/**
 * Generate random number in range [min, max)
 */
export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generate Gaussian (Normal) distributed random number
 * Uses Box-Muller transform
 * Returns value around 0 with standard deviation ~1
 */
export function randomGaussian(): number {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Get X coordinate with center bias using Gaussian distribution
 * Mean: 0.5 (center), Sigma: 0.15
 * Result clipped to [0.1, 0.9] of screen width
 */
export function getDistributedX(screenWidth: number): number {
  const x = 0.5 + randomGaussian() * 0.15;
  return Math.max(0.1, Math.min(0.9, x)) * screenWidth;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Map a value from one range to another
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Calculate launch parameters for firework to reach target height
 * Returns travel duration and target Y position
 */
export function calculateLaunchParams(
  screenHeight: number,
  targetYRatio: number,
  gravity: number = 0.25,
): { duration: number; targetY: number } {
  const targetY = screenHeight * targetYRatio;
  const dist = screenHeight - targetY;
  const v0 = Math.sqrt(2 * gravity * dist);
  const frames = Math.ceil(v0 / gravity);
  const duration = frames / 60; // seconds at 60fps
  return { duration, targetY };
}

/**
 * Convert HSL to CSS color string
 */
export function hslColor(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}
