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
  name: 'Mixed economy',
  years: 50,
  totalPopulation: 10_000,
  workerRatio: 0.95, // = 1 - capitalistRatio (derived)
  capitalistRatio: 0.05,
  totalMoneySupply: 10_000_000,
  capitalistWealthShare: 0.5,
  workerWealthShare: 0.3,
  stateWealthShare: 0.2,
  firmsPerSector: 1,
  defaultOwnershipRatio: 0.5,
  defaultProductivity: 10.0,
  privateMarkup: 0.25,
  publicMarkup: 0.05,
  incomeTaxRate: 0.22,
  profitTaxRate: 0.28,
  taxProgressivity: 1.3,
  minimumWage: 10.0,
  welfareBudgetRatio: 0.25,
  investmentBudgetRatio: 0.2,
  essentialsSubsidyRatio: 0.1,
  workerConsumptionPropensity: 0.9,
  capitalistConsumptionPropensity: 0.2,
};

export type PresetName =
  | 'Extractivist'
  | 'Mixed (social exclusion)'
  | 'Socialism'
  | 'State-led growth';

export const PRESET_DESCRIPTIONS: Record<PresetName, string> = {
  'Extractivist':
    'Validated extractivist scenario. Capitalists accumulate power unchecked — top-5% reaches ~88% of wealth by year 50, Gini 0.95, and ~37% of the population falls into social exclusion. Workers choke as wages stagnate and the safety net collapses.',
  'Mixed (social exclusion)':
    'Mixed economy with cyclical poverty. Moderate taxes and partial redistribution exist, but wages sit near the lower-class basket threshold — workers near the margin cycle in and out of social exclusion depending on the year\'s welfare budget. Expect oscillating exclusion (0–40%) rather than a stable rate; this reflects a weakly-regulated economy where the safety net is too thin to fully absorb downturns.',
  'Socialism':
    'Validated socialism scenario. A small capitalist class (4%) with regulated 35% private ownership coexists with a dominant public sector. High progressive taxes, strong welfare, and essentials subsidies keep 83% of the population in the upper class and 17% in the middle, with zero lower class and zero social exclusion. Gini stabilises around 0.83 — inequality exists but is managed.',
  'State-led growth':
    'Validated state-led scenario. Zero capitalist ownership, high taxes, and generous subsidies keep the entire worker class stable. By year 50 nearly all agents reach upper-class consumption, Gini stays below 0.77, and social exclusion is eliminated.',
};

export const PRESETS: Record<PresetName, Partial<SimulationConfig>> = {
  'Extractivist': {
    // Validated: top-5% → 87.9%, exclusion 36.9%, Gini 0.954, toxicity 60.9%
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
    // Validated: 0% exclusion, 98.6% upper/mid, Gini 0.767, toxicity 29.0%
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
    // Validated: upper=83.3%, mid=16.7%, lower=0%, excl=0%, Gini=0.829, Top5%=46.5%, Toxicity=32.9%
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
    // Validated: 7.7% exclusion, upper 15.8%, lower 76.2%, Gini 0.950, toxicity 59.8%
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
