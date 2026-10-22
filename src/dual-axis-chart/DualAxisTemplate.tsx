import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {expansionEase} from "../subject-expansion/evaluate";
import {chartRevealProgress} from "../chart-reveal";
import type {DualAxisSpec} from "./schema";

export const DualAxisTemplate = ({spec,group="line-overlay"}: {spec: DualAxisSpec;group?:string}) => {
  const seconds = useCurrentFrame() / useVideoConfig().fps;
  const compact=group==="editorial-overlay";
  const left = 175; const top = compact?155:180; const width = 1570; const height = compact?270:420;
  const x = (i: number) => left + i / (spec.categories.length - 1) * width;
  const colors = ["#f2bc75", "#79d1df"];
  return <AbsoluteFill style={{background: "transparent", fontFamily: '"Microsoft YaHei", sans-serif', color: "#eff4ec"}}>
    <div style={{position: "absolute", left: 75, top: 45, width: 1770, height: compact?505:680, borderRadius: 26, background: "linear-gradient(#10252cea, #10252cbd)", border: "1px solid #d8eeed39"}} />
    <div style={{position: "absolute", left: 130, top: compact?65:80, fontSize: compact?28:31, fontWeight: 600}}>{spec.title}</div>
    <svg width={1920} height={1080} style={{position: "absolute", inset: 0}}>
      {Array.from({length: 6}, (_, i) => <line key={i} x1={left} x2={left + width} y1={top + height * i / 5} y2={top + height * i / 5} stroke="#c4d9d62e" />)}
      {([spec.leftAxis, spec.rightAxis] as const).map((axis, a) => <g key={a}>
        <text x={a ? left + width : left} y={compact?130:150} textAnchor={a ? "end" : "start"} fill={colors[a]} fontSize={25}>{axis.label}（{axis.unit}）</text>
        {Array.from({length: 6}, (_, i) => <text key={i} x={a ? left + width + 18 : left - 18} y={top + height * i / 5 + 8} textAnchor={a ? "start" : "end"} fill={colors[a]} fontSize={24}>{(axis.max - (axis.max - axis.min) * i / 5).toLocaleString("zh-CN", {maximumFractionDigits: 1})}</text>)}
      </g>)}
      {spec.series.map((s) => {
        const a = s.axis === "left" ? 0 : 1; const axis = a ? spec.rightAxis : spec.leftAxis;
        const y = (v: number) => top + (1 - (v - axis.min) / (axis.max - axis.min)) * height;
        return <g key={s.name}>
          {s.data.slice(1).map((p, i) => {
            const prev = s.data[i]; const progress = chartRevealProgress(seconds - p.at, 0.85);
            return <line key={i} x1={x(i)} y1={y(prev.value)} x2={x(i) + (x(i + 1) - x(i)) * progress} y2={y(prev.value) + (y(p.value) - y(prev.value)) * progress} stroke={colors[a]} strokeWidth={5} strokeLinecap="round" opacity={progress > 0 ? 1 : 0} />;
          })}
          {s.data.map((p, i) => <g key={i} opacity={expansionEase(seconds - p.at)}><circle cx={x(i)} cy={y(p.value)} r={7} fill={colors[a]} /><text x={x(i) + (i === 0 ? 12 : i === s.data.length - 1 ? -12 : 0)} y={y(p.value) + (a ? 38 : -22)} textAnchor={i === 0 ? "start" : i === s.data.length - 1 ? "end" : "middle"} fill={colors[a]} fontSize={26}>{p.value}{axis.unit}</text></g>)}
        </g>;
      })}
      {spec.categories.map((category, i) => <text key={category} x={x(i)} y={compact?475:650} textAnchor="middle" fill="#d8e4df" fontSize={26}>{category}</text>)}
    </svg>
    <div style={{position: "absolute", left: 130, top: compact?505:680, fontSize: 20, color: "#d3ded7"}}>左右轴单位不同，曲线高度与斜率不作直接比较</div>
  </AbsoluteFill>;
};
