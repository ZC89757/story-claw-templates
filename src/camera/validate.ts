import type {CameraSpec} from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const validateCameraSpec = (input: unknown): string[] => {
  if (!isRecord(input)) return ["spec must be an object"];
  const errors: string[] = [];
  if (typeof input.text !== "string" || !input.text.trim() || input.text.length > 120) {
    errors.push("text must be a non-empty string of at most 120 characters");
  }
  if (typeof input.at !== "number" || !Number.isFinite(input.at) || input.at < 0) {
    errors.push("at must be a non-negative number");
  }
  if (input.items !== undefined) {
    if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 12) {
      errors.push("items must contain 1-12 items when supplied");
    } else {
      let previousAt = -1;
      input.items.forEach((raw, index) => {
        if (!isRecord(raw)) {
          errors.push(`items[${index}] must be an object`);
          return;
        }
        if (typeof raw.text !== "string" || !raw.text.trim() || raw.text.length > 120) {
          errors.push(`items[${index}].text must be a non-empty string of at most 120 characters`);
        }
        if (typeof raw.at !== "number" || !Number.isFinite(raw.at) || raw.at < 0 || raw.at < previousAt) {
          errors.push(`items[${index}].at must be a non-negative, non-decreasing number`);
        } else previousAt = raw.at;
      });
    }
  }
  return errors;
};

export const assertCameraSpec = (input: unknown): CameraSpec => {
  const errors = validateCameraSpec(input);
  if (errors.length) throw new Error(`Invalid CameraSpec:\n- ${errors.join("\n- ")}`);
  return input as CameraSpec;
};
