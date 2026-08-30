import type {ShowcaseSpec} from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const validateShowcaseSpec = (input: unknown): string[] => {
  if (!isRecord(input)) return ["spec must be an object"];
  const errors: string[] = [];
  if (input.title !== undefined && (typeof input.title !== "string" || !input.title.trim() || input.title.length > 80)) {
    errors.push("title must be a non-empty string of at most 80 characters when supplied");
  }
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 12) {
    return [...errors, "items must contain 1-12 items"];
  }
  let previousAt = -1;
  input.items.forEach((raw, index) => {
    if (!isRecord(raw)) {
      errors.push(`items[${index}] must be an object`);
      return;
    }
    if (typeof raw.id !== "string" || !raw.id.trim() || raw.id.length > 80) {
      errors.push(`items[${index}].id must be a non-empty string of at most 80 characters`);
    }
    if (typeof raw.text !== "string" || !raw.text.trim() || raw.text.length > 100) {
      errors.push(`items[${index}].text must be a non-empty string of at most 100 characters`);
    }
    if (typeof raw.at !== "number" || !Number.isFinite(raw.at) || raw.at < 0 || raw.at < previousAt) {
      errors.push(`items[${index}].at must be a non-negative, non-decreasing number`);
    } else {
      previousAt = raw.at;
    }
  });
  return errors;
};

export const assertShowcaseSpec = (input: unknown): ShowcaseSpec => {
  const errors = validateShowcaseSpec(input);
  if (errors.length) throw new Error(`Invalid ShowcaseSpec:\n- ${errors.join("\n- ")}`);
  return input as ShowcaseSpec;
};
