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
  required: ["group", "order", "at", "text"],
  properties: {
    group: functionGroupSchema,
    order: functionOrderSchema,
    at: functionAtSchema,
    text: {type: "string", minLength: 1, maxLength: 80},
  },
} as const;

export const titleFunctionDefinition = {
  type: "function",
  name: "create_title_cue",
  description: "Create one title cue for an HTML group. at is the absolute episode timestamp. Supply only visible text; numbering and the selected title motion belong to the chosen template.",
  strict: true,
  parameters: titleParametersSchema,
} as const;

export const resolveTitleFunctionArgs = (
  input: TitleFunctionArgs,
): ResolvedFunctionCall<TitleSpec> => {
  const envelope = assertFunctionEnvelope(input);
  return {...envelope, spec: assertTitleSpec({text: input.text, at: 0})};
};
