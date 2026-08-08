import { Tokens } from '@/constants/theme';

/**
 * Cart alternative slots — single source of truth for the colour-coded
 * alternative rows (BRD §8.1). The base cart line is always white; each entry
 * below is one assignable alternative slot. To rescale the feature (e.g. 4
 * alternatives per line), edit `ALTERNATIVE_COLORS` and the UI adapts.
 */
export const ALTERNATIVE_COLORS = ['yellow', 'green', 'blue'] as const;
export type AlternativeColor = (typeof ALTERNATIVE_COLORS)[number];
export const MAX_ALTERNATIVES_PER_ITEM = ALTERNATIVE_COLORS.length;

/** Solid accent per alternative colour. */
export const ALTERNATIVE_COLOR_HEX: Record<AlternativeColor, string> = {
  yellow: '#eab308',
  green: Tokens.success,
  blue: Tokens.steel,
};

/** Soft row tint per alternative colour (hex + alpha). */
export const ALTERNATIVE_COLOR_TINT: Record<AlternativeColor, string> = {
  yellow: '#eab30826',
  green: '#16a34a26',
  blue: '#3d6b8e26',
};
