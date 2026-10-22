import type {FunctionCallTiming} from "../function-call";
import {autoAxis} from "../function-call";
import {closedObject, envelopeFields, functionAtSchema, listField, localEventTime, orderedTimes, readEnvelope, readList, readNumber, readText, recordOf, textField, unique} from "../authoring-contract";

type Axis = {label: string; unit: string; min: number; max: number; ticks: number};
export type DualAxisSpec = {title: string; categories: string[]; leftAxis: Axis; rightAxis: Axis; series: {name: string; axis: "left" | "right"; data: {value: number; at: number}[]}[]};
const axisSchema = closedObject({label: textField(40), unit: textField(16)});
export const dualAxisParametersSchema = closedObject({
  ...envelopeFields(["line-overlay", "editorial-overlay"]), title: textField(), categories: listField(textField(30), 2, 16),
  leftAxis: axisSchema, rightAxis: axisSchema,
  series: listField(closedObject({name: textField(40), axis: {type: "string", enum: ["left", "right"]}, data: listField(closedObject({category: textField(30), value: {type: "number"}, at: functionAtSchema}), 2, 16)}), 2, 2),
});
export const dualAxisFunctionDefinition = {type: "function", name: "create_dual_axis_chart", strict: true, parameters: dualAxisParametersSchema,
  description: "透明双轴折线叠加层，用两条线展示单位不同的两组数据。series 分别绑定 left/right，独立计算轴尺度，必须明确两个单位，不可把线高低或斜率当作同量纲比较。categories 为共同时间分类，datum.at 为绝对秒数。不要补造缺失数值，禁止把百分比增长率与人数混成一根线。"} as const;
export const resolveDualAxisFunctionArgs = (input: unknown, timing: FunctionCallTiming) => {
  const envelope = readEnvelope(input, timing, ["line-overlay", "editorial-overlay"]);
  const r = recordOf(input, ["group", "order", "title", "categories", "leftAxis", "rightAxis", "series"], "dual-axis-chart");
  const categories = readList(r.categories, "categories", 2, 16).map((v) => readText(v, "category", 30)); unique(categories, "categories");
  const series = readList(r.series, "series", 2, 2).map((raw) => {
    const s = recordOf(raw, ["name", "axis", "data"], "series");
    if (s.axis !== "left" && s.axis !== "right") throw new Error("axis must be left or right");
    const points = readList(s.data, "data", categories.length, categories.length).map((rawPoint) => {
      const p = recordOf(rawPoint, ["category", "value", "at"], "datum");
      return {category: readText(p.category, "category", 30), value: readNumber(p.value, "value"), at: localEventTime(p.at, timing)};
    });
    unique(points.map((p) => p.category), "data categories");
    const data = categories.map((category) => {const p = points.find((point) => point.category === category); if (!p) throw new Error(`missing category ${category}`); return {at: p.at, value: p.value};});
    orderedTimes(data);
    return {name: readText(s.name, "series.name", 40), axis: s.axis as "left" | "right", data};
  });
  unique(series.map((s) => s.axis), "axis assignments"); unique(series.map((s) => s.name), "series names");
  const axis = (raw: unknown, side: "left" | "right"): Axis => {
    const a = recordOf(raw, ["label", "unit"], "axis");
    const label = readText(a.label, "axis.label", 40); const unit = readText(a.unit, "axis.unit", 16);
    const values = series.find((s) => s.axis === side)!.data.map((p) => p.value);
    if (unit === "%" && values.some((v) => v < 0 || v > 100)) throw new Error("percentage values must be within 0..100");
    return {label, unit, ...(unit === "%" ? {min: 0, max: 100, ticks: 6} : autoAxis(values))};
  };
  return {...envelope, spec: {title: readText(r.title, "title"), categories, leftAxis: axis(r.leftAxis, "left"), rightAxis: axis(r.rightAxis, "right"), series} satisfies DualAxisSpec};
};
