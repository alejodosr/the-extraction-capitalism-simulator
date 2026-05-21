import type {
  ClassTier,
  Role,
  Sector,
  WealthBin,
  WealthConcentration,
  WorldState,
  YearMetrics,
} from './types';
import { SURVIVAL_BASKET } from './baskets';

export function computeMetrics(world: WorldState): YearMetrics {
  const gdp = world.firms.reduce((sum, firm) => {
    const market = world.markets.find((m) => m.sector === firm.sector);
    if (!market) return sum;
    return sum + firm.output * market.clearingPrice;
  }, 0);

  const gini = computeGini(world.agents.map((a) => a.wealth));
  const workers = world.agents.filter((a) => a.role === 'worker');
  const unemploymentRate =
    workers.length > 0 ? workers.filter((a) => a.employedAt === null).length / workers.length : 0;
  const socialExclusionRate =
    world.agents.length > 0
      ? world.agents.filter((a) => a.class === 'social_exclusion').length / world.agents.length
      : 0;

  const classDistribution: Record<ClassTier, number> = {
    upper: 0,
    middle: 0,
    lower: 0,
    social_exclusion: 0,
  };
  for (const a of world.agents) classDistribution[a.class]++;
  const n = Math.max(1, world.agents.length);
  classDistribution.upper /= n;
  classDistribution.middle /= n;
  classDistribution.lower /= n;
  classDistribution.social_exclusion /= n;

  const surplusExtractionRate = gdp > 0 ? world.flows.totalPrivateSurplus / gdp : 0;
  const publicFirmOutputValue = world.firms
    .filter((f) => f.ownershipRatio < 1)
    .reduce((sum, firm) => {
      const market = world.markets.find((m) => m.sector === firm.sector);
      if (!market) return sum;
      return sum + firm.output * market.clearingPrice * (1 - firm.ownershipRatio);
    }, 0);
  const stateCapacity = gdp > 0 ? (world.state.treasury + publicFirmOutputValue) / gdp : 0;

  const totalWealth = world.agents.reduce((s, a) => s + a.wealth, 0);
  // Sort agents descending by wealth once; reuse for all concentration metrics.
  const sortedAgents = world.agents.slice().sort((a, b) => b.wealth - a.wealth);
  const agentCount = sortedAgents.length;
  const top1Count = Math.max(1, Math.floor(agentCount * 0.01));
  const top5Count = Math.max(1, Math.floor(agentCount * 0.05));
  const top10Count = Math.max(1, Math.floor(agentCount * 0.1));
  const bottom50Count = Math.floor(agentCount * 0.5);

  const sumWealth = (agents: typeof sortedAgents) => agents.reduce((s, a) => s + a.wealth, 0);
  const top1Wealth = sumWealth(sortedAgents.slice(0, top1Count));
  const top5Wealth = sumWealth(sortedAgents.slice(0, top5Count));
  const top10Wealth = sumWealth(sortedAgents.slice(0, top10Count));
  const bottom50Wealth = sumWealth(sortedAgents.slice(agentCount - bottom50Count));

  const top5Agents = sortedAgents.slice(0, top5Count);
  const top5CapWealth = sumWealth(top5Agents.filter((a) => a.role === 'capitalist'));
  const top5WorkWealth = sumWealth(top5Agents.filter((a) => a.role === 'worker'));

  const wealthConcentrationTop5 = totalWealth > 0 ? top5Wealth / totalWealth : 0;
  const wealthConcentration: WealthConcentration = {
    top1: totalWealth > 0 ? top1Wealth / totalWealth : 0,
    top5: wealthConcentrationTop5,
    top10: totalWealth > 0 ? top10Wealth / totalWealth : 0,
    bottom50: totalWealth > 0 ? bottom50Wealth / totalWealth : 0,
    top5CapShare: top5Wealth > 0 ? top5CapWealth / top5Wealth : 0,
    top5WorkerShare: top5Wealth > 0 ? top5WorkWealth / top5Wealth : 0,
  };

  // Price index = cost of the survival basket at current clearing prices
  const priceIndex = world.markets.reduce(
    (sum, market) => sum + market.clearingPrice * SURVIVAL_BASKET[market.sector],
    0,
  );

  const unmetDemand: Record<Sector, number> = {
    food: 0,
    clothing: 0,
    energy: 0,
    transportation: 0,
    housing: 0,
  };
  for (const market of world.markets) {
    unmetDemand[market.sector] = market.unmetDemand;
  }

  // Circulation rate: of every dollar that entered an agent's pocket this
  // year (wages + private surplus + welfare), how much returned to firms as
  // consumption? Welfare is included because it becomes disposable income for
  // recipients. Low circulation = money stagnating in capitalist wealth.
  const inflow =
    world.flows.totalWages + world.flows.totalPrivateSurplus + world.flows.totalWelfare;
  const circulationRate = inflow > 0 ? Math.min(1.5, world.flows.totalConsumption / inflow) : 0;

  // Toxicity index: weighted composite of the "things going wrong" metrics.
  // Higher weights on concentration and exclusion because those are the
  // clearest failures of redistribution. Clamped to [0,1].
  const toxicityIndex = clamp01(
    0.35 * wealthConcentrationTop5 +
      0.3 * socialExclusionRate +
      0.2 * gini +
      0.15 * unemploymentRate,
  );

  return {
    year: world.year,
    gdp,
    gini,
    unemploymentRate,
    socialExclusionRate,
    classDistribution,
    surplusExtractionRate,
    stateCapacity,
    wealthConcentrationTop5,
    wealthConcentration,
    priceIndex,
    unmetDemand,
    circulationRate,
    toxicityIndex,
    flows: { ...world.flows },
  };
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

export function computeGini(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const n = sorted.length;
  let sum = 0;
  let cumulative = 0;
  for (let i = 0; i < n; i++) {
    cumulative += sorted[i];
    sum += (2 * (i + 1) - n - 1) * sorted[i];
  }
  if (cumulative === 0) return 0;
  return sum / (n * cumulative);
}

/**
 * Summarize wealth distribution for a given year into a compact set of bins
 * (deciles by default). Each bin records average wealth, count by role, and
 * the dominant role.
 */
export function computeWealthBins(world: WorldState, binCount = 10): WealthBin[] {
  const sorted = world.agents
    .slice()
    .sort((a, b) => a.wealth - b.wealth);
  const perBin = Math.ceil(sorted.length / binCount);
  const bins: WealthBin[] = [];
  for (let i = 0; i < binCount; i++) {
    const slice = sorted.slice(i * perBin, (i + 1) * perBin);
    if (slice.length === 0) continue;
    let total = 0;
    const counts: Record<Role, number> = { worker: 0, capitalist: 0 };
    for (const a of slice) {
      total += a.wealth;
      counts[a.role]++;
    }
    const dominantRole = dominantRoleOf(counts);
    bins.push({
      percentile: (i / binCount) * 100,
      avgWealth: total / slice.length,
      dominantRole,
      workers: counts.worker,
      capitalists: counts.capitalist,
    });
  }
  return bins;
}

function dominantRoleOf(counts: Record<Role, number>): Role | 'mixed' {
  const entries = Object.entries(counts) as Array<[Role, number]>;
  const sorted = entries.slice().sort((a, b) => b[1] - a[1]);
  if (sorted.length < 2 || sorted[0][1] === sorted[1][1]) return 'mixed';
  const total = sorted.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return 'mixed';
  if (sorted[0][1] / total >= 0.6) return sorted[0][0];
  return 'mixed';
}
