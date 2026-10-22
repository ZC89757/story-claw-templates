import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {evaluateSubjectExpansion} from "./evaluate";
import type {SubjectExpansionGroup, SubjectExpansionSpec} from "./types";
import {SubjectExpansionImpactTemplate} from "./SubjectExpansionImpactTemplate";

const INK = "#263d44";
const PAPER = "#f1eee6";
const COLORS = ["#517b85", "#bc7759", "#7f8d64", "#8a7c9b", "#a58a4b"];
const src = (image: string) => /^(https?:|data:)/i.test(image) ? image : staticFile(image.replace(/^public[\\/]+/i, "").replace(/^\/+/, ""));

export const subjectExpansionPositions = (count: number): Array<{x: number; y: number}> => {
  if (count === 2) return [{x: 1100, y: 350}, {x: 1470, y: 660}];
  if (count === 3) return [{x: 1080, y: 310}, {x: 1520, y: 495}, {x: 1100, y: 660}];
  if (count === 5) return [{x: 945, y: 330}, {x: 1270, y: 330}, {x: 1600, y: 330}, {x: 1100, y: 660}, {x: 1510, y: 660}];
  return [{x: 1080, y: 330}, {x: 1550, y: 330}, {x: 1080, y: 660}, {x: 1550, y: 660}];
};

const ProgressiveSubjectExpansionTemplate = ({spec}: {spec: SubjectExpansionSpec}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const state = evaluateSubjectExpansion(spec, frame / fps);
  const positions = subjectExpansionPositions(spec.items.length);
  return <AbsoluteFill style={{background: PAPER, color: INK, overflow: "hidden", fontFamily: '"Microsoft YaHei", "Noto Sans CJK SC", sans-serif'}}>
    <AbsoluteFill style={{backgroundImage: "radial-gradient(ellipse at 20% 43%, #fffdf6 0%, transparent 62%), radial-gradient(#697d791c .8px, transparent .8px)", backgroundSize: "auto, 14px 14px"}} />
    <svg width={1920} height={1080} style={{position: "absolute", inset: 0}}>
      <ellipse cx={355} cy={690} rx={248} ry={55} fill="#dadbd0" opacity={state.subjectProgress} />
      <ellipse cx={355} cy={679} rx={248} ry={55} fill="#e9e8de" stroke="#c4cdc6" strokeWidth={2} />
      {spec.items.map((item, index) => {
        const p = positions[index];
        const itemState = state.items[index];
        // Wider rows use a rail above each row so links never run through an earlier image.
        const endpoint = spec.items.length >= 4 ? {x: p.x, y: p.y - 118} : {x: p.x - 180, y: p.y};
        const d = spec.items.length >= 4
          ? `M 558 575 C 680 575, 700 ${p.y - 165}, 745 ${p.y - 165} H ${p.x - 24} Q ${p.x} ${p.y - 165}, ${p.x} ${p.y - 141} V ${endpoint.y}`
          : `M 558 575 C 730 575, 720 ${p.y}, ${endpoint.x} ${endpoint.y}`;
        return <g key={item.id} opacity={itemState.progress * itemState.opacity}>
          <path d={d} fill="none" stroke={COLORS[index]} strokeWidth={2 + itemState.focus} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - itemState.progress} opacity={0.64} />
          <circle cx={endpoint.x} cy={endpoint.y} r={4} fill={COLORS[index]} />
        </g>;
      })}
    </svg>
    <div style={{position: "absolute", left: 100, top: 218, width: 510, height: 500, opacity: state.subjectProgress * state.subjectOpacity, transform: `translateY(${(1 - state.subjectProgress) * 88}px)`}}>
      {spec.subject.image ? <Img src={src(spec.subject.image)} style={{width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 15px 15px #24393418)"}} /> : null}
    </div>
    <div style={{position: "absolute", left: 100, top: 765, width: 510, textAlign: "center", fontSize: 34, fontWeight: 600, letterSpacing: 2, opacity: state.subjectProgress}}>{spec.subject.label}</div>
    {spec.items.map((item, index) => {
      const p = positions[index];
      const s = state.items[index];
      const hasImage = Boolean(item.image);
      return <div key={item.id} style={{position: "absolute", left: p.x - 155, top: p.y - 105, width: 310, height: 210, opacity: s.progress * s.opacity, transform: `translate(${(1 - s.progress) * -32}px, ${(1 - s.progress) * 20}px) scale(${0.96 + s.progress * 0.04 + s.focus * 0.025})`, transformOrigin: "center", textAlign: "center"}}>
        {hasImage ? <Img src={src(item.image!)} style={{width: 190, height: 142, objectFit: "contain", filter: "drop-shadow(0 7px 9px #24393412)"}} /> : <div style={{height: 90, display: "flex", justifyContent: "center", alignItems: "flex-end"}}><span style={{width: 32, height: 4, borderRadius: 2, background: COLORS[index]}} /></div>}
        <div style={{fontSize: item.label.length > 10 ? 23 : 29, lineHeight: 1.35, fontWeight: 600, marginTop: 4, overflowWrap: "anywhere"}}>{item.label}</div>
        <div style={{fontSize: item.relation.length > 12 ? 20 : 23, lineHeight: 1.4, color: COLORS[index], marginTop: 7, overflowWrap: "anywhere"}}>{item.relation}</div>
        <div style={{margin: "13px auto 0", height: 2, width: 54 + s.focus * 90, background: COLORS[index], opacity: s.focus * 0.65}} />
      </div>;
    })}
    {state.note ? <div style={{position: "absolute", left: 790, top: 910, width: 960, paddingLeft: 22, borderLeft: "3px solid #9caeaa", fontSize: 27, lineHeight: 1.5, letterSpacing: 0.5, opacity: state.noteProgress, transform: `translateY(${(1 - state.noteProgress) * 12}px)`}}>{state.note}</div> : null}
  </AbsoluteFill>;
};

export const SubjectExpansionTemplate = ({spec, group = "progressive"}: {spec: SubjectExpansionSpec; group?: SubjectExpansionGroup}) =>
  group === "impact" ? <SubjectExpansionImpactTemplate spec={spec} /> : <ProgressiveSubjectExpansionTemplate spec={spec} />;
