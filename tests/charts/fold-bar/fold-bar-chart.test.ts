import { afterEach, describe, expect, it } from 'vitest';
import { FoldBarChart, type FoldBarDatum } from '../../../src/index';

const DATA: FoldBarDatum[] = [
  { label: '发起支付', value: 65.2 },
  { label: '授权支付', value: 54.8 },
  { label: '支付成功', value: 48.6 },
  { label: '商户打款', value: 38.3 },
  { label: '完成交易', value: 32.9 },
];

function host(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

// jsdom ships no SVG text metrics, so measurement silently degrades to zeros
// there. These stubs emulate a browser well enough to observe centering.
const ASCENT = 8.4;
const DESCENT = 2.1;
const CHAR_WIDTH = 6;

type TextMetrics = SVGElement & {
  getBBox: () => { x: number; y: number; width: number; height: number };
  getComputedTextLength: () => number;
};

function stubTextMetrics(node: SVGElement): void {
  const inkWidth = () => (node.textContent ?? '').length * CHAR_WIDTH;
  const metrics = node as TextMetrics;
  metrics.getComputedTextLength = inkWidth;
  metrics.getBBox = () => ({
    x: Number(node.getAttribute('x') ?? 0) - inkWidth() / 2,
    y: Number(node.getAttribute('y') ?? 0) - ASCENT,
    width: inkWidth(),
    height: ASCENT + DESCENT,
  });
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoldBarChart integration', () => {
  it('renders one svg with a column per datum', () => {
    const el = host();
    const chart = new FoldBarChart(el, { data: DATA });
    const svg = el.querySelector('svg')!;
    expect(svg).toBeTruthy();
    expect(svg.querySelectorAll('g[data-i]').length).toBe(5);
    expect(svg.getAttribute('viewBox')).toBe('0 0 860 386');
    chart.destroy();
  });

  it('two instances have no defs id collision', () => {
    const a = host();
    const b = host();
    const c1 = new FoldBarChart(a, { data: DATA });
    const c2 = new FoldBarChart(b, { data: DATA });
    const idsOf = (root: HTMLElement) =>
      [...root.querySelectorAll('[id]')].map((node) => node.id);
    const ids1 = idsOf(a);
    const ids2 = idsOf(b);
    expect(ids1.length).toBeGreaterThan(0);
    expect(ids1.filter((id) => ids2.includes(id))).toEqual([]);
    c1.destroy();
    c2.destroy();
  });

  it('applies defaultActive and responds to setActive', () => {
    const el = host();
    const chart = new FoldBarChart(el, { data: DATA, state: { defaultActive: 2 } });
    expect(chart.activeIndex).toBe(2);
    const cols = el.querySelectorAll('g[data-i]');
    expect(cols[2].getAttribute('class')).toContain('-active');
    chart.setActive(0);
    expect(chart.activeIndex).toBe(0);
    expect(cols[0].getAttribute('class')).toContain('-active');
    expect(cols[2].getAttribute('class')).not.toContain('-active');
    chart.destroy();
  });

  it('emits column events on hover and click', () => {
    const el = host();
    const chart = new FoldBarChart(el, { data: DATA });
    const enters: number[] = [];
    const clicks: number[] = [];
    chart.on('column:enter', (p) => enters.push(p.index));
    chart.on('column:click', (p) => clicks.push(p.index));
    const cols = el.querySelectorAll('g[data-i]');
    cols[1].dispatchEvent(new Event('mouseenter'));
    cols[1].dispatchEvent(new Event('click'));
    expect(enters).toEqual([1]);
    expect(clicks).toEqual([1]);
    expect(chart.activeIndex).toBe(1);
    chart.destroy();
  });

  it('mouseleave returns to defaultActive', () => {
    const el = host();
    const chart = new FoldBarChart(el, { data: DATA, state: { defaultActive: 3 } });
    const cols = el.querySelectorAll('g[data-i]');
    cols[0].dispatchEvent(new Event('mouseenter'));
    expect(chart.activeIndex).toBe(0);
    el.querySelector('svg g[mask]')!.dispatchEvent(new Event('mouseleave'));
    expect(chart.activeIndex).toBe(3);
    chart.destroy();
  });

  it('update() rebuilds with new data and removes the old svg', () => {
    const el = host();
    const chart = new FoldBarChart(el, { data: DATA });
    chart.update({ data: DATA.slice(0, 3) });
    expect(el.querySelectorAll('svg').length).toBe(1);
    expect(el.querySelectorAll('g[data-i]').length).toBe(3);
    chart.destroy();
  });

  it('destroy() empties the container and allows re-instantiation', () => {
    const el = host();
    const chart = new FoldBarChart(el, { data: DATA });
    chart.destroy();
    expect(el.innerHTML).toBe('');
    expect(chart.isDestroyed).toBe(true);
    const chart2 = new FoldBarChart(el, { data: DATA });
    expect(el.querySelector('svg')).toBeTruthy();
    chart2.destroy();
  });

  it('tooltip honors the fixedWidth escape hatch under jsdom', () => {
    const el = host();
    const chart = new FoldBarChart(el, { data: DATA, tooltip: { fixedWidth: 180 } });
    const rect = el.querySelector('svg g[filter] rect')!;
    expect(rect.getAttribute('width')).toBe('180');
    chart.destroy();
  });

  it('centers the label and value over the bar', () => {
    const el = host();
    const chart = new FoldBarChart(el, { data: DATA });
    const texts = [...el.querySelectorAll('g[data-i="0"] text')];
    expect(texts.map((t) => t.getAttribute('text-anchor'))).toEqual(['middle', 'middle']);
    // bar.centerX of the first column: 73 + 1 + 130.6 / 2
    expect(texts.map((t) => Number(t.getAttribute('x')))).toEqual([139.3, 139.3]);
    chart.destroy();
  });

  it('keeps the tooltip ink centered in the bubble on every hover', () => {
    const el = host();
    const chart = new FoldBarChart(el, { data: DATA });
    const text = el.querySelector<SVGElement>('svg g[filter] text')!;
    stubTextMetrics(text);
    const inkCenter = () =>
      Number(text.getAttribute('y')) - ASCENT + (ASCENT + DESCENT) / 2;

    for (const index of [0, 1, 2, 3, 4, 0]) {
      chart.setActive(index);
      expect(inkCenter()).toBeCloseTo(14, 6); // bubble height 28 / 2
    }
    chart.destroy();
  });

  it('scopes styles per instance', () => {
    const a = host();
    const b = host();
    const c1 = new FoldBarChart(a, { data: DATA });
    const c2 = new FoldBarChart(b, { data: DATA });
    const css1 = a.querySelector('svg style')!.textContent!;
    const css2 = b.querySelector('svg style')!.textContent!;
    expect(css1).not.toBe(css2);
    c1.destroy();
    c2.destroy();
  });

  it('keyboard navigation covers arrows, Home, End and Enter click', () => {
    const el = host();
    const chart = new FoldBarChart(el, { data: DATA, state: { defaultActive: 2 } });
    const clicks: number[] = [];
    chart.on('column:click', (p) => clicks.push(p.index));
    const svg = el.querySelector('svg')!;
    const key = (k: string) => svg.dispatchEvent(new KeyboardEvent('keydown', { key: k }));
    key('ArrowRight');
    expect(chart.activeIndex).toBe(3);
    key('End');
    expect(chart.activeIndex).toBe(4);
    key('Home');
    expect(chart.activeIndex).toBe(0);
    key('Enter');
    expect(clicks).toEqual([0]);
    chart.destroy();
  });

  it('columns expose listitem semantics with synced aria-selected', () => {
    const el = host();
    const chart = new FoldBarChart(el, { data: DATA, state: { defaultActive: 2 } });
    const cols = el.querySelectorAll('g[data-i]');
    expect(cols[0].getAttribute('role')).toBe('listitem');
    expect(cols[2].getAttribute('aria-selected')).toBe('true');
    expect(cols[0].getAttribute('aria-selected')).toBe('false');
    chart.setActive(1);
    expect(cols[1].getAttribute('aria-selected')).toBe('true');
    expect(cols[2].getAttribute('aria-selected')).toBe('false');
    chart.destroy();
  });

  it('scoped css includes a prefers-reduced-motion block', () => {
    const el = host();
    const chart = new FoldBarChart(el, { data: DATA });
    expect(el.querySelector('svg style')!.textContent).toContain(
      '@media (prefers-reduced-motion: reduce)',
    );
    chart.destroy();
  });

  it('ten consecutive updates keep a single svg', () => {
    const el = host();
    const chart = new FoldBarChart(el, { data: DATA });
    for (let i = 0; i < 10; i++) {
      chart.update({ data: DATA.slice(0, 3 + (i % 3)) });
    }
    expect(el.querySelectorAll('svg').length).toBe(1);
    expect(el.querySelectorAll('g[data-i]').length).toBeGreaterThanOrEqual(3);
    chart.destroy();
  });

  it('setActive, on and update are safe after destroy', () => {
    const el = host();
    const chart = new FoldBarChart(el, { data: DATA });
    chart.destroy();
    expect(() => chart.setActive(1)).not.toThrow();
    expect(() => chart.on('column:enter', () => {})).not.toThrow();
    expect(() => chart.update({ data: DATA })).not.toThrow();
    expect(el.innerHTML).toBe('');
  });

  it('theme tokens are overridable via config', () => {
    const el = host();
    const chart = new FoldBarChart(el, { data: DATA, theme: { number: { fontSize: 20 } } });
    const css = el.querySelector('svg style')!.textContent!;
    expect(css).toContain('font-size:20px');
    chart.destroy();
  });

  it('pill gradient and shadow color are overridable via style', () => {
    const el = host();
    const chart = new FoldBarChart(el, {
      data: DATA,
      style: {
        pill: {
          gradient: [
            [0, '#e8fff9'],
            [1, '#0e7a6c'],
          ],
          shadow: { color: '#0e7a6c', opacity: 0.6 },
        },
      },
    });
    const svg = el.querySelector('svg')!;
    const stops = [...svg.querySelectorAll('linearGradient stop')].filter(
      (s) => s.getAttribute('stop-color') === '#e8fff9' || s.getAttribute('stop-color') === '#0e7a6c',
    );
    expect(stops.length).toBe(2);
    const shadow = [...svg.querySelectorAll('rect')].find(
      (r) => r.getAttribute('fill') === '#0e7a6c' && r.getAttribute('fill-opacity') === '0.6',
    );
    expect(shadow).toBeTruthy();
    chart.destroy();
  });

  it('renders nice ticks at truthful scale positions', () => {
    const el = host();
    const chart = new FoldBarChart(el, { data: DATA, scale: { exponent: 2 } });
    const texts = [...el.querySelectorAll('text')];
    const top = texts.find((t) => t.textContent === '70k')!;
    const low = texts.find((t) => t.textContent === '30k')!;
    expect(top).toBeTruthy();
    // domainMax 70 maps to stairTop 138, label baseline +4
    expect(Number(top.getAttribute('y'))).toBeCloseTo(142, 2);
    // 330 - (30/70)^2 * 192 + 4
    expect(Number(low.getAttribute('y'))).toBeCloseTo(298.7347, 2);
    expect(texts.filter((t) => /^(\d+)k$/.test(t.textContent ?? '')).length).toBe(5);
    chart.destroy();
  });

  it('hides vertical grid lines when xAxis.showGrid is false', () => {
    const el = host();
    const chart = new FoldBarChart(el, { data: DATA, xAxis: { showGrid: false } });
    const vertical = [...el.querySelectorAll('line')].filter(
      (l) => l.getAttribute('y1') === '64',
    );
    expect(vertical.length).toBe(0);
    chart.destroy();
  });

  it('draws a baseline and tick marks when showLine/showTick are enabled', () => {
    const el = host();
    const chart = new FoldBarChart(el, { data: DATA, xAxis: { showLine: true, showTick: true } });
    // No text rows, so plot.bottom stays 360 and the axis band sits below the bars.
    const baseline = [...el.querySelectorAll('line')].find(
      (l) => l.getAttribute('y1') === '364' && l.getAttribute('y2') === '364',
    );
    expect(baseline?.getAttribute('x1')).toBe('73');
    expect(baseline?.getAttribute('x2')).toBe('831');
    const marks = [...el.querySelectorAll('line')].filter(
      (l) => l.getAttribute('y1') === '364' && l.getAttribute('y2') === '368',
    );
    expect(marks.length).toBe(6);
    chart.destroy();
  });

  it('renders bottom labels in an unmasked, non-interactive axis layer', () => {
    const el = host();
    const chart = new FoldBarChart(el, {
      data: DATA,
      xAxis: {
        bottomLabels: (d, i, data) => {
          const conv = i === 0 ? '100%' : `${Math.round((d.value / data[i - 1].value) * 100)}%`;
          return [`第 ${i + 1} 阶段`, conv];
        },
      },
    });
    const layer = el.querySelector('g[pointer-events="none"]')!;
    expect(layer).toBeTruthy();
    expect(layer.getAttribute('aria-hidden')).toBe('true');
    expect(layer.getAttribute('mask')).toBeNull();
    const texts = [...layer.querySelectorAll('text')];
    expect(texts.length).toBe(10);
    const first = texts.slice(0, 2);
    expect(first.map((t) => t.textContent)).toEqual(['第 1 阶段', '100%']);
    // centered over the first bar, below the axis band
    expect(first.map((t) => Number(t.getAttribute('x')))).toEqual([139.3, 139.3]);
    expect(first.map((t) => Number(t.getAttribute('y')))).toEqual([344, 359]);
    chart.destroy();
  });

  it('grows the bottom padding to fit multi-line bottom labels', () => {
    const el = host();
    const chart = new FoldBarChart(el, {
      data: DATA,
      xAxis: { bottomLabels: (_d, i) => [`第 ${i + 1} 阶段`, '—'] },
    });
    // axis band 32 + 2 * (11 + 4) = 62, so plot.bottom = 324
    const gridLine = [...el.querySelectorAll('line')].find((l) => l.getAttribute('y1') === '64');
    expect(gridLine?.getAttribute('y2')).toBe('324');
    chart.destroy();
  });

  it('omits the x-axis layer by default', () => {
    const el = host();
    const chart = new FoldBarChart(el, { data: DATA });
    expect(el.querySelector('g[pointer-events="none"]')).toBeNull();
    chart.destroy();
  });

  it('renders the x-axis title below the bottom labels', () => {
    const el = host();
    const chart = new FoldBarChart(el, {
      data: DATA,
      xAxis: {
        bottomLabels: (_d, i) => [`第 ${i + 1} 阶段`, '—'],
        title: { text: '支付阶段' },
      },
    });
    const layer = el.querySelector('g[pointer-events="none"]')!;
    const texts = [...layer.querySelectorAll('text')];
    expect(texts.length).toBe(11);
    const title = texts[texts.length - 1];
    expect(title.textContent).toBe('支付阶段');
    // centered across the plot: (73 + 831) / 2
    expect(title.getAttribute('x')).toBe('452');
    // band 32 + 3 rows * 15 = 77, so plot.bottom = 309 and the title sits at
    // 309 + 26 + 2 * 15, clearly separated from the last label row.
    expect(title.getAttribute('y')).toBe('365');
    const gridLine = [...el.querySelectorAll('line')].find((l) => l.getAttribute('y1') === '64');
    expect(gridLine?.getAttribute('y2')).toBe('309');
    chart.destroy();
  });

  it('reserves a single row for a standalone x-axis title', () => {
    const el = host();
    const chart = new FoldBarChart(el, {
      data: DATA,
      xAxis: { title: { text: '支付阶段' } },
    });
    const title = el.querySelector('g[pointer-events="none"] text')!;
    expect(title.textContent).toBe('支付阶段');
    expect(title.getAttribute('x')).toBe('452');
    // band 32 + 1 row * 15 = 47, so plot.bottom = 339 and title y = 339 + 26.
    expect(title.getAttribute('y')).toBe('365');
    const gridLine = [...el.querySelectorAll('line')].find((l) => l.getAttribute('y1') === '64');
    expect(gridLine?.getAttribute('y2')).toBe('339');
    chart.destroy();
  });
});
