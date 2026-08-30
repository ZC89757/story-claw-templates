export const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const effectProgress = (at: number, seconds: number, duration = 1.2): number =>
  Math.max(0, (seconds - at) / duration);

export const easeOut = (value: number): number => 1 - Math.pow(1 - clamp01(value), 3);

export const easeInOut = (value: number): number => {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const deterministic = (seed: number): number => {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
};
