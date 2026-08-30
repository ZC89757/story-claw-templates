import {ImageMediaSpec} from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const validateImageMediaSpec = (input: unknown): string[] => {
  if (!isRecord(input)) return ["spec must be an object"];
  const errors: string[] = [];
  if (input.title !== undefined && (typeof input.title !== "string" || !input.title.trim() || input.title.length > 80)) {
    errors.push("title must be a non-empty string of at most 80 characters when supplied");
  }
  if (!Array.isArray(input.images) || input.images.length < 2 || input.images.length > 8) {
    return [...errors, "images must contain 2-8 items"];
  }
  let previousAt = -1;
  input.images.forEach((raw, index) => {
    if (!isRecord(raw)) {
      errors.push(`images[${index}] must be an object`);
      return;
    }
    if (typeof raw.image !== "string" || !raw.image.trim() || raw.image.length > 2000) {
      errors.push(`images[${index}].image must be a non-empty string of at most 2000 characters`);
    }
    if (raw.label !== undefined && (typeof raw.label !== "string" || !raw.label.trim() || raw.label.length > 100)) {
      errors.push(`images[${index}].label must be at most 100 characters when supplied`);
    }
    if (typeof raw.at !== "number" || !Number.isFinite(raw.at) || raw.at < 0 || raw.at < previousAt) {
      errors.push(`images[${index}].at must be a non-negative, non-decreasing number`);
    } else {
      previousAt = raw.at;
    }
  });
  return errors;
};

export const assertImageMediaSpec = <T extends ImageMediaSpec>(input: unknown): T => {
  const errors = validateImageMediaSpec(input);
  if (errors.length) throw new Error(`Invalid ImageMediaSpec:\n- ${errors.join("\n- ")}`);
  return input as T;
};
