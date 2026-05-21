import type { WorldState } from './types';

/**
 * Phase 1 — Production.
 * For each firm, compute output and labor cost.
 * Firms with no employees produce nothing.
 */
export function runProduction(world: WorldState): WorldState {
  const minWage = world.state.minimumWage;
  for (const firm of world.firms) {
    const n = firm.employeeIds.length;
    firm.output = n > 0 ? firm.productivity * n : 0;
    // Unit cost in pricing phase, but labor cost commitment per firm:
    // laborCost = minWage * n  (not stored on firm, recomputed in income.ts)
    // unitCost stored for pricing:
    firm.unitCost = firm.output > 0 ? (minWage * n) / firm.output : 0;
  }
  return world;
}
