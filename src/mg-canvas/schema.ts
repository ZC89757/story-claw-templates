import type {FunctionCallTiming} from "../function-call";
import {closedObject, envelopeFields, functionAtSchema, listField, localEventTime, nullableField, orderedTimes, readEnvelope, readId, readList, readText, recordOf, textField, unique} from "../authoring-contract";
import {cutoutSourceSchema} from "../subject-expansion/schema";
import {assertSubjectExpansionSource} from "../subject-expansion/validate";
import type {SubjectExpansionSource} from "../subject-expansion/types";

export type CanvasSpec = {title: string; nodes: {id: string; label: string; source: SubjectExpansionSource | null; image: string | null}[]; steps: {nodeId: string; at: number}[]; prepared?: boolean};
export const canvasParametersSchema = closedObject({
  ...envelopeFields(["path-follow", "subject-detail"]), title: textField(),
  nodes: listField(closedObject({id: textField(40), label: textField(60), source: nullableField(cutoutSourceSchema)}), 1, 12),
  steps: listField(closedObject({nodeId: textField(40), at: functionAtSchema}), 1, 32),
});
export const canvasFunctionDefinition = {type: "function", name: "create_continuous_canvas", strict: true, parameters: canvasParametersSchema,
  description: "一张连续画布上的可回访节点与固定内容窗口。与普通卡片列表不同：nodes 定义唯一对象及可选透明图，steps 以绝对 at 选择 nodeId，可多次回访同一节点而不复制对象；每个 node 至少访问一次。path-follow 跟随节点移动，subject-detail 固定首节点为主体，切换其属性窗口，两组使用同一 Schema。第一个 step.at 必须等于实例开始；后续切换需间隔至少 0.6 秒。子 MG/视频用独立嵌套标签；首次窗口立即可用，后续在 step.at+0.5 秒开放至下一 step，不填 children/slot/视频时长。"} as const;
export const resolveCanvasFunctionArgs = (input: unknown, timing: FunctionCallTiming) => {
  const envelope = readEnvelope(input, timing, ["path-follow", "subject-detail"]);
  const r = recordOf(input, ["group", "order", "title", "nodes", "steps"], "mg-canvas");
  const nodes = readList(r.nodes, "nodes", 1, 12).map((raw) => {
    const n = recordOf(raw, ["id", "label", "source"], "node");
    const source = n.source === null ? null : assertSubjectExpansionSource(n.source);
    return {id: readId(n.id, "node.id"), label: readText(n.label, "node.label", 60), source, image: source?.mode === "transparent" ? source.image : null};
  });
  unique(nodes.map((n) => n.id), "node ids");
  const steps = readList(r.steps, "steps", 1, 32).map((raw) => {
    const step = recordOf(raw, ["nodeId", "at"], "step"); const nodeId = readId(step.nodeId, "step.nodeId");
    if (!nodes.some((n) => n.id === nodeId)) throw new Error(`unknown node ${nodeId}`);
    return {nodeId, at: localEventTime(step.at, timing)};
  });
  orderedTimes(steps, true);
  if (steps[0].at !== 0) throw new Error("first canvas step must equal host start");
  if (steps.some((s, i) => i > 0 && s.at - steps[i - 1].at < 0.6 - 1e-6)) throw new Error("canvas steps need 0.6 seconds between switches");
  if (nodes.some((n) => !steps.some((s) => s.nodeId === n.id))) throw new Error("every canvas node must be visited");
  return {...envelope, spec: {title: readText(r.title, "title"), nodes, steps} satisfies CanvasSpec};
};
