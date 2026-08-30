import type { BaseConfig, ChartEventMap, ContainerLike } from './types';

// Handler erasure point: concrete payload types are enforced at the on/off/emit boundary.
type AnyHandler = (payload: any) => void;

/**
 * Shared lifecycle for all chart classes: container resolution, config merge,
 * full-rebuild update/resize, event bus and teardown.
 *
 * E is the chart-type-specific event map, so each chart declares its own events
 * without touching core.
 */
export abstract class ChartBase<
  C extends BaseConfig,
  E extends object = ChartEventMap,
> {
  protected container: HTMLElement;
  protected config: C;
  protected svg: SVGSVGElement | null = null;
  private handlers = new Map<string, Set<AnyHandler>>();
  private destroyed = false;

  constructor(container: ContainerLike, config: C) {
    const element =
      typeof container === 'string' ? document.querySelector<HTMLElement>(container) : container;
    if (!element) {
      throw new Error(`sk-chart: container "${String(container)}" not found`);
    }
    this.container = element;
    this.config = config;
  }

  get isDestroyed(): boolean {
    return this.destroyed;
  }

  on<K extends keyof E & string>(event: K, handler: (payload: E[K]) => void): this {
    if (this.destroyed) return this;
    const set = this.handlers.get(event) ?? new Set<AnyHandler>();
    this.handlers.set(event, set);
    set.add(handler as AnyHandler);
    return this;
  }

  off<K extends keyof E & string>(event: K, handler: (payload: E[K]) => void): this {
    this.handlers.get(event)?.delete(handler as AnyHandler);
    return this;
  }

  protected emit<K extends keyof E & string>(event: K, payload: E[K]): void {
    this.handlers.get(event)?.forEach((handler) => handler(payload));
  }

  /** Merges the partial config and rebuilds the chart. */
  update(config: Partial<C>): void {
    if (this.destroyed) return;
    this.config = { ...this.config, ...config };
    this.renderChart();
  }

  /** Changes the viewBox design space and rebuilds (userSpaceOnUse coordinates depend on it). */
  resize(width: number, height: number): void {
    this.update({ width, height } as Partial<C>);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.onDestroy();
    this.svg?.remove();
    this.svg = null;
    this.handlers.clear();
  }

  /** Subclasses build (or rebuild) the SVG and attach it to the container. */
  protected abstract renderChart(): void;

  /** Subclass teardown hook, called before the SVG is removed. */
  protected onDestroy(): void {}
}
