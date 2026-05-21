import type { SimulationConfig, SimulationRun, WorldState, YearMetrics } from './types';
import { buildInitialWorld, emptyFlows } from './initialization';
import { runProduction } from './production';
import { runPricing } from './pricing';
import { runIncome } from './income';
import { runTaxation } from './taxation';
import { runStateExpenditure } from './state';
import { runConsumption } from './consumption';
import { runClassification } from './classification';
import { runReinvestment } from './reinvestment';
import { computeMetrics, computeWealthBins } from './metrics';

export interface ProgressUpdate {
  kind: 'progress';
  year: number;
  totalYears: number;
  metrics: YearMetrics;
}

export type OnProgress = (update: ProgressUpdate) => void;

export function runYear(world: WorldState): WorldState {
  world.year += 1;
  // Reset flow counters for this year
  world.flows = emptyFlows();
  // Reset per-firm transient values
  for (const firm of world.firms) {
    firm.output = 0;
    firm.unitCost = 0;
    firm.unitPrice = 0;
  }
  // Reset market transient values
  for (const market of world.markets) {
    market.totalDemand = 0;
    market.unmetDemand = 0;
    // clearingPrice/totalSupply repopulated in Phase 2
  }

  runProduction(world);
  runPricing(world);
  runIncome(world);
  runTaxation(world);
  runStateExpenditure(world);
  runConsumption(world);
  runClassification(world);
  runReinvestment(world);

  return world;
}

export function runSimulation(
  config: SimulationConfig,
  onProgress?: OnProgress,
): SimulationRun {
  let world = buildInitialWorld(config);
  const metrics: YearMetrics[] = [];
  const binsByYear: ReturnType<typeof computeWealthBins>[] = [];

  for (let y = 1; y <= config.years; y++) {
    world = runYear(world);
    const m = computeMetrics(world);
    metrics.push(m);
    binsByYear.push(computeWealthBins(world));
    if (onProgress) {
      onProgress({ kind: 'progress', year: y, totalYears: config.years, metrics: m });
    }
  }

  const finalBins = binsByYear[binsByYear.length - 1] ?? [];

  return {
    id: makeId(),
    config,
    createdAt: new Date().toISOString(),
    metrics,
    finalState: {
      year: world.year,
      wealthBins: finalBins,
      wealthBinsByYear: binsByYear,
    },
  };
}

function makeId(): string {
  // RFC4122-ish v4. Web Worker has crypto but not always crypto.randomUUID.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as { randomUUID: () => string }).randomUUID();
  }
  return 'r-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
}
