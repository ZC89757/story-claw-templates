import type {FunctionCallTiming} from "../function-call";
import {closedObject, envelopeFields, functionAtSchema, listField, nullableField, textField, recordOf, readText, readId, readList, readNumber, readEnvelope, localEventTime, orderedTimes, unique} from "../authoring-contract";
import {sourceSchema, readSource, type DocumentarySource} from "./source";

export type VisualAsset = {source: DocumentarySource; image: string | null};
export type ProductionStage = VisualAsset & {id: string; label: string; actorId: string; parts: (VisualAsset & {appearAt: number; mergeAt: number})[]; at: number};
export type ProductionSpec = {title: string; actors: {id: string; label: string}[]; stages: ProductionStage[]; links: {from: string; to: string; at: number}[]; prepared?: boolean};
const asset = (raw: unknown): VisualAsset => {const source = readSource(raw); return {source, image: source.method === "existing" ? source.image : null};};
export const productionFunctionDefinition = {
  type: "function", name: "create_production_chain", strict: true,
  description: "通用分工流程，银灰立体陈列与蓝红流转。内容与图像均由参数提供，无内置公司或行业。actors 为参与方，stages 为按口播出现的环节，links 必须是真实方向关系。source.method=existing 读取 image，generate 按 prompt 调用生图。background.transparent=true 确保去背景，false 保留背景；底色和处理方法由代码决定。parts 可为空，每项有 source、appearAt、mergeAt；出现时间不能早于所属 stage.at，mergeAt 至少晚0.5秒且距结束留0.8秒。部件从主体旁边移到主体后面被遮住，不表达精确机械安装位置。第一个 stage.at 等于宿主开始，相邻阶段至少间隔1.2秒。所有 at、appearAt、mergeAt 是整集绝对时间。模型不填写布局、颜色、坐标。",
  parameters: closedObject({...envelopeFields(["production-chain"]), title: textField(28),
    actors: listField(closedObject({id: textField(40), label: textField(18)}), 1, 4),
    stages: listField(closedObject({id: textField(40), label: textField(24), actorId: textField(40), source: sourceSchema, parts: listField(closedObject({source: sourceSchema, appearAt: functionAtSchema, mergeAt: functionAtSchema}), 0, 3), at: functionAtSchema}), 2, 6),
    links: listField(closedObject({from: textField(40), to: textField(40), at: functionAtSchema}), 1, 12),
  }),
} as const;
export const resolveProduction = (input: unknown, timing: FunctionCallTiming) => {
  const envelope = readEnvelope(input, timing, ["production-chain"]);
  const r = recordOf(input, ["group", "order", "title", "actors", "stages", "links"], "production-chain");
  const actors = readList(r.actors, "actors", 1, 4).map(raw => {const a = recordOf(raw, ["id", "label"], "actor"); return {id: readId(a.id, "actor.id"), label: readText(a.label, "actor.label", 18)};});
  unique(actors.map(a => a.id), "actor ids");
  const stages = readList(r.stages, "stages", 2, 6).map(raw => {
    const s = recordOf(raw, ["id", "label", "actorId", "source", "parts", "at"], "stage");
    const actorId = readId(s.actorId, "actorId"); if (!actors.some(a => a.id === actorId)) throw new Error("Unknown actorId");
    return {id: readId(s.id, "stage.id"), label: readText(s.label, "stage.label", 24), actorId, ...asset(s.source), parts: readList(s.parts, "parts", 0, 3).map(raw => {
      const p = recordOf(raw, ["source", "appearAt", "mergeAt"], "part");
      const appearAt = localEventTime(p.appearAt, timing), mergeAt = localEventTime(p.mergeAt, timing);
      if (appearAt < localEventTime(s.at, timing) || mergeAt < appearAt + .5 || mergeAt + .8 > timing.end - timing.start) throw new Error("Part needs stage.at <= appearAt, 0.5s before mergeAt and 0.8s to complete fusion");
      if (!readSource(s.source).background.transparent) throw new Error("Parts require a transparent subject for occlusion");
      return {...asset(p.source), appearAt, mergeAt};
    }), at: localEventTime(s.at, timing)};
  });
  unique(stages.map(s => s.id), "stage ids"); orderedTimes(stages, true);
  if (stages[0].at !== 0 || stages.some((s, i) => i > 0 && s.at - stages[i - 1].at < 1.2)) throw new Error("First stage must start with host; stages need 1.2 seconds apart");
  if (actors.some(a => !stages.some(s => s.actorId === a.id))) throw new Error("Unused actor");
  const links = readList(r.links, "links", 1, 12).map(raw => {
    const e = recordOf(raw, ["from", "to", "at"], "link"), from = readId(e.from, "link.from"), to = readId(e.to, "link.to"), at = localEventTime(e.at, timing);
    const a = stages.findIndex(s => s.id === from), b = stages.findIndex(s => s.id === to);
    if (a < 0 || b < 0 || a >= b) throw new Error("Production links require existing stages in forward order; use a general graph for cycles");
    if (at < Math.max(stages[a].at, stages[b].at)) throw new Error("Link cannot precede its stages");
    return {from, to, at};
  });
  unique(links.map(l => `${l.from}:${l.to}`), "links"); orderedTimes(links);
  return {...envelope, spec: {title: readText(r.title, "title", 28), actors, stages, links} satisfies ProductionSpec};
};

