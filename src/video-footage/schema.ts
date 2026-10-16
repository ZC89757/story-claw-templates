import type {FunctionCallTiming} from "../function-call";
import {
  assertFunctionEnvelope,
  functionAtSchema,
  functionOrderSchema,
  type ResolvedFunctionCall,
} from "../function-call";
import {resolveVideoFootageAsset} from "./library";
import type {VideoFootageAsset, VideoFootageFunctionArgs, VideoFootageSpec} from "./types";

export const videoFootageParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["group", "order", "source", "sourceStart", "sourceEnd"],
  properties: {
    group: {type: "string", enum: ["full-bleed"]},
    order: functionOrderSchema,
    source: {
      type: "string",
      minLength: 1,
      maxLength: 500,
      description: "Choose one exact relative source path listed by the Provider. Never output assetDir, a URL or an absolute path.",
    },
    sourceStart: {type: "number", minimum: 0, maximum: 36000},
    sourceEnd: {type: "number", exclusiveMinimum: 0, maximum: 36000},
  },
} as const;

export const videoFootageFunctionDefinition = {
  type: "function",
  name: "use_video_footage",
  description: "Use one continuous excerpt from the package-owned video-footage library as a full-bleed scene. Read the Provider's current subtitle timeline before choosing sourceStart and sourceEnd. The host supplies the annotation window; sourceStart and sourceEnd are seconds inside the selected source video. The excerpt must cover the host window. The template fixes full-screen cover layout and muted playback.",
  strict: true,
  parameters: videoFootageParametersSchema,
} as const;

type ResolveOptions = Readonly<{
  resolveSource?: (source: string) => VideoFootageAsset;
}>;

export const resolveVideoFootageFunctionArgs = (
  input: unknown, timing: FunctionCallTiming,
  options: ResolveOptions = {},
): ResolvedFunctionCall<VideoFootageSpec> => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("use_video_footage 参数必须是对象");
  }
  const args = input as VideoFootageFunctionArgs;
  const allowedFields = new Set(["group", "order", "source", "sourceStart", "sourceEnd"]);
  const unknownFields = Object.keys(args).filter((field) => !allowedFields.has(field));
  if (unknownFields.length) throw new Error(`use_video_footage 不接受额外字段: ${unknownFields.join(", ")}`);

  const envelope = assertFunctionEnvelope(args, timing);
  if (envelope.group !== "full-bleed") throw new Error("use_video_footage group 必须是 full-bleed");
  if (typeof args.source !== "string" || !args.source.trim()) throw new Error("use_video_footage 缺少 source");
  if (!Number.isFinite(args.sourceStart) || args.sourceStart < 0) {
    throw new Error("use_video_footage sourceStart 必须是非负秒数");
  }
  if (!Number.isFinite(args.sourceEnd) || args.sourceEnd <= args.sourceStart) {
    throw new Error("use_video_footage sourceEnd 必须大于 sourceStart");
  }

  const asset = (options.resolveSource ?? resolveVideoFootageAsset)(args.source);
  if (args.sourceEnd > asset.duration + 0.001) {
    throw new Error(`use_video_footage sourceEnd=${args.sourceEnd} 超过素材时长 ${asset.duration}s`);
  }
  if (args.sourceEnd - args.sourceStart < timing.end - timing.start - 0.001) {
    throw new Error(`use_video_footage 素材区间必须覆盖宿主窗口 ${timing.start}-${timing.end}s`);
  }
  return {
    ...envelope,
    group: "full-bleed",
    spec: Object.freeze({
      source: asset.runtimeSource,
      sourceStart: Math.round(args.sourceStart * 1000) / 1000,
      sourceEnd: Math.round(args.sourceEnd * 1000) / 1000,
      assetVersion: asset.assetVersion,
    }),
  };
};
