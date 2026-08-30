import { describe, expect, it } from 'vitest';
import { createLinearScale } from '../../src/scale/linear-scale';
import { createPowerScale } from '../../src/scale/power-scale';
import { createBandScale } from '../../src/scale/band-scale';

describe('createLinearScale', () => {
  it('maps domain endpoints to range endpoints', () => {
    const scale = createLinearScale({ domain: [0, 70], range: [360, 64] });
    expect(scale(0)).toBe(360);
    expect(scale(70)).toBe(64);
  });

  it('interpolates linearly', () => {
    const scale = createLinearScale({ domain: [0, 70], range: [360, 64] });
    expect(scale(35)).toBe(212);
  });

  it('maps everything to range[0] for a degenerate domain', () => {
    const scale = createLinearScale({ domain: [5, 5], range: [360, 64] });
    expect(scale(0)).toBe(360);
    expect(scale(100)).toBe(360);
  });
});

describe('createPowerScale', () => {
  // Reference values derived from the prototype funnel: base 330, top 138, max 65.2.
  it('behaves like a linear scale when exponent is 1', () => {
    const scale = createPowerScale({ domain: [0, 65.2], range: [330, 138], exponent: 1 });
    expect(scale(65.2)).toBeCloseTo(138, 6);
    expect(scale(0)).toBeCloseTo(330, 6);
    expect(scale(32.9)).toBeCloseTo(233.1166, 3);
  });

  it('applies the exponent to the normalized value', () => {
    const scale = createPowerScale({ domain: [0, 65.2], range: [330, 138], exponent: 2 });
    expect(scale(65.2)).toBeCloseTo(138, 6);
    expect(scale(0)).toBeCloseTo(330, 6);
    // 330 - (32.9 / 65.2)^2 * 192
    expect(scale(32.9)).toBeCloseTo(281.11, 1);
  });

  it('defaults exponent to 1', () => {
    const power = createPowerScale({ domain: [0, 10], range: [0, 100] });
    const linear = createLinearScale({ domain: [0, 10], range: [0, 100] });
    for (const v of [0, 2.5, 5, 7.5, 10]) {
      expect(power(v)).toBe(linear(v));
    }
  });

  it('clamps values below the domain to range[0]', () => {
    const scale = createPowerScale({ domain: [10, 20], range: [330, 138], exponent: 2 });
    expect(scale(-5)).toBe(330);
  });

  it('maps everything to range[0] for a degenerate domain', () => {
    const scale = createPowerScale({ domain: [0, 0], range: [330, 138], exponent: 2 });
    expect(scale(42)).toBe(330);
  });
});

describe('createBandScale', () => {
  it('splits the range into equal bands', () => {
    const band = createBandScale(5, [73, 831]);
    expect(band.step).toBeCloseTo(151.6, 6);
    expect(band.bandwidth).toBeCloseTo(151.6, 6);
    expect(band.position(0)).toBeCloseTo(73, 6);
    expect(band.position(4)).toBeCloseTo(679.4, 6);
    expect(band.center(0)).toBeCloseTo(148.8, 6);
  });

  it('applies the padding ratio inside each band', () => {
    const band = createBandScale(4, [0, 100], 0.5);
    expect(band.step).toBe(25);
    expect(band.bandwidth).toBe(12.5);
    expect(band.position(0)).toBe(6.25);
  });

  it('handles a single band', () => {
    const band = createBandScale(1, [0, 100]);
    expect(band.step).toBe(100);
    expect(band.center(0)).toBe(50);
  });

  it('handles zero bands without NaN', () => {
    const band = createBandScale(0, [0, 100]);
    expect(band.step).toBe(0);
    expect(band.bandwidth).toBe(0);
    expect(Number.isNaN(band.position(0))).toBe(false);
  });
});
