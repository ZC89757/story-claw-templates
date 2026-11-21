import {useCurrentFrame, useVideoConfig} from "remotion";
import {clamp, ease, type PortraitDemo} from "../common";
import type {CrossingLinesSpec} from "./crossing-lines-contract";

const plot = {left: 83, right: 314, top: 201, bottom: 420};
const red = "#e60b09";
const latin = "'Times New Roman',serif";
const sans = "'Microsoft YaHei',sans-serif";
const serif = "SimSun,serif";
const xAt = (index: number) => plot.left + index * (plot.right - plot.left) / 6;
const yAt = (value: number) => plot.bottom - value * (plot.bottom - plot.top) / 100;
const line = (values: number[]) => values.map((value, index) => `${xAt(index)},${yAt(value)}`).join(" ");

export function CrossingLines({spec}: {spec: CrossingLinesSpec}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  const onset = spec.declining.at;
  const zoom = 1 + .128 * (1 - ease((time - onset + .21) / .46));
  const headline = clamp((time + .08) / .29);
  const redLabel = ease((time - onset + 1.39) / .32);
  const progress = clamp((time - onset) / 2.16);
  const revealX = plot.left + 10 + (plot.right - plot.left - 8) * progress;

  return (
    <div style={{position: "absolute", inset: 0, background: "linear-gradient(#000 17%,#090706 28%,#262424 50%,#454343 72%,#686669 100%)"}}>
      <svg viewBox="0 0 360 640" width={360} height={640} style={{position: "absolute", inset: 0}}>
        <defs>
          <clipPath id="latepost-red-line-reveal"><rect x={plot.left - 2} y={plot.top - 5} width={revealX - plot.left + 2} height={230} /></clipPath>
        </defs>
        <g transform={`translate(83 224) scale(${zoom}) translate(-83 -224)`}>
          <text x={25} y={161} fill="#f8f7f4" opacity={headline} fontFamily={sans} fontWeight={800} fontSize={26.5}>{spec.title}</text>
          {[100, 80, 60, 40, 20, 0].map(value => (
            <g key={value}>
              <line x1={58} x2={328} y1={yAt(value)} y2={yAt(value)} stroke="#aaa4a4" strokeOpacity={.1} />
              <text x={28} y={yAt(value) + 5} fill="#eeeae6" fontFamily={latin} fontStyle="italic" fontSize={14} letterSpacing={.8}>{value}%</text>
            </g>
          ))}
          {[0, 2, 4, 6].map(index => (
            <text key={index} x={xAt(index)} y={448} textAnchor="middle" fontFamily={latin} fill="#fbf9f4" fontWeight={700} letterSpacing={.4} fontSize={15}>{spec.firstYear + index}</text>
          ))}
          <polyline points={line(spec.rising.values)} fill="none" stroke="#999795" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
          <text x={160} y={410} fontFamily={sans} fontSize={19} fontWeight={700} fill="#999795">{spec.rising.label}</text>
          <polyline points={line(spec.declining.values)} clipPath="url(#latepost-red-line-reveal)" fill="none" stroke={red} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
          <text x={80} y={211} opacity={redLabel} fontFamily={serif} fontSize={18} fontWeight={900} fill={red} stroke={red} strokeWidth={.35}>{spec.declining.label}</text>
        </g>
      </svg>
    </div>
  );
}

export const crossingLinesDemo: PortraitDemo = {
  fps: 30,
  durationInFrames: 229,
  reference: "晚点LatePost · BV18bM462E31 · 35.066875–42.70025",
  spec: {
    title: "港股红筹架构占比变化",
    firstYear: 2020,
    rising: {label: "H股直接上市", values: [5, 5, 15, 35, 45, 70, 80]},
    declining: {label: "红筹架构", at: 3.45, values: [90, 90, 80, 60, 50, 31, 5]},
  } satisfies CrossingLinesSpec,
};

