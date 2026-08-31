export interface ExportOptions {
  /** 'png' rasterizes through a canvas; 'svg' returns the vector markup as a data URL. */
  type?: 'png' | 'svg';
  /** Pixel-density multiplier for PNG output. */
  scale?: number;
  /** Canvas backdrop painted before drawing the SVG; omit for transparency. */
  background?: string;
}

export interface DownloadOptions extends ExportOptions {
  filename?: string;
}

/** Standalone SVG markup: explicit pixel size + xmlns so the string renders anywhere. */
export function svgToMarkup(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const size = viewBoxSize(svg);
  if (size) {
    clone.setAttribute('width', String(size.width));
    clone.setAttribute('height', String(size.height));
  }
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  return new XMLSerializer().serializeToString(clone);
}

export function svgToDataUrl(svg: SVGSVGElement): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgToMarkup(svg))}`;
}

export async function svgToPngDataUrl(
  svg: SVGSVGElement,
  scale = 2,
  background?: string,
): Promise<string> {
  const size = viewBoxSize(svg) ?? { width: svg.clientWidth, height: svg.clientHeight };
  if (!size.width || !size.height) throw new Error('sk-chart: cannot measure SVG for raster export');

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(size.width * scale);
  canvas.height = Math.round(size.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('sk-chart: canvas 2d context unavailable');

  const url = URL.createObjectURL(new Blob([svgToMarkup(svg)], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = await loadImage(url);
    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}

function viewBoxSize(svg: SVGSVGElement): { width: number; height: number } | null {
  const [, , w, h] = (svg.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number);
  return Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0 ? { width: w, height: h } : null;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('sk-chart: failed to rasterize SVG'));
    image.src = url;
  });
}

export function triggerDownload(href: string, filename: string): void {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
