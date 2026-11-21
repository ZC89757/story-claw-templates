import {interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {chartCanvas, chartSvg, easeOut, numbers, progress, sans, serif} from "./common";
import {twoToneBubbleContract, type TwoToneBubbleSpec} from "./two-tone-bubbles-contract";
import type {PortraitDemo} from "../../common";

const colors = {
  red: {fill: "#e51313", edge: "#e60000", core: "#ff0804", figure: "#ee1313"},
  blue: {fill: "#2865cd", edge: "#4f78bd", core: "#3579e3", figure: "#ae1021"},
};

const appear = (time: number, at: number) => interpolate(time - at, [0, .07, .21, .39, .49],
  [0, .08, .73, 1.04, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

function BubbleAmount({x, y, value, unit, color, time, at, size, align}: {
  x: number; y: number; value: string; unit: string; color: string; time: number; at: number;
  size: number; align: "start" | "end";
}) {
  const opacity = progress(time, at, .13);
  const numberWidth = [...value].reduce((sum, glyph) => sum + (glyph === "." ? .18 : .40) * size, 0);
  const start = align === "end" ? x - numberWidth - unit.length * 11.7 : x;
  return <g opacity={opacity} transform={`translate(0 ${(1 - easeOut(opacity)) * 9})`}>
    <text x={start} y={y} fontFamily={numbers} fontStyle="italic" fontWeight={700} fontSize={size}
      textLength={numberWidth} lengthAdjust="spacingAndGlyphs" fill={color}>{value}</text>
    <text x={start + numberWidth + 1} y={y - 1} fontFamily={sans} fontSize={11.7} fill="#fff">{unit}</text>
  </g>;
}

export function TwoToneBubbles({spec}: {spec: TwoToneBubbleSpec}) {
  const time = useCurrentFrame() / useVideoConfig().fps;
  const {first, second} = spec;
  const rows = [
    {group: first, x: 115.5, radius: 85.5, dot: 15.2, color: colors.red, nameAt: -.045, outputText: {x: 41, y: 215, size: 29}, alignment: "end" as const},
    {group: second, x: 244.7, radius: 60.7, dot: 17, color: colors.blue, nameAt: second.at, outputText: {x: 251, y: 237, size: 33}, alignment: "start" as const},
  ];
  return <div style={chartCanvas}>
    <svg viewBox="0 0 360 640" width={360} height={640} style={chartSvg}>
      <text x={0} y={134.5} transform="translate(27 0) scale(.906 1)" fill="#faf9fa" fontFamily={sans} fontSize={21} fontWeight={700}>{spec.title}</text>
      <text x={28} y={153} fill="#8b8687" fontFamily={sans} fontSize={10.6} fontStyle="italic" transform="translate(28 0) scale(.86 1) translate(-28 0)">{spec.sourceNote}</text>
      {rows.map(({group, x, nameAt}) => {
        const entrance = progress(time, nameAt, .33);
        const rise = easeOut(progress(time, nameAt + .04, .42));
        return <g key={x} opacity={entrance}>
          <line x1={x} x2={x} y1={414 - 237 * rise} y2={414} stroke="#fff" strokeOpacity={.095} strokeDasharray="2 2" />
          <text x={x} y={452 + (1 - easeOut(entrance)) * 23} textAnchor="middle" fontFamily={serif}
            fontSize={46} fontWeight={700} textLength={group.name.length * 25.5} lengthAdjust="spacingAndGlyphs"
            fill="#fff" stroke="#fff" strokeWidth={.4}>{group.name}</text>
        </g>;
      })}
      {rows.map(({group, x, radius, color}) => (
        <circle key={x} cx={x} cy={304.6} r={radius * easeOut(progress(time, group.output.at, .57))}
          fill={color.fill} fillOpacity={.245} stroke={color.edge} strokeOpacity={.63} strokeWidth={.75} />
      ))}
      <rect x={115.5} y={289} width={129.2 * easeOut(progress(time, second.workers.at, .32))}
        height={31} fill="#fff" opacity={.046 * progress(time, second.workers.at, .15)} />
      {rows.map(({group, x, dot, color, alignment, outputText}) => <g key={x}>
        <circle cx={x} cy={304.6} r={dot * appear(time, group.workers.at)} fill={color.core} />
        <BubbleAmount x={alignment === "end" ? 111 : 251} y={310} size={28}
          value={group.workers.value} unit={spec.workerUnit} color={color.figure}
          time={time} at={group.workers.at + .07} align={alignment} />
        <BubbleAmount {...outputText} value={group.output.value} unit={spec.outputUnit}
          color={color.figure} time={time} at={group.output.at + .43} align="start" />
      </g>)}
    </svg>
  </div>;
}

const demo: PortraitDemo = {
  fps: 30,
  durationInFrames: 215,
  reference: "晚点 LatePost · BV1WAJy6mE4y · 30.867–38.067",
  spec: {
    title: "中美特斯拉工人生产效率对比",
    sourceNote: "数据来源：单伟建《揭开中国生产力悖论》",
    first: {name: "上海工厂", workers: {value: "2", at: 29 / 30}, output: {value: "100", at: 64 / 30}},
    second: {name: "加州工厂", at: 117 / 30, workers: {value: "2.2", at: 146 / 30}, output: {value: "46.4", at: 175 / 30}},
    workerUnit: "万名工人",
    outputUnit: "万辆车",
  } satisfies TwoToneBubbleSpec,
};

export const twoToneBubbles = {...twoToneBubbleContract, Component: TwoToneBubbles, demo};
