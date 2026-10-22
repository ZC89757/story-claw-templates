import type {FunctionCallTiming} from "../function-call";
import {closedObject, envelopeFields, functionAtSchema, listField, localEventTime, orderedTimes, readEnvelope, readList, readText, recordOf, textField} from "../authoring-contract";
import {cutoutSourceSchema} from "../subject-expansion/schema";
import {assertSubjectExpansionSource} from "../subject-expansion/validate";
import type {SubjectExpansionSource} from "../subject-expansion/types";

type Side = "left" | "right";
type ImageSide = {label: string; source: SubjectExpansionSource; image: string};
export type ImageComparisonSpec = {title: string; left: ImageSide; right: ImageSide; items: {side: Side; text: string; at: number}[]; highlights: {side: Side; at: number}[]; prepared?: boolean};
const side = {type: "string", enum: ["left", "right"]};
const subject = closedObject({label: textField(30), source: cutoutSourceSchema});
export const imageComparisonParametersSchema = closedObject({
  ...envelopeFields(["split-panel", "editorial-paper"]), title: textField(), left: subject, right: subject,
  items: listField(closedObject({side, text: textField(60), at: functionAtSchema}), 2, 12),
  highlights: listField(closedObject({side, at: functionAtSchema}), 0, 12),
});
export const imageComparisonFunctionDefinition = {type: "function", name: "create_image_comparison", strict: true, parameters: imageComparisonParametersSchema,
  description: "同一维度的左右图文对照：两侧各一个透明图主体、短标签、逐步出现的说明，已出现内容保留。不同于旧纯文字对照，本函数明确接受左右图片 source。源图不得含文字，抽象图为示意，不能伪造真实界面或量化大小。generate 只填主体 prompt，模板附带风格参考并自动生图抠图；transparent 使用已有透明图。items/highlights.at 均为绝对秒数。不能拿同一业务的机会与约束硬作两个对立主体。"} as const;
export const resolveImageComparisonFunctionArgs = (input: unknown, timing: FunctionCallTiming) => {
  const envelope = readEnvelope(input, timing, ["split-panel", "editorial-paper"]);
  const r = recordOf(input, ["group", "order", "title", "left", "right", "items", "highlights"], "image-side-by-side");
  const readSide = (raw: unknown): ImageSide => {const s = recordOf(raw, ["label", "source"], "image subject"); const source = assertSubjectExpansionSource(s.source); return {label: readText(s.label, "subject.label", 30), source, image: source.mode === "transparent" ? source.image : ""};};
  const readSideName = (value: unknown): Side => {if (value !== "left" && value !== "right") throw new Error("side must be left or right"); return value;};
  const items = readList(r.items, "items", 2, 12).map((raw) => {const p = recordOf(raw, ["side", "text", "at"], "item"); return {side: readSideName(p.side), text: readText(p.text, "item.text", 60), at: localEventTime(p.at, timing)};});
  const highlights = readList(r.highlights, "highlights", 0, 12).map((raw) => {const p = recordOf(raw, ["side", "at"], "highlight"); return {side: readSideName(p.side), at: localEventTime(p.at, timing)};});
  orderedTimes(items); orderedTimes(highlights);
  if (!["left", "right"].every((side) => items.some((p) => p.side === side))) throw new Error("both comparison sides need an item");
  for (const h of highlights) if (!items.some((p) => p.side === h.side && p.at <= h.at)) throw new Error("cannot highlight a side before it appears");
  return {...envelope, spec: {title: readText(r.title, "title"), left: readSide(r.left), right: readSide(r.right), items, highlights} satisfies ImageComparisonSpec};
};
