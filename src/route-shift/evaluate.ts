const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
export const routeShiftProgress = (at: number, seconds: number, duration = 0.9): number => clamp01((seconds - at) / duration);
export const routeShiftEaseInOut = (value: number): number => {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
