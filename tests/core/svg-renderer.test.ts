import { describe, expect, it } from 'vitest';
import {
  addStops,
  clearElement,
  createSvgElement,
  createUid,
  scopedId,
  urlRef,
  SVG_NS,
} from '../../src/core/svg-renderer';

describe('createSvgElement', () => {
  it('creates a namespaced SVG element with attributes', () => {
    const rect = createSvgElement('rect', { x: 1, y: 2.5, width: 10, height: 20 });
    expect(rect.namespaceURI).toBe(SVG_NS);
    expect(rect.getAttribute('x')).toBe('1');
    expect(rect.getAttribute('y')).toBe('2.5');
  });

  it('defaults to no attributes', () => {
    const g = createSvgElement('g');
    expect(g.attributes.length).toBe(0);
  });
});

describe('addStops', () => {
  it('appends stop children with offset and color', () => {
    const gradient = createSvgElement('linearGradient', { id: 'g' });
    const returned = addStops(gradient, [
      [0, '#fff'],
      [0.5, '#000'],
      [1, 'rgba(255,255,255,0)'],
    ]);
    const stops = gradient.querySelectorAll('stop');
    expect(stops.length).toBe(3);
    expect(stops[1].getAttribute('offset')).toBe('0.5');
    expect(stops[1].getAttribute('stop-color')).toBe('#000');
    expect(returned).toBe(gradient); // returns the same node for chaining
  });
});

describe('uid isolation', () => {
  it('generates unique prefixed ids', () => {
    const a = createUid();
    const b = createUid();
    expect(a).not.toBe(b);
    expect(a.startsWith('skc')).toBe(true);
    const custom = createUid('chart');
    expect(custom.startsWith('chart')).toBe(true);
  });

  it('scopes ids and url refs under the uid', () => {
    expect(scopedId('skc1abc', 'stripes')).toBe('skc1abc-stripes');
    expect(urlRef('skc1abc', 'wash')).toBe('url(#skc1abc-wash)');
  });
});

describe('clearElement', () => {
  it('removes all children', () => {
    const host = document.createElement('div');
    host.appendChild(document.createElement('span'));
    host.appendChild(document.createElement('span'));
    clearElement(host);
    expect(host.childNodes.length).toBe(0);
  });
});
