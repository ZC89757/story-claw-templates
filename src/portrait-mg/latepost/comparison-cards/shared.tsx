import {useCurrentFrame, useVideoConfig} from "remotion";
import {clamp} from "../../common";

export const cover = {position: "absolute", inset: 0} as const;
export const charcoal = "linear-gradient(180deg,#030203 0%,#030203 24%,#0c0b0c 33%,#252425 47%,#3c3b3c 63%,#525152 79%,#6b6a6b 100%)";
export const song = '"Songti SC", STSong, SimSun, serif';
export const roman = '"Times New Roman", Georgia, serif';
export const demoAsset = (file: string) => "portrait-mg/latepost/comparison-cards/" + file;
export const reference = (id: string) => "D:/MG_Reference_Library/creators/latepost/effects/" + id + "/reference.mp4";
export const travel = (t: number) => 1 - Math.pow(1 - clamp(t), 3);

export function useSeconds() {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return frame / fps;
}
