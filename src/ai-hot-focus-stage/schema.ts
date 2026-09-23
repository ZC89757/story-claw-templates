import {functionAtSchema, type ResolvedFunctionCall} from "../function-call";
import {AI_HOT_FOCUS_STAGE_GROUP, type AiHotFocusStageSpec} from "./types";
import {assertAiHotFocusStageSpec} from "./validate";

export const aiHotFocusStageParametersSchema = {
  type: "object", additionalProperties: false,
  required: ["at", "title", "sub_title", "items"],
  properties: {
    at: {...functionAtSchema, description: "Absolute episode timestamp at which this full-screen chapter stage begins."},
    title: {type: "string", minLength: 1, maxLength: 24, description: "Main title shown in the opening orb."},
    sub_title: {anyOf: [{type: "string", minLength: 1, maxLength: 32}, {type: "null"}], description: "Optional smaller subtitle; pass null when absent."},
    items: {type: "array", minItems: 1, maxItems: 6, description: "Ordered chapter headlines with absolute switch times.", items: {
      type: "object", additionalProperties: false, required: ["title", "time"],
      properties: {
        title: {type: "string", minLength: 1, maxLength: 40},
        time: {type: "number", minimum: 0, maximum: 36000, description: "Absolute episode seconds when this item expands."},
      },
    }},
  },
} as const;

export const aiHotFocusStageFunctionDefinition = {
  type: "function", name: "create_ai_hot_focus_stage",
  description: "Create a full-episode AI hot-news chapter stage. Items correspond one-to-one with the HTML values title anchors and expand one at a time. Do not provide endTime, group, order, colors or animation settings.",
  strict: true, parameters: aiHotFocusStageParametersSchema,
} as const;

export const resolveAiHotFocusStageFunctionArgs = (input: unknown): ResolvedFunctionCall<AiHotFocusStageSpec> => {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("create_ai_hot_focus_stage arguments must be an object");
  const args = input as Record<string, unknown>;
  const allowed = new Set(["at", "title", "sub_title", "items"]);
  const unknown = Object.keys(args).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error(`create_ai_hot_focus_stage does not accept extra fields: ${unknown.join(", ")}`);
  const at = Number(args.at);
  if (!Number.isFinite(at) || at < 0 || at > 36000) throw new Error("create_ai_hot_focus_stage at must be a non-negative absolute timestamp");
  const title = typeof args.title === "string" ? args.title.trim() : "";
  const rawSubtitle = args.sub_title;
  const subTitle = typeof rawSubtitle === "string" && rawSubtitle.trim() ? rawSubtitle.trim() : null;
  if (!Array.isArray(args.items)) throw new Error("create_ai_hot_focus_stage items must be an array");
  const items = args.items.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return item;
    const row = item as Record<string, unknown>;
    const unknownItemFields = Object.keys(row).filter((key) => key !== "title" && key !== "time");
    if (unknownItemFields.length) throw new Error(`create_ai_hot_focus_stage item does not accept extra fields: ${unknownItemFields.join(", ")}`);
    const localTime = Math.round((Number(row.time) - at) * 1000) / 1000;
    return {title: typeof row.title === "string" ? row.title.trim() : row.title, time: localTime};
  });
  const spec = assertAiHotFocusStageSpec({title, subTitle, items});
  return {group: AI_HOT_FOCUS_STAGE_GROUP, at, spec};
};
