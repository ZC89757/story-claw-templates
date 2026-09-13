import type {FunctionCallEnvelope} from "../function-call";

export type VideoFootageSubtitle = Readonly<{
  start: number;
  end: number;
  text: string;
}>;

export type VideoFootageAsset = Readonly<{
  /** Path relative to public/video-footage/sources/. */
  source: string;
  /** Path consumed by Remotion staticFile(). */
  runtimeSource: string;
  duration: number;
  subtitles: readonly VideoFootageSubtitle[];
  metadataFile: string;
  assetVersion: string;
}>;

export type VideoFootageFunctionArgs = FunctionCallEnvelope & {
  group: "full-bleed";
  source: string;
  sourceStart: number;
  sourceEnd: number;
};

export type VideoFootageSpec = Readonly<{
  source: string;
  sourceStart: number;
  sourceEnd: number;
  /** Internal cache discriminator. It is never exposed as a Function Calling field. */
  assetVersion: string;
}>;

