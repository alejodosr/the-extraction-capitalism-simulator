import type { Agent, Firm, Role, Sector, WorldState } from './types';
import { SECTORS } from './types';
import { BASKETS, PURCHASE_PRIORITY, SURVIVAL_BASKET, TIERS_BY_AMBITION } from './baskets';
import { zeroSatisfaction } from './initialization';

/**
 * Phase 6 — Consumption / market clearing.
 *
 * Two key dynamics live here:
 *
 * 1) **Consumption propensity (hoarding).** Each agent attempts to consume
 *    only `propensity[role] × available` of their disposable resources. The
 *    rest accumulates as wealth (savings / hoard). Capitalists typically have
 *    low propensity — the mechanism that makes "unredistributed surplus"
 *    actually stagnate rather than recirculate.
 *
 * 2) **Essentials subsidy.** The state optionally covers a fraction of the
 *    clearing price for essentials (food / energy / housing) purchased by
 *    non-capitalist agents, funded from `state.subsidyPool` (set up in
 *    Phase 5). Firms still receive the full clearing price — the state makes
 *    up the difference — so this models means-tested price supports
 *    (food stamps, housing vouchers, energy rebates).
 *
 * Supply is treated as infinite (v1 simplification): agents are only excluded
 * when they cannot *afford* a basket within their consumption budget.
 *
 * At end of phase: unspent income rolls into wealth.
 */

const ESSENTIALS: Sector[] = ['food', 'energy', 'housing'];
const ESSENTIAL_SET = new Set<Sector>(ESSENTIALS);

