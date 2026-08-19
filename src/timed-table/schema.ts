export const timedTableParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["size", "cells"],
  properties: {
    size: {
      type: "object",
      additionalProperties: false,
      required: ["rows", "columns"],
      properties: {
        rows: {type: "integer", minimum: 1, maximum: 10},
        columns: {type: "integer", minimum: 1, maximum: 8},
      },
    },
    cells: {
      type: "array",
      minItems: 1,
      maxItems: 80,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["at", "text"],
        properties: {
          at: {type: "number", minimum: 0, maximum: 3600},
          text: {type: "string", maxLength: 160},
        },
      },
    },
  },
} as const;

export const timedTableFunctionDefinition = {
  type: "function",
  name: "create_timed_table",
  description: "Create a fully visible empty table whose row-major cell texts appear only when each cell's at timestamp is reached.",
  strict: true,
  parameters: timedTableParametersSchema,
} as const;
