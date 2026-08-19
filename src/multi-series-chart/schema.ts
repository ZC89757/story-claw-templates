export const multiSeriesChartParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["chartType", "title", "xAxis", "yAxis", "series"],
  properties: {
    chartType: {type: "string", enum: ["bar", "line"]},
    title: {type: "string", minLength: 1, maxLength: 80},
    xAxis: {
      type: "object",
      additionalProperties: false,
      required: ["label", "categories"],
      properties: {
        label: {type: "string", maxLength: 40},
        categories: {type: "array", minItems: 1, maxItems: 16, items: {type: "string", minLength: 1, maxLength: 30}},
      },
    },
    yAxis: {
      type: "object",
      additionalProperties: false,
      required: ["min", "max", "label", "unit", "ticks"],
      properties: {
        min: {type: "number"}, max: {type: "number"},
        label: {type: "string", maxLength: 40}, unit: {type: "string", maxLength: 20},
        ticks: {type: "integer", minimum: 2, maximum: 12},
      },
    },
    series: {
      type: "array", minItems: 1, maxItems: 8,
      items: {
        type: "object", additionalProperties: false, required: ["name", "data"],
        properties: {
          name: {type: "string", minLength: 1, maxLength: 40},
          data: {
            type: "array", minItems: 1, maxItems: 16,
            items: {
              type: "object", additionalProperties: false, required: ["at", "value"],
              properties: {at: {type: "number", minimum: 0, maximum: 3600}, value: {type: "number"}},
            },
          },
        },
      },
    },
  },
} as const;

export const multiSeriesChartFunctionDefinition = {
  type: "function",
  name: "create_multi_series_chart",
  description: "Create a multi-series bar or line chart. Each datum starts animating exactly at its at timestamp; chartType is the only rendering-mode parameter.",
  strict: true,
  parameters: multiSeriesChartParametersSchema,
} as const;
