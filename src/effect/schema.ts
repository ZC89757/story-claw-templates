import type {FunctionCallTiming} from "../function-call";
import {
  assertFunctionEnvelope,
  functionAtSchema,
  functionGroupSchema,
  functionOrderSchema,
  type FunctionCallEnvelope,
  type ResolvedFunctionCall,
  toLocalAt,
} from "../function-call";
import type {ConfigurableEffectFunctionArgs, EffectFunctionArgs, EffectSpec} from "./types";
import {assertEffectSpec} from "./validate";

/** Fixed asset-selection guidance for the two configurable effect groups. */
export const EFFECT_GROUP_DESCRIPTIONS = Object.freeze({
  "object-drop": "单个完整的产品或实体物体图，主体清晰、轮廓完整，适合从画面上方垂直落下；烟雾、地面和落点效果由模板固定提供。",
  "glass-fracture": "一张作为固定裂纹下层内容的完整 logo、图标或画面，主体清晰、适合居中展示；图片本身不能带裂纹，裂纹由模板固定覆盖。",
} as const);

export const EFFECT_GROUP_ASSET_DIRS = Object.freeze({
  "object-drop": "public/mg-effect/object-drop/",
  "glass-fracture": "public/mg-effect/glass-fracture/",
} as const);

export const effectParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["group", "order", "text", "items"],
  properties: {
    group: functionGroupSchema,
    order: functionOrderSchema,
    text: {type: "string", minLength: 1, maxLength: 120},
    items: {
      type: "array",
      minItems: 1,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "at"],
        properties: {
          text: {type: "string", minLength: 1, maxLength: 120},
          at: functionAtSchema,
        },
      },
    },
  },
} as const;

export const effectFunctionDefinition = {
  type: "function",
  name: "create_effect_cue",
  description: "Create one fixed visual-effect overlay for a standard HTML effect group. Supply an anchor text, absolute timestamp and marked items only; colors, geometry, easing, intensity and fixed sound belong to the selected style. Do not use this function for group=object-drop or group=glass-fracture; those groups have dedicated minimal image tools.",
  strict: true,
  parameters: effectParametersSchema,
} as const;

const configurableEffectParametersSchema = (group: "object-drop" | "glass-fracture") => {
  const objectDrop = group === "object-drop";
  return {
    type: "object",
    additionalProperties: false,
    required: objectDrop
      ? ["group", "order", "impactAt", "image"]
      : ["group", "order", "crackAt", "image"],
    properties: {
      group: {type: "string", enum: [group]},
      order: functionOrderSchema,
      ...(objectDrop ? {
        impactAt: {
          ...functionAtSchema,
          description: "物体落到地面并产生撞击烟雾的绝对时间戳，单位秒。必须晚于标签首字时间，且落在该 mg-effect 标签覆盖的时间区间内；物体从标签首字时间开始下落，坠落时长等于 impactAt 减标签首字时间。",
        },
      } : {
        crackAt: {
          ...functionAtSchema,
          description: "完整的下层内容炸开并开始扩散裂纹的绝对时间戳，单位秒。必须晚于标签首字时间，且落在该 mg-effect 标签覆盖的时间区间内；标签首字时间到 crackAt 之间只显示完好的内容，crackAt 之后裂纹扩散并停留。",
        },
      }),
      image: {
        type: "string",
        minLength: 1,
        maxLength: 2000,
        description: "Choose exactly one candidate listed by the Provider for this group. Pass only its filename or listed local path; never pass assetDir, smoke, cracks, text, items or visual parameters.",
      },
    },
  } as const;
};

export const objectDropEffectFunctionDefinition = {
  type: "function",
  name: "create_object_drop_effect",
  description: `Create the fixed object-drop effect. The object starts falling at at and hits the ground at impactAt; it uses one image from ${EFFECT_GROUP_ASSET_DIRS["object-drop"]}. The landed object then stays on screen until the mg-effect tag ends. Smoke, ground, impact motion and sound are internal to the template.`,
  strict: true,
  parameters: configurableEffectParametersSchema("object-drop"),
} as const;

export const glassFractureEffectFunctionDefinition = {
  type: "function",
  name: "create_glass_fracture_effect",
  description: `Create the fixed glass-fracture effect. The intact lower content appears at at and cracks apart at crackAt; it uses one image from ${EFFECT_GROUP_ASSET_DIRS["glass-fracture"]}. The cracked screen then stays on screen until the mg-effect tag ends. Full-screen cracks and sound are internal to the template.`,
  strict: true,
  parameters: configurableEffectParametersSchema("glass-fracture"),
} as const;

const resolveConfigurableEffectFunctionArgs = (
  input: ConfigurableEffectFunctionArgs & FunctionCallEnvelope, timing: FunctionCallTiming,
  expectedGroup: ConfigurableEffectFunctionArgs["group"],
): ResolvedFunctionCall<EffectSpec> => {
  const detailField = expectedGroup === "object-drop" ? "impactAt" : "crackAt";
  const allowedFields = new Set(["group", "order", "image", detailField]);
  const unknownFields = Object.keys(input).filter((field) => !allowedFields.has(field));
  if (unknownFields.length) throw new Error(`${expectedGroup} only accepts group, order, ${detailField} and image`);
  const envelope = assertFunctionEnvelope(input, timing);
  if (envelope.group !== expectedGroup) throw new Error(`group must be ${expectedGroup}`);
  if (typeof input.image !== "string" || !input.image.trim()) {
    throw new Error(`${expectedGroup} requires one image asset`);
  }
  const rawDetailAt = (input as Record<string, unknown>)[detailField];
  const detailAt = typeof rawDetailAt === "number" && Number.isFinite(rawDetailAt) ? rawDetailAt : undefined;
  if (detailAt !== undefined && detailAt < envelope.at) {
    throw new Error(`${expectedGroup} 的 ${detailField} 不能早于 at`);
  }
  const detailFields = detailAt === undefined
    ? {}
    : expectedGroup === "object-drop"
      ? {impactAt: toLocalAt(detailAt, envelope.at)}
      : {crackAt: toLocalAt(detailAt, envelope.at)};
  return {
    ...envelope,
    spec: assertEffectSpec({
      text: expectedGroup,
      at: 0,
      image: input.image.trim(),
      ...detailFields,
    }),
  };
};

export const resolveObjectDropEffectFunctionArgs = (
  input: ConfigurableEffectFunctionArgs & FunctionCallEnvelope, timing: FunctionCallTiming,
): ResolvedFunctionCall<EffectSpec> => resolveConfigurableEffectFunctionArgs(input, timing, "object-drop");

export const resolveGlassFractureEffectFunctionArgs = (
  input: ConfigurableEffectFunctionArgs & FunctionCallEnvelope, timing: FunctionCallTiming,
): ResolvedFunctionCall<EffectSpec> => resolveConfigurableEffectFunctionArgs(input, timing, "glass-fracture");

export const resolveEffectFunctionArgs = (
  input: EffectFunctionArgs & FunctionCallEnvelope, timing: FunctionCallTiming,
): ResolvedFunctionCall<EffectSpec> => {
  const envelope = assertFunctionEnvelope(input, timing);
  if (input.group === "object-drop" || input.group === "glass-fracture") {
    throw new Error(`${input.group} must use its dedicated image effect function`);
  }
  return {
    ...envelope,
    spec: assertEffectSpec({
      text: input.text,
      at: 0,
      ...(input.items ? {
        items: input.items.map((item) => ({
          text: item.text,
          at: toLocalAt(item.at, envelope.at),
        })),
      } : {}),
    }),
  };
};
