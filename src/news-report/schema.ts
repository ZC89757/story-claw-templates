import {
  assertFunctionEnvelope,
  functionAtSchema,
  functionGroupSchema,
  functionOrderSchema,
  FunctionCallEnvelope,
  ResolvedFunctionCall,
} from "../function-call";
import {NewsReportSpec} from "./types";
import {assertNewsReportSpec} from "./validate";

export type NewsReportFunctionArgs = FunctionCallEnvelope & {
  pages: Array<{image: string; source?: string; title?: string}>;
};

export const newsReportParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["group", "order", "at", "pages"],
  properties: {
    group: functionGroupSchema,
    order: functionOrderSchema,
    at: functionAtSchema,
    pages: {
      type: "array",
      minItems: 2,
      maxItems: 12,
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

export const newsReportFunctionDefinition = {
  type: "function",
  name: "create_news_report_stack",
  description: "Create one news-report paper stack for an HTML group. at is the absolute episode timestamp. Supply 2-12 searched article page screenshots or local image paths in pages. The template shows only the papers and their stacking motion; it does not render a central title.",
  strict: true,
  parameters: newsReportParametersSchema,
} as const;

export const resolveNewsReportFunctionArgs = (input: NewsReportFunctionArgs): ResolvedFunctionCall<NewsReportSpec> => {
  const envelope = assertFunctionEnvelope(input);
  const pages = input.pages.map((page) => ({
    image: page.image,
    ...(page.source === undefined ? {} : {source: page.source}),
    ...(page.title === undefined ? {} : {title: page.title}),
  }));
  return {...envelope, spec: assertNewsReportSpec({at: 0, pages})};
};
