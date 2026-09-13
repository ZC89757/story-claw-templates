import {NewsFlashbackSpec} from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const validateNewsFlashbackSpec = (input: unknown): string[] => {
  if (!isRecord(input)) return ["spec must be an object"];
  const errors: string[] = [];
  if (typeof input.text !== "string" || !input.text.trim()) errors.push("text is required");
  if (typeof input.text === "string" && Array.from(input.text).length > 16) errors.push("text may contain at most 16 characters");
  if (typeof input.at !== "number" || !Number.isFinite(input.at) || input.at < 0) errors.push("at must be a non-negative number");
  if (!Array.isArray(input.pages) || input.pages.length < 2 || input.pages.length > 12) {
    errors.push("pages must contain 2-12 items");
  } else {
    input.pages.forEach((page, index) => {
      if (!isRecord(page) || typeof page.image !== "string" || !page.image.trim()) {
        errors.push(`pages[${index}].image is required`);
      }
      if (isRecord(page) && page.source !== undefined && typeof page.source !== "string") {
        errors.push(`pages[${index}].source must be a string`);
      }
      if (isRecord(page) && page.title !== undefined && typeof page.title !== "string") {
        errors.push(`pages[${index}].title must be a string`);
      }
    });
  }
  return errors;
};

export const assertNewsFlashbackSpec = (input: unknown): NewsFlashbackSpec => {
  const errors = validateNewsFlashbackSpec(input);
  if (errors.length) throw new Error(`Invalid NewsFlashbackSpec:\n- ${errors.join("\n- ")}`);
  return input as NewsFlashbackSpec;
};
