import type {CSSProperties, ReactNode} from "react";
import {Img, OffthreadVideo, Video, staticFile, useVideoConfig} from "remotion";

export type PortraitMediaRef = {source: string; sourceStart: number | null};
export const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
export const ease = (value: number) => {const t = clamp(value); return t * t * (3 - 2 * t);};
export const asset = (source: string) => /^(?:data:|blob:|https?:)/.test(source) ? source : staticFile(source.replace(/\\/g, "/"));

/** A prepared, local asset. Sequence determines its local playback clock. */
export const PortraitMedia = ({media, style}: {media: PortraitMediaRef; style?: CSSProperties}) => {
  const {fps} = useVideoConfig();
  const css: CSSProperties = {width: "100%", height: "100%", objectFit: "cover", ...style};
  if (media.sourceStart === null) return <Img src={asset(media.source)} style={css} />;
  if (media.source.startsWith("data:video/")) return <Video src={media.source} startFrom={Math.round(media.sourceStart * fps)} muted style={css} />;
  return <OffthreadVideo src={asset(media.source)} startFrom={Math.round(media.sourceStart * fps)} muted style={css} />;
};

/** The portrait renderer owns a 360×640 design space; no landscape safe-canvas wrapper. */
export const PortraitCanvas = ({children, viewport}: {children: ReactNode; viewport?: {width: number; height: number}}) => {
  const config = useVideoConfig();
  const {width, height} = viewport ?? config;
  const scale = Math.min(width / 360, height / 640);
  return <div style={{position: "absolute", width: 360, height: 640,
    left: (width - 360 * scale) / 2, top: (height - 640 * scale) / 2,
    transform: `scale(${scale})`, transformOrigin: "top left", overflow: "hidden"}}>{children}</div>;
};

export type PortraitDemo = {
  spec: any;
  durationInFrames: number;
  fps: 30;
  reference: string;
  referenceStart?: number;
  previewBackground?: string;
};
