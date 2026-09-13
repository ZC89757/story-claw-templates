import {AbsoluteFill, OffthreadVideo, staticFile, useVideoConfig} from "remotion";
import type {VideoFootageSpec} from "./types";

type Props = Readonly<{
  spec: VideoFootageSpec;
  /** Active template window supplied by the package runtime. */
  durationInFrames?: number;
}>;

export const VideoFootageTemplate = ({spec, durationInFrames}: Props) => {
  const {fps} = useVideoConfig();
  const trimBefore = Math.max(0, Math.round(spec.sourceStart * fps));
  const selectedFrames = Math.max(1, Math.round(spec.sourceEnd * fps) - trimBefore);
  // Extend the selected footage tail to the MG window so TTS pauses do not expose a black gap.
  const trimAfter = trimBefore + Math.max(1, selectedFrames, durationInFrames ?? 0);

  return <AbsoluteFill style={{background: "#000", overflow: "hidden"}}>
    <OffthreadVideo
      src={staticFile(spec.source)}
      trimBefore={trimBefore}
      trimAfter={trimAfter}
      muted
      style={{width: "100%", height: "100%", objectFit: "cover"}}
    />
  </AbsoluteFill>;
};
