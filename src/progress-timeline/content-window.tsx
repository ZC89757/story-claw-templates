import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import type {MgCompositionLayout, MgCompositionSlot} from "../runtime";
import type {ProgressTimelineSpec} from "./types";
import {expansionEase} from "../subject-expansion/evaluate";
export const TIMELINE_WINDOW_GROUP = "content-window";
export const TIMELINE_WINDOW_LAYOUT: MgCompositionLayout = {bounds: {x: 0.27, y: 0.12, width: 0.68, height: 0.68}};
export const resolveTimelineWindowSlots = (value: unknown, fps: number, durationFrames: number): readonly MgCompositionSlot[] => {
  const spec = value as ProgressTimelineSpec;
  if (!spec?.nodes?.every((node) => node.id.startsWith(`${TIMELINE_WINDOW_GROUP}-`))) return [];
  if (!(fps > 0) || !Number.isInteger(durationFrames) || durationFrames < 1) throw new Error("invalid timeline window timing");
  return spec.nodes.flatMap((node, i) => {
    const openFrame = Math.ceil((node.at + (i ? 0.45 : 0)) * fps);
    const closeFrame = Math.min(durationFrames, spec.nodes[i + 1] ? Math.round(spec.nodes[i + 1].at * fps) : durationFrames);
    return openFrame < closeFrame ? [{slotId: `node-${i + 1}`, openFrame, closeFrame}] : [];
  });
};
export const TimelineWindowTemplate = ({spec}: {spec: ProgressTimelineSpec}) => {
  const seconds = useCurrentFrame() / useVideoConfig().fps;
  const active = Math.max(0, spec.nodes.reduce((last, node, i) => node.at <= seconds ? i : last, -1));
  const node = spec.nodes[active]; const from = Math.max(0, Math.min(spec.nodes.length - 5, active - 2));
  const shown = spec.nodes.slice(from, from + 5); const gap = 1660 / Math.max(1, shown.length - 1);
  return <AbsoluteFill style={{background: "#e8eee8", color: "#2c494c", fontFamily: '"Microsoft YaHei", sans-serif'}}>
    <div style={{position: "absolute", left: 75, top: 65, fontSize: 29}}>{spec.title}</div>
    <div style={{position: "absolute", left: 75, top: 290, width: 360}}>
      <div style={{fontSize: 45, fontWeight: 600, color: "#387e83"}}>{node.eyebrow}</div>
      <div style={{fontSize: 29, lineHeight: 1.7, marginTop: 32}}>{node.title}</div>
    </div>
    <div style={{position: "absolute", left: "27%", top: "12%", width: "68%", height: "68%", background: "#f7faf3", border: "1px solid #afc4b5", boxShadow: "0 14px 34px #3e695a1c", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", padding: 110}}>
      <div style={{fontSize: 34, lineHeight: 1.7, textAlign: "center", opacity: expansionEase(seconds - node.at, 0.45)}}>{node.title}</div>
    </div>
    <svg width={1920} height={1080}>
      <line x1={130} y1={930} x2={1790} y2={930} stroke="#a9c0b3" strokeWidth={3} />
      {shown.map((n, i) => <g key={n.id} opacity={from + i <= active ? 1 : 0.45}>
        <circle cx={130 + gap * i} cy={930} r={from + i === active ? 11 : 7} fill={from + i === active ? "#d2895c" : "#528a83"} />
        <text x={130 + gap * i} y={990} textAnchor={i === 0 ? "start" : i === shown.length - 1 ? "end" : "middle"} fontSize={29} fill="#365853">{n.eyebrow}</text>
      </g>)}
    </svg>
  </AbsoluteFill>;
};
