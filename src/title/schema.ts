export const titleParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["text", "at", "sequence"],
  properties: {
    text: {type: "string", minLength: 1, maxLength: 80},
    at: {type: "number", minimum: 0, maximum: 3600},
    sequence: {type: "integer", minimum: 1, maximum: 999},
  },
} as const;

export const titleFunctionDefinition = {
  type: "function",
  name: "create_title_cue",
  description: "Create a title cue. The selected title template starts its internally defined animation exactly at the at timestamp.",
  strict: true,
  parameters: titleParametersSchema,
} as const;
