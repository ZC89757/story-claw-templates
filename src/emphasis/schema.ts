export const emphasisParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["text", "at"],
  properties: {
    text: {type: "string", minLength: 1, maxLength: 16},
    at: {type: "number", minimum: 0, maximum: 3600},
  },
} as const;

export const emphasisFunctionDefinition = {
  type: "function",
  name: "create_emphasis_text_cue",
  description: "Create a large emphasis text cue that starts sliding upward exactly at the at timestamp.",
  strict: true,
  parameters: emphasisParametersSchema,
} as const;
