import type {FunctionCallTiming} from "../function-call";
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

export type EmphasisFunctionArgs = FunctionCallEnvelope & {
  text: string;
};

export const emphasisParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["group", "order", "text"],
  properties: {
    group: functionGroupSchema,
    order: functionOrderSchema,
    text: {type: "string", minLength: 1, maxLength: 16},
  },
} as const;

export const emphasisFunctionDefinition = {
  type: "function",
  name: "create_emphasis_text_cue",
  description: "Create one emphasis-text animation for an HTML group. The host supplies the annotation window; text is the exact HTML cue text. The template only scales one short sentence up and stays transparent over the original footage; it never needs images.",
  strict: true,
  parameters: emphasisParametersSchema,
} as const;

export const resolveEmphasisFunctionArgs = (
  input: EmphasisFunctionArgs, timing: FunctionCallTiming,
): ResolvedFunctionCall<EmphasisSpec> => {
  const envelope = assertFunctionEnvelope(input, timing);
  return {...envelope, spec: assertEmphasisSpec({text: input.text, at: 0})};
};
