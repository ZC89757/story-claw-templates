import type {FunctionCallTiming} from "../function-call";
import {closedObject, envelopeFields, functionAtSchema, listField, localEventTime, orderedTimes, readEnvelope, readList, readNumber, readText, recordOf, textField, unique} from "../authoring-contract";

export type PartWholeSpec = {title: string; total: {label: string; value: number; unit: string}; parts: {label: string; value: number; at: number}[]};
export const partWholeParametersSchema = closedObject({
  ...envelopeFields(["pie"]), title: textField(),
  total: closedObject({label: textField(30), value: {type: "number", exclusiveMinimum: 0}, unit: textField(16)}),
  parts: listField(closedObject({label: textField(30), value: {type: "number", minimum: 0}, at: functionAtSchema}), 1, 6),
});
export const partWholeFunctionDefinition = {type: "function", name: "create_part_whole_chart", strict: true, parameters: partWholeParametersSchema,
  description: "用明确数值表现部分与整体的动态饼图。total 是统计总体，parts 是互不重叠的部分，value 与 total 使用同一 unit，合计不可超过总体；剩余扇区自动为‘其余’。不要把可重叠的设备用户当作互斥部分。各 at 为绝对秒数，整体时间由宿主决定。布局、比例与颜色由模板计算。"} as const;
export const resolvePartWholeFunctionArgs = (input: unknown, timing: FunctionCallTiming) => {
  const envelope = readEnvelope(input, timing, ["pie"]);
  const r = recordOf(input, ["group", "order", "title", "total", "parts"], "part-whole-chart");
  const total = recordOf(r.total, ["label", "value", "unit"], "total");
  const value = readNumber(total.value, "total.value", 0);
  if (!value) throw new Error("total.value must be positive");
  const parts = readList(r.parts, "parts", 1, 6).map((raw) => {
    const p = recordOf(raw, ["label", "value", "at"], "part");
    return {label: readText(p.label, "part.label", 30), value: readNumber(p.value, "part.value", 0), at: localEventTime(p.at, timing)};
  });
  unique(parts.map((part) => part.label), "part labels"); orderedTimes(parts);
  if (parts.reduce((sum, part) => sum + part.value, 0) > value + Math.max(1, value) * 1e-10) throw new Error("parts sum exceeds total");
  return {...envelope, spec: {title: readText(r.title, "title"), total: {label: readText(total.label, "total.label", 30), value, unit: readText(total.unit, "total.unit", 16)}, parts} satisfies PartWholeSpec};
};
