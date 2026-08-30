import {
  assertFunctionEnvelope,
  functionAtSchema,
  functionGroupSchema,
  functionOrderSchema,
  FunctionCallEnvelope,
  ResolvedFunctionCall,
  toLocalAt,
} from "../function-call";
import {ContainmentSpec} from "./types";
import {assertContainmentSpec} from "./validate";

export type ContainmentFunctionArgs = FunctionCallEnvelope & {
  title: string;
  root: string;
  relations: Array<{at: number; parent: string; child: string}>;
  highlights: Array<{at: number; target: string}>;
};

const concept = {type: "string", minLength: 1, maxLength: 50} as const;

export const containmentParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["group", "order", "at", "title", "root", "relations", "highlights"],
  properties: {
    group: functionGroupSchema,
    order: functionOrderSchema,
    at: functionAtSchema,
    title: {type: "string", minLength: 1, maxLength: 80},
    root: concept,
    relations: {
      type: "array",
      minItems: 1,
      maxItems: 40,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["at", "parent", "child"],
        properties: {at: functionAtSchema, parent: concept, child: concept},
      },
    },
    highlights: {
      type: "array",
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["at", "target"],
        properties: {at: functionAtSchema, target: concept},
      },
    },
  },
} as const;

export const containmentFunctionDefinition = {
  type: "function",
  name: "create_containment_timeline",
  description: "Create one containment animation for an HTML group. Use absolute episode timestamps for the root animation, each parent-child relation and each optional highlight. Relation and highlight motion are fixed by their named collections; do not supply action names.",
  strict: true,
  parameters: containmentParametersSchema,
} as const;

export const resolveContainmentFunctionArgs = (
  input: ContainmentFunctionArgs,
): ResolvedFunctionCall<ContainmentSpec> => {
  const envelope = assertFunctionEnvelope(input);
  const events = [
    ...input.relations.map((relation) => ({
      action: "contain" as const,
      parent: relation.parent,
      child: relation.child,
      at: toLocalAt(relation.at, envelope.at),
    })),
    ...input.highlights.map((highlight) => ({
      action: "highlight" as const,
      target: highlight.target,
      at: toLocalAt(highlight.at, envelope.at),
    })),
  ].sort((left, right) => left.at - right.at);
  const spec = assertContainmentSpec({title: input.title, root: input.root, events});
  return {...envelope, spec};
};
