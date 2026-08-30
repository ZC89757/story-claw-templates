const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const transitionProgress = (at: number, seconds: number, duration = 0.72): number =>
  clamp01((seconds - at) / duration);

export const easeInOut = (value: number): number => {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
