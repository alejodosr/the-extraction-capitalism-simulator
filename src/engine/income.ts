import type { WorldState } from './types';

/**
 * Phase 3 — Income distribution.
 *
 * For each firm with output, compute expected revenue at clearing price.
 * Workers receive wages (minWage per employee) as income.
 * Surplus = revenue - wages. Split between capitalist owner (by ownershipRatio)
 * and the state (remainder), both credited as income/treasury.
 *
 * Physical money: firm.capitalReserves -= revenue; that amount is redistributed
 * to workers (income), capitalist owner (income), and state (treasury). This
 * preserves money conservation: what leaves firm reserves lands in agent
 * income + state treasury. Phase 6 (consumption) refills firm reserves from
 * agents' wealth+income.
 */
export function runIncome(world: WorldState): WorldState {
  const minWage = world.state.minimumWage;

  for (const firm of world.firms) {
    if (firm.output <= 0 || firm.employeeIds.length === 0) continue;
    const market = world.markets.find((m) => m.sector === firm.sector);
    if (!market) continue;
    const revenue = firm.output * market.clearingPrice;
    const wagesTotal = minWage * firm.employeeIds.length;

    // Pay wages as income
    for (const employeeId of firm.employeeIds) {
      const worker = world.agents[employeeId];
      worker.income += minWage;
    }
    world.flows.totalWages += wagesTotal;

    // Surplus = revenue - wages
    const surplus = revenue - wagesTotal;
    const capShare = firm.ownershipRatio * surplus;
    const stateShare = (1 - firm.ownershipRatio) * surplus;

    if (firm.ownerId !== null && capShare !== 0) {
      const owner = world.agents[firm.ownerId];
      owner.income += capShare;
      world.flows.totalPrivateSurplus += capShare;
    } else if (capShare !== 0) {
      // No owner but private share: still goes to state as windfall
      world.state.treasury += capShare;
      world.flows.totalPublicSurplus += capShare;
    }
    if (stateShare !== 0) {
      world.state.treasury += stateShare;
      world.flows.totalPublicSurplus += stateShare;
    }

    // Money leaves firm reserves (will be replenished in Phase 6)
    firm.capitalReserves -= revenue;
  }

  return world;
}
