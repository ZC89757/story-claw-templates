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
  description: "Create one transparent emphasis-text animation. The host supplies the annotation window; text is the exact HTML cue text. Group scale enlarges a short sentence. Group brush-shadow uses white brush calligraphy with yellow offset shadows: single 海/陆/空 chapter words drop from above, other headings reveal left to right. No images are needed.",
  strict: true,
  parameters: emphasisParametersSchema,
} as const;

export const resolveEmphasisFunctionArgs = (
  input: EmphasisFunctionArgs, timing: FunctionCallTiming,
): ResolvedFunctionCall<EmphasisSpec> => {
  const envelope = assertFunctionEnvelope(input, timing);
  return {...envelope, spec: assertEmphasisSpec({text: input.text, at: 0})};
};
