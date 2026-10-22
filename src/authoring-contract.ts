import {assertFunctionEnvelope, functionAtSchema, functionOrderSchema, toLocalAt, type FunctionCallTiming} from "./function-call";

/** Closed, content-only contracts shared by new templates; old contracts are untouched. */
export const closedObject = (properties: Record<string, unknown>) => ({type: "object", additionalProperties: false, required: Object.keys(properties), properties});
export const textField = (maxLength = 80) => ({type: "string", minLength: 1, maxLength});
export const listField = (items: unknown, minItems = 0, maxItems = 12) => ({type: "array", minItems, maxItems, items});
export const nullableField = (schema: unknown) => ({anyOf: [schema, {type: "null"}]});
export const envelopeFields = (groups: readonly string[]) => ({group: {type: "string", enum: groups}, order: functionOrderSchema});
export {functionAtSchema};

export const recordOf = (value: unknown, fields: readonly string[], name: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${name} must be an object`);
  const record = value as Record<string, unknown>;
  const extra = Object.keys(record).filter((key) => !fields.includes(key));
  const missing = fields.filter((key) => !(key in record));
  if (extra.length || missing.length) throw new Error(`${name}: extra fields [${extra.join(", ")}], missing fields [${missing.join(", ")}]`);
  return record;
};
export const readText = (value: unknown, name: string, max = 80): string => {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error(`${name} requires 1-${max} characters`);
  return value.trim();
};
export const readNumber = (value: unknown, name: string, minimum = -Infinity): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum) throw new Error(`${name} must be a finite number >= ${minimum}`);
  return value;
};
export const readList = (value: unknown, name: string, min: number, max: number): unknown[] => {
  if (!Array.isArray(value) || value.length < min || value.length > max) throw new Error(`${name} requires ${min}-${max} entries`);
  return value;
};
export const unique = (values: readonly string[], name: string): void => {
  if (new Set(values).size !== values.length) throw new Error(`${name} must be unique`);
};
export const readId = (value: unknown, name: string): string => {
  const id = readText(value, name, 40);
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(id)) throw new Error(`${name} requires an ASCII identifier`);
  return id;
};
export const readEnvelope = (input: unknown, timing: FunctionCallTiming, groups: readonly string[]) => {
  const envelope = assertFunctionEnvelope(input, timing);
  if (!groups.includes(envelope.group)) throw new Error(`group must be ${groups.join(" or ")}`);
  return envelope;
};
export const localEventTime = (value: unknown, timing: FunctionCallTiming): number => {
  const at = readNumber(value, "event.at", 0);
  if (at < timing.start || at >= timing.end) throw new Error("event.at must be within host [start, end)");
  return toLocalAt(at, timing.start);
};
export const orderedTimes = (events: readonly {at: number}[], strict = false): void => {
  if (events.some((event, i) => i > 0 && (strict ? event.at <= events[i - 1].at : event.at < events[i - 1].at))) throw new Error(`event times must ${strict ? "strictly increase" : "be non-decreasing"}`);
};
