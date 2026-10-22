import dagre from "@dagrejs/dagre";
import {useMemo} from "react";
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {expansionEase} from "../subject-expansion/evaluate";
import type {ImageGraphSpec} from "./schema";
import {EditorialGraphTemplate} from "./EditorialGraphTemplate";
export const imageGraphLayout = (spec: ImageGraphSpec) => {
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({rankdir: "LR", ranksep: 170, nodesep: 100, marginx: 70, marginy: 70}); graph.setDefaultEdgeLabel(() => ({}));
  spec.nodes.forEach((n) => graph.setNode(n.id, {width: 300, height: 245}));
  spec.edges.forEach((e) => graph.setEdge(e.from, e.to, {width: Math.max(80, Math.min(220, e.relation.length * 15)), height: 45}));
  dagre.layout(graph);
  const width = Math.max(1, graph.graph().width ?? 1); const height = Math.max(1, graph.graph().height ?? 1);
  return {graph, width, height, scale: Math.min(1.15, 1770 / width, 820 / height)};
};
const FlowImageGraphTemplate = ({spec}: {spec: ImageGraphSpec}) => {
  const seconds = useCurrentFrame() / useVideoConfig().fps;
  const layout = useMemo(() => imageGraphLayout(spec), [spec]);
  return <AbsoluteFill style={{background: "#edf0e6", color: "#2c4b50", fontFamily: '"Microsoft YaHei", sans-serif', overflow: "hidden"}}>
    <div style={{position: "absolute", left: 85, top: 60, fontSize: 29}}>{spec.title}</div>
    <div style={{position: "absolute", left: (1920 - layout.width * layout.scale) / 2, top: 140 + (820 - layout.height * layout.scale) / 2, width: layout.width, height: layout.height, transform: `scale(${layout.scale})`, transformOrigin: "top left"}}>
      <svg width={layout.width} height={layout.height} style={{position: "absolute", inset: 0}}>
        <defs><marker id="image-graph-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10Z" fill="#5b8a85" /></marker></defs>
        {spec.edges.map((edge, i) => {
          const line = layout.graph.edge(edge.from, edge.to); const progress = expansionEase(seconds - edge.at, 0.85);
          const points = line.points as {x: number; y: number}[];
          return <g key={i} opacity={progress > 0 ? 1 : 0}>
            <path d={points.map((p, n) => `${n ? "L" : "M"}${p.x} ${p.y}`).join(" ")} fill="none" stroke="#5b8a85" strokeWidth={3} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress} markerEnd={progress > 0.98 ? "url(#image-graph-arrow)" : undefined} />
            <g transform={`translate(${line.x} ${line.y})`} opacity={expansionEase(seconds - edge.at - 0.4)}>
              <rect x={-122} y={-24} width={244} height={48} rx={12} fill="#edf0e6" />
              <text textAnchor="middle" y={7} fontSize={edge.relation.length > 12 ? 17 : 22} fill="#607d76">{edge.relation}</text>
            </g>
          </g>;
        })}
      </svg>
      {spec.nodes.map((node) => {
        const p = layout.graph.node(node.id); const progress = expansionEase(seconds - node.at, 0.65);
        return <div key={node.id} style={{position: "absolute", left: p.x - 150, top: p.y - 122.5, width: 300, height: 245, opacity: progress, transform: `translateY(${(1 - progress) * 20}px)`, textAlign: "center"}}>
          {node.image ? <Img src={staticFile(node.image.replace(/^public[\\/]/, ""))} style={{width: 250, height: 165, objectFit: "contain"}} /> : <div style={{height: 165, display: "flex", alignItems: "center", justifyContent: "center"}}><div style={{width: 82, height: 82, border: "3px solid #80a69d", borderRadius: 18, background: "#dce6d5"}} /></div>}
          <div style={{fontSize: node.label.length > 12 ? 23 : 29, lineHeight: 1.45, padding: "9px 8px", background: "#edf0e6"}}>{node.label}</div>
        </div>;
      })}
    </div>
  </AbsoluteFill>;
};
export const ImageGraphTemplate = ({spec, group = "flow"}: {spec: ImageGraphSpec; group?: string}) =>
  group === "editorial" || group === "editorial-paper" ? <EditorialGraphTemplate spec={spec} paper={group === "editorial-paper"}/> : <FlowImageGraphTemplate spec={spec}/>;
