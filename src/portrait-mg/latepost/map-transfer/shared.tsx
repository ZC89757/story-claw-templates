import type {CSSProperties} from "react";
import {useCurrentFrame, useVideoConfig} from "remotion";
import {PortraitMedia, ease} from "../../common";

export const sans = '"Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
export const song = '"SimSun", "Noto Serif CJK SC", serif';
export const time30 = (frame: number) => frame / 30;
export function useTime() {
  return useCurrentFrame() / useVideoConfig().fps;
}
export function progress(time: number, start: number, duration: number) {
  return ease((time - start) / duration);
}
export function Still({source, style}: {source: string; style: CSSProperties}) {
  return <PortraitMedia media={{source, sourceStart: null}} style={{position: "absolute", objectFit: "contain", ...style}} />;
}


