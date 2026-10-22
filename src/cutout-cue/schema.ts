import {assertFunctionEnvelope, functionAtSchema, functionOrderSchema, toLocalAt, type FunctionCallTiming} from "../function-call";
import {assertMgCutoutRiseSpec} from "../mg-cutout/validate";
import type {MgCutoutSource} from "../mg-cutout/types";

export type CutoutCueItem = {at: number; label: string | null; source: MgCutoutSource; image: string};
export type CutoutCueSpec = {items: CutoutCueItem[]; prepared?: boolean};
export const CUTOUT_CUE_GROUPS = ["duo", "pop", "duo-landscape", "pop-landscape"] as const;
export const cutoutCueMode = (group: string): "duo" | "pop" => group.startsWith("duo") ? "duo" : "pop";
const nullableText = (maxLength: number) => ({anyOf: [{type: "string", minLength: 1, maxLength}, {type: "null"}]} as const);
export const cutoutCueFunctionDefinition = {
  type: "function", name: "create_cutout_cues", strict: true,
  description: "Create transparent cutouts on an existing image or video. duo: exactly two people appear left then right at their spoken names and stay. pop: logos or objects pop at the center at each cue and leave after a short fixed hold. Reuses the existing transparent/chroma/reference-generation source pipeline. No background or visual tuning parameters.",
  parameters: {
    type: "object", additionalProperties: false, required: ["group", "order", "items"],
    properties: {
      group: {type: "string", enum: CUTOUT_CUE_GROUPS}, order: functionOrderSchema,
      items: {type: "array", minItems: 1, maxItems: 8, items: {
        type: "object", additionalProperties: false, required: ["at", "label", "source"],
        properties: {
          at: functionAtSchema, label: nullableText(32),
          source: {
            type: "object", additionalProperties: false, required: ["mode", "image", "subject", "references"],
            properties: {
              mode: {type: "string", enum: ["transparent", "chroma", "generate"]},
              image: nullableText(2000), subject: nullableText(160),
              references: {type: "array", maxItems: 3, items: {type: "string", minLength: 1, maxLength: 2000}},
            },
          },
        },
      }},
    },
  },
} as const;

export const assertCutoutCueSpec = (input: unknown): CutoutCueSpec => {
  const spec=input as CutoutCueSpec;
  if (!spec || !Array.isArray(spec.items) || !spec.items.length || spec.items.length>8) throw new Error("cutout-cue requires 1-8 items");
  for (const [index,item] of spec.items.entries()) {
    assertMgCutoutRiseSpec({image:item.image,source:item.source,at:item.at,prepared:spec.prepared});
    if (item.label!==null && (typeof item.label!=="string" || !item.label.trim() || item.label.length>32)) throw new Error("cutout-cue label must be null or 1-32 characters");
    if (index && item.at<spec.items[index-1]!.at) throw new Error("cutout-cue items must follow narration order");
  }
  return spec;
};
export const resolveCutoutCueFunctionArgs = (input: unknown, timing: FunctionCallTiming) => {
  const envelope=assertFunctionEnvelope(input,timing);
  const value=input as {items: Array<{at:number;label:string|null;source:MgCutoutSource}>};
  if (Object.keys(input as object).some(k=>!["group","order","items"].includes(k))) throw new Error("cutout-cue accepts only group, order and items");
  if (!(CUTOUT_CUE_GROUPS as readonly string[]).includes(envelope.group)) throw new Error("invalid cutout-cue group");
  if (!Array.isArray(value.items) || (cutoutCueMode(envelope.group)==="duo" && value.items.length!==2)) throw new Error("cutout-cue duo requires exactly two people");
  const items=value.items.map(item=>{
    if (Object.keys(item).some(k=>!["at","label","source"].includes(k))) throw new Error("invalid cutout-cue item field");
    if (!Number.isFinite(item.at) || item.at>=timing.end) throw new Error("cutout cue must be inside its HTML window");
    return {...item,at:toLocalAt(item.at,envelope.at),image:item.source?.mode==="generate"?"":item.source?.image??""};
  });
  return {...envelope,spec:assertCutoutCueSpec({items})};
};

export const cutoutCuePlanningInstructions = `cutout-cue 是透明前景，不绘制背景。group=duo 恰好两人，items 顺序固定左、右，at 精确对应各自姓名首字，第一人出现后保留到段尾；group=pop 用于真实视频上的 Logo/物体点名弹入，自动短暂停留退出，不把图标铺满整段。16:9 横屏选择 duo-landscape / pop-landscape，参数与时序完全相同，仅布局不同；group 必须与审核 HTML 一致，不自行改写。source 完全沿用 mg-cutout 的 transparent/chroma/generate 三种来源；有真实人物照片或准确品牌 Logo 优先使用，不凭空伪造身份。静态公司背景用独立 image-plate，视频背景用 video-footage，外层包住内层 cutout-cue。`;
