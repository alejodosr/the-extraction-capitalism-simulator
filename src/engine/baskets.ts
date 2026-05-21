import type { ClassTier, Sector } from './types';

export const BASKETS: Record<ClassTier, Record<Sector, number>> = {
  social_exclusion: { food: 0, clothing: 0, energy: 0, transportation: 0, housing: 0 },
  lower: { food: 1.5, clothing: 0.5, energy: 1.0, transportation: 0.5, housing: 0.5 },
  middle: { food: 2.0, clothing: 1.0, energy: 1.5, transportation: 1.0, housing: 1.0 },
  upper: { food: 3.0, clothing: 2.0, energy: 2.5, transportation: 2.0, housing: 2.0 },
};

// Minimum survival basket (below this = social exclusion)
export const SURVIVAL_BASKET: Record<Sector, number> = {
  food: 1.0,
  clothing: 0.2,
  energy: 0.5,
  transportation: 0.1,
  housing: 0.3,
};

// Priority order for purchasing (survival needs first)
export const PURCHASE_PRIORITY: Sector[] = [
  'food',
  'energy',
  'housing',
  'clothing',
  'transportation',
];

// Ordered tiers from highest ambition to lowest, used for classification.
// social_exclusion is the fallback if even survival can't be met.
export type AmbitionTier = Exclude<ClassTier, 'social_exclusion'>;
export const TIERS_BY_AMBITION: AmbitionTier[] = ['upper', 'middle', 'lower'];
