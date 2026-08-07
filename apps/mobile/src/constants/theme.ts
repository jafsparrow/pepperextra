/**
 * Design tokens. Single source of truth for colours and spacing.
 * BRD palette: warm sand backgrounds, white cards, deep amber primary,
 * steel blue secondary, green success. No dark mode.
 */

import { Platform } from 'react-native';

export const Tokens = {
  background: '#f7f3e9',
  surface: '#f7f3e9',
  card: '#ffffff',
  foreground: '#1c1917',
  foregroundSecondary: '#57534e',
  muted: '#a8a29e',
  border: '#e7e0d6',
  primary: '#b45309',
  primaryForeground: '#ffffff',
  steel: '#3d6b8e',
  success: '#16a34a',
  danger: '#dc2626',
} as const;

export const Colors = {
  light: {
    text: Tokens.foreground,
    background: Tokens.background,
    backgroundElement: Tokens.card,
    backgroundSelected: '#ece5d8',
    textSecondary: Tokens.foregroundSecondary,
  },
  dark: {
    text: Tokens.foreground,
    background: Tokens.background,
    backgroundElement: Tokens.card,
    backgroundSelected: '#ece5d8',
    textSecondary: Tokens.foregroundSecondary,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
/** Width (dp) at which the app switches to tablet layouts. Matches `use-mobile` in packages/ui. */
export const TabletBreakpoint = 768;
