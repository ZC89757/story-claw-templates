import type {FunctionCallTiming} from "../function-call";
import {
  assertFunctionEnvelope,
  functionAtSchema,
  functionGroupSchema,
  functionOrderSchema,
  type FunctionCallEnvelope,
  type ResolvedFunctionCall,
} from "../function-call";
import type {RhythmFunctionArgs, RhythmSpec} from "./types";
import {assertRhythmSpec} from "./validate";

export const rhythmParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["group", "order", "text"],
  properties: {
    group: functionGroupSchema,
    order: functionOrderSchema,
    text: {type: "string", minLength: 1, maxLength: 100},
  },
} as const;

export const rhythmFunctionDefinition = {
  type: "function",
  name: "create_rhythm_cue",
  description: "Create one fixed beat/rhythm treatment at an absolute episode timestamp. Supply only a short anchor text; pulse, freeze, strobe, cadence and sound are owned by the selected style.",
  strict: true,
  parameters: rhythmParametersSchema,
} as const;

export const resolveRhythmFunctionArgs = (
  input: RhythmFunctionArgs & FunctionCallEnvelope, timing: FunctionCallTiming,
): ResolvedFunctionCall<RhythmSpec> => {
  const envelope = assertFunctionEnvelope(input, timing);
  return {...envelope, spec: assertRhythmSpec({text: input.text, at: 0})};
};
