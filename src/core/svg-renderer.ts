export const SVG_NS = 'http://www.w3.org/2000/svg';

export function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, String(value));
  }
  return node;
}

export type GradientStop = readonly [offset: number, color: string];

export function addStops<T extends SVGElement>(gradient: T, stops: readonly GradientStop[]): T {
  for (const [offset, color] of stops) {
    gradient.appendChild(createSvgElement('stop', { offset, 'stop-color': color }));
  }
  return gradient;
}

let uidCounter = 0;

/** Per-instance unique prefix isolating SVG defs ids and class names across chart instances. */
export function createUid(prefix = 'skc'): string {
  uidCounter += 1;
  return `${prefix}${uidCounter.toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function scopedId(uid: string, name: string): string {
  return `${uid}-${name}`;
}

export function urlRef(uid: string, name: string): string {
  return `url(#${scopedId(uid, name)})`;
}

export function clearElement(node: Element): void {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}
