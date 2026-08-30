import type { GradientStop } from '../../core/svg-renderer';
import type { BaseConfig } from '../../core/types';
import type { DeepPartialTokens } from '../../theme/default-theme';
import type { Padding } from './geometry';

export interface FoldBarDatum {
  label: string;
  value: number;
  [key: string]: unknown;
}

export interface FoldBarScaleConfig {
  /** Power applied to normalized values. 1 = linear; 2 reproduces the fold-funnel silhouette. */
  exponent?: number;
}

export interface FoldBarFoldConfig {
  /** Horizontal run reserved for the paper fold between columns. */
  run?: number;
  creaseColor?: string;
  creaseWidth?: number;
}

export interface FoldBarAxisConfig {
  /** Explicit tick values, e.g. [70, 60, 50, 40, 30]. */
  ticks?: number[];
  tickFormat?: (value: number) => string;
  /** Vertical zone [top, bottom] where tick labels are evenly distributed. */
  zone?: [number, number];
}

export type TooltipTone = 'n' | 'b' | 's';

export interface TooltipPart {
  text: string;
  /** 'b' = bold ink, 's' = faded separator, 'n'/omitted = normal. */
  tone?: TooltipTone;
}

export type TooltipFormatter = (
  datum: FoldBarDatum,
  index: number,
  data: FoldBarDatum[],
) => TooltipPart[];

export interface FoldBarTooltipConfig {
  enabled?: boolean;
  formatter?: TooltipFormatter;
  height?: number;
  radius?: number;
  paddingX?: number;
  anchorRatio?: number;
  offsetY?: number;
  minY?: number;
  /** Skip text measurement and use a fixed width (SSR / testing escape hatch). */
  fixedWidth?: number;
}

export interface FoldBarStateConfig {
  /** Active column when idle. Defaults to the last column. */
  defaultActive?: number;
}

export interface FoldBarTitleConfig {
  text?: string;
  x?: number;
  y?: number;
}

export interface StripePatternStyle {
  size: number;
  lineWidth: number;
  lineColor: string;
  lineOpacity: number;
  rotation: number;
}

export interface PillShadowStyle {
  width: number;
  height: number;
  rx: number;
  offsetY: number;
  color: string;
  opacity: number;
}

export interface PillStyle {
  width: number;
  height: number;
  rx: number;
  offsetY: number;
  gradient: GradientStop[];
  shadow: PillShadowStyle;
}

export interface DropShadowStyle {
  dx: number;
  dy: number;
  blur: number;
  color: string;
  opacity: number;
}

export interface FoldBarStyleConfig {
  stripePattern?: Partial<StripePatternStyle>;
  /** The active stops paint the default-active bar; all other bars use normal. */
  barGradient?: { active?: GradientStop[]; normal?: GradientStop[] };
  foldGradient?: GradientStop[];
  creaseGradient?: GradientStop[];
  washTop?: number;
  washGradient?: GradientStop[];
  pill?: Partial<Omit<PillStyle, 'shadow'>> & { shadow?: Partial<PillShadowStyle> };
  shadow?: Partial<DropShadowStyle>;
  fadeMask?: Partial<{ start: number; end: number }>;
  labelY?: number;
  numberY?: number;
  labelXOffset?: number;
}

export interface FoldBarChartConfig extends BaseConfig {
  data: FoldBarDatum[];
  xField?: string;
  yField?: string;
  /** Formats bar header values and feeds the default tooltip formatter. */
  valueFormat?: (value: number) => string;
  ariaLabel?: string;
  padding?: Partial<Padding>;
  stair?: Partial<{ bottomOffset: number; topOffset: number }>;
  scale?: FoldBarScaleConfig;
  fold?: FoldBarFoldConfig;
  axis?: FoldBarAxisConfig;
  tooltip?: FoldBarTooltipConfig;
  state?: FoldBarStateConfig;
  title?: FoldBarTitleConfig;
  style?: FoldBarStyleConfig;
  /** Typography / color / transition tokens; deep-merged over the defaults. */
  theme?: DeepPartialTokens;
}
