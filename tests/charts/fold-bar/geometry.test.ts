import { describe, expect, it } from 'vitest';
import {
  axisTickYs,
  barGeometry,
  computeLayout,
  flapGeometry,
  gridLineXs,
  hitRect,
  pillGeometry,
  tooltipPlacement,
  washRect,
  type FoldBarLayoutInput,
  type PillOptions,
} from '../../../src/charts/fold-bar/geometry';

// The prototype data source (payments funnel, 效果 3).
const VALUES = [65.2, 54.8, 48.6, 38.3, 32.9];

// Defaults mirroring the prototype's hardcoded geometry.
const input: FoldBarLayoutInput = {
  width: 860,
  height: 386,
  padding: { top: 64, right: 29, bottom: 26, left: 73 },
  stairBottomOffset: 30,
  stairTopOffset: 74,
  foldRun: 20,
  barGap: 1,
  exponent: 2,
  values: VALUES,
};

const PILL: PillOptions = {
  width: 26,
  height: 7,
  rx: 3.5,
  offsetY: -13,
  shadow: { width: 24, height: 1.4, rx: 0.7, offsetY: -7.5 },
};

describe('computeLayout', () => {
  it('derives plot bounds from width/height/padding', () => {
    const layout = computeLayout(input);
    expect(layout.plot).toEqual({ left: 73, right: 831, top: 64, bottom: 360, width: 758, height: 296 });
  });

  it('derives column and bar widths like the prototype (COL_W, BAR_W)', () => {
    const layout = computeLayout(input);
    expect(layout.colWidth).toBeCloseTo(151.6, 6);
    expect(layout.barWidth).toBeCloseTo(130.6, 6);
  });

  it('derives the stair anchors (STAIR.base / STAIR.top)', () => {
    const layout = computeLayout(input);
    expect(layout.stairBase).toBe(330);
    expect(layout.stairTop).toBe(138);
    expect(layout.maxValue).toBe(65.2);
  });

  it('maps values to bar tops with the power formula (topOf)', () => {
    const layout = computeLayout(input);
    expect(layout.barTopOf(65.2)).toBeCloseTo(138, 6);
    expect(layout.barTopOf(0)).toBeCloseTo(330, 6);
    // 330 - (32.9 / 65.2)^2 * 192
    expect(layout.barTopOf(32.9)).toBeCloseTo(281.11, 1);
  });

  it('falls back to a linear mapping when exponent is 1', () => {
    const layout = computeLayout({ ...input, exponent: 1 });
    // 330 - (32.9 / 65.2) * 192
    expect(layout.barTopOf(32.9)).toBeCloseTo(233.12, 1);
  });

  it('handles empty data without NaN', () => {
    const layout = computeLayout({ ...input, values: [] });
    expect(layout.count).toBe(0);
    expect(layout.colWidth).toBe(0);
    expect(layout.barTopOf(10)).toBe(layout.stairBase);
  });
});

describe('barGeometry', () => {
  it('matches the prototype bar rect for the first column', () => {
    const layout = computeLayout(input);
    const bar = barGeometry(layout, 0, VALUES[0]);
    expect(bar.colStart).toBeCloseTo(73, 6);
    expect(bar.x).toBeCloseTo(74, 6);
    expect(bar.y).toBeCloseTo(138, 6);
    expect(bar.width).toBeCloseTo(130.6, 6);
    expect(bar.height).toBeCloseTo(222, 6);
    expect(bar.centerX).toBeCloseTo(139.3, 6);
  });

  it('positions the last column correctly', () => {
    const layout = computeLayout(input);
    const bar = barGeometry(layout, 4, VALUES[4]);
    expect(bar.x).toBeCloseTo(680.4, 6);
    expect(bar.y).toBeCloseTo(281.11, 1);
  });
});

