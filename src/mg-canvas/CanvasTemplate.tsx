import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {expansionEase} from "../subject-expansion/evaluate";
import type {CanvasSpec} from "./schema";

export const evaluateCanvas = (spec: CanvasSpec, seconds: number) => {
  const active = Math.max(0, spec.steps.reduce((last, step, i) => step.at <= seconds ? i : last, -1));
  const step = spec.steps[active]; const previous = spec.steps[Math.max(0, active - 1)];
  const index = spec.nodes.findIndex((n) => n.id === step.nodeId);
  const previousIndex = spec.nodes.findIndex((n) => n.id === previous.nodeId);
  const move = expansionEase(seconds - step.at, 0.5);
  return {active, index, move, camera: previousIndex + (index - previousIndex) * move, visited: new Set(spec.steps.filter((s) => s.at <= seconds).map((s) => s.nodeId))};
};
export const CanvasTemplate = ({spec, group}: {spec: CanvasSpec; group: string}) => {
  const seconds = useCurrentFrame() / useVideoConfig().fps;
  const state = evaluateCanvas(spec, seconds); const current = spec.nodes[state.index];
  const detail = group === "subject-detail";
  const image = (src: string) => staticFile(src.replace(/^public[\\/]/, ""));
  return <AbsoluteFill style={{background: "#eaece4", color: "#2a4345", fontFamily: '"Microsoft YaHei", sans-serif', overflow: "hidden"}}>
    <div style={{position: "absolute", left: 90, top: 65, fontSize: 30, fontWeight: 600}}>{spec.title}</div>
    <div style={{position: "absolute", left: 0, top: 0, width: spec.nodes.length * 500 + 700, height: 1080, transform: `translateX(${-state.camera * 500}px)`}}>
      {spec.nodes.map((node, i) => {
        const pinned = detail && i === 0; const shown = pinned || state.visited.has(node.id);
        return <div key={node.id} style={{position: "absolute", left: pinned ? 100 + state.camera * 500 : 100 + i * 500, top: 245, width: 440, height: 500, opacity: shown && (!detail || pinned) ? 1 : 0, background: "linear-gradient(145deg, #fffdf3, #dde5d9)", border: "1px solid #aabab1", borderRadius: 22, boxShadow: "0 20px 42px #35554b22", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 34, boxSizing: "border-box"}}>
          {node.image ? <Img src={image(node.image)} style={{width: 300, height: 285, objectFit: "contain"}} /> : <div style={{width: 88, height: 88, border: "3px solid #87a6a3", transform: "rotate(45deg)", borderRadius: 20, marginBottom: 35, background: "#d4e3d5"}} />}
          <div style={{fontSize: node.label.length > 16 ? 28 : 36, lineHeight: 1.5, textAlign: "center", marginTop: 18}}>{node.label}</div>
        </div>;
      })}
    </div>
    <div style={{position: "absolute", left: "36%", top: "18%", width: "62%", height: "62%", boxSizing: "border-box", border: "1px solid #a8bbb2", borderRadius: 18, background: "#f7f8f1", boxShadow: "0 16px 34px #35554b16", overflow: "hidden"}}>
      <div style={{position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: detail ? state.move : 1}}>
        <div style={{maxWidth: 760, fontSize: 34, lineHeight: 1.6, textAlign: "center", padding: 30}}>{current.label}</div>
      </div>
    </div>
    <div style={{position: "absolute", left: 80, right: 80, top: 930, display: "flex", gap: 10}}>
      {spec.nodes.map((node, i) => <div key={node.id} style={{flex: 1, minWidth: 0, borderTop: `3px solid ${i === state.index ? "#d07d5a" : "#a7b9ae"}`, paddingTop: 14, color: i === state.index ? "#a55537" : "#5b7770", fontSize: spec.nodes.length > 7 ? 16 : 20, lineHeight: 1.45, opacity: state.visited.has(node.id) ? 1 : 0.3}}>{node.label}</div>)}
    </div>
  </AbsoluteFill>;
};
