import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {evaluateMgCutoutRise, MG_CUTOUT_RISE_OFFSET} from "./evaluate";
import type {MgCutoutRiseSpec} from "./types";

type Props = {spec: MgCutoutRiseSpec};

export const MgCutoutTemplate = ({spec}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = evaluateMgCutoutRise(frame / fps, spec.at);
  const translateY = (1 - progress) * MG_CUTOUT_RISE_OFFSET;

  return <AbsoluteFill style={{background: "transparent", overflow: "hidden", pointerEvents: "none"}}>
    {spec.image ? <Img
      src={staticFile(spec.image.replace(/^\/+/, "").replace(/^public[\\/]+/i, ""))}
      style={{
        position: "absolute",
        left: "50%",
        top: 70,
        width: 1360,
        height: 940,
        objectFit: "contain",
        objectPosition: "center bottom",
        transform: `translate3d(-50%, ${translateY}px, 0)`,
      }}
    /> : null}
  </AbsoluteFill>;
};
