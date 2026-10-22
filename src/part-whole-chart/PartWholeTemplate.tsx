import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {expansionEase} from "../subject-expansion/evaluate";
import {chartRevealProgress} from "../chart-reveal";
import type {PartWholeSpec} from "./schema";

const COLORS = ["#db7955", "#4f8992", "#9aa875", "#a18ab6", "#c1a45e", "#77a899"];
const fmt = (n: number) => n.toLocaleString("zh-CN", {maximumFractionDigits: 2});
export const evaluatePartWhole = (spec: PartWholeSpec, seconds: number) => spec.parts.map((part) => ({...part, shown: part.value * chartRevealProgress(seconds - part.at, 1.2)}));
export const PartWholeTemplate = ({spec}: {spec: PartWholeSpec}) => {
  const seconds = useCurrentFrame() / useVideoConfig().fps;
  const parts = evaluatePartWhole(spec, seconds);
  let angle = -90;
  const arcs = parts.map((part, i) => {
    const degrees = part.shown / spec.total.value * 360;
    const start = angle; angle += degrees;
    return {part, i, start, degrees};
  });
  return <AbsoluteFill style={{background: "#f3f0e8", color: "#293e42", fontFamily: '"Microsoft YaHei", sans-serif'}}>
    <div style={{position: "absolute", left: 100, top: 68, fontSize: 32, fontWeight: 600}}>{spec.title}</div>
    <svg width={1920} height={1080}>
      <circle cx={660} cy={540} r={335} fill="#dce1d5" />
      {arcs.map(({part, i, start, degrees}) => {
        const x1 = 660 + 335 * Math.cos(start * Math.PI / 180); const y1 = 540 + 335 * Math.sin(start * Math.PI / 180);
        const x2 = 660 + 335 * Math.cos((start + degrees) * Math.PI / 180); const y2 = 540 + 335 * Math.sin((start + degrees) * Math.PI / 180);
        return degrees >= 359.999 ? <circle key={i} cx={660} cy={540} r={335} fill={COLORS[i]} />
          : degrees > 0 ? <path key={i} d={`M660 540 L${x1} ${y1} A335 335 0 ${degrees > 180 ? 1 : 0} 1 ${x2} ${y2} Z`} fill={COLORS[i]} stroke="#f3f0e8" strokeWidth={3} /> : null;
      })}
      <circle cx={660} cy={540} r={145} fill="#f3f0e8" />
      <text x={660} y={527} textAnchor="middle" fontSize={29} fill="#5a7478">{spec.total.label}</text>
      <text x={660} y={580} textAnchor="middle" fontSize={44} fontWeight={600} fill="#293e42">{fmt(spec.total.value)}{spec.total.unit}</text>
    </svg>
    <div style={{position: "absolute", left: 1120, top: 270, width: 660}}>
      {parts.map((part, i) => <div key={part.label} style={{padding: "22px 0", borderBottom: "1px solid #cbd3c8", opacity: expansionEase(seconds - part.at)}}>
        <div style={{fontSize: 28, color: COLORS[i]}}>{part.label}</div>
        <div style={{fontSize: 43, fontWeight: 600, marginTop: 10}}>{fmt(part.shown)}{spec.total.unit}<span style={{fontSize: 29, marginLeft: 25}}>{(part.shown / spec.total.value * 100).toLocaleString("zh-CN", {maximumFractionDigits: 1})}%</span></div>
      </div>)}
      <div style={{fontSize: 24, color: "#768783", paddingTop: 25}}>灰色区域：其余部分</div>
    </div>
  </AbsoluteFill>;
};
