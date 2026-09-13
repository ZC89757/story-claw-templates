import type {CSSProperties} from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import type {ScLongtakeFunctionArgs} from "./schema";

type Props = {spec: ScLongtakeFunctionArgs; style?: CSSProperties};

const CYAN = "#8ad3df";
const LIME = "#b9e77a";
const INK = "#edf4f2";

/** Standalone fallback/preview for the relay-video contract. Real episodes use generated MP4 nodes. */
export const ScLongtakeTemplate = ({spec, style}: Props) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const segmentCount = Math.max(2, spec.segments.length);
  const progress = Math.min(1, Math.max(0, frame / Math.max(1, durationInFrames - 1)));
  const active = Math.min(segmentCount - 1, Math.floor(progress * segmentCount));
  const pulse = 0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 2.2);
  const visibleCount = Math.min(4, segmentCount);

  return <AbsoluteFill style={{
    background: "#071014",
    color: INK,
    overflow: "hidden",
    fontFamily: '"Microsoft YaHei", "Noto Sans SC", Arial, sans-serif',
    ...style,
  }}>
    <div style={{position: "absolute", inset: 0, background: "linear-gradient(135deg, #071014 0%, #10252b 58%, #0b1619 100%)"}} />
    <div style={{position: "absolute", left: 112, top: 92, color: CYAN, fontSize: 28, fontWeight: 900, letterSpacing: 4}}>
      SC LONGTAKE / FRAME RELAY
    </div>
    <div style={{position: "absolute", left: 114, top: 154, width: 760, color: "#a9bec0", fontSize: 30, lineHeight: 1.35}}>
      One continuous visual idea, generated as a chain of matched first and last frames.
    </div>
    <div style={{position: "absolute", left: 150, right: 150, top: 360, display: "flex", alignItems: "center", gap: 30}}>
      {Array.from({length: visibleCount}).map((_, index) => {
        const isActive = index === active % visibleCount;
        const tone = isActive ? LIME : CYAN;
        return <div key={index} style={{display: "flex", alignItems: "center", gap: 30, flex: 1}}>
          <div style={{position: "relative", flex: 1, height: 248, border: `3px solid ${tone}${isActive ? "" : "66"}`, background: isActive ? "rgba(185,231,122,.12)" : "rgba(138,211,223,.06)", boxShadow: isActive ? `0 0 ${30 + pulse * 24}px rgba(185,231,122,.22)` : "none", transform: `translateY(${isActive ? -12 : 0}px)`}}>
            <div style={{position: "absolute", left: 24, top: 22, color: tone, fontSize: 22, fontWeight: 900, letterSpacing: 2}}>SHOT {String(index + 1).padStart(2, "0")}</div>
            <div style={{position: "absolute", left: 24, right: 24, bottom: 32, height: 8, background: `${tone}55`}} />
            <div style={{position: "absolute", left: 24, right: 84, bottom: 56, height: 12, background: `${tone}99`}} />
            <div style={{position: "absolute", right: 26, top: 76, width: 84, height: 84, borderRadius: "50%", border: `3px solid ${tone}`, opacity: .72}} />
          </div>
          {index < visibleCount - 1 ? <div style={{width: 54, height: 3, background: `linear-gradient(90deg, ${CYAN}, ${LIME})`, position: "relative"}}><span style={{position: "absolute", right: -2, top: -7, width: 0, height: 0, borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderLeft: `12px solid ${LIME}`}} /></div> : null}
        </div>;
      })}
    </div>
    <div style={{position: "absolute", left: 150, right: 150, bottom: 144, display: "flex", justifyContent: "space-between", alignItems: "center", color: "#b6c9c8", fontSize: 22, letterSpacing: 1.4}}>
      <span>FIRST FRAME</span>
      <span style={{color: LIME, fontWeight: 900}}>TAIL FRAME  →  NEXT FIRST FRAME</span>
      <span>LAST FRAME</span>
    </div>
  </AbsoluteFill>;
};
