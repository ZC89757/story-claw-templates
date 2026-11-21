import type {CSSProperties, ReactNode} from "react";
import {useCurrentFrame, useVideoConfig} from "remotion";
import {PortraitMedia, ease} from "../../common";

export const assetRoot = "portrait-mg/latepost/product-scenes/";
export const sans = '"Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
export const song = 'SimSun, "Noto Serif CJK SC", serif';
export const lerp = (start: number, end: number, progress: number) => start + (end - start) * progress;
export const phase = (time: number, start: number, duration: number) => ease((time - start) / duration);
export const useSeconds = () => useCurrentFrame() / useVideoConfig().fps;
export const nightGradient = "linear-gradient(#000 0%,#090909 23%,#2f2f2f 58%,#666 100%)";

export function Layer({children, style}: {children?: ReactNode; style?: CSSProperties}) {
  return <div style={{position: "absolute", inset: 0, ...style}}>{children}</div>;
}

export function Cutout({source, x, y, width, height}: {source: string; x: number; y: number; width: number; height: number}) {
  return <div style={{position: "absolute", left: x, top: y, width, height}}>
    <PortraitMedia media={{source, sourceStart: null}} style={{objectFit: "contain"}} />
  </div>;
}
