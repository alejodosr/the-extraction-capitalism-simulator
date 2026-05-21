import type { WorldState } from './types';

/**
 * Phase 7 — Classification.
 *
 * Consumption already determined the highest basket the agent fully satisfied
 * (stashed on agent._attemptedTier). We read that and assign agent.class.
 * If no tier was recorded (shouldn't happen after consumption runs), fall
 * back to social_exclusion.
 */
export function runClassification(world: WorldState): WorldState {
  for (const agent of world.agents) {
    agent.class = agent._attemptedTier ?? 'social_exclusion';
    // Clear the transient hint so it doesn't leak into serialization.
    delete agent._attemptedTier;
  }
  return world;
}
