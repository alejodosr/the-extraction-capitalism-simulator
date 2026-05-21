import type { WorldState } from './types';

/**
 * Phase 4 — Taxation.
 *
 * Income tax on workers & public employees; profit tax on capitalists.
 *
 * Progressivity: agents whose *wealth* sits above the population median pay
 * their base rate multiplied by `state.taxProgressivity` (capped to 95% to
 * avoid pathological 100%+ rates). 1.0 = flat. 2.0 = rich pay 2× base rate.
 *
 * Using wealth (not income) to set the bracket matters: a capitalist whose
 * firm had a bad year but who sits on huge reserves is still taxed at the
 * progressive rate. That's the whole point of a wealth-aware progressivity.
 */
export function runTaxation(world: WorldState): WorldState {
  const incomeRate = world.state.incomeTaxRate;
  const profitRate = world.state.profitTaxRate;
  const progressivity = Math.max(0, world.state.taxProgressivity);

  const medianWealth = medianOf(world.agents.map((a) => a.wealth));

  for (const agent of world.agents) {
    if (agent.income <= 0) continue;
    const base = agent.role === 'capitalist' ? profitRate : incomeRate;
    const multiplier = agent.wealth > medianWealth ? progressivity : 1;
    const effective = Math.min(0.95, Math.max(0, base * multiplier));
    const tax = agent.income * effective;
    agent.income -= tax;
    world.state.treasury += tax;
    if (agent.role === 'capitalist') {
      world.flows.totalProfitTax += tax;
    } else {
      world.flows.totalIncomeTax += tax;
    }
  }

  return world;
}

function medianOf(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
