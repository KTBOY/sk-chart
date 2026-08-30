export interface ScaleOptions {
  domain: [number, number];
  range: [number, number];
}

/** Maps values from domain to range linearly. A degenerate domain maps everything to range[0]. */
export function createLinearScale({
  domain: [d0, d1],
  range: [r0, r1],
}: ScaleOptions): (value: number) => number {
  const span = d1 - d0;
  if (span === 0) return () => r0;
  const k = (r1 - r0) / span;
  return (value: number) => r0 + (value - d0) * k;
}
