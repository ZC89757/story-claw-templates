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
  WEB_NEWS_FOCUS_ENTRANCES,
  WEB_NEWS_FOCUS_GROUP,
  type WebNewsFocusSpec,
} from "./types";
import {assertWebNewsFocusGroup, assertWebNewsFocusSpec} from "./validate";

export type WebNewsFocusFunctionArgs = FunctionCallEnvelope & {
  url: string;
  entrance: (typeof WEB_NEWS_FOCUS_ENTRANCES)[number];
  highlights: Array<{text: string; at: number}>;
};

export const webNewsFocusParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["group", "order", "at", "url", "highlights", "entrance"],
  properties: {
    group: {...functionGroupSchema, description: `固定填写 ${WEB_NEWS_FOCUS_GROUP}。`},
    order: functionOrderSchema,
    at: {...functionAtSchema, description: "Absolute episode timestamp at which the real web page enters."},
    url: {
      type: "string",
      format: "uri",
      pattern: "^https?://",
      minLength: 12,
      maxLength: 2000,
      description: "The canonical original article URL. Do not pass a search result page or screenshot URL.",
    },
    highlights: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      description: "Exact source phrases to locate in the loaded page. Their at values are absolute episode seconds.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "at"],
        properties: {
          text: {type: "string", minLength: 1, maxLength: 240, description: "Exact text copied from the tagged article, including punctuation when present."},
          at: {...functionAtSchema, description: "Absolute episode timestamp when this phrase should be highlighted and focused."},
        },
      },
    },
    entrance: {
      type: "string",
      enum: [...WEB_NEWS_FOCUS_ENTRANCES],
      description: "Fixed page entrance: fade, slide-right, or cut. Camera motion and zoom are template-owned.",
    },
  },
} as const;

export const webNewsFocusFunctionDefinition = {
  type: "function",
  name: "create_web_news_focus",
  description: "Create one readable landscape real-news webpage shot. The Provider opens the canonical URL in a browser, finds exact highlight phrases with DOM Range, captures the real page and CSS highlights, then the template performs fixed entrance, zoom and focus-follow motion. Never provide camera coordinates, zoom, easing, or screenshots.",
  strict: true,
  parameters: webNewsFocusParametersSchema,
} as const;

export const resolveWebNewsFocusFunctionArgs = (
  input: WebNewsFocusFunctionArgs,
): ResolvedFunctionCall<WebNewsFocusSpec> => {
  const rawInput = input as unknown as Record<string, unknown>;
  const allowed = new Set(["group", "order", "at", "url", "highlights", "entrance"]);
  const unknown = Object.keys(rawInput).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error(`create_web_news_focus does not accept extra fields: ${unknown.join(", ")}`);
  const envelope = assertFunctionEnvelope(input);
  assertWebNewsFocusGroup(envelope.group);
  if (!WEB_NEWS_FOCUS_ENTRANCES.includes(input.entrance)) {
    throw new Error(`entrance must be one of ${WEB_NEWS_FOCUS_ENTRANCES.join(", ")}`);
  }
  if (!Array.isArray(input.highlights) || input.highlights.length < 1 || input.highlights.length > 8) {
    throw new Error("create_web_news_focus requires 1-8 highlights");
  }
  const highlights = input.highlights.map((highlight, index) => {
    if (!highlight || typeof highlight.text !== "string" || !highlight.text.trim()) {
      throw new Error(`highlights[${index}].text is required`);
    }
    if (typeof highlight.at !== "number" || !Number.isFinite(highlight.at)) {
      throw new Error(`highlights[${index}].at must be a finite absolute timestamp`);
    }
    return {text: highlight.text, at: toLocalAt(highlight.at, envelope.at)};
  });
  const spec = assertWebNewsFocusSpec({
    at: 0,
    url: input.url,
    entrance: input.entrance,
    highlights,
  });
  return {...envelope, spec};
};
