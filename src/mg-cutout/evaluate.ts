const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const MG_CUTOUT_RISE_DURATION = 1.2;
/** Minimum source window needed to let the rise complete and briefly hold. */
export const MG_CUTOUT_MIN_DURATION_SECONDS = 1.5;
export const MG_CUTOUT_RISE_OFFSET = 1020;

/** A single upward travel with a quick lift that naturally eases to a stop. */
export const evaluateMgCutoutRise = (
  seconds: number,
  at = 0,
  duration = MG_CUTOUT_RISE_DURATION,
): number => {
  const progress = clamp01((seconds - at) / Math.max(0.001, duration));
  return 1 - Math.pow(1 - progress, 3);
};
