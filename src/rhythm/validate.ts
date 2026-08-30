import type {RhythmSpec} from "./types";

export const validateRhythmSpec = (input: unknown): string[] => {
  if (!input || typeof input !== "object" || Array.isArray(input)) return ["spec must be an object"];
  const value = input as Record<string, unknown>;
  const errors: string[] = [];
  if (typeof value.text !== "string" || !value.text.trim() || value.text.length > 100) errors.push("text must be a non-empty string of at most 100 characters");
  if (typeof value.at !== "number" || !Number.isFinite(value.at) || value.at < 0) errors.push("at must be a non-negative number");
  return errors;
};

export const assertRhythmSpec = (input: unknown): RhythmSpec => {
  const errors = validateRhythmSpec(input);
  if (errors.length) throw new Error(`Invalid RhythmSpec:\n- ${errors.join("\n- ")}`);
  return input as RhythmSpec;
};
