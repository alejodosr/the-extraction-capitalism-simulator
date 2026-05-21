import type { Agent, Firm, Sector, WorldState } from './types';

/**
 * Phase 8 — Reinvestment & expansion.
 *
 * Capitalists with capital reserves (personal wealth) in their owned firms'
 * sectors where demand exceeds supply hire from the unemployed pool.
 * The state does the same for public firms using the investment pool.
 * If no unmet demand, surplus simply accumulates as capitalist wealth (already
 * happened in Phase 3, so this phase does nothing in that case).
 */
export function runReinvestment(world: WorldState): WorldState {
  const HIRE_COST = world.state.minimumWage; // one "year's advance" paid into firm reserves

  // Identify unmet-demand sectors
  const unmetBySector: Record<Sector, number> = {
    food: 0,
    clothing: 0,
    energy: 0,
    transportation: 0,
    housing: 0,
  };
  for (const market of world.markets) {
    unmetBySector[market.sector] = market.unmetDemand;
  }

  // Unemployed pool (only workers, not public employees)
  const unemployed: Agent[] = world.agents.filter(
    (a) => a.role === 'worker' && a.employedAt === null,
  );

  // Private reinvestment (per capitalist, per owned firm)
  for (const firm of world.firms) {
    if (unmetBySector[firm.sector] <= 0) continue;
    if (unemployed.length === 0) break;
    if (firm.ownershipRatio <= 0 || firm.ownerId === null) continue;
    const owner = world.agents[firm.ownerId];

    // Hire as many as: unmet demand / productivity (units per worker), capped by
    // owner wealth, capped by unemployed pool.
    const workersNeeded = Math.ceil(unmetBySector[firm.sector] / Math.max(firm.productivity, 1));
    let hires = 0;
    while (
      hires < workersNeeded &&
      owner.wealth >= HIRE_COST &&
      unemployed.length > 0
    ) {
      const newHire = unemployed.shift()!;
      owner.wealth -= HIRE_COST;
      firm.capitalReserves += HIRE_COST;
      firm.employeeIds.push(newHire.id);
      newHire.employedAt = firm.id;
      hires++;
    }
    unmetBySector[firm.sector] = Math.max(
      0,
      unmetBySector[firm.sector] - hires * firm.productivity,
    );
  }

  // Public reinvestment (state funds expansion of hybrid/public firms)
  const investmentPool = world.state.investmentPool;
  let investmentRemaining = investmentPool;
  for (const firm of world.firms) {
    if (investmentRemaining < HIRE_COST) break;
    if (unemployed.length === 0) break;
    if (unmetBySector[firm.sector] <= 0) continue;
    if (firm.ownershipRatio >= 1) continue; // fully private — state doesn't invest

    const workersNeeded = Math.ceil(unmetBySector[firm.sector] / Math.max(firm.productivity, 1));
    let hires = 0;
    while (
      hires < workersNeeded &&
      investmentRemaining >= HIRE_COST &&
      unemployed.length > 0
    ) {
      const newHire = unemployed.shift()!;
      investmentRemaining -= HIRE_COST;
      firm.capitalReserves += HIRE_COST;
      firm.employeeIds.push(newHire.id);
      newHire.employedAt = firm.id;
      hires++;
    }
    unmetBySector[firm.sector] = Math.max(
      0,
      unmetBySector[firm.sector] - hires * firm.productivity,
    );
  }

  const spentInvestment = investmentPool - investmentRemaining;
  world.flows.totalPublicInvestment = spentInvestment;

  // Any unused investment pool money returns to treasury (can't evaporate).
  world.state.treasury += investmentRemaining;
  world.state.investmentPool = 0;

  return world;
}

export type { Firm };
