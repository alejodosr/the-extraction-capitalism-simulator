import type { WorldState, Sector } from './types';
import { SECTORS } from './types';

/**
 * Phase 2 — Pricing.
 * For each firm, compute unit cost (already set in production) and apply blended markup.
 * Sector clearing price = weighted average of firm prices by output volume.
 */
export function runPricing(world: WorldState): WorldState {
  for (const firm of world.firms) {
    firm.unitPrice = firm.unitCost * (1 + firm.markup);
  }

  for (const market of world.markets) {
    const firmsInSector = world.firms.filter((f) => f.sector === market.sector);
    let totalOutput = 0;
    let weightedPrice = 0;
    for (const firm of firmsInSector) {
      totalOutput += firm.output;
      weightedPrice += firm.unitPrice * firm.output;
    }
    market.totalSupply = totalOutput;
    market.clearingPrice = totalOutput > 0 ? weightedPrice / totalOutput : 0;
    market.totalDemand = 0; // populated in Phase 6
    market.unmetDemand = 0;
  }

  // If a sector has zero supply, fall back to the highest non-zero price in that
  // sector's firms, else an inferred nominal price, so consumption can still
  // compute basket costs (demand will be recorded as unmet).
  for (const market of world.markets) {
    if (market.clearingPrice === 0) {
      const nominal = inferNominalPrice(world, market.sector);
      market.clearingPrice = nominal;
    }
  }

  return world;
}

function inferNominalPrice(world: WorldState, sector: Sector): number {
  // Use the average unit price of any firm in this sector (even with 0 output),
  // or derive from minimum wage and default productivity as a safe fallback.
  const firmsInSector = world.firms.filter((f) => f.sector === sector);
  const withPrice = firmsInSector.filter((f) => f.unitPrice > 0);
  if (withPrice.length > 0) {
    return withPrice.reduce((s, f) => s + f.unitPrice, 0) / withPrice.length;
  }
  // Fallback: assume productivity=1 and minimum wage = per-unit cost, plus average markup.
  const avgMarkup =
    firmsInSector.length > 0
      ? firmsInSector.reduce((s, f) => s + f.markup, 0) / firmsInSector.length
      : 0.2;
  return world.state.minimumWage * (1 + avgMarkup);
}

export { SECTORS };
