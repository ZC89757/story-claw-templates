import type {EraShiftItem, EraShiftItemState} from "./types";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

export const ERA_SHIFT_ITEM_DURATION = 0.48;

export const evaluateEraShiftItem = (item: EraShiftItem, seconds: number, at = 0): EraShiftItemState => {
  const progress = easeOutCubic(clamp01((seconds - at) / ERA_SHIFT_ITEM_DURATION));
  return {progress, visible: seconds >= at};
};

export const eraShiftProgress = (at: number, seconds: number, duration = 0.78): number =>
  clamp01((seconds - at) / duration);

export const eraShiftEaseInOut = (value: number): number => {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
