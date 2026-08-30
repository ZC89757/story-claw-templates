export const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const cameraProgress = (seconds: number, duration = 4): number => clamp01(seconds / duration);

export const easeOut = (value: number): number => 1 - Math.pow(1 - clamp01(value), 3);

export const easeInOut = (value: number): number => {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
