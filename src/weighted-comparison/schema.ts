import type {FunctionCallTiming} from "../function-call";
import {
  assertFunctionEnvelope,
  functionAtSchema,
  functionGroupSchema,
  functionOrderSchema,
  FunctionCallEnvelope,
  ResolvedFunctionCall,
  toLocalAt,
} from "../function-call";
import {ComparisonSide, SideBySideComparisonSpec, WeightedComparisonSpec} from "./types";
import {assertSideBySideComparisonSpec, assertWeightedComparisonSpec} from "./validate";

const label = {type: "string", minLength: 1, maxLength: 50} as const;
const pointText = {type: "string", minLength: 1, maxLength: 100} as const;
const side = {type: "string", enum: ["left", "right"]} as const;

type ComparisonFunctionBase = FunctionCallEnvelope & {
  title: string;
  leftLabel: string;
  rightLabel: string;
  highlights: Array<{at: number; side: ComparisonSide}>;
};

export type WeightedComparisonFunctionArgs = ComparisonFunctionBase & {
  items: Array<{at: number; side: ComparisonSide; text: string; weight: number}>;
};

export type SideBySideComparisonFunctionArgs = ComparisonFunctionBase & {
  items: Array<{at: number; side: ComparisonSide; text: string}>;
};

const commonProperties = {
  group: functionGroupSchema,
  order: functionOrderSchema,
  title: {type: "string", minLength: 1, maxLength: 80},
  leftLabel: label,
  rightLabel: label,
} as const;

const highlights = {
  type: "array",
  maxItems: 12,
  items: {
    type: "object",
    additionalProperties: false,
    required: ["at", "side"],
    properties: {at: functionAtSchema, side},
  },
} as const;

export const weightedComparisonParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["group", "order", "title", "leftLabel", "rightLabel", "items", "highlights"],
  properties: {
    ...commonProperties,
    items: {
      type: "array",
      minItems: 2,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["at", "side", "text", "weight"],
        properties: {
          at: functionAtSchema,
          side,
          text: pointText,
          weight: {type: "number", minimum: 1, maximum: 5},
        },
      },
    },
    highlights,
  },
} as const;

export const sideBySideComparisonParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["group", "order", "title", "leftLabel", "rightLabel", "items", "highlights"],
  properties: {
    ...commonProperties,
    items: {
      type: "array",
      minItems: 2,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["at", "side", "text"],
        properties: {at: functionAtSchema, side, text: pointText},
      },
    },
    highlights,
  },
} as const;

export const weightedComparisonFunctionDefinition = {
  type: "function",
  name: "create_weighted_comparison",
  description: "Create one weighted balance comparison for an HTML group. at values are absolute episode timestamps. Supply visible labels, timed points, evidence-based weights from 1 to 5 and optional timed side highlights. Add/highlight actions, scoring motion and balance physics are fixed by the template.",
  strict: true,
  parameters: weightedComparisonParametersSchema,
} as const;

export const sideBySideComparisonFunctionDefinition = {
  type: "function",
  name: "create_side_by_side_comparison",
  description: "Create one ordinary left-versus-right comparison for an HTML group. at values are absolute episode timestamps. Supply visible labels, timed points and optional timed side highlights. Do not invent weights or scores; layout and motion are fixed by the template.",
  strict: true,
  parameters: sideBySideComparisonParametersSchema,
} as const;

const highlightEvents = (input: ComparisonFunctionBase, rootAt: number) =>
  input.highlights.map((item) => ({
    at: toLocalAt(item.at, rootAt),
    action: "highlight" as const,
    side: item.side,
  }));

export const resolveWeightedComparisonFunctionArgs = (
  input: WeightedComparisonFunctionArgs, timing: FunctionCallTiming,
): ResolvedFunctionCall<WeightedComparisonSpec> => {
  const envelope = assertFunctionEnvelope(input, timing);
  const events = [
    ...input.items.map((item) => ({...item, at: toLocalAt(item.at, envelope.at), action: "add" as const})),
    ...highlightEvents(input, envelope.at),
  ].sort((left, right) => left.at - right.at);
  const spec = assertWeightedComparisonSpec({title: input.title, leftLabel: input.leftLabel, rightLabel: input.rightLabel, events});
  return {...envelope, spec};
};

export const resolveSideBySideComparisonFunctionArgs = (
  input: SideBySideComparisonFunctionArgs, timing: FunctionCallTiming,
): ResolvedFunctionCall<SideBySideComparisonSpec> => {
  const envelope = assertFunctionEnvelope(input, timing);
  const events = [
    ...input.items.map((item) => ({...item, at: toLocalAt(item.at, envelope.at), action: "add" as const})),
    ...highlightEvents(input, envelope.at),
  ].sort((left, right) => left.at - right.at);
  const spec = assertSideBySideComparisonSpec({title: input.title, leftLabel: input.leftLabel, rightLabel: input.rightLabel, events});
  return {...envelope, spec};
};
