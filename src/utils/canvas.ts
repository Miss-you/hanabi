/**
 * Setup canvas with device pixel ratio scaling
 */
export function setupCanvas(
  canvas: HTMLCanvasElement,
  width?: number,
  height?: number
): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context');

  const dpr = window.devicePixelRatio || 1;
  const w = width ?? canvas.clientWidth;
  const h = height ?? canvas.clientHeight;

  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  ctx.scale(dpr, dpr);
  return ctx;
}

/**
 * Clear canvas with optional color
 */
export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string = '#000'
): void {
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draw a gradient background
 */
export function drawGradient(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  topColor: string,
  bottomColor: string
): void {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, topColor);
  grad.addColorStop(1, bottomColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}
