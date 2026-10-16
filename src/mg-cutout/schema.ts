import type {FunctionCallTiming} from "../function-call";
import {
  assertFunctionEnvelope,
  functionAtSchema,
  functionOrderSchema,
  type FunctionCallEnvelope,
  type ResolvedFunctionCall,
} from "../function-call";
import type {MgCutoutRiseFunctionArgs, MgCutoutRiseSpec, MgCutoutSource} from "./types";
import {assertMgCutoutRiseSpec} from "./validate";

export const MG_CUTOUT_GROUP = "rise" as const;

const nullableString = (description: string, maxLength: number) => ({
  anyOf: [
    {type: "string", minLength: 1, maxLength, description},
    {type: "null"},
  ],
} as const);

const sourceSchema = {
  type: "object",
  additionalProperties: false,
  required: ["mode", "image", "subject", "references"],
  properties: {
    mode: {
      type: "string",
      enum: ["transparent", "chroma", "generate"],
      description: "transparent 使用已有 alpha 图片；chroma 抠除已有绿幕；generate 用参考图生成并自动抠除。",
    },
    image: nullableString("transparent/chroma 模式下的图片来源；chroma 必须填写绝对本地文件路径；generate 填 null。", 2000),
    subject: nullableString("generate 模式下要生成的人物或物体描述；其他模式填 null。", 160),
    references: {
      type: "array",
      minItems: 0,
      maxItems: 3,
      items: {type: "string", minLength: 1, maxLength: 2000},
      description: "generate 模式使用的 1-3 个直接图片 URL；其他模式填空数组。",
    },
  },
} as const;

export const mgCutoutRiseParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["group", "order", "source"],
  properties: {
    group: {type: "string", enum: [MG_CUTOUT_GROUP]},
    order: functionOrderSchema,
    source: sourceSchema,
  },
} as const;

export const mgCutoutRiseFunctionDefinition = {
  type: "function",
  name: "create_cutout_rise",
  description: "Create one transparent foreground overlay. Supply one already-transparent image, one existing chroma-green local image, or a subject plus direct image references for host-side green-screen generation and removal. The cutout rises from below, eases naturally to a stop, and remains still. It never draws a background, shadow or decoration; do not add visual parameters.",
  strict: true,
  parameters: mgCutoutRiseParametersSchema,
} as const;

const normalizeSource = (input: unknown): MgCutoutSource => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("mg-cutout source must be an object");
  }
  const record = input as Record<string, unknown>;
  const unknownFields = Object.keys(record).filter((field) => !["mode", "image", "subject", "references"].includes(field));
  if (unknownFields.length) throw new Error("mg-cutout source only accepts mode, image, subject and references");
  return {
    mode: record.mode as MgCutoutSource["mode"],
    image: typeof record.image === "string" ? record.image.trim() : record.image as null,
    subject: typeof record.subject === "string" ? record.subject.trim() : record.subject as null,
    references: Array.isArray(record.references)
      ? record.references.map((reference) => typeof reference === "string" ? reference.trim() : reference) as string[]
      : record.references as string[],
  } as MgCutoutSource;
};
export const resolveMgCutoutRiseFunctionArgs = (
  input: MgCutoutRiseFunctionArgs & FunctionCallEnvelope, timing: FunctionCallTiming,
): ResolvedFunctionCall<MgCutoutRiseSpec> => {
  const envelope = assertFunctionEnvelope(input, timing);
  const record = input as unknown as Record<string, unknown>;
  const unknownFields = Object.keys(record).filter((field) => !["group", "order", "source"].includes(field));
  if (unknownFields.length) throw new Error("mg-cutout only accepts group, order and source");
  if (envelope.group !== MG_CUTOUT_GROUP) throw new Error(`mg-cutout group must be ${MG_CUTOUT_GROUP}`);
  const source = normalizeSource(record.source);
  const image = source.mode === "transparent" || source.mode === "chroma" ? source.image : "";
  return {
    ...envelope,
    spec: assertMgCutoutRiseSpec({image, source, at: 0}),
  };
};
