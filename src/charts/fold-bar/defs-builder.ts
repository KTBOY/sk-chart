import { addStops, createSvgElement, scopedId, urlRef } from '../../core/svg-renderer';
import type { ResolvedFoldBarStyle } from '../../theme/default-theme';

export interface DefsContext {
  uid: string;
  width: number;
  height: number;
  plotBottom: number;
  barCount: number;
  /** Which bar is painted with the active gradient stops. */
  gradientIndex: number;
  /** Per-flap gradient y range (bar top -> plot bottom), aligned with columns; last is null. */
  flapGradientYs: ([number, number] | null)[];
  /** Fade band that dissolves bar bottoms; follows plot.bottom unless user-overridden. */
  fade: { start: number; end: number };
  style: ResolvedFoldBarStyle;
}

/** Builds the full <defs> block. Every id is scoped under ctx.uid for multi-instance safety. */
export function buildDefs(ctx: DefsContext): SVGDefsElement {
  const { uid, style } = ctx;
  const defs = createSvgElement('defs');

  // Diagonal "lined paper" stripes laid over inactive bars.
  const pattern = createSvgElement('pattern', {
    id: scopedId(uid, 'stripes'),
    width: style.stripePattern.size,
    height: style.stripePattern.size,
    patternUnits: 'userSpaceOnUse',
    patternTransform: `rotate(${style.stripePattern.rotation})`,
  });
  pattern.appendChild(
    createSvgElement('rect', {
      width: style.stripePattern.size,
      height: style.stripePattern.size,
      fill: 'none',
    }),
  );
  pattern.appendChild(
    createSvgElement('rect', {
      width: style.stripePattern.lineWidth,
      height: style.stripePattern.size,
      fill: style.stripePattern.lineColor,
      'fill-opacity': style.stripePattern.lineOpacity,
    }),
  );
  defs.appendChild(pattern);

  // Bar body gradients (per bar, vertical over its own bounding box).
  for (let i = 0; i < ctx.barCount; i++) {
    const stops = i === ctx.gradientIndex ? style.barGradientActive : style.barGradientNormal;
    defs.appendChild(
      addStops(
        createSvgElement('linearGradient', { id: scopedId(uid, `bar${i}`), x1: 0, y1: 0, x2: 0, y2: 1 }),
        stops,
      ),
    );
  }

  // Folded flap gradients (userSpaceOnUse so the lit crease sits at each flap's own top).
  for (let i = 0; i < ctx.barCount; i++) {
    const range = ctx.flapGradientYs[i];
    if (!range) continue;
    defs.appendChild(
      addStops(
        createSvgElement('linearGradient', {
          id: scopedId(uid, `fold${i}`),
          gradientUnits: 'userSpaceOnUse',
          x1: 0,
          y1: range[0],
          x2: 0,
          y2: range[1],
        }),
        style.foldGradient,
      ),
    );
  }

  // Specular highlight along the crease (horizontal over the flap's bounding box).
  defs.appendChild(
    addStops(
      createSvgElement('linearGradient', { id: scopedId(uid, 'crease'), x1: 0, y1: 0, x2: 1, y2: 0 }),
      style.creaseGradient,
    ),
  );

  // Active column wash backdrop.
  defs.appendChild(
    addStops(
      createSvgElement('linearGradient', { id: scopedId(uid, 'wash'), x1: 0, y1: 0, x2: 0, y2: 1 }),
      style.washGradient,
    ),
  );

  // Pill handle.
  defs.appendChild(
    addStops(
      createSvgElement('linearGradient', { id: scopedId(uid, 'pill'), x1: 0, y1: 0, x2: 0, y2: 1 }),
      style.pill.gradient,
    ),
  );

  // Soft shadow under the tooltip paper.
  const filter = createSvgElement('filter', {
    id: scopedId(uid, 'soft'),
    x: '-40%',
    y: '-40%',
    width: '180%',
    height: '200%',
  });
  filter.appendChild(
    createSvgElement('feDropShadow', {
      dx: style.shadow.dx,
      dy: style.shadow.dy,
      stdDeviation: style.shadow.blur,
      'flood-color': style.shadow.color,
      'flood-opacity': style.shadow.opacity,
    }),
  );
  defs.appendChild(filter);

  // The sheet dissolves instead of hitting a hard baseline.
  defs.appendChild(
    addStops(
      createSvgElement('linearGradient', {
        id: scopedId(uid, 'fadeGrad'),
        gradientUnits: 'userSpaceOnUse',
        x1: 0,
        y1: ctx.fade.start,
        x2: 0,
        y2: ctx.fade.end,
      }),
      [
        [0, '#fff'],
        [1, '#000'],
      ],
    ),
  );
  const mask = createSvgElement('mask', {
    id: scopedId(uid, 'fade'),
    maskUnits: 'userSpaceOnUse',
    x: 0,
    y: 0,
    width: ctx.width,
    height: ctx.height,
  });
  mask.appendChild(
    createSvgElement('rect', {
      x: 0,
      y: 0,
      width: ctx.width,
      height: ctx.height,
      fill: urlRef(uid, 'fadeGrad'),
    }),
  );
  defs.appendChild(mask);

  return defs;
}
