export const scVideoFunctionDefinition = {
  name: "create_sc_video",
  description: "为 <sc-video> 实例生成普通 AI 视频片段。时间窗口由宿主代码计算。",
  parameters: {
    type: "object",
    additionalProperties: false,
    required: ["group", "order", "reference_image_state", "video_prompt"],
    properties: {
      group: {type: "string", enum: ["normal"]},
      order: {anyOf: [{type: "integer", minimum: 1}, {type: "null"}]},
      reference_image_state: {type: "string", enum: ["existing", "generate", "none"]},
      reference_image_path: {type: "string"},
      reference_image_prompt: {type: "string"},
      video_prompt: {type: "string", minLength: 1},
    },
  },
} as const;

export type ScVideoFunctionArgs = {
  group: "normal";
  order: number | null;
  reference_image_state: "existing" | "generate" | "none";
  reference_image_path?: string;
  reference_image_prompt?: string;
  video_prompt: string;
};

export const resolveScVideoFunctionArgs = (input: unknown): {
  group: "normal";
  order?: number | null;
  at: number;
  spec: ScVideoFunctionArgs;
} => {
  if (!input || typeof input !== "object") throw new Error("create_sc_video 参数必须是对象");
  const args = input as Record<string, unknown>;
  if (args.group !== "normal") throw new Error("create_sc_video group 必须是 normal");
  if (args.order !== null && args.order !== undefined && (!Number.isInteger(args.order) || Number(args.order) < 1)) {
    throw new Error("create_sc_video order 必须是正整数或 null");
  }
  const state = args.reference_image_state;
  if (state !== "existing" && state !== "generate" && state !== "none") {
    throw new Error("create_sc_video reference_image_state 无效");
  }
  const videoPrompt = String(args.video_prompt ?? "").trim();
  if (!videoPrompt) throw new Error("create_sc_video 缺少 video_prompt");
  const referenceImagePath = String(args.reference_image_path ?? "").trim();
  const referenceImagePrompt = String(args.reference_image_prompt ?? "").trim();
  if (state === "existing" && !referenceImagePath) throw new Error("existing 状态必须提供 reference_image_path");
  if (state === "generate" && !referenceImagePrompt) throw new Error("generate 状态必须提供 reference_image_prompt");
  const spec: ScVideoFunctionArgs = {
    group: "normal",
    order: typeof args.order === "number" ? args.order : null,
    reference_image_state: state,
    ...(referenceImagePath ? {reference_image_path: referenceImagePath} : {}),
    ...(referenceImagePrompt ? {reference_image_prompt: referenceImagePrompt} : {}),
    video_prompt: videoPrompt,
  };
  // The host binds the real absolute timeline after matching this call to its HTML instance.
  return {group: "normal", order: spec.order, at: 0, spec};
};
