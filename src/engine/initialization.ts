import type {
  Agent,
  Firm,
  SimulationConfig,
  StateEntity,
  WorldState,
  Sector,
  MarketSnapshot,
  YearFlows,
} from './types';
import { SECTORS } from './types';

// Deterministic pseudo-random generator so runs are reproducible for a given config+seed.
// We seed from the config's population+money to give different presets different shuffles.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Standard normal sample via Box–Muller, using the project's seeded RNG so
// wealth distributions remain reproducible for a given config.
function standardNormal(rand: () => number): number {
  const u1 = Math.max(rand(), 1e-12);
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// Draw `count` log-normal wealth values that sum exactly to `totalPool`.
// Shape is controlled by sigma (≈ within-role inequality). The final rescale
// preserves money conservation — the sum invariant at the top of CLAUDE.md.
function logNormalPool(
  count: number,
  totalPool: number,
  sigma: number,
  rand: () => number,
): number[] {
  if (count <= 0) return [];
  if (totalPool <= 0 || sigma <= 0) return new Array(count).fill(totalPool / Math.max(1, count));
  const raw = new Array<number>(count);
  let sum = 0;
  for (let i = 0; i < count; i++) {
    const v = Math.exp(sigma * standardNormal(rand));
    raw[i] = v;
    sum += v;
  }
  const scale = sum > 0 ? totalPool / sum : 0;
  for (let i = 0; i < count; i++) raw[i] *= scale;
  return raw;
}

// Within-role wealth spread. Higher = more initial inequality among workers
// (and among capitalists). 0 recovers the old uniform behavior.
const WEALTH_INEQUALITY_SIGMA = 0.8;

export function emptyFlows(): YearFlows {
  return {
    totalWages: 0,
    totalPrivateSurplus: 0,
    totalPublicSurplus: 0,
    totalIncomeTax: 0,
    totalProfitTax: 0,
    totalWelfare: 0,
    totalPublicInvestment: 0,
    totalConsumption: 0,
    totalEssentialsSubsidy: 0,
    totalHoarded: 0,
  };
}

export function buildInitialWorld(config: SimulationConfig): WorldState {
  const rand = mulberry32(config.totalPopulation * 31 + Math.floor(config.totalMoneySupply));

  // 1) Allocate roles proportionally. Only two roles: worker & capitalist.
  //    Worker ratio is derived (1 - capitalistRatio); all non-capitalists are workers.
  const capitalistCount = Math.round(config.totalPopulation * config.capitalistRatio);
  const workerCount = config.totalPopulation - capitalistCount;

  const roleList: Agent['role'][] = [];
  for (let i = 0; i < workerCount; i++) roleList.push('worker');
  for (let i = 0; i < capitalistCount; i++) roleList.push('capitalist');
  const shuffledRoles = shuffle(roleList, rand);

  // 2) Initial wealth distribution
  const capitalistPool = config.totalMoneySupply * config.capitalistWealthShare;
  const workerPool = config.totalMoneySupply * config.workerWealthShare;
  const stateWealth = config.totalMoneySupply * config.stateWealthShare;

  // Draw heterogeneous wealth per role from a log-normal distribution and
  // rescale so each role's total matches its pool exactly. This replaces the
  // old "everyone in a role is a clone" behavior, which made within-role
  // dynamics impossible (identical wealth -> identical consumption forever).
  const workerWealths = logNormalPool(workerCount, workerPool, WEALTH_INEQUALITY_SIGMA, rand);
  const capitalistWealths = logNormalPool(
    capitalistCount,
    capitalistPool,
    WEALTH_INEQUALITY_SIGMA,
    rand,
  );
  let workerCursor = 0;
  let capitalistWealthCursor = 0;

  const agents: Agent[] = shuffledRoles.map((role, id) => ({
    id,
    role,
    wealth:
      role === 'capitalist'
        ? capitalistWealths[capitalistWealthCursor++] ?? 0
        : workerWealths[workerCursor++] ?? 0,
    income: 0,
    employedAt: null,
    class: 'lower',
    consumptionSatisfied: zeroSatisfaction(),
  }));

  // 3) Create firms: firmsPerSector × SECTORS.length firms
  const firms: Firm[] = [];
  const capitalistIds = agents.filter((a) => a.role === 'capitalist').map((a) => a.id);
  let capitalistCursor = 0;
  let firmId = 0;
  for (const sector of SECTORS) {
    for (let i = 0; i < config.firmsPerSector; i++) {
      const ownerId =
        capitalistIds.length > 0 && config.defaultOwnershipRatio > 0
          ? capitalistIds[capitalistCursor++ % capitalistIds.length]
          : null;
      // Blended markup: public portion uses publicMarkup, private uses privateMarkup
      const markup =
        config.defaultOwnershipRatio * config.privateMarkup +
        (1 - config.defaultOwnershipRatio) * config.publicMarkup;
      firms.push({
        id: firmId++,
        sector,
        ownershipRatio: config.defaultOwnershipRatio,
        ownerId: config.defaultOwnershipRatio > 0 ? ownerId : null,
        employeeIds: [],
        markup,
        capitalReserves: 0,
        productivity: config.defaultProductivity,
        output: 0,
        unitCost: 0,
        unitPrice: 0,
      });
    }
  }

  // 4) Assign workers to firms round-robin. Leave a 10% unemployment buffer so
  // Phase 8 (reinvestment) has a real pool to hire from when firms need to
  // expand — otherwise supply stays static forever and the economy can't grow.
  //    All non-capitalists are workers (public firms hire workers just like private firms).
  const workerIds = agents.filter((a) => a.role === 'worker').map((a) => a.id);
  const INITIAL_UNEMPLOYMENT = 0.1;
  const toEmploy = Math.floor(workerIds.length * (1 - INITIAL_UNEMPLOYMENT));
  if (firms.length > 0) {
    for (let i = 0; i < toEmploy; i++) {
      const firm = firms[i % firms.length];
      const worker = agents[workerIds[i]];
      firm.employeeIds.push(worker.id);
      worker.employedAt = firm.id;
    }
  }

  // 5) State entity (initial class default = 'lower'; classification runs after year 1)
  const state: StateEntity = {
    treasury: stateWealth,
    incomeTaxRate: config.incomeTaxRate,
    profitTaxRate: config.profitTaxRate,
    consumptionTaxRate: 0,
    publicMarkupPolicy: config.publicMarkup,
    minimumWage: config.minimumWage,
    welfareBudgetRatio: config.welfareBudgetRatio,
    investmentBudgetRatio: config.investmentBudgetRatio,
    taxProgressivity: config.taxProgressivity,
    essentialsSubsidyRatio: config.essentialsSubsidyRatio,
    workerPropensity: config.workerConsumptionPropensity,
    capitalistPropensity: config.capitalistConsumptionPropensity,
    investmentPool: 0,
    subsidyPool: 0,
  };

  const markets: MarketSnapshot[] = SECTORS.map((sector) => ({
    sector,
    totalSupply: 0,
    totalDemand: 0,
    clearingPrice: 0,
    unmetDemand: 0,
  }));

  return {
    year: 0,
    agents,
    firms,
    state,
    markets,
    flows: emptyFlows(),
  };
}

export function zeroSatisfaction(): Record<Sector, number> {
  return { food: 0, clothing: 0, energy: 0, transportation: 0, housing: 0 };
}
