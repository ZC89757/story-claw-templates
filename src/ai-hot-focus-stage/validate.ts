import {
  AI_HOT_FOCUS_STAGE_MAX_ITEMS,
  AI_HOT_FOCUS_STAGE_MIN_FIRST_DELAY_SECONDS,
  AI_HOT_FOCUS_STAGE_MIN_GAP_SECONDS,
  type AiHotFocusStageSpec,
} from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const validateAiHotFocusStageSpec = (input: unknown): string[] => {
  if (!isRecord(input)) return ["spec must be an object"];
  const errors: string[] = [];
  if (typeof input.title !== "string" || !input.title.trim() || input.title.length > 24) {
    errors.push("title must be a non-empty string of at most 24 characters");
  }
  if (input.subTitle !== null && (typeof input.subTitle !== "string" || !input.subTitle.trim() || input.subTitle.length > 32)) {
    errors.push("subTitle must be null or a non-empty string of at most 32 characters");
  }
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > AI_HOT_FOCUS_STAGE_MAX_ITEMS) {
    errors.push(`items must contain 1-${AI_HOT_FOCUS_STAGE_MAX_ITEMS} items`);
  } else {
    let previous = -Infinity;
    input.items.forEach((item, index) => {
      if (!isRecord(item)) {
        errors.push(`items[${index}] must be an object`);
        return;
      }
      if (typeof item.title !== "string" || !item.title.trim() || item.title.length > 40) {
        errors.push(`items[${index}].title must be a non-empty string of at most 40 characters`);
      }
      if (typeof item.time !== "number" || !Number.isFinite(item.time) || item.time < 0) {
        errors.push(`items[${index}].time must be a non-negative number`);
      } else {
        if (index === 0 && item.time < AI_HOT_FOCUS_STAGE_MIN_FIRST_DELAY_SECONDS) {
          errors.push(`items[0].time must be at least ${AI_HOT_FOCUS_STAGE_MIN_FIRST_DELAY_SECONDS} seconds`);
        }
        if (index > 0 && item.time - previous < AI_HOT_FOCUS_STAGE_MIN_GAP_SECONDS) {
          errors.push(`items[${index}].time must be at least ${AI_HOT_FOCUS_STAGE_MIN_GAP_SECONDS} seconds after the previous item`);
        }
        previous = item.time;
      }
    });
  }
  return errors;
};

export const assertAiHotFocusStageSpec = (input: unknown): AiHotFocusStageSpec => {
  const errors = validateAiHotFocusStageSpec(input);
  if (errors.length) throw new Error(`Invalid AiHotFocusStageSpec:\n- ${errors.join("\n- ")}`);
  return input as AiHotFocusStageSpec;
};
