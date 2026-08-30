export interface BandScale {
  /** Full width of one band, including padding. */
  step: number;
  /** Usable width inside a band. */
  bandwidth: number;
  /** Leading edge of the band at index. */
  position: (index: number) => number;
  /** Center of the band at index. */
  center: (index: number) => number;
}

/** Splits range into count equal bands. paddingRatio is the fraction of each step left empty. */
export function createBandScale(
  count: number,
  range: [number, number],
  paddingRatio = 0,
): BandScale {
  const [r0, r1] = range;
  const step = count > 0 ? (r1 - r0) / count : 0;
  const bandwidth = step * (1 - paddingRatio);
  const offset = (step - bandwidth) / 2;
  return {
    step,
    bandwidth,
    position: (index) => r0 + index * step + offset,
    center: (index) => r0 + index * step + step / 2,
  };
}
