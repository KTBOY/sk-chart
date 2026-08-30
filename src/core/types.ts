export type ContainerLike = string | HTMLElement;

export interface BaseConfig {
  /** viewBox design-space width. */
  width?: number;
  /** viewBox design-space height. */
  height?: number;
}

export interface ColumnEventPayload<D = unknown> {
  index: number;
  datum: D;
}

export interface ChartEventMap<D = unknown> {
  'column:enter': ColumnEventPayload<D>;
  'column:leave': ColumnEventPayload<D>;
  'column:click': ColumnEventPayload<D>;
}
