import type { FoldBarStyleConfig } from '../charts/fold-bar/types';
import type { DeepPartialTokens } from './default-theme';

export interface ThemeFormats {
  valueFormat?: (value: number) => string;
  tickFormat?: (value: number) => string;
}

/** A theme bundle: visual style, typography tokens and default formatters. */
export interface ThemePack {
  style?: FoldBarStyleConfig;
  tokens?: DeepPartialTokens;
  formats?: ThemeFormats;
}

/** Runtime type guard: pack keys are disjoint from DeepPartialTokens keys. */
export function isThemePack(value: object): value is ThemePack {
  return 'style' in value || 'tokens' in value || 'formats' in value;
}

const registry = new Map<string, ThemePack>();

/** Registers (or replaces) a named theme pack usable via `config.theme`. */
export function registerTheme(name: string, pack: ThemePack): void {
  registry.set(name, pack);
}

export function getTheme(name: string): ThemePack | undefined {
  return registry.get(name);
}

const DARK_STYLE: FoldBarStyleConfig = {
  barGradient: {
    normal: [
      [0, '#5B8CFF'],
      [0.07, '#4A7AF2'],
      [0.22, '#3E68DE'],
      [0.42, '#3255C2'],
      [0.62, '#27408F'],
      [0.82, '#1B2C5E'],
      [1, '#111B3A'],
    ],
    active: [
      [0, '#7BA2FF'],
      [0.07, '#6A93F8'],
      [0.22, '#5A80E8'],
      [0.42, '#4A6ACC'],
      [0.62, '#38529E'],
      [0.82, '#263868'],
      [1, '#172142'],
    ],
  },
  foldGradient: [
    [0, '#3A4E7E'],
    [0.14, '#334572'],
    [0.38, '#2A3A60'],
    [0.68, '#1F2C4C'],
    [1, '#18223C'],
  ],
  creaseGradient: [
    [0, 'rgba(255,255,255,0)'],
    [0.18, 'rgba(255,255,255,.28)'],
    [0.55, 'rgba(255,255,255,.10)'],
    [1, 'rgba(255,255,255,0)'],
  ],
  stripePattern: { lineColor: '#6E86B8', lineOpacity: 0.16 },
  washGradient: [
    [0, 'rgba(96,146,255,0)'],
    [0.55, 'rgba(96,146,255,.24)'],
    [1, 'rgba(84,130,250,.48)'],
  ],
  pill: {
    gradient: [
      [0, '#4E669E'],
      [0.45, '#3A507F'],
      [1, '#2A3B61'],
    ],
    shadow: { color: '#000814', opacity: 0.8 },
  },
  shadow: { color: '#000000', opacity: 0.5 },
};

const DARK_TOKENS: DeepPartialTokens = {
  title: { fill: '#F1F5FC' },
  axis: { fill: '#5D6880' },
  label: { fill: '#4E5871', activeFill: '#F1F5FC' },
  number: { fill: '#566179', activeFill: '#FFFFFF' },
  grid: { stroke: '#222C42' },
  tooltip: {
    bg: '#1A2236',
    stroke: 'rgba(255,255,255,.10)',
    fill: '#93A0BC',
    strongFill: '#FFFFFF',
    softFill: '#46536F',
  },
};

registerTheme('light', {});
registerTheme('dark', { style: DARK_STYLE, tokens: DARK_TOKENS });
