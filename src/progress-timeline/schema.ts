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
  nodes: Array<{at: number; year?: string; title: string}>;
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
        required: ["at", "year", "title"],
        properties: {
          at: functionAtSchema,
          year: {type: "string", minLength: 1, maxLength: 24},
          title: {
            type: "string",
            minLength: 1,
            maxLength: 100,
            description: "左侧说明框唯一显示的节点概述，不包含年份，请控制在50字以内。",
          },
        },
      },
    },
  },
} as const;

export const progressTimelineFunctionDefinition = {
  type: "function",
  name: "create_progress_timeline",
  description: "Create one progress-timeline animation for an HTML group. at values are absolute episode timestamps copied from the supplied timestamp file. For each node, pass year as the short year/date shown below the node (for example, '1993年'), and pass title as the single concise event overview shown in the left description panel (for example, '三位创始人共同创办英伟达'). Do not put the year into title. The template displays these values exactly as provided; node position, size, description panel, viewport behavior and motion are fixed by the template.",
  strict: true,
  parameters: progressTimelineParametersSchema,
} as const;

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
      eyebrow: node.year ?? "",
      detail: {type: "text" as const, value: node.title},
      motion: index === 0 ? "instant" as const : "ease" as const,
    })),
  });
  return {...envelope, spec};
};
