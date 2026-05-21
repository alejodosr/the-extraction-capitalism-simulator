/**
 * Single source of truth for palette hexes. Must stay in sync with the
 * Tailwind `econ.*` namespace in tailwind.config.ts.
 *
 * Design language: The Extraction — white / near-black / sky-blue (#7AB3CF) chrome.
 * Data colors retain semantic hue families but are anchored at consistent
 * lightness bands so chart layers stay visually distinct.
 */

// Chrome accent — sky blue from design reference
export const ACCENT = '#7AB3CF';

// Money flows — agent roles
export const ROLE_COLORS = {
  worker: '#16A34A',     // green-600
  capitalist: '#D97706', // amber-600
} as const;

// Money flows — institution nodes in Sankey
export const INSTITUTION_COLORS = {
  state: '#2563EB', // blue-600
  firm: '#9333EA',  // purple-600
} as const;

// Class distribution stacked-area (indigo/teal/amber/red — deep 700 level)
export const TIER_COLORS = {
  upper: '#4338CA',
  middle: '#0F766E',
  lower: '#B45309',
  social_exclusion: '#B91C1C',
} as const;

// KPI sparklines (bright 400–500 level; each a distinct hue family)
export const METRIC_COLORS = {
  gdp: '#7AB3CF',          // accent sky — primary KPI
  gini: '#818CF8',          // indigo-400
  unemployment: '#FB923C',  // orange-400
  exclusion: '#F87171',     // red-400
  toxic: '#F472B6',         // pink-400
  circulation: '#22D3EE',   // cyan-400
} as const;

// Overlay palette for the Compare view — max 4 runs overlaid
export const COMPARE_COLORS = ['#6366F1', '#F59E0B', '#10B981', '#DC2626'];
