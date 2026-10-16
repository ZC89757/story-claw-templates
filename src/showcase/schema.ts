import type {FunctionCallTiming} from "../function-call";
import {
  assertFunctionEnvelope,
  functionAtSchema,
  functionGroupSchema,
  functionOrderSchema,
  type FunctionCallEnvelope,
  type ResolvedFunctionCall,
  toLocalAt,
} from "../function-call";
import type {ShowcaseFunctionArgs, ShowcaseSpec} from "./types";
import {assertShowcaseSpec} from "./validate";

export const showcaseParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["group", "order", "title", "items"],
  properties: {
    group: functionGroupSchema,
    order: functionOrderSchema,
    title: {type: "string", minLength: 1, maxLength: 80},
    items: {
      type: "array",
      minItems: 1,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["at", "text"],
        properties: {
          at: functionAtSchema,
          text: {type: "string", minLength: 1, maxLength: 100},
        },
      },
    },
  },
} as const;

export const showcaseFunctionDefinition = {
  type: "function",
  name: "create_showcase_timeline",
  description: "Create one UI/card/list showcase animation for an HTML group. Supply only visible title, item text and absolute timestamps; layout, depth, colors, easing and fixed sound design belong to the selected style.",
  strict: true,
  parameters: showcaseParametersSchema,
} as const;

export const resolveShowcaseFunctionArgs = (
  input: ShowcaseFunctionArgs & FunctionCallEnvelope, timing: FunctionCallTiming,
): ResolvedFunctionCall<ShowcaseSpec> => {
  const envelope = assertFunctionEnvelope(input, timing);
  const spec = assertShowcaseSpec({
    title: input.title,
    items: input.items.map((item, index) => ({
      id: `${envelope.group}-${index + 1}`,
      text: item.text,
      at: toLocalAt(item.at, envelope.at),
    })),
  });
  return {...envelope, spec};
};
