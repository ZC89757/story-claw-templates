export const progressTimelineParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "subtitle", "followViewport", "nodes"],
  properties: {
    title: {type: "string", minLength: 1, maxLength: 80},
    subtitle: {type: "string", maxLength: 120},
    followViewport: {type: "boolean"},
    nodes: {
      type: "array",
      minItems: 2,
      maxItems: 60,
      items: {$ref: "#/$defs/node"},
    },
  },
  $defs: {
    detail: {
      type: "object",
      additionalProperties: false,
      required: ["type", "value", "src", "caption"],
      properties: {
        type: {type: "string", enum: ["text", "image", "video"]},
        value: {type: "string", maxLength: 180},
        src: {type: "string", maxLength: 500},
        caption: {type: "string", maxLength: 100},
      },
    },
    node: {
      type: "object",
      additionalProperties: false,
      required: ["id", "at", "progress", "kind", "title", "eyebrow", "detail", "motion"],
      properties: {
        id: {type: "string", minLength: 1, maxLength: 40},
        at: {type: "number", minimum: 0, maximum: 3600},
        progress: {type: "number", minimum: 0, maximum: 100},
        kind: {type: "string", enum: ["major", "minor"]},
        title: {type: "string", minLength: 1, maxLength: 80},
        eyebrow: {type: "string", maxLength: 40},
        detail: {$ref: "#/$defs/detail"},
        motion: {type: "string", enum: ["ease", "instant"]},
      },
    },
  },
} as const;

export const progressTimelineFunctionDefinition = {
  type: "function",
  name: "create_progress_timeline",
  description: "Create a timed progress timeline with major and minor nodes. A node starts moving at its scene-local at second. It remains still before at; movement duration is controlled internally by the template.",
  strict: true,
  parameters: progressTimelineParametersSchema,
} as const;
