import type {FunctionCallTiming} from "../function-call";
import {
  assertFunctionEnvelope,
  functionAtSchema,
  functionGroupSchema,
  functionOrderSchema,
  type FunctionCallEnvelope,
  type ResolvedFunctionCall,
} from "../function-call";
import type {TransitionFunctionArgs, TransitionSpec} from "./types";
import {assertTransitionSpec} from "./validate";

export const transitionParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["group", "order", "text"],
  properties: {
    group: functionGroupSchema,
    order: functionOrderSchema,
    text: {type: "string", minLength: 1, maxLength: 100},
  },
} as const;

export const transitionFunctionDefinition = {
  type: "function",
  name: "create_transition_cue",
  description: "Create one fixed transition overlay at an absolute episode timestamp. Supply only a short anchor text; wipe geometry, direction, intensity, duration and sound are owned by the selected style.",
  strict: true,
  parameters: transitionParametersSchema,
} as const;

export const resolveTransitionFunctionArgs = (
  input: TransitionFunctionArgs & FunctionCallEnvelope, timing: FunctionCallTiming,
): ResolvedFunctionCall<TransitionSpec> => {
  const envelope = assertFunctionEnvelope(input, timing);
  return {...envelope, spec: assertTransitionSpec({text: input.text, at: 0})};
};
