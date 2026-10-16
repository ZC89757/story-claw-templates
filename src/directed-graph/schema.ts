import type {FunctionCallTiming} from "../function-call";
import {
  assertFunctionEnvelope,
  functionAtSchema,
  functionGroupSchema,
  functionOrderSchema,
  FunctionCallEnvelope,
  ResolvedFunctionCall,
  toLocalAt,
} from "../function-call";
import {DirectedGraphSpec} from "./types";
import {assertDirectedGraphSpec} from "./validate";

export type DirectedGraphFunctionArgs = FunctionCallEnvelope & {
  title: string;
  nodes: Array<{id: string; label: string; at: number}>;
  edges: Array<{at: number; from: string; to: string; relation: string}>;
};

const nodeId = {type: "string", minLength: 1, maxLength: 40, pattern: "^[A-Za-z0-9_-]+$"} as const;
const nodeLabel = {type: "string", minLength: 1, maxLength: 80} as const;

export const directedGraphParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["group", "order", "title", "nodes", "edges"],
  properties: {
    group: functionGroupSchema,
    order: functionOrderSchema,
    title: {type: "string", minLength: 1, maxLength: 80},
    nodes: {
      type: "array",
      minItems: 1,
      maxItems: 40,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "at"],
        properties: {
          id: nodeId,
          label: nodeLabel,
          at: functionAtSchema,
        },
      },
    },
    edges: {
      type: "array",
      minItems: 1,
      maxItems: 40,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["at", "from", "to", "relation"],
        properties: {
          at: functionAtSchema,
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
  description: "Create one progressively revealed directed graph for an HTML group. The reviewed HTML already fixes the node and edge topology; copy those node ids, labels and edge endpoints exactly, and provide absolute episode timestamps for every node and edge. Relation text explains each fixed edge. Do not add, remove, reorder or rename topology elements.",
  strict: true,
  parameters: directedGraphParametersSchema,
} as const;

export const resolveDirectedGraphFunctionArgs = (
  input: DirectedGraphFunctionArgs, timing: FunctionCallTiming,
): ResolvedFunctionCall<DirectedGraphSpec> => {
  const envelope = assertFunctionEnvelope(input, timing);
  const spec = assertDirectedGraphSpec({
    title: input.title,
    nodes: input.nodes.map((node) => ({...node, at: toLocalAt(node.at, envelope.at)})),
    edges: input.edges.map((edge) => ({...edge, at: toLocalAt(edge.at, envelope.at)})),
  });
  return {...envelope, spec};
};
