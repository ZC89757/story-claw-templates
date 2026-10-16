import type {FunctionCallTiming} from "../function-call";
import {
  assertFunctionEnvelope,
  functionAtSchema,
  functionGroupSchema,
  functionOrderSchema,
  type FunctionCallEnvelope,
  type ResolvedFunctionCall,
  toLocalAt,
} from "../function-call";
import type {MetricFunctionArgs, MetricSpec} from "./types";
import {assertMetricSpec} from "./validate";

export const metricParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["group", "order", "title", "points"],
  properties: {
    group: functionGroupSchema,
    order: functionOrderSchema,
    title: {type: "string", minLength: 1, maxLength: 80},
    points: {
      type: "array",
      minItems: 1,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "value", "at"],
        properties: {
          label: {type: "string", minLength: 1, maxLength: 100},
          value: {type: "string", minLength: 1, maxLength: 100},
          at: functionAtSchema,
        },
      },
    },
  },
} as const;

export const metricFunctionDefinition = {
  type: "function",
  name: "create_metric_timeline",
  description: "Create one data/metric animation for an HTML group. Supply only labels, visible values and absolute timestamps; gauges, rolling digits, particles, colors and easing are fixed by the selected style.",
  strict: true,
  parameters: metricParametersSchema,
} as const;

export const resolveMetricFunctionArgs = (
  input: MetricFunctionArgs & FunctionCallEnvelope, timing: FunctionCallTiming,
): ResolvedFunctionCall<MetricSpec> => {
  const envelope = assertFunctionEnvelope(input, timing);
  const spec = assertMetricSpec({
    title: input.title,
    points: input.points.map((point, index) => ({
      id: `${envelope.group}-${index + 1}`,
      label: point.label,
      value: point.value,
      at: toLocalAt(point.at, envelope.at),
    })),
  });
  return {...envelope, spec};
};