describe('flapGeometry', () => {
  it('builds the fold flap between two columns', () => {
    const layout = computeLayout(input);
    const flap = flapGeometry(layout, 0, VALUES);
    expect(flap).not.toBeNull();
    expect(flap!.crease.x1).toBeCloseTo(204.6, 6);
    expect(flap!.crease.y1).toBeCloseTo(138, 6);
    expect(flap!.crease.x2).toBeCloseTo(226.6, 6);
    expect(flap!.crease.y2).toBeCloseTo(194.37, 1);
    expect(flap!.gradientY).toEqual([flap!.crease.y1, 360]);
    expect(flap!.points).toContain('226.6,360');
  });

  it('returns null for the last column', () => {
    const layout = computeLayout(input);
    expect(flapGeometry(layout, 4, VALUES)).toBeNull();
  });
});

describe('pillGeometry', () => {
  it('centers the pill over the bar and offsets it above the bar top', () => {
    const pill = pillGeometry(139.3, 138, PILL);
    expect(pill.x).toBeCloseTo(126.3, 6);
    expect(pill.y).toBe(125);
    expect(pill.rx).toBe(3.5);
    expect(pill.shadowX).toBeCloseTo(127.3, 6);
    expect(pill.shadowY).toBeCloseTo(130.5, 6);
  });
});

describe('axisTickYs', () => {
  it('reproduces the prototype tick positions from the axis zone', () => {
    expect(axisTickYs([113, 249], 5)).toEqual([113, 147, 181, 215, 249]);
  });

  it('handles single and zero counts', () => {
    expect(axisTickYs([113, 249], 1)).toEqual([113]);
    expect(axisTickYs([113, 249], 0)).toEqual([]);
  });
});

describe('gridLineXs', () => {
  it('emits one line per column boundary', () => {
    const layout = computeLayout(input);
    const xs = gridLineXs(layout);
    expect(xs.length).toBe(6);
    expect(xs[0]).toBeCloseTo(73, 6);
    expect(xs[1]).toBeCloseTo(224.6, 6);
    expect(xs[5]).toBeCloseTo(831, 6);
  });
});

describe('tooltipPlacement', () => {
  const options = { anchorRatio: 0.42, offsetY: -30, minY: 140 };

  it('anchors above the bar and respects minY', () => {
    const layout = computeLayout(input);
    const bar = barGeometry(layout, 0, VALUES[0]);
    const pos = tooltipPlacement(layout, bar, 200, options);
    expect(pos.x).toBeCloseTo(128.852, 6);
    expect(pos.y).toBe(140); // bar top 138 - 30 < 140
  });

  it('clamps against the plot right edge', () => {
    const layout = computeLayout(input);
    const bar = barGeometry(layout, 4, VALUES[4]);
    const pos = tooltipPlacement(layout, bar, 300, options);
    expect(pos.x).toBeCloseTo(531, 1);
    expect(pos.y).toBeCloseTo(251.11, 1);
  });
});

describe('hitRect / washRect', () => {
  it('covers the full column band', () => {
    const layout = computeLayout(input);
    const rect = hitRect(layout, 0);
    expect(rect.x).toBeCloseTo(73, 6);
    expect(rect.y).toBe(64);
    expect(rect.width).toBeCloseTo(151.6, 6);
    expect(rect.height).toBeCloseTo(296, 6);
  });

  it('fills from washTop down to the bar top', () => {
    const layout = computeLayout(input);
    const bar = barGeometry(layout, 0, VALUES[0]);
    const rect = washRect(bar, 115);
    expect(rect.x).toBeCloseTo(74, 6);
    expect(rect.y).toBe(115);
    expect(rect.width).toBeCloseTo(130.6, 6);
    expect(rect.height).toBeCloseTo(23, 6);
  });

  it('never produces a negative wash height', () => {
    const layout = computeLayout(input);
    const bar = { ...barGeometry(layout, 0, VALUES[0]), y: 100 };
    expect(washRect(bar, 115).height).toBe(0);
  });
});
