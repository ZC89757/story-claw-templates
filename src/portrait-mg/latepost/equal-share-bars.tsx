import {useCurrentFrame, useVideoConfig} from "remotion";
import {clamp, ease, type PortraitDemo} from "../common";
import type {EqualShareBarsSpec} from "./equal-share-bars-contract";

const plotLeft = 106;
const plotWidth = 211;
const firstRowTop = 164;
const rowStep = 51.4;
const sans = "'Microsoft YaHei',sans-serif";
const serif = "'Times New Roman',serif";
const proportionalUnit = (largestValue: number) => {
  const ideal = largestValue / 4;
  const magnitude = 10 ** Math.floor(Math.log10(ideal));
  const ratio = ideal / magnitude;
  return (ratio <= 1 ? 1 : ratio <= 2 ? 2 : ratio <= 2.5 ? 2.5 : ratio <= 5 ? 5 : 10) * magnitude;
};

export function EqualShareBars({spec}: {spec: EqualShareBarsSpec}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  const step = proportionalUnit(spec.groups[0].value);
  const span = step * 4;
  const ticksIn = ease((time - spec.firstBar.at) / .37);
  return (
    <div style={{position: "absolute", inset: 0, background: "radial-gradient(ellipse 95% 25% at 50% 104%,#fbe8e6 5%,transparent 100%),linear-gradient(#faf7f3,#fff9f2)"}}>
      <svg viewBox="0 0 360 640" width={360} height={640} style={{position: "absolute", inset: 0}}>
        <defs><linearGradient id="latepost-share-base" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#efc6a6" stopOpacity=".55"/><stop offset="1" stopColor="#f8d6b9" stopOpacity=".72"/></linearGradient></defs>
        <text x={33} y={124} fontFamily={sans} fill="#252525" fontSize={16} fontWeight={750}>{spec.title}</text>
        <text x={32} y={142} fontFamily={sans} fill="#8b8885" fontSize={11} fontStyle="italic">{spec.sourceLine}</text>
        {spec.groups.map(({label, value}, index) => {
          const y = firstRowTop + rowStep * index;
          const labelIn = ease((time - .1 - index * .48) / .27);
          const baseAt = index === 0 ? spec.firstBar.at : spec.otherBars.at + (index - 1) * .22;
          const ratioAt = index === 0 ? spec.firstRatio.at : spec.otherRatios.at + (index - 1) * .18;
          const grow = ease((time - baseAt) / .39);
          const red = ease((time - ratioAt) / .35);
          const w = value / span * plotWidth;
          const fillWidth = spec.equalAmount / span * plotWidth;
          const ratio = spec.equalAmount / value * 100;
          return (
            <g key={index}>
              <g textAnchor="end" fill="#252525" fontFamily={sans} opacity={labelIn} transform={`translate(0 ${6 * (1 - labelIn)})`}>
                <text x={100} y={y + 9} fontSize={14} fontWeight={750}>20%</text>
                <text x={100} y={y + 25} fontSize={13}>{label}</text>
              </g>
              <rect x={plotLeft} y={y} width={w * grow} height={25} fill="url(#latepost-share-base)" />
              <text x={plotLeft + w * grow} y={y - 2} textAnchor="end" opacity={grow} fill="#9b9390" fontFamily={serif} fontSize={11}>{value}</text>
              <rect x={plotLeft} y={y} width={fillWidth * red} height={25} fill="#db1010" opacity={red}/>
              <text x={plotLeft + fillWidth + 3} y={y + 21} opacity={red} fontFamily={serif} fontStyle="italic" fontWeight={800} fontSize={24} fill="#e40000">
                {(ratio * clamp(red)).toFixed(2)}<tspan dx={2} fontSize={12}>%</tspan>
              </text>
            </g>
          );
        })}
        <g opacity={ticksIn} fontFamily={serif} textAnchor="middle">
          {[0, 1, 2, 3, 4].map(tick => <text key={tick} x={plotLeft + tick * plotWidth / 4} y={407} fill="#15110d" fontSize={9} fontWeight={700}>{step * tick}</text>)}
        </g>
        <text x={334} y={420} textAnchor="end" fill="#aaa2a1" opacity={ticksIn} fontFamily={sans} fontSize={9}>{spec.axisLabel}</text>
      </svg>
    </div>
  );
}

export const equalShareBarsDemo: PortraitDemo = {
  fps: 30,
  durationInFrames: 607,
  reference: "晚点LatePost · BV1rvhHzoEfL · 86.333–106.567",
  spec: {
    title: "不同组别的年人均可支配收入 (2024 年)",
    sourceLine: "数据来源：国家统计局",
    axisLabel: "家庭年人均可支配收入",
    groups: [
      {label: "高收入组", value: 98809},
      {label: "中上收入组", value: 53359},
      {label: "中间收入组", value: 33925},
      {label: "中下收入组", value: 21608},
      {label: "低收入组", value: 9542},
    ],
    equalAmount: 3600,
    firstBar: {at: 4.4},
    firstRatio: {at: 9},
    otherBars: {at: 11.3},
    otherRatios: {at: 15.5},
  } satisfies EqualShareBarsSpec,
};
