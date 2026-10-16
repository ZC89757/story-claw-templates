import type {FunctionCallTiming} from "../function-call";
import {
  assertFunctionEnvelope,
  functionAtSchema,
  functionGroupSchema,
  functionOrderSchema,
  FunctionCallEnvelope,
  ResolvedFunctionCall,
  toLocalAt,
} from "../function-call";
import {ImageGridSpec, ImageMediaFunctionArgs, ImageStackSpec} from "./types";
import {assertImageMediaSpec} from "./validate";

const imageValue = {type: "string", minLength: 1, maxLength: 2000} as const;
const labelValue = {type: "string", minLength: 1, maxLength: 100} as const;

const imageParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["group", "order", "title", "images"],
  properties: {
    group: functionGroupSchema,
    order: functionOrderSchema,
    title: {type: "string", minLength: 1, maxLength: 80},
    images: {
      type: "array",
      minItems: 2,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["image", "at"],
        properties: {image: imageValue, label: labelValue, at: functionAtSchema},
      },
    },
  },
} as const;

export const imageStackParametersSchema = imageParametersSchema;
export const imageGridParametersSchema = imageParametersSchema;

export const imageStackFunctionDefinition = {
  type: "function",
  name: "create_image_stack",
  description: "Create one editorial image stack for an HTML group. at values are absolute episode timestamps. Supply a title and 2-8 image values; each value may be an official URL/local asset path or an image-generation prompt, with an optional visible label. Layering direction and motion are fixed by the template.",
  strict: true,
  parameters: imageStackParametersSchema,
} as const;

export const imageGridFunctionDefinition = {
  type: "function",
  name: "create_image_grid",
  description: "Create one editorial image grid for an HTML group. at values are absolute episode timestamps. Supply a title and 2-8 image values; each value may be an official URL/local asset path or an image-generation prompt, with an optional visible label. Grid layout and motion are fixed by the template.",
  strict: true,
  parameters: imageGridParametersSchema,
} as const;

const resolve = <T extends ImageStackSpec | ImageGridSpec>(input: ImageMediaFunctionArgs, timing: FunctionCallTiming): ResolvedFunctionCall<T> => {
  const envelope = assertFunctionEnvelope(input, timing);
  const spec = assertImageMediaSpec<T>({
    title: input.title,
    images: input.images.map((item) => ({
      image: item.image,
      ...(item.label === undefined ? {} : {label: item.label}),
      at: toLocalAt(item.at, envelope.at),
    })),
  });
  return {...envelope, spec};
};

export const resolveImageStackFunctionArgs = (input: ImageMediaFunctionArgs, timing: FunctionCallTiming): ResolvedFunctionCall<ImageStackSpec> => resolve<ImageStackSpec>(input, timing);
export const resolveImageGridFunctionArgs = (input: ImageMediaFunctionArgs, timing: FunctionCallTiming): ResolvedFunctionCall<ImageGridSpec> => resolve<ImageGridSpec>(input, timing);
