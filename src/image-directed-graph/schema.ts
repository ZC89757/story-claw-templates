import type {FunctionCallTiming} from "../function-call";
import {closedObject, envelopeFields, functionAtSchema, listField, localEventTime, nullableField, orderedTimes, readEnvelope, readId, readList, readText, recordOf, textField, unique} from "../authoring-contract";
import {cutoutSourceSchema} from "../subject-expansion/schema";
import {assertSubjectExpansionSource} from "../subject-expansion/validate";
import type {SubjectExpansionSource} from "../subject-expansion/types";
export type ImageGraphSpec = {title: string; nodes: {id: string; label: string; source: SubjectExpansionSource | null; image: string | null; at: number}[]; edges: {from: string; to: string; relation: string; at: number}[]; prepared?: boolean};
export const imageGraphParametersSchema = closedObject({
  ...envelopeFields(["flow", "editorial", "editorial-paper"]), title: textField(),
  nodes: listField(closedObject({id: textField(40), label: textField(40), source: nullableField(cutoutSourceSchema), at: functionAtSchema}), 2, 10),
  edges: listField(closedObject({from: textField(40), to: textField(40), relation: textField(32), at: functionAtSchema}), 1, 24),
});
export const imageGraphFunctionDefinition = {type: "function", name: "create_image_directed_graph", strict: true, parameters: imageGraphParametersSchema,
  description: "图文有向关系图：节点含明确透明图片来源和短名称，边含明确关系和绝对时间。区别于纯文字图与只扫描 Logo 的拼贴网络，允许给任意具体物体或人物提供真实抠图。按已审核拓扑填写，不增删边；source=null 用于无需具象图的抽象节点。图片不含文字，不伪造量化大小。边不能早于两端节点，不能把希望形成的过程画成已经盈利。generate 只填主体 prompt，模板附带风格参考并自动生图抠图；transparent 使用已有透明图。"} as const;
export const resolveImageGraphFunctionArgs = (input: unknown, timing: FunctionCallTiming) => {
  const envelope = readEnvelope(input, timing, ["flow", "editorial", "editorial-paper"]);
  const r = recordOf(input, ["group", "order", "title", "nodes", "edges"], "image-directed-graph");
  const nodes = readList(r.nodes, "nodes", 2, 10).map((raw) => {
    const n = recordOf(raw, ["id", "label", "source", "at"], "node"); const source = n.source === null ? null : assertSubjectExpansionSource(n.source);
    return {id: readId(n.id, "node.id"), label: readText(n.label, "node.label", 40), source, image: source?.mode === "transparent" ? source.image : null, at: localEventTime(n.at, timing)};
  }); unique(nodes.map((n) => n.id), "node ids");
  const edges = readList(r.edges, "edges", 1, 24).map((raw) => {
    const e = recordOf(raw, ["from", "to", "relation", "at"], "edge");
    const from = readId(e.from, "edge.from"); const to = readId(e.to, "edge.to"); const at = localEventTime(e.at, timing);
    if (from === to) throw new Error("graph self edges are not supported");
    for (const id of [from, to]) {const node = nodes.find((n) => n.id === id); if (!node) throw new Error(`unknown node ${id}`); if (node.at > at) throw new Error("edge cannot precede its nodes");}
    return {from, to, relation: readText(e.relation, "edge.relation", 32), at};
  }); unique(edges.map((e) => `${e.from}::${e.to}`), "directed edges"); orderedTimes(nodes); orderedTimes(edges);
  return {...envelope, spec: {title: readText(r.title, "title"), nodes, edges} satisfies ImageGraphSpec};
};
