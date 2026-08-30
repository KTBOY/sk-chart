import type { GradientStop } from '../core/svg-renderer';
import type {
  DropShadowStyle,
  FoldBarStyleConfig,
  PillStyle,
  StripePatternStyle,
} from '../charts/fold-bar/types';

export interface ResolvedFoldBarStyle {
  stripePattern: StripePatternStyle;
  barGradientActive: GradientStop[];
  barGradientNormal: GradientStop[];
  foldGradient: GradientStop[];
  creaseGradient: GradientStop[];
  washTop: number;
  washGradient: GradientStop[];
  pill: PillStyle;
  shadow: DropShadowStyle;
  fadeMask: { start: number; end: number };
  labelY: number;
  numberY: number;
  labelXOffset: number;
}

export interface FoldBarThemeTokens {
  fontFamily: string;
  title: { fill: string; fontSize: number; fontWeight: number; letterSpacing: string };
  axis: { fill: string; fontSize: number; fontWeight: number };
  label: { fill: string; activeFill: string; fontSize: number; fontWeight: number };
  number: {
    fill: string;
    activeFill: string;
    fontSize: number;
    fontWeight: number;
    letterSpacing: string;
  };
  grid: { stroke: string; strokeWidth: number };
  tooltip: {
    bg: string;
    stroke: string;
    fill: string;
    strongFill: string;
    softFill: string;
    fontSize: number;
  };
  transition: { state: string; tip: string };
}

const BAR_GRADIENT_ACTIVE: GradientStop[] = [
  [0, '#2A2FC8'],
  [0.07, '#2A55E2'],
  [0.22, '#2C62EC'],
  [0.42, '#3184F7'],
  [0.62, '#77ABF5'],
  [0.82, '#C5DAF5'],
  [1, '#EAF1FA'],
];

const BAR_GRADIENT_NORMAL: GradientStop[] = [
  [0, '#2B3AD6'],
  [0.07, '#2C60EC'],
  [0.22, '#2F76F2'],
  [0.42, '#4C93F8'],
  [0.62, '#87B5F6'],
  [0.82, '#CDDDF5'],
  [1, '#EBF2FA'],
];

const DEFAULT_STYLE: ResolvedFoldBarStyle = {
  stripePattern: { size: 7.1, lineWidth: 2.1, lineColor: '#fff', lineOpacity: 0.93, rotation: 45 },
  barGradientActive: BAR_GRADIENT_ACTIVE,
  barGradientNormal: BAR_GRADIENT_NORMAL,
  foldGradient: [
    [0, '#8FB2F8'],
    [0.14, '#A6C2FA'],
    [0.38, '#C6DAFA'],
    [0.68, '#E6EDFB'],
    [1, '#F4F7FC'],
  ],
  creaseGradient: [
    [0, 'rgba(255,255,255,0)'],
    [0.18, 'rgba(255,255,255,.62)'],
    [0.55, 'rgba(255,255,255,.18)'],
    [1, 'rgba(255,255,255,0)'],
  ],
  washTop: 115,
  washGradient: [
    [0, 'rgba(222,240,254,0)'],
    [0.55, 'rgba(222,240,254,.55)'],
    [1, 'rgba(214,238,254,1)'],
  ],
  pill: {
    width: 26,
    height: 7,
    rx: 3.5,
    offsetY: -13,
    gradient: [
      [0, '#EFF7FF'],
      [0.45, '#BBD9FF'],
      [1, '#7FB2FF'],
    ],
    shadow: { width: 24, height: 1.4, rx: 0.7, offsetY: -7.5, color: '#4A78D8', opacity: 0.75 },
  },
  shadow: { dx: 0, dy: 3, blur: 5, color: '#1B3560', opacity: 0.14 },
  fadeMask: { start: 344, end: 360 },
  labelY: 85,
  numberY: 117,
  labelXOffset: -5,
};

export const DEFAULT_THEME_TOKENS: FoldBarThemeTokens = {
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI","Inter","Helvetica Neue","PingFang SC","Microsoft YaHei",Arial,sans-serif',
  title: { fill: '#14161F', fontSize: 21, fontWeight: 700, letterSpacing: '-0.2px' },
  axis: { fill: '#9AA1AC', fontSize: 11, fontWeight: 500 },
  label: { fill: '#C4CAD3', activeFill: '#242A36', fontSize: 11.5, fontWeight: 500 },
  number: {
    fill: '#C9CED6',
    activeFill: '#15181F',
    fontSize: 27,
    fontWeight: 600,
    letterSpacing: '-0.6px',
  },
  grid: { stroke: '#E9EBEF', strokeWidth: 1 },
  tooltip: {
    bg: '#fff',
    stroke: 'rgba(20,35,70,.07)',
    fill: '#79839A',
    strongFill: '#171B26',
    softFill: '#C3C8D4',
    fontSize: 10.5,
  },
  transition: { state: '.32s ease', tip: 'transform .34s cubic-bezier(.22,.61,.36,1)' },
};

