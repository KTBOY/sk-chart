import { createSvgElement, scopedId } from '../../core/svg-renderer';
import type { ChartEventMap } from '../../core/types';
import type { FoldBarModel } from './defaults';
import { tooltipPlacement } from './geometry';
import type { TooltipHandle } from './render';
import type { FoldBarDatum, TooltipPart } from './types';

export interface InteractionHost {
  emit: <K extends keyof ChartEventMap<FoldBarDatum>>(
    event: K,
    payload: ChartEventMap<FoldBarDatum>[K],
  ) => void;
}

export interface InteractionContext {
  uid: string;
  columns: SVGGElement[];
  columnsLayer: SVGGElement;
  tooltip: TooltipHandle;
  model: FoldBarModel;
  host: InteractionHost;
}

export interface InteractionHandle {
  setActive(index: number): void;
  getActive(): number;
  destroy(): void;
}

/**
 * Text metrics used to size and center the tooltip. Safe under jsdom (returns zeros).
 * x/y are cleared first: getBBox reports the ink at the baseline written by the previous
 * render, and reusing it as the centering offset makes the text drift on every hover.
 */
export function measureTooltipText(text: SVGTextElement): { width: number; centerY: number } {
  text.setAttribute('x', '0');
  text.setAttribute('y', '0');
  let width = 0;
  let centerY = 0;
  if (typeof text.getComputedTextLength === 'function') {
    try {
      width = text.getComputedTextLength();
    } catch {
      width = 0;
    }
  }
  if (typeof text.getBBox === 'function') {
    try {
      const box = text.getBBox();
      centerY = box.y + box.height / 2;
    } catch {
      centerY = 0;
    }
  }
  return { width, centerY };
}

function renderTooltipText(uid: string, text: SVGTextElement, parts: TooltipPart[]): void {
  text.textContent = '';
  for (const part of parts) {
    const attrs: Record<string, string> = {};
    if (part.tone && part.tone !== 'n') {
      attrs.class = scopedId(uid, part.tone);
    }
    const tspan = createSvgElement('tspan', attrs);
    tspan.textContent = part.text;
    text.appendChild(tspan);
  }
}

export function attachInteraction(ctx: InteractionContext): InteractionHandle {
  const { uid, columns, columnsLayer, tooltip, model, host } = ctx;
  const { options, layout, bars, data } = model;
  let active = -1;

  const cleanup: Array<() => void> = [];
  function listen(
    target: EventTarget,
    type: string,
    fn: EventListener,
    opts?: AddEventListenerOptions,
  ): void {
    target.addEventListener(type, fn, opts);
    cleanup.push(() => target.removeEventListener(type, fn, opts));
  }

  function renderTip(index: number): void {
    if (!options.tooltip.enabled) return;
    const parts = options.tooltip.formatter(data[index], index, data);
    renderTooltipText(uid, tooltip.text, parts);
    const measured = measureTooltipText(tooltip.text);
    const width =
      options.tooltip.fixedWidth ?? measured.width + options.tooltip.paddingX * 2;
    tooltip.rect.setAttribute('width', String(width));
    tooltip.text.setAttribute('x', String(width / 2));
    tooltip.text.setAttribute(
      'y',
      String(options.tooltip.height / 2 - measured.centerY),
    );
    const pos = tooltipPlacement(layout, bars[index], width, options.tooltip);
    tooltip.group.setAttribute('transform', `translate(${pos.x},${pos.y})`);
  }

  function setActive(index: number): void {
    if (index === active || index < 0 || index >= columns.length) return;
    active = index;
    columns.forEach((col, i) => {
      col.classList.toggle(`${uid}-active`, i === index);
      col.setAttribute('aria-selected', String(i === index));
    });
    renderTip(index);
  }

  columns.forEach((col, i) => {
    listen(col, 'mouseenter', () => {
      setActive(i);
      host.emit('column:enter', { index: i, datum: data[i] });
    });
    listen(col, 'click', () => {
      host.emit('column:click', { index: i, datum: data[i] });
    });
    listen(col, 'touchstart', () => setActive(i), { passive: true });
  });

  const releaseTouch = () => setActive(options.state.defaultActive);
  listen(columnsLayer, 'touchend', releaseTouch, { passive: true });
  listen(columnsLayer, 'touchcancel', releaseTouch, { passive: true });

  listen(columnsLayer, 'mouseleave', () => {
    if (active >= 0) {
      host.emit('column:leave', { index: active, datum: data[active] });
    }
    setActive(options.state.defaultActive);
  });

  const svg = columnsLayer.ownerSVGElement;
  if (svg) {
    svg.setAttribute('tabindex', '0');
    listen(svg, 'keydown', (event) => {
      const key = (event as KeyboardEvent).key;
      if (key === 'ArrowRight') {
        setActive(Math.min(active + 1, columns.length - 1));
        event.preventDefault();
      } else if (key === 'ArrowLeft') {
        setActive(Math.max(active - 1, 0));
        event.preventDefault();
      } else if (key === 'Home') {
        setActive(0);
        event.preventDefault();
      } else if (key === 'End') {
        setActive(columns.length - 1);
        event.preventDefault();
      } else if ((key === 'Enter' || key === ' ') && active >= 0) {
        host.emit('column:click', { index: active, datum: data[active] });
        event.preventDefault();
      }
    });
  }

  // First activation must not animate in from the origin.
  tooltip.group.style.transition = 'none';
  setActive(options.state.defaultActive);
  requestAnimationFrame(() => {
    tooltip.group.style.transition = '';
  });

  return {
    setActive,
    getActive: () => active,
    destroy: () => cleanup.forEach((fn) => fn()),
  };
}
