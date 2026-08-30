export const VERSION = '0.1.0';

export { ChartBase } from './core/chart-base';
export type { BaseConfig, ChartEventMap, ColumnEventPayload, ContainerLike } from './core/types';

export { FoldBarChart } from './charts/fold-bar';
export { defaultTooltipFormatter, defaultValueFormat } from './charts/fold-bar/defaults';
export type { FoldBarOptions, FoldBarModel } from './charts/fold-bar/defaults';
export type {
  FoldBarAxisConfig,
  FoldBarChartConfig,
  FoldBarDatum,
  FoldBarFoldConfig,
  FoldBarScaleConfig,
  FoldBarStateConfig,
  FoldBarStyleConfig,
  FoldBarTitleConfig,
  FoldBarTooltipConfig,
  TooltipFormatter,
  TooltipPart,
  TooltipTone,
} from './charts/fold-bar/types';
export type {
  BarGeometry,
  FlapGeometry,
  FoldBarLayout,
  Padding,
  PillGeometry,
  PlotRect,
  RectGeometry,
} from './charts/fold-bar/geometry';
export type { FoldBarThemeTokens, ResolvedFoldBarStyle } from './theme/default-theme';

export { createLinearScale } from './scale/linear-scale';
export type { ScaleOptions } from './scale/linear-scale';
export { createPowerScale } from './scale/power-scale';
export type { PowerScaleOptions } from './scale/power-scale';
export { createBandScale } from './scale/band-scale';
export type { BandScale } from './scale/band-scale';
