import type {ReactNode} from "react";
import {Sequence, useVideoConfig} from "remotion";
import type {MgCompositionBounds} from "./runtime";
import {CanvasTemplate, CANVAS_LAYOUT} from "./mg-canvas";
import {TimelineWindowTemplate, TIMELINE_WINDOW_LAYOUT} from "./progress-timeline";
import {PartWholeTemplate} from "./part-whole-chart";
import {ImageGraphTemplate} from "./image-directed-graph";
import {ImageComparisonTemplate} from "./image-side-by-side";
import {TimedTableTemplate} from "./timed-table";
import {canvasPreviewSpec, timelineWindowPreviewSpec, piePreviewSpec, imageGraphPreviewSpec, imageComparisonPreviewSpec} from "./explainer-previews";

/** Preview composition only: actual components inside the Provider's declared bounds. */
const InsideWindow = ({bounds, from, duration, children}: {bounds: MgCompositionBounds; from: number; duration: number; children: ReactNode}) => {
  const {fps} = useVideoConfig();
  return <Sequence from={Math.round(from * fps)} durationInFrames={Math.round(duration * fps)} layout="none">
    <div style={{position: "absolute", left: bounds.x * 1920, top: bounds.y * 1080, width: bounds.width * 1920, height: bounds.height * 1080, overflow: "hidden"}}>
      <div style={{width: 1920, height: 1080, transform: `scale(${Math.min(bounds.width, bounds.height)})`, transformOrigin: "top left"}}>{children}</div>
    </div>
  </Sequence>;
};
export const ExplainerWindowPreview = ({group}: {group: "path-follow" | "subject-detail" | "content-window"}) => {
  const timeline = group === "content-window";
  const bounds = timeline ? TIMELINE_WINDOW_LAYOUT.bounds : CANVAS_LAYOUT.bounds;
  const graph = {...imageGraphPreviewSpec, nodes: imageGraphPreviewSpec.nodes.map((n) => ({...n, at: n.at / 5})), edges: imageGraphPreviewSpec.edges.map((e) => ({...e, at: e.at / 5}))};
  const comparison = {...imageComparisonPreviewSpec, items: imageComparisonPreviewSpec.items.map((p) => ({...p, at: p.at / 5})), highlights: []};
  return <>
    {timeline ? <TimelineWindowTemplate spec={timelineWindowPreviewSpec} /> : <CanvasTemplate spec={canvasPreviewSpec} group={group} />}
    <InsideWindow bounds={bounds} from={0.7} duration={2.1}><PartWholeTemplate spec={{...piePreviewSpec, parts: piePreviewSpec.parts.map((p) => ({...p, at: 0.1}))}} /></InsideWindow>
    <InsideWindow bounds={bounds} from={3.65} duration={2.2}><ImageGraphTemplate spec={graph} /></InsideWindow>
    <InsideWindow bounds={bounds} from={6.65} duration={2.2}><TimedTableTemplate spec={{size: {rows: 2, columns: 2}, cells: [
      {text: "统计对象", at: 0}, {text: "统计口径", at: 0}, {text: "国内抖音", at: 0.25}, {text: "日活用户", at: 0.5},
    ]}} /></InsideWindow>
    {timeline ? <InsideWindow bounds={bounds} from={9.65} duration={2.2}><ImageComparisonTemplate spec={comparison} /></InsideWindow> : null}
  </>;
};
