import type {MgCompositionLayout, MgCompositionSlot} from "../runtime.js";
import type {AiHotFocusStageSpec} from "./types.js";

/** Leave the chapter heading clear while keeping nested effects in the content area. */
export const AI_HOT_FOCUS_STAGE_COMPOSITION_LAYOUT: MgCompositionLayout = Object.freeze({
  bounds: Object.freeze({x: 0.035, y: 0.17, width: 0.93, height: 0.83}),
});

/** Shared with the chapter morph so nested content opens only after expansion finishes. */
export const AI_HOT_FOCUS_STAGE_MORPH_DURATION_SECONDS = 1.3;
export const AI_HOT_FOCUS_STAGE_EXPAND_START_PROGRESS = 0.28;
export const AI_HOT_FOCUS_STAGE_SUBSEQUENT_ENTER_DELAY_SECONDS = 0.42;

/**
 * Open each chapter's nested content after its full entrance animation.
 * Close at the next switch trigger, leaving the transition itself unfilled.
 */
export const resolveAiHotFocusStageCompositionSlots = (
  spec: unknown,
  fps: number,
  durationFrames: number,
): readonly MgCompositionSlot[] => {
  const typed = spec as AiHotFocusStageSpec;
  if (!Number.isFinite(fps) || fps <= 0) throw new Error("composition slot fps 必须为正数");
  if (!Number.isInteger(durationFrames) || durationFrames < 1) throw new Error("composition slot durationFrames 必须为正整数");
  if (!typed || !Array.isArray(typed.items)) return [];

  const toFrame = (seconds: number): number => Math.max(0, Math.min(durationFrames, Math.round(seconds * fps)));
  const toOpenFrame = (seconds: number): number => Math.max(0, Math.min(durationFrames, Math.ceil(seconds * fps)));
  return typed.items.flatMap((item, index) => {
    const enterStart = Number(item.time) + (index === 0 ? 0 : AI_HOT_FOCUS_STAGE_SUBSEQUENT_ENTER_DELAY_SECONDS);
    const openFrame = toOpenFrame(enterStart + AI_HOT_FOCUS_STAGE_MORPH_DURATION_SECONDS);
    const next = typed.items[index + 1];
    const closeFrame = next ? toFrame(Number(next.time)) : durationFrames;
    return closeFrame > openFrame
      ? [{slotId: `item-${index + 1}`, openFrame, closeFrame}]
      : [];
  });
};
