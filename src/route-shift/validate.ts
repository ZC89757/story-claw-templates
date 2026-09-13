import type {RouteShiftSpec} from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
export const validateRouteShiftSpec = (input: unknown): string[] => {
  if (!isRecord(input)) return ["spec must be an object"];
  const errors: string[] = [];
  for (const field of ["title", "first", "second", "switch"] as const) if (typeof input[field] !== "string" || !input[field].trim() || input[field].length > 100) errors.push(`${field} must be a non-empty string of at most 100 characters`);
  if (typeof input.switchTime !== "number" || !Number.isFinite(input.switchTime) || input.switchTime < 0) errors.push("switchTime must be a non-negative number");
  return errors;
};
export const assertRouteShiftSpec = (input: unknown): RouteShiftSpec => {
  const errors = validateRouteShiftSpec(input); if (errors.length) throw new Error(`Invalid RouteShiftSpec:\n- ${errors.join("\n- ")}`); return input as RouteShiftSpec;
};
