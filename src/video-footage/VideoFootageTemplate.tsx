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
  const trimAfter = Math.max(trimBefore + 1, Math.round(spec.sourceEnd * fps));
  const selectedFrames = trimAfter - trimBefore;
  if (durationInFrames !== undefined && selectedFrames + 1 < durationInFrames) {
    throw new Error(
      `video-footage 所选片段只有 ${selectedFrames} 帧，不足以覆盖 ${durationInFrames} 帧的 HTML 时间窗口`,
    );
  }

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