export type Qualifier = "exact" | "approx" | "at-most" | "at-least" | "greater-than" | "less-than";
export type NumericSide = {label: string; source: DocumentarySource | null; image: string | null; value: number; qualifier: Qualifier; caption: string | null; at: number};
export type NumericSpec = {title: string; unit: string; mode: "absolute" | "relative"; left: NumericSide; right: NumericSide; unitsPerMark: number | null; prepared?: boolean};
const qualifiers: Qualifier[] = ["exact", "approx", "at-most", "at-least", "greater-than", "less-than"];
const sideSchema = closedObject({label: textField(24), source: nullableField(sourceSchema), value: {type: "number", minimum: 0}, qualifier: {type: "string", enum: qualifiers}, caption: nullableField(textField(32)), at: functionAtSchema});
export const numericFunctionDefinition = {
  type: "function", name: "create_numeric_comparison", strict: true,
  description: "通用数值比较。editorial-scale 使用两张明确主体图与比例条，editorial-counts 使用数量阵列。absolute 两侧必须同口径同单位；relative 左侧是基准数值，右侧 value 是相对左侧的倍数，仅显示倍数，不反推精确价格。qualifier 明确约数/上下界，边界值不画精确比例。counts 的 unitsPerMark 表示每格单位数，部分格按比例绘制，最多150格；scale 填 null。图片无默认车型；source.method=existing 读取 image，generate 按 prompt 生图；background.transparent=true 自动去背景，false 保留背景。左侧 at 等于宿主开始，右侧至少晚1.2秒；不提供配色或坐标。",
  parameters: closedObject({...envelopeFields(["editorial-scale", "editorial-counts"]), title: textField(28), unit: textField(10), mode: {type: "string", enum: ["absolute", "relative"]}, left: sideSchema, right: sideSchema, unitsPerMark: nullableField({type: "number", exclusiveMinimum: 0})}),
} as const;
export const resolveNumeric = (input: unknown, timing: FunctionCallTiming) => {
  const envelope = readEnvelope(input, timing, ["editorial-scale", "editorial-counts"]);
  const r = recordOf(input, ["group", "order", "title", "unit", "mode", "left", "right", "unitsPerMark"], "numeric-comparison");
  if (r.mode !== "absolute" && r.mode !== "relative") throw new Error("Invalid comparison mode");
  const side = (raw: unknown): NumericSide => {
    const s = recordOf(raw, ["label", "source", "value", "qualifier", "caption", "at"], "side");
    if (!qualifiers.includes(s.qualifier as Qualifier)) throw new Error("Invalid qualifier");
    return {label: readText(s.label, "label", 24), ...(s.source === null ? {source: null, image: null} : asset(s.source)), value: readNumber(s.value, "value", 0), qualifier: s.qualifier as Qualifier, caption: s.caption === null ? null : readText(s.caption, "caption", 32), at: localEventTime(s.at, timing)};
  };
  const left = side(r.left), right = side(r.right);
  if (left.at !== 0 || right.at - left.at < 1.2) throw new Error("Left starts with host; right needs 1.2 seconds separation");
  if (r.mode === "relative" && (left.value <= 0 || left.qualifier !== "exact")) throw new Error("Relative comparison requires a positive exact baseline");
  let unitsPerMark: number | null = null;
  if (envelope.group === "editorial-counts") {
    unitsPerMark = readNumber(r.unitsPerMark, "unitsPerMark", Number.MIN_VALUE);
    if (r.mode !== "absolute" || left.source !== null || right.source !== null) throw new Error("Counts require absolute quantities and null images");
    if (Math.max(left.value, right.value) / unitsPerMark > 150) throw new Error("Counts exceed 150 marks; increase unitsPerMark");
  } else if (r.unitsPerMark !== null || !left.source || !right.source) throw new Error("Scale requires two images and null unitsPerMark");
  return {...envelope, spec: {title: readText(r.title, "title", 28), unit: readText(r.unit, "unit", 10), mode: r.mode, left, right, unitsPerMark} satisfies NumericSpec};
};

export const numericLabel = (s: NumericSide) => ({exact: "", approx: "约", "at-most": "≤", "at-least": "≥", "greater-than": ">", "less-than": "<"}[s.qualifier]) + s.value.toLocaleString("en-US", {maximumFractionDigits: 6});
export const comparisonFractions = (spec: NumericSpec): [number, number] | null => {
  if ([spec.left, spec.right].some(s => !["exact", "approx"].includes(s.qualifier))) return null;
  const values = spec.mode === "relative" ? [1, spec.right.value] : [spec.left.value, spec.right.value];
  const max = Math.max(...values); return max === 0 ? [0, 0] : [values[0] / max, values[1] / max];
};
