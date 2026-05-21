// -- Enums --
export type Role = 'worker' | 'capitalist';
export type Sector = 'food' | 'clothing' | 'energy' | 'transportation' | 'housing';
export type ClassTier = 'upper' | 'middle' | 'lower' | 'social_exclusion';

export const SECTORS: Sector[] = ['food', 'clothing', 'energy', 'transportation', 'housing'];
export const CLASS_TIERS: ClassTier[] = ['upper', 'middle', 'lower', 'social_exclusion'];

// -- Entities --
export interface Agent {
  id: number;
  role: Role;
  wealth: number;
  income: number; // reset each step
  employedAt: number | null; // firm id
  class: ClassTier;
  consumptionSatisfied: Record<Sector, number>; // 0.0–1.0
  // Transient hint populated by consumption: which tier they fully bought.
  _attemptedTier?: ClassTier;
}

export interface Firm {
  id: number;
  sector: Sector;
  ownershipRatio: number; // 0.0 = fully public, 1.0 = fully private
  ownerId: number | null; // capitalist agent id
  employeeIds: number[];
  markup: number; // the capitalist's desired markup
  capitalReserves: number;
  productivity: number;
  // Transient per-year values (populated by phases, zeroed at start of each year)
  output: number;
  unitCost: number;
  unitPrice: number;
}

export interface StateEntity {
  treasury: number;
  incomeTaxRate: number;
  profitTaxRate: number;
  consumptionTaxRate: number; // 0 for v1
  publicMarkupPolicy: number;
  minimumWage: number;
  welfareBudgetRatio: number;
  investmentBudgetRatio: number;
  // Progressivity multiplier applied to the income/profit tax rate for
  // above-median-wealth agents. 1.0 = flat tax. 2.0 = rich pay 2× base rate.
  taxProgressivity: number;
  // Fraction of the clearing price for essential sectors (food/energy/housing)
  // covered by the state for non-capitalist agents. 0 = no subsidy.
  essentialsSubsidyRatio: number;
  // Per-role consumption propensities (fraction of disposable resources each
  // role attempts to consume per year). The capitalist value drives the
  // hoarding dynamic: low propensity → surplus stagnates → low circulation.
  workerPropensity: number;
  capitalistPropensity: number;
  // Transient: investment pool set aside in Phase 5 for Phase 8
  investmentPool: number;
  // Transient: subsidy pool set aside in Phase 5 for Phase 6
  subsidyPool: number;
}

export interface MarketSnapshot {
  sector: Sector;
  totalSupply: number;
  totalDemand: number;
  clearingPrice: number;
  unmetDemand: number;
}

// -- World state (one per time step) --
export interface WorldState {
  year: number;
  agents: Agent[];
  firms: Firm[];
  state: StateEntity;
  markets: MarketSnapshot[];
  // Flow accumulators for the year — zeroed at start of each runYear
  flows: YearFlows;
}

export interface YearFlows {
  totalWages: number;
  totalPrivateSurplus: number;
  totalPublicSurplus: number;
  totalIncomeTax: number;
  totalProfitTax: number;
  totalWelfare: number;
  totalPublicInvestment: number;
  totalConsumption: number;
  // State spending covering the subsidized portion of essentials for workers
  // and public employees (Phase 6). Tracked separately so redistribution
  // channels (welfare vs investment vs subsidy) stay legible.
  totalEssentialsSubsidy: number;
  // Portion of disposable wealth+income that agents chose NOT to consume this
  // year. Primary driver of the "toxic accumulation" dynamic.
  totalHoarded: number;
}

export interface WealthConcentration {
  // Share of total wealth held by each percentile bracket (0.0–1.0).
  top1: number;
  top5: number;
  top10: number;
  bottom50: number;
  // Within the top-5% agents, fraction of their combined wealth held by each role.
  top5CapShare: number;
  top5WorkerShare: number;
}

// -- Metrics computed per step --
export interface YearMetrics {
  year: number;
  gdp: number;
  gini: number;
  unemploymentRate: number;
  socialExclusionRate: number;
  classDistribution: Record<ClassTier, number>;
  surplusExtractionRate: number;
  stateCapacity: number;
  wealthConcentrationTop5: number;
  wealthConcentration: WealthConcentration;
  priceIndex: number;
  unmetDemand: Record<Sector, number>;
  // Share of disposable resources (wealth + income) that returned to the
  // productive economy as consumption this year. Low circulation = surplus is
  // stagnating in capitalist wealth rather than buying anyone's output.
  circulationRate: number;
  // Composite crisis indicator in [0,1]. Weighted blend of wealth
  // concentration, social exclusion, unemployment, and Gini. Above ~0.5 the
  // dashboard treats the run as "in crisis".
  toxicityIndex: number;
  flows: YearFlows;
}

// -- Simulation config (what the user configures) --
export interface SimulationConfig {
  name: string;
  years: number; // 30–50
  totalPopulation: number;
  workerRatio: number; // derived: 1 - capitalistRatio
  capitalistRatio: number;
  totalMoneySupply: number;
  capitalistWealthShare: number;
  workerWealthShare: number;
  stateWealthShare: number; // derived: 1 - cap - worker
  firmsPerSector: number;
  defaultOwnershipRatio: number;
  defaultProductivity: number;
  privateMarkup: number;
  publicMarkup: number;
  incomeTaxRate: number;
  profitTaxRate: number;
  // Progressivity multiplier on taxes for above-median-wealth agents (1.0 = flat).
  taxProgressivity: number;
  minimumWage: number;
  welfareBudgetRatio: number;
  investmentBudgetRatio: number;
  // Share of essentials price (food/energy/housing) paid by the state for
  // non-capitalist agents. 0 = no subsidy, 1 = fully covered (capped by treasury).
  essentialsSubsidyRatio: number;
  // Fraction of disposable resources that capitalists attempt to consume per
  // year. Low values → strong hoarding → low circulation → toxic accumulation.
  capitalistConsumptionPropensity: number;
  // Worker propensity — dial for "austerity forces workers to save" scenarios.
  workerConsumptionPropensity: number;
}

// -- A completed simulation run --
export interface SimulationRun {
  id: string; // uuid
  config: SimulationConfig;
  createdAt: string; // ISO timestamp
  metrics: YearMetrics[];
  // For the dashboard histogram we need wealth buckets per year, per role.
  // We store a compact summary instead of full WorldState (localStorage budget).
  finalState: FinalStateSummary;
}

export interface FinalStateSummary {
  year: number;
  // Wealth histogram bins for the final year, split by role.
  wealthBins: WealthBin[];
  // Per-year histograms (compact) used by the scrubber.
  wealthBinsByYear: WealthBin[][];
}

export interface WealthBin {
  // Percentile lower-upper in the overall wealth ordering.
  percentile: number; // e.g. 0, 10, 20, ..., 90
  // Average wealth of agents within this percentile bucket.
  avgWealth: number;
  // Dominant role in this bucket ('worker' | 'capitalist' | 'mixed')
  dominantRole: Role | 'mixed';
  // Count by role within the bucket
  workers: number;
  capitalists: number;
}
