import {
  assertFunctionEnvelope,
  functionAtSchema,
  functionGroupSchema,
  functionOrderSchema,
  FunctionCallEnvelope,
  ResolvedFunctionCall,
  toLocalAt,
} from "../function-call";
import {ProgressTimelineSpec} from "./types";
import {assertProgressTimelineSpec} from "./validate";

export type ProgressTimelineFunctionArgs = FunctionCallEnvelope & {
  title: string;
  nodes: Array<{at: number; title: string}>;
};

export const progressTimelineParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["group", "order", "at", "title", "nodes"],
  properties: {
    group: functionGroupSchema,
    order: functionOrderSchema,
    at: functionAtSchema,
    title: {type: "string", minLength: 1, maxLength: 80},
    nodes: {
      type: "array",
      minItems: 2,
      maxItems: 60,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["at", "title"],
        properties: {
          at: functionAtSchema,
          title: {type: "string", minLength: 1, maxLength: 100},
        },
      },
    },
  },
} as const;

export const progressTimelineFunctionDefinition = {
  type: "function",
  name: "create_progress_timeline",
  description: "Create one progress-timeline animation for an HTML group. at values are absolute episode timestamps copied from the supplied timestamp file. Provide only the visible title and timed node titles; node position, size, detail panel, camera behavior and motion are fixed by the template.",
  strict: true,
  parameters: progressTimelineParametersSchema,
} as const;

const nodeLabel = (title: string, index: number) => title.match(/\d{4}年?/)?.[0] ?? `节点 ${index + 1}`;

export const resolveProgressTimelineFunctionArgs = (
  input: ProgressTimelineFunctionArgs,
): ResolvedFunctionCall<ProgressTimelineSpec> => {
  const envelope = assertFunctionEnvelope(input);
  const count = input.nodes.length;
  const spec = assertProgressTimelineSpec({
    title: input.title,
    subtitle: "",
    followViewport: true,
    nodes: input.nodes.map((node, index) => ({
      id: `${envelope.group}-${index + 1}`,
      at: toLocalAt(node.at, envelope.at),
      progress: count === 1 ? 0 : index / (count - 1) * 100,
      kind: "major" as const,
      title: node.title,
      eyebrow: nodeLabel(node.title, index),
      detail: {type: "text" as const, value: node.title},
      motion: index === 0 ? "instant" as const : "ease" as const,
    })),
  });
  return {...envelope, spec};
};
