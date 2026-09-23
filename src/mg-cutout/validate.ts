import type {MgCutoutRiseSpec, MgCutoutSource} from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const validReferences = (value: unknown): value is string[] =>
  Array.isArray(value)
  && value.length <= 3
  && value.every((reference) => typeof reference === "string" && reference.trim().length > 0 && reference.length <= 2000);

const validateSource = (value: unknown, errors: string[]): value is MgCutoutSource => {
  if (!isRecord(value)) {
    errors.push("source must be an object");
    return false;
  }
  const unknownFields = Object.keys(value).filter((field) => !["mode", "image", "subject", "references"].includes(field));
  if (unknownFields.length) errors.push("source only accepts mode, image, subject and references");

  if (value.mode === "transparent" || value.mode === "chroma") {
    if (typeof value.image !== "string" || !value.image.trim() || value.image.length > 2000) {
      errors.push(`source.image must be a non-empty string of at most 2000 characters in ${value.mode} mode`);
    }
    if (value.subject !== null) errors.push(`source.subject must be null in ${value.mode} mode`);
    if (!Array.isArray(value.references) || value.references.length !== 0) {
      errors.push(`source.references must be an empty array in ${value.mode} mode`);
    }
    return errors.length === 0;
  }

  if (value.mode === "generate") {
    if (value.image !== null) errors.push("source.image must be null in generate mode");
    if (typeof value.subject !== "string" || !value.subject.trim() || value.subject.length > 160) {
      errors.push("source.subject must be a non-empty string of at most 160 characters in generate mode");
    }
    if (!validReferences(value.references) || value.references.length < 1) {
      errors.push("source.references must contain 1-3 direct image URLs in generate mode");
    }
    return errors.length === 0;
  }

  errors.push("source.mode must be transparent, chroma or generate");
  return false;
};

export const validateMgCutoutRiseSpec = (input: unknown): string[] => {
  if (!isRecord(input)) return ["spec must be an object"];
  const errors: string[] = [];
  const sourceValue = input.source;
  const sourceValid = validateSource(sourceValue, errors);
  if (typeof input.image !== "string" || input.image.length > 2000) {
    errors.push("image must be a string of at most 2000 characters");
  } else if (input.prepared === true && !input.image.trim()) {
    errors.push("image must be non-empty after asset preparation");
  } else if (sourceValid && isRecord(sourceValue) && sourceValue.mode === "transparent" && !input.image.trim()) {
    errors.push("image must be non-empty for a transparent source");
  }
  if (typeof input.at !== "number" || !Number.isFinite(input.at) || input.at < 0) {
    errors.push("at must be a non-negative finite number");
  }
  if (input.prepared !== undefined && typeof input.prepared !== "boolean") {
    errors.push("prepared must be a boolean when supplied");
  }
  return errors;
};

export const assertMgCutoutRiseSpec = (input: unknown): MgCutoutRiseSpec => {
  const errors = validateMgCutoutRiseSpec(input);
  if (errors.length) throw new Error(`Invalid MgCutoutRiseSpec:\n- ${errors.join("\n- ")}`);
  return input as MgCutoutRiseSpec;
};
