const orderSchema = {
  anyOf: [{type: "integer", minimum: 1}, {type: "null"}],
} as const;

const referenceStateSchema = {
  type: "string",
  enum: ["existing", "generate", "none"],
} as const;

const segmentSchema = {
  type: "object",
  additionalProperties: false,
  required: ["at", "video_prompt"],
  properties: {
    at: {type: "number", minimum: 0},
    video_prompt: {type: "string", minLength: 1},
  },
} as const;

export const scLongtakeFunctionDefinition = {
  name: "create_sc_longtake",
  description: "为 <sc-longtake> 实例生成接力式一镜到底视频。把一段过长的连续画面拆成按时间排序的 segments；第一段使用初始参考图，后续每段必须以前一段视频的尾帧作为首帧，并保持主体、镜头轴线、光线和运动方向连续。不要把它当作多个独立镜头或硬切蒙太奇。时间窗口由宿主代码根据 HTML 标签和 segments 的 at 计算。",
  parameters: {
    type: "object",
    additionalProperties: false,
    required: ["group", "order", "at", "reference_image_state", "segments"],
    properties: {
      group: {type: "string", enum: ["relay"]},
      order: orderSchema,
      at: {type: "number", minimum: 0},
      reference_image_state: referenceStateSchema,
      reference_image_path: {type: "string"},
      reference_image_prompt: {type: "string"},
      segments: {
        type: "array",
        minItems: 2,
        maxItems: 8,
        items: segmentSchema,
      },
    },
  },
} as const;

export type ScLongtakeSegment = {
  at: number;
  video_prompt: string;
};

export type ScLongtakeFunctionArgs = {
  group: "relay";
  order: number | null;
  at: number;
  reference_image_state: "existing" | "generate" | "none";
  reference_image_path?: string;
  reference_image_prompt?: string;
  segments: ScLongtakeSegment[];
};

export const resolveScLongtakeFunctionArgs = (input: unknown): {
  group: "relay";
  order?: number | null;
  at: number;
  spec: ScLongtakeFunctionArgs;
} => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("create_sc_longtake 参数必须是对象");
  }
  const args = input as Record<string, unknown>;
  if (args.group !== "relay") throw new Error("create_sc_longtake group 必须是 relay");
  if (args.order !== null && args.order !== undefined && (!Number.isInteger(args.order) || Number(args.order) < 1)) {
    throw new Error("create_sc_longtake order 必须是正整数或 null");
  }
  const at = Number(args.at);
  if (!Number.isFinite(at) || at < 0) throw new Error("create_sc_longtake at 必须是非负绝对时间");

  const state = args.reference_image_state;
  if (state !== "existing" && state !== "generate" && state !== "none") {
    throw new Error("create_sc_longtake reference_image_state 无效");
  }
  const referenceImagePath = String(args.reference_image_path ?? "").trim();
  const referenceImagePrompt = String(args.reference_image_prompt ?? "").trim();
  if (state === "existing" && !referenceImagePath) throw new Error("existing 状态必须提供 reference_image_path");
  if (state === "generate" && !referenceImagePrompt) throw new Error("generate 状态必须提供 reference_image_prompt");

  if (!Array.isArray(args.segments) || args.segments.length < 2 || args.segments.length > 8) {
    throw new Error("create_sc_longtake segments 必须包含 2-8 个连续片段");
  }
  const segments: ScLongtakeSegment[] = args.segments.map((raw, index) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new Error(`create_sc_longtake segments[${index}] 必须是对象`);
    }
    const segment = raw as Record<string, unknown>;
    const segmentAt = Number(segment.at);
    const prompt = String(segment.video_prompt ?? "").trim();
    if (!Number.isFinite(segmentAt) || segmentAt < 0) throw new Error(`create_sc_longtake segments[${index}].at 无效`);
    if (!prompt) throw new Error(`create_sc_longtake segments[${index}] 缺少 video_prompt`);
    return {at: segmentAt, video_prompt: prompt};
  });

  if (Math.abs(segments[0].at - at) > 0.35) throw new Error("create_sc_longtake 的第一个 segment.at 必须接近根 at");
  for (let index = 1; index < segments.length; index++) {
    if (segments[index].at <= segments[index - 1].at) throw new Error("create_sc_longtake segments.at 必须严格递增");
  }

  const spec: ScLongtakeFunctionArgs = {
    group: "relay",
    order: typeof args.order === "number" ? args.order : null,
    at,
    reference_image_state: state,
    ...(referenceImagePath ? {reference_image_path: referenceImagePath} : {}),
    ...(referenceImagePrompt ? {reference_image_prompt: referenceImagePrompt} : {}),
    segments,
  };
  return {group: "relay", order: spec.order, at, spec};
};
