import type { Padding } from './geometry';
import { barGeometry, computeLayout, flapGeometry, type BarGeometry, type FlapGeometry, type FoldBarLayout } from './geometry';
import {
  resolveStyle,
  resolveTokens,
  type FoldBarThemeTokens,
  type ResolvedFoldBarStyle,
} from '../../theme/default-theme';
import type {
  FoldBarChartConfig,
  FoldBarDatum,
  TooltipFormatter,
  TooltipPart,
  XAxisBottomFormatter,
  XAxisLabelFormatter,
} from './types';

export interface FoldBarOptions {
  width: number;
  height: number;
  xField: string;
  yField: string;
  valueFormat: (value: number) => string;
  ariaLabel: string;
  padding: Padding;
  stair: { bottomOffset: number; topOffset: number };
  scale: { exponent: number };
  fold: { run: number; creaseColor: string; creaseWidth: number };
  axis: {
    ticks: number[];
    tickFormat: (value: number) => string;
    /** Axis domain maximum; bars normalize against it so ticks map truthfully. */
    domainMax: number;
  };
  xAxis: {
    labelFormat: XAxisLabelFormatter;
    bottomLabels?: XAxisBottomFormatter;
    title: { text: string; x?: number; y?: number };
    showLine: boolean;
    showTick: boolean;
    showGrid: boolean;
  };
  tooltip: {
    enabled: boolean;
    formatter: TooltipFormatter;
    height: number;
    radius: number;
    paddingX: number;
    anchorRatio: number;
    offsetY: number;
    minY: number;
    fixedWidth?: number;
  };
  state: { defaultActive: number };
  title: { text: string; x: number; y: number };
  style: ResolvedFoldBarStyle;
  tokens: FoldBarThemeTokens;
}

/** Default header value formatter, matching the prototype's `65.2k` labels. */
export const defaultValueFormat = (value: number): string => `${value.toFixed(1)}k`;

/**
 * Default tooltip: value + conversion vs. the previous stage + loss,
 * reproducing the prototype's payments wording.
 */
export function defaultTooltipFormatter(
  datum: FoldBarDatum,
  index: number,
  data: FoldBarDatum[],
): TooltipPart[] {
  const value = datum.value;
  const prev = index > 0 ? data[index - 1].value : null;
  const conversion = prev ? Math.round((value / prev) * 100) : 100;
  const loss = prev ? `${conversion - 100}%` : '0%';
  return [
    { text: defaultValueFormat(value), tone: 'b' },
    { text: ' 笔交易 ', tone: 'n' },
    { text: '|', tone: 's' },
    { text: ' 转化率: ', tone: 'n' },
    { text: `${conversion}%`, tone: 'b' },
    { text: ' |', tone: 's' },
    { text: ' 流失: ', tone: 'n' },
    { text: loss, tone: 'b' },
  ];
}

export interface NiceScale {
  /** Nice axis maximum; bars normalize against it. */
  axisMax: number;
  step: number;
  /** Nice tick values in descending order (topmost first), zero excluded. */
  ticks: number[];
}

function cleanNumber(value: number): number {
  return Number(value.toPrecision(12));
}

/** d3-style nice tick generation: step = multiplier × 10^power, keeping at most targetCount top ticks. */
export function niceScale(maxValue: number, targetCount = 5): NiceScale {
  if (!Number.isFinite(maxValue) || maxValue <= 0) return { axisMax: 0, step: 0, ticks: [] };
  const rawStep = maxValue / targetCount;
  const power = Math.floor(Math.log10(rawStep));
  const base = Math.pow(10, power);
  const error = rawStep / base;
  const multiplier =
    error >= Math.sqrt(50) ? 10 : error >= Math.sqrt(10) ? 5 : error >= Math.SQRT2 ? 2 : 1;
  const step = cleanNumber(multiplier * base);
  const axisMax = cleanNumber(Math.ceil(maxValue / step - 1e-9) * step);
  const intervalCount = Math.round(axisMax / step);
  const ascending = Array.from({ length: intervalCount }, (_, i) => cleanNumber((i + 1) * step));
  return { axisMax, step, ticks: ascending.slice(-targetCount).reverse() };
}

