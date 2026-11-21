import {Img, useCurrentFrame, useVideoConfig} from "remotion";
import {asset, ease, type PortraitDemo} from "../common";
import type {ThreeRoadSpec} from "./three-road-contract";

const roadShapes = [
  "164,340 171,340 0,517 0,431",
  "175,340 185,340 280,640 80,640",
  "193,340 200,340 360,431 360,517",
];
const labelPositions = [{x: 25, y: 350}, {x: 127, y: 389}, {x: 254, y: 350}];
const serif = "STSong,SimSun,serif";

export function ThreeRoad({spec}: {spec: ThreeRoadSpec}) {
  const time = useCurrentFrame() / useVideoConfig().fps;
  const zoom = 1 + .07 * ease(time / 7.75);
  const titleIn = ease((time - .43) / .39);
  const options = [
    {...spec.first, cutAt: spec.first.reject.at},
    {...spec.second, cutAt: spec.second.reject.at},
    {...spec.remaining, cutAt: Infinity},
  ];
  const rejected = options.map(({cutAt}) => ease((time - cutAt) / .2));
  return (
    <div style={{position: "absolute", inset: 0, background: "linear-gradient(#0a080b 0 24%,#0f0d10 31%,#363437 40%,#aaa8aa 47%,#fafafa 53%,#080609 53.13%)"}}>
      <svg viewBox="0 0 360 640" width={360} height={640} style={{position: "absolute", inset: 0}}>
        <defs>
          <linearGradient id="latepost-road-shading" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#ffffff"/><stop offset=".3" stopColor="#f5f4f2"/><stop offset=".56" stopColor="#c2c1c0"/><stop offset="1" stopColor="#111011"/>
          </linearGradient>
          <linearGradient id="latepost-outer-road-shading" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#ffffff"/><stop offset=".42" stopColor="#fffefa"/><stop offset="1" stopColor="#aaa9a6"/>
          </linearGradient>
        </defs>
        <text x={18} y={201 - (1 - titleIn) * 29} opacity={titleIn} textLength={325} lengthAdjust="spacingAndGlyphs"
          fontFamily={serif} fontWeight={900} fontSize={122} fill="#ea0000">{spec.title}</text>
        {roadShapes.map((shape, index) => (
          <polygon key={shape} points={shape} fill={index === 1 ? "url(#latepost-road-shading)" : "url(#latepost-outer-road-shading)"}
            opacity={1 - rejected[index] * .72} />
        ))}
      </svg>
      <Img src={asset("portrait-mg/latepost/three-road-building.png")} style={{
        position: "absolute", left: 59, top: 138, width: 227, height: 202,
        transform: `scale(${zoom})`, transformOrigin: "53% bottom",
      }}/>
      <svg viewBox="0 0 360 640" width={360} height={640} style={{position: "absolute", inset: 0}}>
        {options.map(({label, appear, cutAt}, index) => {
          const reveal = ease((time - appear.at) / .2);
          const strike = ease((time - cutAt) / .15);
          const {x, y} = labelPositions[index];
          return <g key={index} opacity={reveal} transform={`translate(${x - (1 - reveal) * 12} ${y})`}>
            <g opacity={1 - rejected[index] * .64}>
              <text x={0} y={40} fill="#ea0413" fontFamily="'Times New Roman',serif" fontSize={52} fontStyle="italic">{index + 1}.</text>
              <rect x={39} y={0} width={50} height={39} fill="#e0000a"/>
              <text x={64} y={30} textAnchor="middle" fontSize={25} fontWeight={750} fontFamily={serif} fill="#fffdf5">{label}</text>
            </g>
            <line x1={0} x2={96 * strike} y1={20} y2={20} stroke="#f7f8f6" strokeWidth={4}/>
          </g>;
        })}
      </svg>
    </div>
  );
}

export const threeRoadDemo: PortraitDemo = {
  fps: 30,
  durationInFrames: 238,
  reference: "晚点LatePost · BV18bM462E31 · 77.3338125–85.2673125",
  spec: {
    title: "公司上市",
    first: {label: "A股", appear: {at: 1.77}, reject: {at: 2.33}},
    second: {label: "港股", appear: {at: 2.83}, reject: {at: 3.66}},
    remaining: {label: "美股", appear: {at: 5.52}},
  } satisfies ThreeRoadSpec,
};
