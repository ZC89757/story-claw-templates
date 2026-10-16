import type {FunctionCallTiming} from "../function-call";
import {
  assertFunctionEnvelope,
  functionAtSchema,
  functionOrderSchema,
  toLocalAt,
  type FunctionCallEnvelope,
  type ResolvedFunctionCall,
} from "../function-call";
import {assertEraShiftSpec} from "./validate";
import type {EraShiftForeground, EraShiftFunctionArgs, EraShiftSpec} from "./types";

export const ERA_SHIFT_GROUP = "foreground-with-background" as const;

export const ERA_SHIFT_ASSET_DIRS = Object.freeze({
  foreground: "public/era-shift/foreground/",
  logos: "public/era-shift/logos/",
} as const);

export const ERA_SHIFT_FOREGROUND_DESCRIPTION =
  "前景人物或物体的选择；可以引用模板固定的透明素材，也可以提供人物描述和少量直接参考图片，由模板生成并抠出透明前景。";

export const ERA_SHIFT_LOGO_DESCRIPTION =
  "可选的品牌或实体 Logo 文件名；Logo 本身由模板包提供。省略时常见品牌可按文字自动匹配，其他内容显示文字卡片。";

const item = {
  type: "object",
  additionalProperties: false,
  required: ["text"],
  properties: {
    text: {type: "string", minLength: 1, maxLength: 80},
    logo: {type: "string", minLength: 1, maxLength: 240, description: ERA_SHIFT_LOGO_DESCRIPTION},
  },
} as const;

const items = {
  type: "array",
  minItems: 1,
  maxItems: 8,
  items: item,
} as const;

const nullableString = (description: string, maxLength: number) => ({
  anyOf: [
    {type: "string", minLength: 1, maxLength, description},
    {type: "null"},
  ],
} as const);

const foreground = {
  type: "object",
  additionalProperties: false,
  required: ["mode", "image", "person", "references"],
  properties: {
    mode: {
      type: "string",
      enum: ["existing", "generate"],
      description: "existing 使用固定透明素材；generate 根据人物参考图生成并抠出透明前景。",
    },
    image: nullableString("existing 模式下填写模板固定 foreground 文件名；generate 模式必须为 null。", 240),
    person: nullableString("generate 模式下的人物或人物组合描述；existing 模式必须为 null。", 160),
    references: {
      type: "array",
      minItems: 0,
      maxItems: 3,
      items: {type: "string", minLength: 1, maxLength: 2000},
      description: "generate 模式使用的 1-3 个直接图片地址；existing 模式填空数组。",
    },
  },
} as const;

export const eraShiftParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["group", "order", "foreground", "switchAt", "startItems", "endItems"],
  properties: {
    group: {type: "string", enum: [ERA_SHIFT_GROUP]},
    order: functionOrderSchema,
    foreground,
    switchAt: {
      ...functionAtSchema,
      description: "背景从 startItems 切换到 endItems 的绝对 episode 时间；必须不早于标签首字时间。",
    },
    startItems: items,
    endItems: items,
  },
} as const;

export const eraShiftFunctionDefinition = {
  type: "function",
  name: "create_era_shift",
  description: "Create one foreground-with-background era-shift scene. Supply a fixed or generated foreground selection, two sets of semantic background cards, and the absolute timestamp where the background changes from startItems to endItems. Item cards enter with a fixed internal stagger; do not add per-item timestamps, title/label fields, assetDir, colors, layout or sound parameters. For generated foregrounds, references must be direct image URLs selected after search_web.",
  strict: true,
  parameters: eraShiftParametersSchema,
} as const;

export const resolveEraShiftFunctionArgs = (
  input: EraShiftFunctionArgs & FunctionCallEnvelope, timing: FunctionCallTiming,
): ResolvedFunctionCall<EraShiftSpec> => {
  const envelope = assertFunctionEnvelope(input, timing);
  const record = input as unknown as Record<string, unknown>;
  const allowedFields = new Set(["group", "order", "foreground", "image", "switchAt", "startItems", "endItems"]);
  const unknownFields = Object.keys(record).filter((field) => !allowedFields.has(field));
  if (unknownFields.length) throw new Error(`era-shift only accepts group, order, image, foreground, switchAt, startItems and endItems`);
  if (envelope.group !== ERA_SHIFT_GROUP) {
    throw new Error(`era-shift group must be ${ERA_SHIFT_GROUP}`);
  }
  const rawForeground = record.foreground;
  const legacyImage = typeof record.image === "string" ? String(record.image).trim() : "";
  if (rawForeground !== undefined && record.image !== undefined) {
    throw new Error("era-shift 只能在 foreground 和 legacy image 中选择一种前景输入");
  }
  const normalizeForeground = (value: unknown): EraShiftForeground | unknown => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return value;
    const source = value as Record<string, unknown>;
    const unknownFields = Object.keys(source).filter((field) => !["mode", "image", "person", "references"].includes(field));
    if (unknownFields.length) throw new Error("era-shift foreground only accepts mode, image, person and references");
    return {
      mode: source.mode,
      image: typeof source.image === "string" ? source.image.trim() : source.image,
      person: typeof source.person === "string" ? source.person.trim() : source.person,
      references: Array.isArray(source.references)
        ? source.references.map((reference) => typeof reference === "string" ? reference.trim() : reference)
        : source.references,
    };
  };
  const normalizedForeground = rawForeground !== undefined
    ? normalizeForeground(rawForeground)
    : legacyImage
      ? {mode: "existing", image: legacyImage, person: null, references: []}
      : undefined;
  if (normalizedForeground === undefined) {
    throw new Error("era-shift requires foreground (existing or generate)");
  }
  const copyItems = (value: unknown): unknown => Array.isArray(value)
    ? value.map((raw) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
      const item = raw as Record<string, unknown>;
      const unknownItemFields = Object.keys(item).filter((field) => field !== "text" && field !== "logo");
      if (unknownItemFields.length) {
        throw new Error("era-shift item only accepts text and logo");
      }
      return {
        text: item.text,
        ...(item.logo === undefined
          ? {}
          : {logo: typeof item.logo === "string" ? item.logo.trim() : item.logo}),
      };
    })
    : value;
  const spec = assertEraShiftSpec({
    image: (() => {
      const value = normalizedForeground as Partial<EraShiftForeground>;
      return value.mode === "existing" && typeof value.image === "string" ? value.image : "";
    })(),
    foreground: normalizedForeground as EraShiftForeground,
    switchAt: typeof input.switchAt === "number"
      ? toLocalAt(input.switchAt, envelope.at)
      : input.switchAt as unknown as number,
    startItems: copyItems(input.startItems) as EraShiftFunctionArgs["startItems"],
    endItems: copyItems(input.endItems) as EraShiftFunctionArgs["endItems"],
  });
  return {...envelope, spec};
};
