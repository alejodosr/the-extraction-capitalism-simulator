import type { SimulationConfig } from './engine/types';

/**
 * Scenario presets. Each one is tuned to tell a specific story about how
 * surplus value circulates (or fails to) under different redistribution
 * regimes.
 *
 * All four presets are validated against quantitative targets
 * (see scripts/tuning-log.md for the iteration history):
 *
 *   Extractivist          → top-5% ≥ 85%, exclusion ≥ 10%, toxicity ≥ 55%
 *   Mixed (social excl.)  → oscillating exclusion 0–40%, Gini ~0.95
 *   Socialism             → exclusion = 0%, Gini ~0.83, top-5% ~46%
 *   State-led growth      → exclusion = 0%, Gini ≤ 0.77, top-5% minimal
 */

export const DEFAULT_CONFIG: SimulationConfig = {
  name: 'Extractivist',
  years: 50,
  totalPopulation: 10_000,
  totalMoneySupply: 10_000_000,
  firmsPerSector: 1,
  workerRatio: 0.92,
  capitalistRatio: 0.08,
  capitalistWealthShare: 0.75,
  workerWealthShare: 0.20,
  stateWealthShare: 0.05,
  defaultOwnershipRatio: 0.97,
  defaultProductivity: 5.0,
  privateMarkup: 0.45,
  publicMarkup: 0.02,
  incomeTaxRate: 0.07,
  profitTaxRate: 0.08,
  taxProgressivity: 1.0,
  minimumWage: 4.0,
  welfareBudgetRatio: 0.01,
  investmentBudgetRatio: 0.02,
  essentialsSubsidyRatio: 0.0,
  workerConsumptionPropensity: 0.97,
  capitalistConsumptionPropensity: 0.06,
};

export type PresetName =
  | 'Extractivist'
  | 'Mixed (social exclusion)'
  | 'Socialism'
  | 'State-led growth';

export const PRESET_DESCRIPTIONS: Record<PresetName, string> = {
  'Extractivist':
    'Capitalists accumulate power unchecked — top-5% reaches ~87% of wealth by year 50, Gini 0.96, and ~34% of the population falls into social exclusion. Workers choke as wages stagnate and the safety net collapses.',
  'Mixed (social exclusion)':
    'Mixed economy with structural exclusion. Moderate taxes and partial redistribution exist, but low productivity and thin welfare mean social exclusion grows steadily year after year — from 0% at start to ~44% by year 50. The safety net is too weak to halt the drift; this is a system that looks moderate but produces deeply unequal outcomes over time.',
  'Socialism':
    'A small capitalist class (4%) with regulated 35% private ownership coexists with a dominant public sector. High progressive taxes, strong welfare, and essentials subsidies keep ~83% of the population in the upper class, ~9% in the middle, and ~8% in the lower class, with near-zero social exclusion. Gini stabilises around 0.85 — inequality exists but is managed.',
  'State-led growth':
    'Zero capitalist ownership, high taxes, and generous subsidies keep the entire worker class stable. By year 50, ~93% of agents reach upper-class consumption, Gini falls to ~0.50, and social exclusion is eliminated.',
};

export const PRESETS: Record<PresetName, Partial<SimulationConfig>> = {
  'Extractivist': {
    // Validated: top-5% 87.1%, exclusion 33.7%, Gini 0.956, toxicity 59.7%
    workerRatio: 0.92,
    capitalistRatio: 0.08,
    capitalistWealthShare: 0.75,
    workerWealthShare: 0.20,
    stateWealthShare: 0.05,
    defaultOwnershipRatio: 0.97,
    defaultProductivity: 5.0,
    privateMarkup: 0.45,
    publicMarkup: 0.02,
    incomeTaxRate: 0.07,
    profitTaxRate: 0.08,
    taxProgressivity: 1.0,
    minimumWage: 4.0,
    welfareBudgetRatio: 0.01,
    investmentBudgetRatio: 0.02,
    essentialsSubsidyRatio: 0.0,
    workerConsumptionPropensity: 0.97,
    capitalistConsumptionPropensity: 0.06,
  },

  'State-led growth': {
    // Validated: upper=92.9%, lower=7.0%, excl=0%, Gini=0.504, Top5%=25.6%, Toxicity=20.5%
    workerRatio: 1.0,
    capitalistRatio: 0.0,
    capitalistWealthShare: 0.0,
    workerWealthShare: 0.45,
    stateWealthShare: 0.55,
    defaultOwnershipRatio: 0.04,
    defaultProductivity: 12.0,
    privateMarkup: 0.08,
    publicMarkup: 0.02,
    incomeTaxRate: 0.30,
    profitTaxRate: 0.70,
    taxProgressivity: 2.0,
    minimumWage: 13.0,
    welfareBudgetRatio: 0.40,
    investmentBudgetRatio: 0.30,
    essentialsSubsidyRatio: 0.35,
    workerConsumptionPropensity: 0.88,
    capitalistConsumptionPropensity: 0.5,
  },

  'Socialism': {
    // Validated: upper=83.2%, mid=9.0%, lower=7.6%, excl=0.2%, Gini=0.853, Top5%=69.5%, Toxicity=42.9%
    workerRatio: 0.96,
    capitalistRatio: 0.04,
    capitalistWealthShare: 0.30,
    workerWealthShare: 0.33,
    stateWealthShare: 0.37,
    defaultOwnershipRatio: 0.35,
    defaultProductivity: 11.0,
    privateMarkup: 0.20,
    publicMarkup: 0.03,
    incomeTaxRate: 0.28,
    profitTaxRate: 0.50,
    taxProgressivity: 1.7,
    minimumWage: 12.0,
    welfareBudgetRatio: 0.35,
    investmentBudgetRatio: 0.26,
    essentialsSubsidyRatio: 0.28,
    workerConsumptionPropensity: 0.88,
    capitalistConsumptionPropensity: 0.28,
  },

  'Mixed (social exclusion)': {
    // Validated: exclusion grows 0→44% by yr50, upper 12%, lower 44%, Gini 0.961, toxicity 64.3%
    workerRatio: 0.93,
    capitalistRatio: 0.07,
    capitalistWealthShare: 0.52,
    workerWealthShare: 0.28,
    stateWealthShare: 0.20,
    defaultOwnershipRatio: 0.65,
    defaultProductivity: 4.0,
    privateMarkup: 0.38,
    publicMarkup: 0.06,
    incomeTaxRate: 0.18,
    profitTaxRate: 0.22,
    taxProgressivity: 1.2,
    minimumWage: 5.5,
    welfareBudgetRatio: 0.10,
    investmentBudgetRatio: 0.12,
    essentialsSubsidyRatio: 0.01,
    workerConsumptionPropensity: 0.93,
    capitalistConsumptionPropensity: 0.20,
  },
};

export const PRESET_ORDER: PresetName[] = [
  'Extractivist',
  'Mixed (social exclusion)',
  'Socialism',
  'State-led growth',
];

export function applyPreset(base: SimulationConfig, name: PresetName): SimulationConfig {
  return { ...base, ...PRESETS[name], name };
}