/** Merges partial user style over the prototype-derived defaults. */
export function resolveStyle(style?: FoldBarStyleConfig): ResolvedFoldBarStyle {
  if (!style) return DEFAULT_STYLE;
  return {
    stripePattern: { ...DEFAULT_STYLE.stripePattern, ...style.stripePattern },
    barGradientActive: style.barGradient?.active ?? DEFAULT_STYLE.barGradientActive,
    barGradientNormal: style.barGradient?.normal ?? DEFAULT_STYLE.barGradientNormal,
    foldGradient: style.foldGradient ?? DEFAULT_STYLE.foldGradient,
    creaseGradient: style.creaseGradient ?? DEFAULT_STYLE.creaseGradient,
    washTop: style.washTop ?? DEFAULT_STYLE.washTop,
    washGradient: style.washGradient ?? DEFAULT_STYLE.washGradient,
    pill: {
      ...DEFAULT_STYLE.pill,
      ...style.pill,
      gradient: style.pill?.gradient ?? DEFAULT_STYLE.pill.gradient,
      shadow: { ...DEFAULT_STYLE.pill.shadow, ...style.pill?.shadow },
    },
    shadow: { ...DEFAULT_STYLE.shadow, ...style.shadow },
    fadeMask: { ...DEFAULT_STYLE.fadeMask, ...style.fadeMask },
    labelY: style.labelY ?? DEFAULT_STYLE.labelY,
    numberY: style.numberY ?? DEFAULT_STYLE.numberY,
    labelXOffset: style.labelXOffset ?? DEFAULT_STYLE.labelXOffset,
  };
}

/** Top-level optional theme override; nested token groups are partially overridable. */
export type DeepPartialTokens = {
  [K in keyof FoldBarThemeTokens]?: FoldBarThemeTokens[K] extends object
    ? Partial<FoldBarThemeTokens[K]>
    : FoldBarThemeTokens[K];
};

/** Merges partial user theme tokens over the defaults, group by group. */
export function resolveTokens(theme?: DeepPartialTokens): FoldBarThemeTokens {
  if (!theme) return DEFAULT_THEME_TOKENS;
  return {
    fontFamily: theme.fontFamily ?? DEFAULT_THEME_TOKENS.fontFamily,
    title: { ...DEFAULT_THEME_TOKENS.title, ...theme.title },
    axis: { ...DEFAULT_THEME_TOKENS.axis, ...theme.axis },
    label: { ...DEFAULT_THEME_TOKENS.label, ...theme.label },
    number: { ...DEFAULT_THEME_TOKENS.number, ...theme.number },
    grid: { ...DEFAULT_THEME_TOKENS.grid, ...theme.grid },
    tooltip: { ...DEFAULT_THEME_TOKENS.tooltip, ...theme.tooltip },
    transition: { ...DEFAULT_THEME_TOKENS.transition, ...theme.transition },
  };
}

/** Scoped stylesheet embedded inside each chart's SVG, isolating instances from each other. */
export function buildScopedCss(uid: string, tokens: FoldBarThemeTokens): string {
  const c = (name: string) => `.${uid}-${name}`;
  return [
    `${c('root')}{display:block;width:100%;height:auto;font-family:${tokens.fontFamily}}`,
    `${c('title')}{font-size:${tokens.title.fontSize}px;font-weight:${tokens.title.fontWeight};fill:${tokens.title.fill};letter-spacing:${tokens.title.letterSpacing}}`,
    `${c('axis')}{font-size:${tokens.axis.fontSize}px;font-weight:${tokens.axis.fontWeight};fill:${tokens.axis.fill};font-variant-numeric:tabular-nums}`,
    `${c('lbl')}{font-size:${tokens.label.fontSize}px;font-weight:${tokens.label.fontWeight};fill:${tokens.label.fill};transition:fill .3s ease}`,
    `${c('num')}{font-size:${tokens.number.fontSize}px;font-weight:${tokens.number.fontWeight};fill:${tokens.number.fill};letter-spacing:${tokens.number.letterSpacing};font-variant-numeric:tabular-nums;transition:fill .3s ease}`,
    `${c('col')}.${uid}-active ${c('lbl')}{fill:${tokens.label.activeFill}}`,
    `${c('col')}.${uid}-active ${c('num')}{fill:${tokens.number.activeFill}}`,
    `${c('stripes')}{opacity:1;transition:opacity ${tokens.transition.state}}`,
    `${c('col')}.${uid}-active ${c('stripes')}{opacity:0}`,
    `${c('wash')}{opacity:0;transition:opacity ${tokens.transition.state}}`,
    `${c('col')}.${uid}-active ${c('wash')}{opacity:1}`,
    `${c('hit')}{fill:transparent;cursor:pointer}`,
    `${c('tip')}{transition:${tokens.transition.tip};pointer-events:none}`,
    `${c('tip')} text{font-size:${tokens.tooltip.fontSize}px;font-weight:400;fill:${tokens.tooltip.fill};font-variant-numeric:tabular-nums}`,
    `${c('tip')} ${c('b')}{font-weight:700;fill:${tokens.tooltip.strongFill}}`,
    `${c('tip')} ${c('s')}{fill:${tokens.tooltip.softFill}}`,
    `@media (prefers-reduced-motion: reduce){${c('lbl')},${c('num')},${c('stripes')},${c('wash')},${c('tip')}{transition:none}}`,
  ].join('\n');
}
