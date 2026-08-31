import { afterEach, describe, expect, it, vi } from 'vitest';
import { FoldBarChart, type FoldBarDatum } from '../../src/index';

const DATA: FoldBarDatum[] = [
  { label: '发起支付', value: 65.2 },
  { label: '支付成功', value: 48.6 },
];

function mount(): FoldBarChart {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return new FoldBarChart(el, { data: DATA });
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('export', () => {
  it('toSVGString emits a standalone document with size, xmlns and embedded style', () => {
    const chart = mount();
    const markup = chart.toSVGString();
    expect(markup).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(markup).toContain('width="860"');
    expect(markup).toContain('height="386"');
    expect(markup).toContain('<style>');
    expect(markup).toContain('viewBox="0 0 860 386"');
  });

  it('getDataURL svg round-trips the markup', async () => {
    const chart = mount();
    const url = await chart.getDataURL({ type: 'svg' });
    expect(url.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
    expect(decodeURIComponent(url.slice('data:image/svg+xml;charset=utf-8,'.length))).toContain(
      'xmlns="http://www.w3.org/2000/svg"',
    );
  });

  it('getDataURL png surfaces a clear error when canvas 2d is unavailable (jsdom)', async () => {
    const chart = mount();
    await expect(chart.getDataURL()).rejects.toThrow(/canvas 2d|rasterize|measure/);
  });

  it('download svg clicks an anchor named <filename>.svg', async () => {
    const chart = mount();
    let downloadName = '';
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloadName = this.download;
    });
    await chart.download({ type: 'svg', filename: 'funnel' });
    expect(downloadName).toBe('funnel.svg');
  });

  it('export APIs reject after destroy', async () => {
    const chart = mount();
    chart.destroy();
    expect(() => chart.toSVGString()).toThrow('not rendered');
    await expect(chart.getDataURL({ type: 'svg' })).rejects.toThrow('not rendered');
  });
});
