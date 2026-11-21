import {useCurrentFrame, useVideoConfig} from "remotion";
import {ease} from "../../common";

export const assetRoot = "portrait-mg/latepost/structure-batch/";
export const cover = {position: "absolute", inset: 0} as const;
export const charcoal = "linear-gradient(180deg,#020003 18%,#030205 25%,#090909 31.25%,#201f22 46.9%,#363538 62.5%,#49484b 75%,#615e62 90%,#6e6d6e)";
export const displayFont = 'STSong, "Songti SC", SimSun, serif';
export const roman = '"Times New Roman", Georgia, serif';
export const labels = 'DengXian, "Microsoft YaHei", sans-serif';

export function useSceneSeconds() {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return frame / fps;
}

export const tween = (a: number, b: number, progress: number) => a + (b - a) * ease(progress);
