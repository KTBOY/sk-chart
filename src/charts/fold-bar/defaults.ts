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
    zone: [number, number];
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

function defaultTicks(maxValue: number): number[] {
  if (maxValue <= 0) return [];
  const axisMax = Math.ceil(maxValue / 10) * 10;
  const step = axisMax >= 50 ? 10 : Math.max(1, Math.round(axisMax / 5));
  return Array.from({ length: 5 }, (_, i) => axisMax - i * step);
}

export function resolveOptions(config: FoldBarChartConfig): FoldBarOptions {
  const width = config.width ?? 860;
  const height = config.height ?? 386;
  const maxValue = config.data.reduce((max, d) => Math.max(max, Number(d.value) || 0), 0);
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
  return {
    width,
    height,
    xField: config.xField ?? 'label',
    yField: config.yField ?? 'value',
    valueFormat: config.valueFormat ?? defaultValueFormat,
    ariaLabel: config.ariaLabel ?? 'fold bar chart',
    padding: { top: 64, right: 29, bottom: 26, left: 73, ...config.padding },
    stair: { bottomOffset: 30, topOffset: 74, ...config.stair },
    scale: { exponent },
    fold: {
      run: config.fold?.run ?? 20,
      creaseColor: config.fold?.creaseColor ?? 'rgba(255,255,255,.85)',
      creaseWidth: config.fold?.creaseWidth ?? 1.2,
    },
    axis: {
      ticks: config.axis?.ticks ?? defaultTicks(maxValue),
      tickFormat: config.axis?.tickFormat ?? ((v) => `${v}k`),
      zone: config.axis?.zone ?? [113, 249],
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
    tokens: resolveTokens(config.theme),
  };
}

export interface FoldBarModel {
  data: FoldBarDatum[];
  labels: string[];
  values: number[];
  layout: FoldBarLayout;
  bars: BarGeometry[];
  flaps: (FlapGeometry | null)[];
  options: FoldBarOptions;
}

/** Precomputes all geometry for the current config, shared by rendering and interaction. */
export function createModel(config: FoldBarChartConfig, options: FoldBarOptions): FoldBarModel {
  const data = config.data;
  const labels = data.map((d) => String(d[options.xField] ?? ''));
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
    values,
  });
  const bars = values.map((v, i) => barGeometry(layout, i, v));
  const flaps = values.map((_, i) => flapGeometry(layout, i, values));
  return { data, labels, values, layout, bars, flaps, options };
}
