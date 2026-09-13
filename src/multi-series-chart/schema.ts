import {
  assertFunctionEnvelope,
  autoAxis,
  functionAtSchema,
  functionGroupSchema,
  functionOrderSchema,
  FunctionCallEnvelope,
  ResolvedFunctionCall,
  toLocalAt,
} from "../function-call";
import {MultiSeriesChartSpec} from "./types";
import {assertMultiSeriesChartSpec} from "./validate";

export type MultiSeriesChartFunctionArgs = FunctionCallEnvelope & {
  title: string;
  xAxis: {label: string; categories: string[]};
  yAxis: {label: string; unit: string};
  series: Array<{
    name: string;
    data: Array<{category: string; at: number; value: number}>;
  }>;
};

export const multiSeriesChartParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["group", "order", "at", "title", "xAxis", "yAxis", "series"],
  properties: {
    group: functionGroupSchema,
    order: functionOrderSchema,
    at: functionAtSchema,
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
      required: ["label", "unit"],
      properties: {
        label: {type: "string", maxLength: 40},
        unit: {type: "string", maxLength: 20},
      },
    },
    series: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "data"],
        properties: {
          name: {type: "string", minLength: 1, maxLength: 40},
          data: {
            type: "array",
            minItems: 1,
            maxItems: 16,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["category", "at", "value"],
              properties: {
                category: {type: "string", minLength: 1, maxLength: 30},
                at: functionAtSchema,
                value: {type: "number"},
              },
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
  description: "Create one multi-series chart animation for an HTML group. Copy the HTML group unchanged and use absolute episode timestamps for the root and every datum. Supply visible data and axis meaning only; bar or line rendering, category placement, bounds, ticks and motion are determined by the template group. If the HTML lacks concrete numbers but names identifiable entities and a meaningful comparison, call search_web first and use only reliable, unit-consistent public data; never invent values or add source fields to this strict schema.",
  strict: true,
  parameters: multiSeriesChartParametersSchema,
} as const;

export const resolveMultiSeriesChartFunctionArgs = (
  input: MultiSeriesChartFunctionArgs,
): ResolvedFunctionCall<MultiSeriesChartSpec> => {
  const envelope = assertFunctionEnvelope(input);
  const categories = input.xAxis.categories;
  if (new Set(categories).size !== categories.length) throw new Error("xAxis categories must be unique");
  const allValues = input.series.flatMap((series) => series.data.map((datum) => datum.value));
  const yAxis = autoAxis(allValues);
  const spec = assertMultiSeriesChartSpec({
    title: input.title,
    xAxis: input.xAxis,
    yAxis: {...yAxis, ...input.yAxis},
    series: input.series.map((series) => {
      const byCategory = new Map(series.data.map((datum) => [datum.category, datum]));
      if (byCategory.size !== series.data.length) throw new Error(`series ${series.name} contains duplicate categories`);
      return {
        name: series.name,
        data: categories.map((category) => {
          const datum = byCategory.get(category);
          if (!datum) throw new Error(`series ${series.name} is missing category ${category}`);
          return {value: datum.value, at: toLocalAt(datum.at, envelope.at)};
        }),
      };
    }),
  });
  return {...envelope, spec};
};
