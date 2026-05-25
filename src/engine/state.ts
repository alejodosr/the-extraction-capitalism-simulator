import type { WorldState, Agent } from './types';
import { SECTORS } from './types';
import { BASKETS } from './baskets';

// Essentials sectors that the subsidy applies to (mirrors consumption.ts).
const ESSENTIAL_SECTORS = new Set(['food', 'energy', 'housing']);

/**
 * Phase 5 — State expenditure.
 *
 * The state is a pure fiscal intermediary: no direct employment. It pays
 * welfare to the most vulnerable agents, carves out an investment pool for
 * Phase 8 (hiring into public firms), and sets aside an essentials subsidy
 * pool for Phase 6. All treasury draws sum to ≤ treasury balance so money
 * conservation holds.
 *
 * Welfare distribution: prefer social_exclusion agents; fall back to
 * unemployed workers. Investment pool: Phase 8 spends it on hiring workers
 * into public/hybrid firms. Subsidy pool: Phase 6 draws from it to cover
 * the state's share of essentials prices for non-capitalist agents.
 *
 * Welfare is capped per agent at the deficit to afford the lower basket —
 * this prevents the "welfare overshoot" oscillation where a huge equal-share
 * payment rockets excluded agents to upper tier one year, then collapses back
 * the next. Unused welfare returns to treasury (money conservation).
 */
export function runStateExpenditure(world: WorldState): WorldState {
  // Welfare pool
  const remaining = Math.max(0, world.state.treasury);
  const welfarePool = remaining * world.state.welfareBudgetRatio;
  world.state.treasury -= welfarePool;

  // Distribute welfare: prefer social_exclusion; fall back to unemployed workers.
  const recipients = chooseWelfareRecipients(world);
  if (recipients.length > 0 && welfarePool > 0) {
    // Compute effective lower basket cost at current prices after subsidy.
    // Pricing has already run (Phase 2), so clearingPrice is populated.
    const subsidyRatio = Math.min(1, Math.max(0, world.state.essentialsSubsidyRatio));
    const effectiveLowerCost = SECTORS.reduce((sum, s) => {
      const market = world.markets.find((m) => m.sector === s);
      const price = market?.clearingPrice ?? world.state.minimumWage;
      const discount = ESSENTIAL_SECTORS.has(s) ? subsidyRatio : 0;
      return sum + BASKETS.lower[s] * price * (1 - discount);
    }, 0);

    // Target available resources so consumptionBudget >= effectiveLowerCost.
    // consumptionBudget = (wealth + income) * propensity, so:
    //   target = effectiveLowerCost / propensity
    const propensity = Math.max(0.01, world.state.workerPropensity);
    const targetAvailable = effectiveLowerCost / propensity;

    // Each recipient gets at most their individual deficit (how far below the
    // lower-basket threshold they are), capped by an equal per-capita share of
    // the pool so no one agent drains it. Unused pool returns to treasury.
    const perCap = welfarePool / recipients.length;
    let poolLeft = welfarePool;
    for (const a of recipients) {
      const available = a.wealth + a.income;
      const deficit = Math.max(0, targetAvailable - available);
      const give = Math.min(deficit, perCap, poolLeft);
      a.income += give;
      poolLeft -= give;
      world.flows.totalWelfare += give;
    }
    // Return unspent welfare to treasury (money conservation).
    world.state.treasury += poolLeft;
  } else {
    // No recipients — return pool to treasury to keep money conservation.
    world.state.treasury += welfarePool;
  }

  // Investment pool: held separately but tracked on state so it can be spent in Phase 8.
  const investmentPool = Math.max(0, world.state.treasury) * world.state.investmentBudgetRatio;
  world.state.treasury -= investmentPool;
  world.state.investmentPool = investmentPool;

  // Essentials subsidy pool for Phase 6. Size is a fraction of remaining
  // treasury proportional to the subsidy ratio. We don't try to precisely
  // match expected essentials demand — we just cap spending by treasury and
  // let consumption.ts draw from the pool until it's empty. Unspent pool
  // returns to treasury at end of Phase 6 (money conservation).
  const subsidyBudgetShare = Math.min(1, Math.max(0, world.state.essentialsSubsidyRatio));
  const subsidyPool = Math.max(0, world.state.treasury) * subsidyBudgetShare;
  world.state.treasury -= subsidyPool;
  world.state.subsidyPool = subsidyPool;

  return world;
}

function chooseWelfareRecipients(world: WorldState): Agent[] {
  const excluded = world.agents.filter((a) => a.class === 'social_exclusion');
  if (excluded.length > 0) return excluded;
  return world.agents.filter((a) => a.role === 'worker' && a.employedAt === null);
}
