import {
  AI_HOT_OPENING_MAX_ITEMS,
  AI_HOT_OPENING_MIN_DURATION_SECONDS,
  type AiHotOpeningSpec,
} from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const validateAiHotOpeningSpec = (input: unknown): string[] => {
  if (!isRecord(input)) return ["spec must be an object"];
  const errors: string[] = [];
  if (typeof input.title !== "string" || !input.title.trim() || input.title.length > 24) {
    errors.push("title must be a non-empty string of at most 24 characters");
  }
  if (input.subTitle !== null && (
    typeof input.subTitle !== "string"
    || !input.subTitle.trim()
    || input.subTitle.length > 32
  )) {
    errors.push("subTitle must be null or a non-empty string of at most 32 characters");
  }
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > AI_HOT_OPENING_MAX_ITEMS) {
    errors.push(`items must contain 1-${AI_HOT_OPENING_MAX_ITEMS} headlines`);
  } else {
    input.items.forEach((item, index) => {
      if (typeof item !== "string" || !item.trim() || item.length > 40) {
        errors.push(`items[${index}] must be a non-empty string of at most 40 characters`);
      }
    });
  }
  if (
    typeof input.durationSeconds !== "number"
    || !Number.isFinite(input.durationSeconds)
    || input.durationSeconds < AI_HOT_OPENING_MIN_DURATION_SECONDS
    || input.durationSeconds > 36000
  ) {
    errors.push(`durationSeconds must be between ${AI_HOT_OPENING_MIN_DURATION_SECONDS} and 36000 seconds`);
  }
  return errors;
};

export const assertAiHotOpeningSpec = (input: unknown): AiHotOpeningSpec => {
  const errors = validateAiHotOpeningSpec(input);
  if (errors.length) throw new Error(`Invalid AiHotOpeningSpec:\n- ${errors.join("\n- ")}`);
  return input as AiHotOpeningSpec;
};
