import type {FunctionCallTiming} from "../function-call";
import {assertFunctionTiming, type ResolvedFunctionCall} from "../function-call";
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
  required: ["title", "sub_title", "items"],
  properties: {
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
  description: "Create one full-screen AI hot-news opening. Supply the center title, an optional subtitle, and 1-6 surrounding headline strings. The host supplies the reviewed annotation window. The color bloom, vertical curtain, glass buttons, floating motion, glare, audio and layout are fixed by the template.",
  strict: true,
  parameters: aiHotOpeningParametersSchema,
} as const;

export const resolveAiHotOpeningFunctionArgs = (
  input: unknown, timing: FunctionCallTiming,
): ResolvedFunctionCall<AiHotOpeningSpec> => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("create_ai_hot_opening arguments must be an object");
  }
  const args = input as Record<string, unknown>;
  const allowedFields = new Set(["title", "sub_title", "items"]);
  const unknownFields = Object.keys(args).filter((field) => !allowedFields.has(field));
  if (unknownFields.length) {
    throw new Error(`create_ai_hot_opening does not accept extra fields: ${unknownFields.join(", ")}`);
  }

  const {start: at, end: endTime} = assertFunctionTiming(timing);
  const durationSeconds = Math.round((endTime - at) * 1000) / 1000;
  if (durationSeconds < AI_HOT_OPENING_MIN_DURATION_SECONDS) {
    throw new Error(`create_ai_hot_opening requires a host window of at least ${AI_HOT_OPENING_MIN_DURATION_SECONDS} seconds`);
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
