import type {ShowcaseItem} from "./types";

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const showcaseItemProgress = (item: ShowcaseItem, seconds: number): number =>
  clamp01((seconds - item.at) / 0.34);

export const showcaseItemVisible = (item: ShowcaseItem, seconds: number): boolean => seconds >= item.at;

export const showcaseEaseOutCubic = (value: number): number => 1 - Math.pow(1 - clamp01(value), 3);
