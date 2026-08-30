import {
  assertFunctionEnvelope,
  functionAtSchema,
  functionGroupSchema,
  functionOrderSchema,
  type FunctionCallEnvelope,
  type ResolvedFunctionCall,
  toLocalAt,
} from "../function-call";
import type {EffectFunctionArgs, EffectSpec} from "./types";
import {assertEffectSpec} from "./validate";

export const effectParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["group", "order", "at", "text", "items"],
  properties: {
    group: functionGroupSchema,
    order: functionOrderSchema,
    at: functionAtSchema,
    text: {type: "string", minLength: 1, maxLength: 120},
    items: {
      type: "array",
      minItems: 1,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "at"],
        properties: {
          text: {type: "string", minLength: 1, maxLength: 120},
          at: functionAtSchema,
        },
      },
    },
  },
} as const;

export const effectFunctionDefinition = {
  type: "function",
  name: "create_effect_cue",
  description: "Create one fixed visual-effect overlay for an HTML group. Supply only an anchor text and absolute timestamps; colors, geometry, easing, intensity and fixed sound belong to the selected style. For multiple marked fragments, copy each fragment into items.",
  strict: true,
  parameters: effectParametersSchema,
} as const;

export const resolveEffectFunctionArgs = (
  input: EffectFunctionArgs & FunctionCallEnvelope,
): ResolvedFunctionCall<EffectSpec> => {
  const envelope = assertFunctionEnvelope(input);
  return {
    ...envelope,
    spec: assertEffectSpec({
      text: input.text,
      at: 0,
      ...(input.items ? {
        items: input.items.map((item) => ({
          text: item.text,
          at: toLocalAt(item.at, envelope.at),
        })),
      } : {}),
    }),
  };
};
