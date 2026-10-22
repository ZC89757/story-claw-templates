/** Quantitative marks must never overshoot the provided value. */
export const chartRevealProgress = (seconds: number, duration: number): number => {
  const t = Math.max(0, Math.min(1, seconds / duration));
  return t * t * (3 - 2 * t);
};
