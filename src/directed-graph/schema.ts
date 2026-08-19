export const directedGraphParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["edges"],
  properties: {
    edges: {
      type: "array",
      minItems: 1,
      maxItems: 40,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["at", "from", "to", "relation"],
        properties: {
          at: {type: "number", minimum: 0, maximum: 3600},
          from: {type: "string", minLength: 1, maxLength: 50},
          to: {type: "string", minLength: 1, maxLength: 50},
          relation: {type: "string", minLength: 1, maxLength: 80},
        },
      },
    },
  },
} as const;

export const directedGraphFunctionDefinition = {
  type: "function",
  name: "create_directed_graph_timeline",
  description: "Create a progressively revealed directed graph. Each edge starts drawing exactly at its at timestamp; the target node is revealed only after the arrow is drawn.",
  strict: true,
  parameters: directedGraphParametersSchema,
} as const;
