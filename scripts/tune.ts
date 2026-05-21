/**
 * Scenario tuning script. Run with:
 *   npx tsx scripts/tune.ts
 *
 * Prints key outcome metrics for each candidate config so we can validate
 * the three target scenarios before committing them as presets.
 */

import { runSimulation } from '../src/engine/simulation';
import type { SimulationConfig } from '../src/engine/types';

const BASE: SimulationConfig = {
  name: '',
  years: 50,
  totalPopulation: 10_000, // production population (2k agents = 5× more wealth/capita → wrong dynamics)
  workerRatio: 0.95,
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

// Blended markup that the engine computes: ownershipRatio*private + (1-ownershipRatio)*public
// survivalUnits = 2.1 (food1+cloth0.2+energy0.5+transp0.1+housing0.3)
// exclusion condition (no wealth, no subsidy): propensity × minWage < 2.1 × (minWage/productivity) × (1+blendedMarkup)
//   → productivity < 2.333 × (1+blendedMarkup)
//
// Extractivist blend  ≈ 0.98×0.65 + 0.02×0.02 = 0.637 → threshold productivity < 3.82  ✓ at 3.0
// Mixed economy blend = 0.50×0.35 + 0.50×0.05 = 0.200 → threshold productivity < 2.80  ✓ at 2.5

const CANDIDATES: Array<{ label: string; patch: Partial<SimulationConfig> }> = [
  // ── 1. EXTRACTIVIST ──────────────────────────────────────────────────────
  // At 10k agents: worker avg wealth = $10M×0.25/9200=$272. Net annual loss = upper basket
  // ($12.55) - income ($2) = $10.55. Median depletion ≈ year 19. Exclusion builds from year 20.
  // Near-zero welfare/subsidy: once depleted workers have budget $1.9 < survival $2.29 → excluded.
  // Target: top5% ≥ 80%, exclusion 30-50% by yr 50, top5 = 100% capitalists.
  {
    label: 'Extractivist',
    patch: {
      workerRatio: 0.92,
      capitalistRatio: 0.08,
      capitalistWealthShare: 0.70,
      workerWealthShare: 0.25,
      stateWealthShare: 0.05,
      defaultOwnershipRatio: 0.98,
      defaultProductivity: 3.0,
      privateMarkup: 0.65,
      publicMarkup: 0.02,
      incomeTaxRate: 0.06,
      profitTaxRate: 0.08,
      taxProgressivity: 1.0,
      minimumWage: 2.0,
      welfareBudgetRatio: 0.01,
      investmentBudgetRatio: 0.01,
      essentialsSubsidyRatio: 0.0,
      workerConsumptionPropensity: 0.95,
      capitalistConsumptionPropensity: 0.06,
    },
  },

  // ── 2. STATE-LED ─────────────────────────────────────────────────────────
  // 0% capitalists. Near-total public ownership → surplus straight to treasury → wages,
  // welfare, subsidies. Workers start with $400 avg; basket costs low (productivity=10).
  // Target: top5% ≤ 40%, exclusion ≈ 0%, upper+middle ≥ 98%, top5 = 100% workers.
  {
    label: 'State-led',
    patch: {
      workerRatio: 1.0,
      capitalistRatio: 0.0,
      capitalistWealthShare: 0.0,
      workerWealthShare: 0.4,
      stateWealthShare: 0.6,
      defaultOwnershipRatio: 0.05,
      defaultProductivity: 10.0,
      privateMarkup: 0.1,
      publicMarkup: 0.02,
      incomeTaxRate: 0.3,
      profitTaxRate: 0.7,
      taxProgressivity: 2.0,
      minimumWage: 12.0,
      welfareBudgetRatio: 0.45,
      investmentBudgetRatio: 0.35,
      essentialsSubsidyRatio: 0.5,
      workerConsumptionPropensity: 0.9,
      capitalistConsumptionPropensity: 0.5,
    },
  },

  // ── 3a. MIXED ECONOMY (high subsidy) ─────────────────────────────────────
  // prod=2.5 → survival cost ($10.08) > worker budget ($9). Generous subsidy (30%) pushes
  // agent-paid survival to $7.92 < $9 → lower class for most. Pool may run out for a few.
  // Expect: exclusion 5-20%, top5 ~55-70%, capitalists dominant in top5.
  {
    label: 'Mixed A – high subsidy',
    patch: {
      workerRatio: 0.95,
      capitalistRatio: 0.05,
      capitalistWealthShare: 0.55,
      workerWealthShare: 0.12,
      stateWealthShare: 0.33,
      defaultOwnershipRatio: 0.5,
      defaultProductivity: 2.5,
      privateMarkup: 0.35,
      publicMarkup: 0.05,
      incomeTaxRate: 0.25,
      profitTaxRate: 0.38,
      taxProgressivity: 1.5,
      minimumWage: 10.0,
      welfareBudgetRatio: 0.35,
      investmentBudgetRatio: 0.20,
      essentialsSubsidyRatio: 0.30,
      workerConsumptionPropensity: 0.9,
      capitalistConsumptionPropensity: 0.28,
    },
  },

  // ── 3b. MIXED ECONOMY (moderate) ─────────────────────────────────────────
  // Same prices but less state: welfare 0.25, subsidy 0.15. More workers slip through.
  {
    label: 'Mixed B – moderate',
    patch: {
      workerRatio: 0.95,
      capitalistRatio: 0.05,
      capitalistWealthShare: 0.55,
      workerWealthShare: 0.12,
      stateWealthShare: 0.33,
      defaultOwnershipRatio: 0.5,
      defaultProductivity: 2.5,
      privateMarkup: 0.35,
      publicMarkup: 0.05,
      incomeTaxRate: 0.22,
      profitTaxRate: 0.32,
      taxProgressivity: 1.4,
      minimumWage: 10.0,
      welfareBudgetRatio: 0.25,
      investmentBudgetRatio: 0.20,
      essentialsSubsidyRatio: 0.15,
      workerConsumptionPropensity: 0.9,
      capitalistConsumptionPropensity: 0.28,
    },
  },
];

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

for (const { label, patch } of CANDIDATES) {
  const config: SimulationConfig = { ...BASE, name: label, ...patch };
  const run = runSimulation(config);
  const final = run.metrics[run.metrics.length - 1];
  const mid = run.metrics[Math.floor(run.metrics.length / 2) - 1];

  console.log(`\n━━ ${label} ━━`);
  console.log(`  Year ${mid.year} snapshot:`);
  console.log(`    top5% wealth share : ${pct(mid.wealthConcentration.top5)}`);
  console.log(`    exclusion rate     : ${pct(mid.socialExclusionRate)}`);
  console.log(`    toxicity           : ${pct(mid.toxicityIndex)}`);
  console.log(`    class upper/mid/low: ${pct(mid.classDistribution.upper)} / ${pct(mid.classDistribution.middle)} / ${pct(mid.classDistribution.lower)}`);
  console.log(`    top5 cap/worker    : ${pct(mid.wealthConcentration.top5CapShare)} / ${pct(mid.wealthConcentration.top5WorkerShare)}`);

  console.log(`  Year ${final.year} (final):`);
  console.log(`    top5% wealth share : ${pct(final.wealthConcentration.top5)}`);
  console.log(`    top1% wealth share : ${pct(final.wealthConcentration.top1)}`);
  console.log(`    bottom 50% share   : ${pct(final.wealthConcentration.bottom50)}`);
  console.log(`    exclusion rate     : ${pct(final.socialExclusionRate)}`);
  console.log(`    toxicity           : ${pct(final.toxicityIndex)}`);
  console.log(`    gini               : ${final.gini.toFixed(3)}`);
  console.log(`    circulation        : ${pct(final.circulationRate)}`);
  console.log(`    class upper/mid/low/excl: ${pct(final.classDistribution.upper)} / ${pct(final.classDistribution.middle)} / ${pct(final.classDistribution.lower)} / ${pct(final.classDistribution.social_exclusion)}`);
  console.log(`    top5 cap/worker    : ${pct(final.wealthConcentration.top5CapShare)} / ${pct(final.wealthConcentration.top5WorkerShare)}`);
}
