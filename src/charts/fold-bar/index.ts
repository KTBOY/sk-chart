import { ChartBase } from '../../core/chart-base';
import { createUid } from '../../core/svg-renderer';
import type { ChartEventMap, ContainerLike } from '../../core/types';
import { createModel, resolveOptions, type FoldBarModel } from './defaults';
import { attachInteraction, type InteractionHandle } from './interaction';
import { renderFoldBar, type FoldBarRenderResult } from './render';
import type { FoldBarChartConfig, FoldBarDatum } from './types';

/**
 * Fold-paper funnel bar chart: gradient columns joined by folded flaps,
 * striped idle state, wash highlight on the active column.
 */
export class FoldBarChart extends ChartBase<
  FoldBarChartConfig,
  ChartEventMap<FoldBarDatum>
> {
  private uid = createUid();
  private model: FoldBarModel | null = null;
  private rendered: FoldBarRenderResult | null = null;
  private interaction: InteractionHandle | null = null;

  constructor(container: ContainerLike, config: FoldBarChartConfig) {
    super(container, config);
    this.renderChart();
  }

  /** Currently active (highlighted) column index. */
  get activeIndex(): number {
    return this.interaction?.getActive() ?? -1;
  }

  /** Programmatically highlight a column. */
  setActive(index: number): void {
    this.interaction?.setActive(index);
  }

  protected renderChart(): void {
    this.interaction?.destroy();
    this.interaction = null;
    this.rendered?.svg.remove();

    const options = resolveOptions(this.config);
    this.model = createModel(this.config, options);
    this.rendered = renderFoldBar(this.uid, this.model);
    this.container.appendChild(this.rendered.svg);
    this.svg = this.rendered.svg;

    this.interaction = this.model.data.length
      ? attachInteraction({
          uid: this.uid,
          columns: this.rendered.columns,
          columnsLayer: this.rendered.columnsLayer,
          tooltip: this.rendered.tooltip,
          model: this.model,
          host: { emit: (event, payload) => this.emit(event, payload) },
        })
      : null;
  }

  protected onDestroy(): void {
    this.interaction?.destroy();
    this.interaction = null;
  }
}

export type { FoldBarChartConfig };