export function runConsumption(world: WorldState): WorldState {
  for (const a of world.agents) {
    a.consumptionSatisfied = zeroSatisfaction();
  }

  const clearingPrice: Record<Sector, number> = {
    food: 0,
    clothing: 0,
    energy: 0,
    transportation: 0,
    housing: 0,
  };
  for (const market of world.markets) {
    clearingPrice[market.sector] = market.clearingPrice;
  }

  const sectorRevenue: Record<Sector, number> = {
    food: 0,
    clothing: 0,
    energy: 0,
    transportation: 0,
    housing: 0,
  };
  const sectorUnitsSold: Record<Sector, number> = {
    food: 0,
    clothing: 0,
    energy: 0,
    transportation: 0,
    housing: 0,
  };
  const sectorDemand: Record<Sector, number> = {
    food: 0,
    clothing: 0,
    energy: 0,
    transportation: 0,
    housing: 0,
  };

  // Sort agents by disposable resources descending. With heterogeneous wealth
  // this is now a real ordering (richest shop first).
  const ordered = world.agents
    .slice()
    .sort((a, b) => b.income + b.wealth - (a.income + a.wealth));

  const basketCost = (basket: Record<Sector, number>) =>
    SECTORS.reduce((sum, s) => sum + basket[s] * clearingPrice[s], 0);

  const upperCost = basketCost(BASKETS.upper);
  const middleCost = basketCost(BASKETS.middle);
  const lowerCost = basketCost(BASKETS.lower);

  // Subsidy pool shrinks as non-capitalists buy essentials. When it hits 0
  // the subsidy turns off mid-phase. Firms always receive the full clearing
  // price; the subsidy just splits who pays what.
  const rawSubsidyRatio = clamp01(world.state.essentialsSubsidyRatio);
  let subsidyPool = Math.max(0, world.state.subsidyPool);
  let subsidyPaid = 0;

  for (const agent of ordered) {
    const available = agent.income + agent.wealth;
    const propensity = clamp01(propensityFor(agent.role, world));
    // Consumption budget: only this fraction of available resources is
    // *considered* for spending this year. The rest is savings.
    const consumptionBudget = available * propensity;

    // Aspirational demand = best basket affordable from *available* (not just
    // the consumption budget). Phase 8 uses this to decide whether to expand
    // output, so it should reflect what people want, not what they'll buy.
    let aspiration: Record<Sector, number> = SURVIVAL_BASKET;
    if (available >= upperCost) aspiration = BASKETS.upper;
    else if (available >= middleCost) aspiration = BASKETS.middle;
    else if (available >= lowerCost) aspiration = BASKETS.lower;
    for (const s of SECTORS) sectorDemand[s] += aspiration[s];

    // Subsidy applies to all non-capitalists (means-tested in v1).
    const subsidyEligible = agent.role !== 'capitalist';

    // Effective basket cost for *this agent* after subsidy on essentials.
    // (Firms still see full clearing price — the state pays the difference.)
    const costForAgent = (basket: Record<Sector, number>): number =>
      SECTORS.reduce((sum, s) => {
        const units = basket[s];
        if (units <= 0) return sum;
        const fullPrice = clearingPrice[s];
        const discount =
          subsidyEligible && ESSENTIAL_SET.has(s) && subsidyPool > 0 ? rawSubsidyRatio : 0;
        return sum + units * fullPrice * (1 - discount);
      }, 0);

    // Pick highest tier the agent can fit inside their consumption budget.
    let chosenTier: 'upper' | 'middle' | 'lower' | null = null;
    let basket: Record<Sector, number> | null = null;
    for (const tier of TIERS_BY_AMBITION) {
      const agentPays = costForAgent(BASKETS[tier]);
      if (consumptionBudget >= agentPays && available >= agentPays) {
        chosenTier = tier;
        basket = BASKETS[tier];
        break;
      }
    }

    let spentByAgent = 0;

    if (chosenTier !== null && basket !== null) {
      for (const s of SECTORS) {
        const units = basket[s];
        if (units <= 0) continue;
        const fullPrice = clearingPrice[s];
        const { agentShare, subsidyShare } = splitWithSubsidy(
          fullPrice,
          units,
          subsidyEligible && ESSENTIAL_SET.has(s),
          rawSubsidyRatio,
          subsidyPool,
        );
        sectorRevenue[s] += fullPrice * units; // firms always get full price
        sectorUnitsSold[s] += units;
        agent.consumptionSatisfied[s] = 1;
        spentByAgent += agentShare;
        subsidyPool -= subsidyShare;
        subsidyPaid += subsidyShare;
      }
      agent._attemptedTier = chosenTier;
      deductSpend(agent, spentByAgent);
    } else {
      // Survival: can't even fit the lower basket in budget. Try to cover
      // survival needs partial-by-sector within the consumption budget.
      let moneyLeft = Math.min(consumptionBudget, available);
      for (const s of PURCHASE_PRIORITY) {
        const desired = SURVIVAL_BASKET[s];
        if (desired <= 0) continue;
        const fullPrice = clearingPrice[s];
        if (fullPrice <= 0) {
          agent.consumptionSatisfied[s] = 1;
          continue;
        }
        const discount =
          subsidyEligible && ESSENTIAL_SET.has(s) && subsidyPool > 0 ? rawSubsidyRatio : 0;
        const agentPricePerUnit = fullPrice * (1 - discount);
        const maxByMoney = agentPricePerUnit > 0 ? moneyLeft / agentPricePerUnit : 0;
        const units = Math.min(desired, maxByMoney);
        if (units <= 0) {
          agent.consumptionSatisfied[s] = 0;
          continue;
        }
        const agentShare = units * agentPricePerUnit;
        const subsidyShare = Math.min(subsidyPool, units * fullPrice * discount);
        sectorRevenue[s] += units * fullPrice;
        sectorUnitsSold[s] += units;
        moneyLeft -= agentShare;
        spentByAgent += agentShare;
        subsidyPool -= subsidyShare;
        subsidyPaid += subsidyShare;
        agent.consumptionSatisfied[s] = Math.min(1, units / desired);
      }
      deductSpend(agent, spentByAgent);
      agent._attemptedTier = 'social_exclusion';
    }

    // Anything inside the consumption budget that wasn't spent on the chosen
    // basket is counted as hoarded (stays in wealth). We track the portion
    // *outside* the budget too since that's the real savings behavior.
    world.flows.totalHoarded += Math.max(0, available - spentByAgent);
  }

  // Redistribute revenue back to firms proportional to output share in sector.
  for (const firm of world.firms) {
    if (firm.output <= 0) continue;
    const market = world.markets.find((m) => m.sector === firm.sector);
    if (!market || market.totalSupply <= 0) continue;
    const share = firm.output / market.totalSupply;
    firm.capitalReserves += sectorRevenue[firm.sector] * share;
  }

  // Record market outcomes
  for (const market of world.markets) {
    market.totalDemand = sectorDemand[market.sector];
    market.unmetDemand = Math.max(0, market.totalDemand - sectorUnitsSold[market.sector]);
  }

  // Leftover subsidy pool flows back to treasury (can't evaporate — money
  // conservation invariant).
  world.state.treasury += Math.max(0, subsidyPool);
  world.state.subsidyPool = 0;

  world.flows.totalConsumption = SECTORS.reduce((sum, s) => sum + sectorRevenue[s], 0);
  world.flows.totalEssentialsSubsidy = subsidyPaid;

  // Unspent income rolls into wealth.
  for (const a of world.agents) {
    a.wealth += a.income;
    a.income = 0;
    if (a.wealth < 0) a.wealth = 0;
  }

  return world;
}

function propensityFor(role: Role, world: WorldState): number {
  switch (role) {
    case 'worker':
      return world.state.workerPropensity;
    case 'capitalist':
      return world.state.capitalistPropensity;
  }
}

// Decide how much of a purchase the agent pays vs. the subsidy pool covers.
// Subsidy cap: cannot draw more than remaining pool.
function splitWithSubsidy(
  fullPrice: number,
  units: number,
  eligible: boolean,
  subsidyRatio: number,
  poolRemaining: number,
): { agentShare: number; subsidyShare: number } {
  const total = fullPrice * units;
  if (!eligible || subsidyRatio <= 0 || poolRemaining <= 0 || total <= 0) {
    return { agentShare: total, subsidyShare: 0 };
  }
  const target = total * subsidyRatio;
  const subsidyShare = Math.min(target, poolRemaining);
  return { agentShare: total - subsidyShare, subsidyShare };
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

function deductSpend(agent: Agent, total: number): void {
  let remaining = total;
  const fromIncome = Math.min(agent.income, remaining);
  agent.income -= fromIncome;
  remaining -= fromIncome;
  if (remaining > 0) {
    const fromWealth = Math.min(agent.wealth, remaining);
    agent.wealth -= fromWealth;
    remaining -= fromWealth;
  }
}

export type { Firm };
