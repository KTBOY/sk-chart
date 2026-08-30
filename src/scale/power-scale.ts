import type { ScaleOptions } from './linear-scale';

export interface PowerScaleOptions extends ScaleOptions {
  /** Power applied to the normalized value. 1 behaves exactly like a linear scale. */
  exponent?: number;
}

/**
 * Maps values from domain to range through t^exponent, where t is the normalized
 * value clamped to [0, +inf). exponent < 1 emphasizes large values, > 1 compresses them.
 */
export function createPowerScale({
  domain: [d0, d1],
  range: [r0, r1],
  exponent = 1,
}: PowerScaleOptions): (value: number) => number {
  const span = d1 - d0;
  if (span === 0) return () => r0;
  return (value: number) => {
    const t = Math.max(0, (value - d0) / span);
    return r0 + Math.pow(t, exponent) * (r1 - r0);
  };
}
