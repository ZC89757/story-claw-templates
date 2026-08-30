import {
  assertFunctionEnvelope,
  functionAtSchema,
  functionGroupSchema,
  functionOrderSchema,
  FunctionCallEnvelope,
  ResolvedFunctionCall,
  toLocalAt,
} from "../function-call";
import {DecompositionSpec} from "./types";
import {assertDecompositionSpec} from "./validate";

const concept = {type: "string", minLength: 1, maxLength: 50} as const;

export type DecompositionFunctionArgs = FunctionCallEnvelope & {
  title: string;
  whole: string;
  parts: Array<{at: number; part: string}>;
  highlights: Array<{at: number; target: string}>;
};

export const decompositionParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["group", "order", "at", "title", "whole", "parts", "highlights"],
  properties: {
    group: functionGroupSchema,
    order: functionOrderSchema,
    at: functionAtSchema,
    title: {type: "string", minLength: 1, maxLength: 80},
    whole: concept,
    parts: {
      type: "array",
      minItems: 2,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["at", "part"],
        properties: {at: functionAtSchema, part: concept},
      },
    },
    highlights: {
      type: "array",
      maxItems: 16,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["at", "target"],
        properties: {at: functionAtSchema, target: concept},
      },
    },
  },
} as const;

export const decompositionFunctionDefinition = {
  type: "function",
  name: "create_decomposition_timeline",
  description: "Create one whole-to-parts animation for an HTML group. at values are absolute episode timestamps. Supply the visible title, whole, timed part names and optional timed highlight targets only. Extraction actions, detail cards, layout and motion are fixed by the template.",
  strict: true,
  parameters: decompositionParametersSchema,
} as const;

export const resolveDecompositionFunctionArgs = (
  input: DecompositionFunctionArgs,
): ResolvedFunctionCall<DecompositionSpec> => {
  const envelope = assertFunctionEnvelope(input);
  const events = [
    ...input.parts.map((item) => ({
      at: toLocalAt(item.at, envelope.at),
      action: "extract" as const,
      part: item.part,
    })),
    ...input.highlights.map((item) => ({
      at: toLocalAt(item.at, envelope.at),
      action: "highlight" as const,
      target: item.target,
    })),
  ].sort((left, right) => left.at - right.at);
  const spec = assertDecompositionSpec({title: input.title, whole: input.whole, events});
  return {...envelope, spec};
};
