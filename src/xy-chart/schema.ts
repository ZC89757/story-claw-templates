/**
 * Plain JSON Schema. It deliberately has no SDK dependency so Story Claw can
 * pass it to any LLM provider that supports function calling or structured output.
 */
export const xyChartParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "axes", "keyframes"],
  properties: {
    title: {type: "string", minLength: 1, maxLength: 80},
    axes: {
      type: "object",
      additionalProperties: false,
      required: ["x", "y"],
      properties: {
        x: {$ref: "#/$defs/axis"},
        y: {$ref: "#/$defs/axis"},
      },
    },
    keyframes: {
      type: "array",
      minItems: 1,
      maxItems: 80,
      items: {$ref: "#/$defs/keyframe"},
    },
  },
  $defs: {
    axis: {
      type: "object",
      additionalProperties: false,
      required: ["min", "max", "label", "unit", "ticks"],
      properties: {
        min: {type: "number"},
        max: {type: "number"},
        label: {type: "string", minLength: 1, maxLength: 40},
        unit: {type: "string", maxLength: 20},
        ticks: {type: "integer", minimum: 2, maximum: 12},
      },
    },
    keyframe: {
      type: "object",
      additionalProperties: false,
      required: ["at", "x", "y", "label", "motion"],
      properties: {
        at: {type: "number", minimum: 0, maximum: 3600},
        x: {type: "number"},
        y: {type: "number"},
        label: {type: "string", minLength: 1, maxLength: 80},
        motion: {type: "string", enum: ["ease", "instant"]},
      },
    },
  },
} as const;

export const xyChartFunctionDefinition = {
  type: "function",
  name: "create_xy_chart_timeline",
  description: "Create a timed two-dimensional chart. Each keyframe's at value is the exact second at which the chart point must reach its x/y coordinate. Use only values supported by the supplied source text and TTS word timestamps.",
  strict: true,
  parameters: xyChartParametersSchema,
} as const;
