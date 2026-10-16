import type {FunctionCallTiming} from "../function-call";
import {
  assertFunctionEnvelope,
  functionAtSchema,
  functionGroupSchema,
  functionOrderSchema,
  FunctionCallEnvelope,
  ResolvedFunctionCall,
} from "../function-call";
import {NewsFlashbackSpec} from "./types";
import {assertNewsFlashbackSpec} from "./validate";

export type NewsFlashbackFunctionArgs = FunctionCallEnvelope & {
  text: string;
  pages: Array<{image: string; source?: string; title?: string}>;
};

export const newsFlashbackParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["group", "order", "text", "pages"],
  properties: {
    group: functionGroupSchema,
    order: functionOrderSchema,
    text: {
      type: "string",
      minLength: 1,
      maxLength: 16,
      description: "The exact center text of the HTML cue, copied verbatim from the tagged sentence.",
    },
    pages: {
      type: "array",
      minItems: 2,
      maxItems: 12,
      description: "2-12 searched article screenshots; the template flips through them while the center text stays on top.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["image"],
        properties: {
          image: {type: "string", minLength: 1, maxLength: 2000},
          source: {type: "string", minLength: 1, maxLength: 120},
          title: {type: "string", minLength: 1, maxLength: 240},
        },
      },
    },
  },
} as const;

export const newsFlashbackFunctionDefinition = {
  type: "function",
  name: "create_news_flashback",
  description: "Create one web-article flashback for an HTML group. The host supplies the annotation window. Provide 2-12 searched article screenshots or local image paths in pages; the center text stays the exact HTML cue text. This template owns the full screen, so it replaces the original footage inside its time window.",
  strict: true,
  parameters: newsFlashbackParametersSchema,
} as const;

export const resolveNewsFlashbackFunctionArgs = (
  input: NewsFlashbackFunctionArgs, timing: FunctionCallTiming,
): ResolvedFunctionCall<NewsFlashbackSpec> => {
  const envelope = assertFunctionEnvelope(input, timing);
  if (!Array.isArray(input.pages) || input.pages.length < 2) {
    throw new Error("create_news_flashback requires 2-12 pages from search_web");
  }
  const pages = input.pages.map((page) => ({
    image: page.image,
    ...(page.source === undefined ? {} : {source: page.source}),
    ...(page.title === undefined ? {} : {title: page.title}),
  }));
  return {...envelope, spec: assertNewsFlashbackSpec({text: input.text, at: 0, pages})};
};
