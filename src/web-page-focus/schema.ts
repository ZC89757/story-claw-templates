import {
  assertFunctionEnvelope,
  functionAtSchema,
  functionGroupSchema,
  functionOrderSchema,
  toLocalAt,
  type FunctionCallEnvelope,
  type ResolvedFunctionCall,
} from "../function-call";
import {
  WEB_PAGE_FOCUS_ENTRANCES,
  WEB_PAGE_FOCUS_GROUP,
  type WebPageFocusSpec,
} from "./types";
import {assertWebPageFocusGroup, assertWebPageFocusSpec} from "./validate";

export type WebPageFocusFunctionArgs = FunctionCallEnvelope & {
  url: string;
  entrance: (typeof WEB_PAGE_FOCUS_ENTRANCES)[number];
  focus: Array<{text: string; at: number}>;
};

export const webPageFocusParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["group", "order", "at", "url", "focus", "entrance"],
  properties: {
    group: {...functionGroupSchema, description: `固定填写 ${WEB_PAGE_FOCUS_GROUP}。`},
    order: functionOrderSchema,
    at: {...functionAtSchema, description: "Absolute episode timestamp at which the real web page enters."},
    url: {
      type: "string",
      format: "uri",
      pattern: "^https?://",
      minLength: 12,
      maxLength: 2000,
      description: "The canonical original official, research, or mainstream-media webpage URL. X requires a verified event-related status post. No personal blogs, aggregators, search result pages, or screenshot URLs.",
    },
    focus: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      description: "Exact source phrases used only as DOM anchors for camera focus. Their at values are absolute episode seconds. No visual highlight is rendered.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "at"],
        properties: {
          text: {type: "string", minLength: 1, maxLength: 240, description: "Exact contiguous phrase copied from the selected webpage content, preserving punctuation and internal spaces."},
          at: {...functionAtSchema, description: "Absolute episode timestamp of the corresponding meaning in the narrated article."},
        },
      },
    },
    entrance: {
      type: "string",
      enum: [...WEB_PAGE_FOCUS_ENTRANCES],
      description: "Fixed page entrance: fade, slide-right, or cut. Camera motion and zoom are template-owned.",
    },
  },
} as const;

export const webPageFocusFunctionDefinition = {
  type: "function",
  name: "create_web_page_focus",
  description: "Create one readable landscape webpage shot without visual highlighting. The Provider opens the canonical URL, locates exact focus phrases with DOM Range, and the template performs fixed entrance, zoom and focus-follow motion. Never provide camera coordinates, zoom, easing, or screenshots.",
  strict: true,
  parameters: webPageFocusParametersSchema,
} as const;

export const resolveWebPageFocusFunctionArgs = (
  input: WebPageFocusFunctionArgs,
): ResolvedFunctionCall<WebPageFocusSpec> => {
  const rawInput = input as unknown as Record<string, unknown>;
  const allowed = new Set(["group", "order", "at", "url", "focus", "entrance"]);
  const unknown = Object.keys(rawInput).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error(`create_web_page_focus does not accept extra fields: ${unknown.join(", ")}`);
  const envelope = assertFunctionEnvelope(input);
  assertWebPageFocusGroup(envelope.group);
  if (!WEB_PAGE_FOCUS_ENTRANCES.includes(input.entrance)) {
    throw new Error(`entrance must be one of ${WEB_PAGE_FOCUS_ENTRANCES.join(", ")}`);
  }
  if (!Array.isArray(input.focus) || input.focus.length < 1 || input.focus.length > 8) {
    throw new Error("create_web_page_focus requires 1-8 focus anchors");
  }
  const focus = input.focus.map((anchor, index) => {
    if (!anchor || typeof anchor.text !== "string" || !anchor.text.trim()) {
      throw new Error(`focus[${index}].text is required`);
    }
    if (typeof anchor.at !== "number" || !Number.isFinite(anchor.at)) {
      throw new Error(`focus[${index}].at must be a finite absolute timestamp`);
    }
    return {text: anchor.text, at: toLocalAt(anchor.at, envelope.at)};
  });
  const spec = assertWebPageFocusSpec({
    at: 0,
    url: input.url,
    entrance: input.entrance,
    focus,
  });
  return {...envelope, spec};
};
