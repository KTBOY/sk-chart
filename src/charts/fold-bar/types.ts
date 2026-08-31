import type { GradientStop } from '../../core/svg-renderer';
import type { BaseConfig } from '../../core/types';
import type { DeepPartialTokens } from '../../theme/default-theme';
import type { ThemePack } from '../../theme/presets';
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
  /** Explicit tick values, e.g. [70, 60, 50, 40, 30]. Positions map via barTopOf. */
  ticks?: number[];
  tickFormat?: (value: number) => string;
}

export type XAxisLabelFormatter = (
  datum: FoldBarDatum,
  index: number,
  data: FoldBarDatum[],
) => string;

export type XAxisBottomFormatter = (
  datum: FoldBarDatum,
  index: number,
  data: FoldBarDatum[],
) => string | string[];

export interface FoldBarXAxisTitleConfig {
  text?: string;
  /** Defaults to the horizontal center of the plot. */
  x?: number;
  /** Defaults to the row below the bottom labels. */
  y?: number;
}

export interface FoldBarXAxisConfig {
  /** Formats the header-row category labels; defaults to the xField value. */
  labelFormat?: XAxisLabelFormatter;
  /**
   * Optional semantic row below the plot (e.g. stage index + step conversion).
   * Returning an array renders one line per entry. Reserves bottom space.
   */
  bottomLabels?: XAxisBottomFormatter;
  /** Axis caption rendered below the bottom labels. Reserves one bottom row. */
  title?: FoldBarXAxisTitleConfig;
  /** Baseline under the bar bottoms (below the fade). Default false to keep the dissolving-paper look. */
  showLine?: boolean;
  /** Small marks under each column center. Default false. */
  showTick?: boolean;
  /** Vertical column dividers. Default true (previous always-on behavior). */
  showGrid?: boolean;
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
  enabled: boolean;
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
  enabled: boolean;
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
  /** Renders the active-column wash backdrop. Default true. */
  washEnabled?: boolean;
  pill?: Partial<Omit<PillStyle, 'shadow'>> & { shadow?: Partial<PillShadowStyle> };
  shadow?: Partial<DropShadowStyle>;
  /** `enabled: false` removes the dissolving baseline mask. Default true. */
  fadeMask?: Partial<{ start: number; end: number; enabled: boolean }>;
  labelY?: number;
  numberY?: number;
  /** Nudge of the label and value away from the bar's horizontal center. */
  labelXOffset?: number;
}

/** Preset name ('light' | 'dark' | registered), an inline pack, or a legacy tokens partial. */
export type ThemeRef = string | ThemePack | DeepPartialTokens;

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
  xAxis?: FoldBarXAxisConfig;
  tooltip?: FoldBarTooltipConfig;
  state?: FoldBarStateConfig;
  title?: FoldBarTitleConfig;
  style?: FoldBarStyleConfig;
  /** Preset name, inline theme pack, or legacy typography tokens; deep-merged over the defaults. */
  theme?: ThemeRef;
}
