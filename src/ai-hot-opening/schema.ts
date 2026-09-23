import {functionAtSchema, type ResolvedFunctionCall} from "../function-call";
import {
  AI_HOT_OPENING_GROUP,
  AI_HOT_OPENING_MAX_ITEMS,
  AI_HOT_OPENING_MIN_DURATION_SECONDS,
  type AiHotOpeningFunctionArgs,
  type AiHotOpeningSpec,
} from "./types";
import {assertAiHotOpeningSpec} from "./validate";

export const aiHotOpeningParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["at", "endTime", "title", "sub_title", "items"],
  properties: {
    at: {
      ...functionAtSchema,
      description: "Absolute episode timestamp at which this opening begins.",
    },
    endTime: {
      ...functionAtSchema,
      description: `Absolute episode timestamp at which this opening is fully gone. It must be at least ${AI_HOT_OPENING_MIN_DURATION_SECONDS} seconds after at.`,
    },
    title: {
      type: "string",
      minLength: 1,
      maxLength: 24,
      description: "Large main title centered inside the orb.",
    },
    sub_title: {
      description: "Optional smaller line above title. Pass null when absent; title will then be vertically centered.",
      anyOf: [
        {type: "string", minLength: 1, maxLength: 32},
        {type: "null"},
      ],
    },
    items: {
      type: "array",
      minItems: 1,
      maxItems: AI_HOT_OPENING_MAX_ITEMS,
      description: "Headline strings distributed evenly around the center orb. Do not include timestamps or visual parameters.",
      items: {type: "string", minLength: 1, maxLength: 40},
    },
  },
} as const;

export const aiHotOpeningFunctionDefinition = {
  type: "function",
  name: "create_ai_hot_opening",
  description: "Create one full-screen AI hot-news opening. Supply only absolute start/end timestamps, the center title, an optional subtitle, and 1-6 surrounding headline strings. The color bloom, vertical curtain, glass buttons, floating motion, glare, audio and layout are fixed by the template. Do not supply group, order, colors, positions, animation timings or audio settings.",
  strict: true,
  parameters: aiHotOpeningParametersSchema,
} as const;

export const resolveAiHotOpeningFunctionArgs = (
  input: unknown,
): ResolvedFunctionCall<AiHotOpeningSpec> => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("create_ai_hot_opening arguments must be an object");
  }
  const args = input as Record<string, unknown>;
  const allowedFields = new Set(["at", "endTime", "title", "sub_title", "items"]);
  const unknownFields = Object.keys(args).filter((field) => !allowedFields.has(field));
  if (unknownFields.length) {
    throw new Error(`create_ai_hot_opening does not accept extra fields: ${unknownFields.join(", ")}`);
  }

  const at = Number(args.at);
  const endTime = Number(args.endTime);
  if (!Number.isFinite(at) || at < 0 || at > 36000) {
    throw new Error("create_ai_hot_opening at must be a non-negative absolute timestamp");
  }
  if (!Number.isFinite(endTime) || endTime <= at || endTime > 36000) {
    throw new Error("create_ai_hot_opening endTime must be later than at");
  }
  const durationSeconds = Math.round((endTime - at) * 1000) / 1000;
  if (durationSeconds < AI_HOT_OPENING_MIN_DURATION_SECONDS) {
    throw new Error(`create_ai_hot_opening requires endTime - at >= ${AI_HOT_OPENING_MIN_DURATION_SECONDS} seconds`);
  }

  const title = typeof args.title === "string" ? args.title.trim() : "";
  const rawSubtitle = args.sub_title;
  const subTitle = typeof rawSubtitle === "string" && rawSubtitle.trim()
    ? rawSubtitle.trim()
    : null;
  if (!Array.isArray(args.items)) {
    throw new Error("create_ai_hot_opening items must be an array");
  }
  const items = args.items.map((item) => typeof item === "string" ? item.trim() : item);
  const spec = assertAiHotOpeningSpec({title, subTitle, items, durationSeconds});

  return {
    group: AI_HOT_OPENING_GROUP,
    at,
    spec,
  };
};
