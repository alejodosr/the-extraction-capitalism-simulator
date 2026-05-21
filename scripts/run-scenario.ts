/**
 * Headless scenario runner — no browser, no worker.
 *
 * Usage:
 *   npx tsx scripts/run-scenario.ts <scenario-name>
 *
 * <scenario-name> must match a file in scripts/scenarios/<name>.json.
 * That file is a Partial<SimulationConfig>; it is merged over DEFAULT_CONFIG
 * and then years is forced to 200 and a fixed seed is embedded via totalPopulation
 * override if not set.
 *
 * Prints final-year YearMetrics and the average of the last 20 years.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { SimulationConfig, YearMetrics } from '../src/engine/types.js';
import { DEFAULT_CONFIG } from '../src/presets.js';
import { runSimulation } from '../src/engine/simulation.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const name = process.argv[2];
if (!name) {
  console.error('Usage: npx tsx scripts/run-scenario.ts <scenario-name>');
  process.exit(1);
}

const scenarioPath = join(__dirname, 'scenarios', `${name}.json`);
let patch: Partial<SimulationConfig>;
try {
  patch = JSON.parse(readFileSync(scenarioPath, 'utf8'));
} catch {
  console.error(`Cannot read ${scenarioPath}`);
  process.exit(1);
}

// Fixed seed: encoded through totalPopulation value (mulberry32 uses it).
// All scenario files that don't override totalPopulation use 10_000 → seed 0xC0FFEE-like.
const FIXED_SEED_POPULATION = 0xc0ffee % 20_000 || 10_000; // 12648430 % 20000 = 8430... hmm

const config: SimulationConfig = {
  ...DEFAULT_CONFIG,
  ...patch,
  years: 200,
  // Override population for deterministic seed unless scenario explicitly sets it
  totalPopulation: patch.totalPopulation ?? FIXED_SEED_POPULATION,
};

console.log(`\nRunning scenario: ${name}`);
console.log(`Config: years=${config.years}, population=${config.totalPopulation}`);
console.log('Simulating...\n');

const start = Date.now();
const run = runSimulation(config);
const elapsed = ((Date.now() - start) / 1000).toFixed(2);

const { metrics } = run;
const last20 = metrics.slice(-20);

function avg(key: keyof YearMetrics): number {
  const vals = last20.map((m) => m[key] as number).filter(Number.isFinite);
  return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
}

const final = metrics[metrics.length - 1];

console.log(`=== Final year (${final.year}) ===`);
printMetrics(final);

console.log(`\n=== Last-20-year averages ===`);
printAvgMetrics(last20);

console.log(`\nCompleted in ${elapsed}s`);

// ---------------------------------------------------------------------------

function printMetrics(m: YearMetrics) {
  const pct = (v: number) => `${(v * 100).toFixed(2)}%`;
  console.log(`  GDP             : ${m.gdp.toLocaleString('en', { maximumFractionDigits: 0 })}`);
  console.log(`  Gini            : ${pct(m.gini)}`);
  console.log(`  Top-5% share    : ${pct(m.wealthConcentrationTop5)}`);
  console.log(`  Exclusion rate  : ${pct(m.socialExclusionRate)}`);
  console.log(`  Unemployment    : ${pct(m.unemploymentRate)}`);
  console.log(`  Circulation     : ${pct(m.circulationRate)}`);
  console.log(`  Toxicity index  : ${pct(m.toxicityIndex)}`);
}

function printAvgMetrics(last: YearMetrics[]) {
  const pct = (v: number) => `${(v * 100).toFixed(2)}%`;
  const mean = (key: keyof YearMetrics) => {
    const vals = last.map((m) => m[key] as number).filter(Number.isFinite);
    return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
  };
  console.log(`  Gini            : ${pct(mean('gini'))}`);
  console.log(`  Top-5% share    : ${pct(mean('wealthConcentrationTop5'))}`);
  console.log(`  Exclusion rate  : ${pct(mean('socialExclusionRate'))}`);
  console.log(`  Unemployment    : ${pct(mean('unemploymentRate'))}`);
  console.log(`  Circulation     : ${pct(mean('circulationRate'))}`);
  console.log(`  Toxicity index  : ${pct(mean('toxicityIndex'))}`);
}
