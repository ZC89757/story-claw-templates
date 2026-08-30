import {ImageMediaItem, ImageMediaItemState} from "./types";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

/** Shared entrance timing keeps stack and grid interchangeable at the Function Call boundary. */
export const IMAGE_REVEAL_DURATION = 0.58;

export const evaluateImageMediaItem = (item: ImageMediaItem, seconds: number): ImageMediaItemState => {
  const progress = easeOutCubic(clamp01((seconds - item.at) / IMAGE_REVEAL_DURATION));
  return {progress, visible: seconds >= item.at};
};
