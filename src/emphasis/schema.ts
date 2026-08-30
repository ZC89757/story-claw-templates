import {
  assertFunctionEnvelope,
  functionAtSchema,
  functionGroupSchema,
  functionOrderSchema,
  FunctionCallEnvelope,
  ResolvedFunctionCall,
} from "../function-call";
import {EmphasisSpec} from "./types";
import {assertEmphasisSpec} from "./validate";

export type EmphasisFunctionArgs = FunctionCallEnvelope & {text: string};

export const emphasisParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["group", "order", "at", "text"],
  properties: {
    group: functionGroupSchema,
    order: functionOrderSchema,
    at: functionAtSchema,
    text: {type: "string", minLength: 1, maxLength: 16},
  },
} as const;

export const emphasisFunctionDefinition = {
  type: "function",
  name: "create_emphasis_text_cue",
  description: "Create one emphasis-text animation for an HTML group. at is the absolute episode timestamp. Text layout and motion are fixed by the template.",
  strict: true,
  parameters: emphasisParametersSchema,
} as const;

export const resolveEmphasisFunctionArgs = (
  input: EmphasisFunctionArgs,
): ResolvedFunctionCall<EmphasisSpec> => {
  const envelope = assertFunctionEnvelope(input);
  return {...envelope, spec: assertEmphasisSpec({text: input.text, at: 0})};
};
