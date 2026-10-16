export type FunctionCallEnvelope = {
  group: string;
  /** Instance order for repeated tags of the same structure; null for a singleton. */
  order?: number | null;
};

/** Whole-instance timing computed by the host from reviewed HTML, never model arguments. */
export type FunctionCallTiming = Readonly<{start: number; end: number}>;

export type ResolvedFunctionEnvelope = FunctionCallEnvelope & {at: number};

export type ResolvedFunctionCall<TSpec> = ResolvedFunctionEnvelope & {
  spec: TSpec;
};

export const functionGroupSchema = {
  type: "string",
  description: "Renderer style id copied verbatim from the HTML group attribute.",
  minLength: 1,
  maxLength: 80,
  pattern: "^[A-Za-z0-9_-]+$",
} as const;

export const functionOrderSchema = {
  description: "Repeated instance order copied from HTML, or null when the tag type occurs once.",
  anyOf: [
    {type: "integer", minimum: 1, maximum: 999},
    {type: "null"},
  ],
} as const;

export const functionAtSchema = {
  type: "number",
  minimum: 0,
  maximum: 36000,
} as const;

export const assertFunctionTiming = (timing: FunctionCallTiming): FunctionCallTiming => {
  if (!timing || !Number.isFinite(timing.start) || timing.start < 0
    || !Number.isFinite(timing.end) || timing.end <= timing.start) {
    throw new Error("host timing requires a non-negative start and a later end");
  }
  return timing;
};

export const assertFunctionEnvelope = (input: unknown, timing: FunctionCallTiming): ResolvedFunctionEnvelope => {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("function arguments must be an object");
  }
  const value = input as Record<string, unknown>;
  if (typeof value.group !== "string" || !/^[A-Za-z0-9_-]+$/.test(value.group)) {
    throw new Error("group must be a non-empty ASCII identifier");
  }
  if (value.order !== undefined && value.order !== null && (!Number.isInteger(value.order) || Number(value.order) < 1)) {
    throw new Error("order must be null or a positive integer");
  }
  if (["at", "startTime", "endTime"].some((field) => field in value)) {
    throw new Error("whole-instance timing belongs to the host, not Function Call arguments");
  }
  return {
    group: value.group,
    ...(typeof value.order === "number" ? {order: value.order} : {}),
    at: assertFunctionTiming(timing).start,
  };
};

export const toLocalAt = (absoluteAt: number, sceneAt: number): number => {
  if (!Number.isFinite(absoluteAt) || absoluteAt < sceneAt - 0.001) {
    throw new Error(`element at ${absoluteAt} cannot precede scene at ${sceneAt}`);
  }
  return Math.round(Math.max(0, absoluteAt - sceneAt) * 1000) / 1000;
};

const niceStep = (range: number, targetTicks = 6) => {
  const rough = Math.max(Number.EPSILON, range / Math.max(1, targetTicks - 1));
  const power = Math.pow(10, Math.floor(Math.log10(rough)));
  const normalized = rough / power;
  const multiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return multiplier * power;
};

export const autoAxis = (
  values: number[],
  options: {includeZero?: boolean; targetTicks?: number} = {},
) => {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return {min: 0, max: 1, ticks: 6};
  const includeZero = options.includeZero ?? true;
  const targetTicks = Math.max(2, Math.min(12, options.targetTicks ?? 6));
  let min = includeZero ? Math.min(0, ...finite) : Math.min(...finite);
  let max = includeZero ? Math.max(0, ...finite) : Math.max(...finite);
  if (min === max) {
    const padding = Math.max(1, Math.abs(min) * 0.2);
    min -= padding;
    max += padding;
  }
  const step = niceStep(max - min, targetTicks);
  min = Math.floor(min / step) * step;
  max = Math.ceil(max / step) * step;
  const ticks = Math.max(2, Math.min(12, Math.round((max - min) / step) + 1));
  return {min, max, ticks};
};