export function resolveOptions(config: FoldBarChartConfig): FoldBarOptions {
  const width = config.width ?? 860;
  const height = config.height ?? 386;
  const yField = config.yField ?? 'value';
  const maxValue = config.data.reduce((max, d) => Math.max(max, Number(d[yField]) || 0), 0);
  const rawExponent = config.scale?.exponent ?? 1;
  let exponent = rawExponent;
  if (!Number.isFinite(exponent) || exponent <= 0) {
    console.warn(`sk-chart: invalid scale.exponent ${rawExponent}; falling back to 1`);
    exponent = 1;
  }
  const requestedActive = config.state?.defaultActive ?? config.data.length - 1;
  const defaultActive = Math.min(
    Math.max(requestedActive, -1),
    Math.max(0, config.data.length - 1),
  );
  const tokens = resolveTokens(config.theme);
  const nice = niceScale(maxValue);
  const ticks = config.axis?.ticks ?? nice.ticks;
  const domainMax = Math.max(nice.axisMax, maxValue, ...ticks);
  const bottomLabels = config.xAxis?.bottomLabels;
  const bottomRows = bottomLabels
    ? config.data.reduce((max, d, i) => {
        const out = bottomLabels(d, i, config.data);
        return Math.max(max, Array.isArray(out) ? out.length : 1);
      }, 0)
    : 0;
  const titleText = config.xAxis?.title?.text ?? '';
  const axisRows = bottomRows + (titleText ? 1 : 0);
  const rowHeight = tokens.axis.fontSize + 4;
  // 32 = axis line + tick marks + breathing room under the dissolving bars.
  const defaultBottom = axisRows > 0 ? Math.max(26, 32 + axisRows * rowHeight) : 26;
  const xField = config.xField ?? 'label';
  return {
    width,
    height,
    xField,
    yField,
    valueFormat: config.valueFormat ?? defaultValueFormat,
    ariaLabel: config.ariaLabel ?? 'fold bar chart',
    padding: { top: 64, right: 29, bottom: defaultBottom, left: 73, ...config.padding },
    stair: { bottomOffset: 30, topOffset: 74, ...config.stair },
    scale: { exponent },
    fold: {
      run: config.fold?.run ?? 20,
      creaseColor: config.fold?.creaseColor ?? 'rgba(255,255,255,.85)',
      creaseWidth: config.fold?.creaseWidth ?? 1.2,
    },
    axis: {
      ticks,
      tickFormat: config.axis?.tickFormat ?? ((v) => `${v}k`),
      domainMax,
    },
    xAxis: {
      labelFormat: config.xAxis?.labelFormat ?? ((d) => String(d[xField] ?? '')),
      bottomLabels,
      title: {
        text: titleText,
        x: config.xAxis?.title?.x,
        y: config.xAxis?.title?.y,
      },
      showLine: config.xAxis?.showLine ?? false,
      showTick: config.xAxis?.showTick ?? false,
      showGrid: config.xAxis?.showGrid ?? true,
    },
    tooltip: {
      enabled: config.tooltip?.enabled ?? true,
      formatter: config.tooltip?.formatter ?? defaultTooltipFormatter,
      height: config.tooltip?.height ?? 28,
      radius: config.tooltip?.radius ?? 9,
      paddingX: config.tooltip?.paddingX ?? 12,
      anchorRatio: config.tooltip?.anchorRatio ?? 0.42,
      offsetY: config.tooltip?.offsetY ?? -30,
      minY: config.tooltip?.minY ?? 140,
      fixedWidth: config.tooltip?.fixedWidth,
    },
    state: { defaultActive },
    title: {
      text: config.title?.text ?? '',
      x: config.title?.x ?? 36,
      y: config.title?.y ?? 52,
    },
    style: resolveStyle(config.style),
    tokens,
  };
}

export interface FoldBarModel {
  data: FoldBarDatum[];
  labels: string[];
  values: number[];
  layout: FoldBarLayout;
  bars: BarGeometry[];
  flaps: (FlapGeometry | null)[];
  /** Fade band that dissolves bar bottoms; derived from plot.bottom unless user-overridden. */
  fade: { start: number; end: number };
  options: FoldBarOptions;
}

/** Precomputes all geometry for the current config, shared by rendering and interaction. */
export function createModel(config: FoldBarChartConfig, options: FoldBarOptions): FoldBarModel {
  const data = config.data;
  const labels = data.map((d, i) => options.xAxis.labelFormat(d, i, data));
  const raw = data.map((d) => Number(d[options.yField]));
  if (raw.some((v) => Number.isNaN(v) || v < 0)) {
    console.warn('sk-chart: FoldBarChart data contains NaN or negative values; they render as zero.');
  }
  const values = raw.map((v) => v || 0);
  const layout = computeLayout({
    width: options.width,
    height: options.height,
    padding: options.padding,
    stairBottomOffset: options.stair.bottomOffset,
    stairTopOffset: options.stair.topOffset,
    foldRun: options.fold.run,
    barGap: 1,
    exponent: options.scale.exponent,
    domainMax: options.axis.domainMax,
    values,
  });
  const bars = values.map((v, i) => barGeometry(layout, i, v));
  const flaps = values.map((_, i) => flapGeometry(layout, i, values));
  const fade = config.style?.fadeMask
    ? options.style.fadeMask
    : { start: layout.plot.bottom - 16, end: layout.plot.bottom };
  return { data, labels, values, layout, bars, flaps, fade, options };
}
