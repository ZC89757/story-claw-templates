import {useCurrentFrame, useVideoConfig} from "remotion";
import {ease, type PortraitDemo} from "../common";
import type {LayeredBubblesSpec} from "./layered-bubbles-contract";

const sans = "'Microsoft YaHei',sans-serif";
const serif = "'Times New Roman',serif";
type Bubble = LayeredBubblesSpec["small"];

export function LayeredBubbles({spec}: {spec: LayeredBubblesSpec}) {
  const time = useCurrentFrame() / useVideoConfig().fps;
  const cx = 234;
  const baseRadius = (value: number) => 91 * Math.sqrt(value / spec.large.value);
  const transition = ease((time - spec.large.at) / .63);
  const older = 1 - transition;
  const bubble = (item: Bubble, cy: number, display: number, alpha: number, size: number, blue = false) => {
    const radius = baseRadius(item.value);
    const textIn = ease((display - .4) / .6);
    return <g opacity={alpha}>
      <circle cx={cx} cy={cy} r={radius * display} fill={blue ? "url(#latepost-layered-bubble-blue)" : "url(#latepost-layered-bubble-pink)"}/>
      <g fill="#fffaf3" fontFamily={sans} textAnchor="middle" opacity={textIn}>
        <text x={cx} y={cy - size * .2} fontSize={size * .7}>{item.detail}</text>
        <text x={cx} y={cy + size * 1.09} fontSize={size} fontWeight={750}>{item.label}</text>
      </g>
    </g>;
  };
  const measure = (item: Bubble, y: number, size: number, opacity: number, tail: number) => <g opacity={opacity}>
    <line x1={41} x2={tail} y1={y + 3} y2={y + 3} stroke="#a8a09e" strokeWidth={.65}/>
    <text x={40} y={y} fill="#bd0013" fontFamily={serif} fontStyle="italic" fontSize={size} fontWeight={900}>{item.value}
      <tspan dx={2} fontFamily={sans} fontSize={11} fontStyle="normal" fontWeight={650} fill="#242020">{spec.unit}</tspan>
    </text>
  </g>;
  const mainIn = ease((time - .06) / .46);
  const contextIn = spec.context.map(item => ease((time - item.at) / .36));
  const newPink = ease((time - spec.large.at - .1) / .49);
  const newBlue = ease((time - spec.large.at - .31) / .43);
  return (
    <div style={{position: "absolute", inset: 0, background: "radial-gradient(ellipse 95% 25% at 50% 107%,#fbe4e2,transparent),linear-gradient(#faeee9,#fff9f4)"}}>
      <svg viewBox="0 0 360 640" width={360} height={640} style={{position: "absolute", inset: 0}}>
        <defs>
          <linearGradient id="latepost-layered-bubble-pink" x1="0" x2="1" y1="1" y2="0">
            <stop stopColor="#ffc6b8" stopOpacity=".48"/><stop offset=".61" stopColor="#fb7473" stopOpacity=".8"/><stop offset="1" stopColor="#f50015"/>
          </linearGradient>
          <linearGradient id="latepost-layered-bubble-blue" x1="0" x2="1" y1="1" y2="0">
            <stop stopColor="#c3b8df" stopOpacity=".63"/><stop offset="1" stopColor="#5b80bd" stopOpacity=".92"/>
          </linearGradient>
        </defs>
        <text x={33} y={125} fill="#2b2725" fontFamily={sans} fontWeight={750} fontSize={16}>{spec.title}</text>
        <text x={33} y={142} fill="#726967" fontFamily={sans} fontStyle="italic" fontSize={11}>{spec.sourceLine}</text>
        {bubble(spec.main, 365 - 198 * transition, mainIn, 1 - .55 * transition, 17)}
        {bubble(spec.context[0], 266 - 225 * transition, contextIn[0], .70 * older, 11)}
        {bubble(spec.context[1], 195 - 225 * transition, contextIn[1], .45 * older, 9)}
        {bubble(spec.large, 320 + (1 - newPink) * 55, newPink, .78, 18)}
        {bubble(spec.small, 444 + (1 - newBlue) * 55, newBlue, .86, 10, true)}
        {measure(spec.main, 322 - 198 * transition, 47, ease((time - spec.main.at) / .24) * older, 171)}
        {measure(spec.context[0], 250 - 225 * transition, 38, contextIn[0] * .64 * older, 185)}
        {measure(spec.context[1], 185 - 225 * transition, 33, contextIn[1] * .44 * older, 198)}
        {measure(spec.large, 276, 46, newPink, 166)}
        {measure(spec.small, 426, 46, newBlue, 178)}
      </svg>
    </div>
  );
}

export const layeredBubblesDemo: PortraitDemo = {
  fps: 30,
  durationInFrames: 321,
  reference: "晚点LatePost · BV1rvhHzoEfL · 129.2667–139.9667",
  spec: {
    title: "各种补贴都花了多少钱？",
    sourceLine: "数据来源：财政部及公开资料整理",
    unit: "亿元",
    main: {value: 900, detail: "2025 年初财政预算", label: "育儿补贴支出", at: 1.73},
    context: [
      {value: 384.8, detail: "2022 年", label: "新能源汽车补贴", at: 3.43},
      {value: 203.8, detail: "2021 年", label: "新能源汽车补贴", at: 4.13},
    ],
    large: {value: 1500, detail: "2024 年消费品以旧换新", label: "“国补”金额", at: 5.3},
    small: {value: 500, detail: "2025 年第三季度", label: "外卖大战补贴金额"},
  } satisfies LayeredBubblesSpec,
};
