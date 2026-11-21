import type {CSSProperties, ReactNode} from "react";
import {useCurrentFrame, useVideoConfig} from "remotion";
import {ease} from "../../common";

export const song = 'SimSun, "Noto Serif CJK SC", serif';
export const phase = (time: number, start: number, duration: number) => ease((time - start) / duration);
export const useSeconds = () => useCurrentFrame() / useVideoConfig().fps;

export function Layer({children, style}: {children?: ReactNode; style?: CSSProperties}) {
  return <div style={{position: "absolute", inset: 0, ...style}}>{children}</div>;
}
