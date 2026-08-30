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
});
