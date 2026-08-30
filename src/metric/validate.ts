import type {MetricSpec} from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const validateMetricSpec = (input: unknown): string[] => {
  if (!isRecord(input)) return ["spec must be an object"];
  const errors: string[] = [];
  if (input.title !== undefined && (typeof input.title !== "string" || !input.title.trim() || input.title.length > 80)) {
    errors.push("title must be a non-empty string of at most 80 characters when supplied");
  }
  if (!Array.isArray(input.points) || input.points.length < 1 || input.points.length > 12) {
    return [...errors, "points must contain 1-12 items"];
  }
  let previousAt = -1;
  input.points.forEach((raw, index) => {
    if (!isRecord(raw)) {
      errors.push(`points[${index}] must be an object`);
      return;
    }
    for (const field of ["id", "label", "value"] as const) {
      if (typeof raw[field] !== "string" || !(raw[field] as string).trim() || (raw[field] as string).length > 100) {
        errors.push(`points[${index}].${field} must be a non-empty string of at most 100 characters`);
      }
    }
    if (typeof raw.at !== "number" || !Number.isFinite(raw.at) || raw.at < 0 || raw.at < previousAt) {
      errors.push(`points[${index}].at must be a non-negative, non-decreasing number`);
    } else previousAt = raw.at;
  });
  return errors;
};

export const assertMetricSpec = (input: unknown): MetricSpec => {
  const errors = validateMetricSpec(input);
  if (errors.length) throw new Error(`Invalid MetricSpec:\n- ${errors.join("\n- ")}`);
  return input as MetricSpec;
};
