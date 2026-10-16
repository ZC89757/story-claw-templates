import type {FunctionCallTiming} from "../function-call";
import {
  assertFunctionEnvelope,
  functionAtSchema,
  functionGroupSchema,
  functionOrderSchema,
  FunctionCallEnvelope,
  ResolvedFunctionCall,
} from "../function-call";
import {TitleSpec} from "./types";
import {assertTitleSpec} from "./validate";

export type TitleFunctionArgs = FunctionCallEnvelope & {text: string};

export const titleParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["group", "order", "text"],
  properties: {
    group: functionGroupSchema,
    order: functionOrderSchema,
    text: {type: "string", minLength: 1, maxLength: 80},
  },
} as const;

export const titleFunctionDefinition = {
  type: "function",
  name: "create_title_cue",
  description: "Create one title cue for an HTML group. The host supplies the annotation window. Supply only visible text; numbering and the selected title motion belong to the chosen template.",
  strict: true,
  parameters: titleParametersSchema,
} as const;

export const resolveTitleFunctionArgs = (
  input: TitleFunctionArgs, timing: FunctionCallTiming,
): ResolvedFunctionCall<TitleSpec> => {
  const envelope = assertFunctionEnvelope(input, timing);
  return {...envelope, spec: assertTitleSpec({text: input.text, at: 0})};
};
