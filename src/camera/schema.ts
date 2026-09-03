import {
  assertFunctionEnvelope,
  functionAtSchema,
  functionGroupSchema,
  functionOrderSchema,
  type FunctionCallEnvelope,
  type ResolvedFunctionCall,
  toLocalAt,
} from "../function-call";
import type {CameraFunctionArgs, CameraSpec} from "./types";
import {assertCameraSpec} from "./validate";

export const cameraParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["group", "order", "at", "text", "items"],
  properties: {
    group: functionGroupSchema,
    order: functionOrderSchema,
    at: functionAtSchema,
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

export const cameraFunctionDefinition = {
  type: "function",
  name: "create_camera_move",
  description: "Create one self-contained camera-animation scene for an HTML group. Supply only an anchor text and absolute timestamps; the visual plate, zoom, tilt, perspective, parallax, duration and fixed sound are owned by the selected style. For multiple marked fragments, copy each fragment into items.",
  strict: true,
  parameters: cameraParametersSchema,
} as const;

export const resolveCameraFunctionArgs = (
  input: CameraFunctionArgs & FunctionCallEnvelope,
): ResolvedFunctionCall<CameraSpec> => {
  const envelope = assertFunctionEnvelope(input);
  return {
    ...envelope,
    spec: assertCameraSpec({
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
