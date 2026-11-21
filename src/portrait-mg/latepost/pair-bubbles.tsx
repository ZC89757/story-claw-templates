import {Img, useCurrentFrame, useVideoConfig} from "remotion";
import {asset, ease, type PortraitDemo} from "../common";
import type {PairBubblesSpec} from "./pair-bubbles-contract";

const numberFont = "'Times New Roman',serif";
const serif = "SimSun,serif";
const sans = "'Microsoft YaHei',sans-serif";

export function PairBubbles({spec}: {spec: PairBubblesSpec}) {
  const fps = useVideoConfig().fps;
  const time = useCurrentFrame() / fps;
  const small = ease((time - .02) / .42);
  const large = ease((time - spec.second.at) / .4);
  const smallRadius = Math.sqrt(spec.first.value / spec.second.value) * 100;
  const smallCenter = 180 + 88 * ease((time - spec.second.at + .04) / .41);
  const largeCenter = 181 - 53 * large;
  const firstLabel = ease((time - .34) / .24);
  const secondLabel = ease((time - spec.second.at - .33) / .22);
  return (
    <div style={{position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 104%,#fbe3e0,transparent 58%),linear-gradient(#faf6f1,#fdf2e9 66%,#fff6ed)"}}>
      <Img src={asset(spec.watermarkImage)} style={{position: "absolute", left: 0, top: 200, width: 360, height: 271, objectFit: "contain", opacity: .2}} />
      <svg viewBox="0 0 360 640" width={360} height={640} style={{position: "absolute", inset: 0}}>
        <defs><linearGradient id="latepost-horizontal-money-bubble" x1="0" x2="1" y1="1" y2="0">
          <stop stopColor="#ff1515"/><stop offset=".34" stopColor="#f93a3b" stopOpacity=".96"/><stop offset="1" stopColor="#ffc0b9" stopOpacity=".57"/>
        </linearGradient></defs>
        <text x={180} y={193} fontFamily={numberFont} fontWeight={900} fontSize={101} textLength={291} lengthAdjust="spacingAndGlyphs" textAnchor="middle" fill="#f8ded9" opacity={.26}>{spec.year}</text>
        <circle cx={largeCenter} cy={265} r={100 * large} fill="url(#latepost-horizontal-money-bubble)"/>
        <circle cx={smallCenter} cy={265} r={smallRadius * small} fill="url(#latepost-horizontal-money-bubble)"/>
        <g textAnchor="middle" fill="#fffaf1">
          <g opacity={ease((time - spec.second.at - .13) / .19)}>
            <text x={largeCenter} y={279} fontFamily={numberFont} fontWeight={900} fontSize={47}>{spec.second.value}</text>
            <text x={largeCenter} y={301} fontFamily={sans} fontSize={16} fontWeight={700}>{spec.unit}</text>
          </g>
          <g opacity={ease((time - .19) / .2)}>
            <text x={smallCenter} y={267} fontFamily={numberFont} fontWeight={900} fontSize={20}>{spec.first.value}</text>
            <text x={smallCenter} y={283} fontFamily={sans} fontSize={12} fontWeight={700}>{spec.unit}</text>
          </g>
        </g>
        <g fontFamily={serif} fontWeight={900} fontSize={24} textAnchor="middle">
          <g opacity={firstLabel}>
            <line x1={smallCenter} x2={smallCenter} y1={351} y2={375} stroke="#5d5550" strokeWidth={1} strokeOpacity={.65} />
            <text x={smallCenter} y={404}>{spec.first.label}</text>
          </g>
          <g opacity={secondLabel}>
            <line x1={largeCenter} x2={largeCenter} y1={382} y2={405} stroke="#5d5550" strokeWidth={1} strokeOpacity={.65} />
            <text x={largeCenter} y={431}>{spec.second.label}</text>
          </g>
        </g>
        <text x={180} y={459} fill="#7b6f65" opacity={secondLabel} fontFamily={serif} fontSize={9} textAnchor="middle">{spec.note}</text>
      </svg>
    </div>
  );
}

export const pairBubblesDemo: PortraitDemo = {
  fps: 30,
  durationInFrames: 88,
  reference: "晚点LatePost · BV1rmWqzEEVU · 112.500–115.420",
  spec: {
    year: 2024,
    watermarkImage: "portrait-mg/latepost/nobel-watermark.png",
    first: {label: "诺贝尔奖金", value: 4125},
    second: {label: "股票分红", value: 9531, at: 1.22},
    unit: "万元",
    note: "（注：汇率按瑞典克朗等于 0.75 元人民币计算）",
  } satisfies PairBubblesSpec,
};
