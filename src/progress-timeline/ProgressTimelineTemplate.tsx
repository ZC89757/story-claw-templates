import {CSSProperties} from "react";
import {AbsoluteFill, Audio, useCurrentFrame, useVideoConfig} from "remotion";
import {evaluateProgressTimeline} from "./evaluate";
import {ProgressTimelineSpec} from "./types";
import {horizontalTimelineLayout} from "./horizontal-layout";

type Props = {spec: ProgressTimelineSpec; audioSrc?: string; style?: CSSProperties};
const TRACK_Y = 690;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const smooth = (value: number) => value * value * (3 - 2 * value);

export const ProgressTimelineTemplate = ({spec, audioSrc, style}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  const state = evaluateProgressTimeline(spec, seconds);
  const {trackWidth, trackLeft, nodeX, viewportOffset: offsetForProgress} = horizontalTimelineLayout(spec);
  const viewportOffset = offsetForProgress(state.progress);
  const active = spec.nodes[state.activeIndex];
  const summaryAge = Math.max(0, seconds - active.at);
  const summaryReveal = smooth(clamp(summaryAge / 0.45, 0, 1));

  return <AbsoluteFill style={{background: "#f4f1ea", color: "#17201b", fontFamily: '"Microsoft YaHei", Arial, sans-serif', overflow: "hidden", ...style}}>
    {audioSrc ? <Audio src={audioSrc} /> : null}
    <div style={{position: "absolute", left: 118, top: 104, zIndex: 5}}>
      <div style={{fontSize: 58, fontWeight: 900}}>{spec.title}</div>
      <div style={{fontSize: 27, color: "#677068", marginTop: 12}}>{spec.subtitle}</div>
    </div>

    <div style={{position: "absolute", left: 118, top: 270, width: 760, minHeight: 245, padding: "38px 40px", boxSizing: "border-box", background: "#fffdfa", borderLeft: "10px solid #b33b2f", boxShadow: "0 18px 55px rgba(23,32,27,.12)", opacity: summaryReveal, transform: `translateY(${(1 - summaryReveal) * 24}px)`}}>
      <div style={{fontSize: 40, lineHeight: 1.45, fontWeight: 800}}>{active.title}</div>
    </div>

    <div style={{position: "absolute", left: 0, top: 0, width: trackWidth, height: 1080, transform: `translateX(${-viewportOffset}px)`}}>
      <div style={{position: "absolute", left: trackLeft, top: TRACK_Y, width: trackWidth - trackLeft * 2, height: 10, background: "#d4d2ca"}} />
      <div style={{position: "absolute", left: trackLeft, top: TRACK_Y, width: Math.max(0, nodeX(state.progress) - trackLeft), height: 10, background: "#b33b2f"}} />
      {spec.nodes.map((node, index) => {
        const x = nodeX(node.progress);
        const complete = state.progress >= node.progress;
        const isActive = index === state.activeIndex;
        const size = node.kind === "major" ? 54 : 28;
        return <div key={node.id} style={{position: "absolute", left: x, top: TRACK_Y + 5, transform: "translate(-50%, -50%)"}}>
          <div style={{width: size, height: size, borderRadius: "50%", background: complete ? "#b33b2f" : "#f4f1ea", border: `${node.kind === "major" ? 8 : 5}px solid ${complete ? "#b33b2f" : "#949991"}`, boxSizing: "border-box", boxShadow: isActive ? "0 0 0 15px rgba(179,59,47,.16)" : "none"}} />
          <div style={{position: "absolute", width: node.kind === "major" ? 300 : 230, left: "50%", transform: "translateX(-50%)", top: node.kind === "major" ? 62 : 42, textAlign: "center"}}>
            <div style={{fontSize: node.kind === "major" ? 40 : 30, lineHeight: 1.1, fontWeight: 900, color: complete ? "#17201b" : "#858a83"}}>{node.eyebrow}</div>
          </div>
        </div>;
      })}
    </div>
  </AbsoluteFill>;
};
