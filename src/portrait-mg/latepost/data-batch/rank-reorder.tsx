import {Img, useCurrentFrame, useVideoConfig} from "remotion";
import {asset, clamp, ease, type PortraitDemo} from "../../common";

import {rankReorderContract, type RankReorderSpec} from "./rank-reorder-contract";

const rowTop = 168;
const rowStep = 77.1;
const rankLeft = [68, 57, 47, 38];
const vehicleLeft = [125, 112, 103, 89];
const namesLeft = [265, 258, 246, 242];
const sans = "'Microsoft YaHei',sans-serif";
const condensed = "SimSun,serif";
const mix = (a: number, b: number, p: number) => a + (b - a) * p;

function RevealingText({text, x, y, progress, alpha = 1, size, color}: {
  text: string; x: number; y: number; progress: number; alpha?: number; size: number; color: string;
}) {
  const characters = Array.from(text);
  return <text x={x} y={y} fill={color} fontFamily={sans} fontWeight={800} fontSize={size}>
    {characters.map((char, index) => <tspan key={index} opacity={alpha * clamp(progress * (characters.length + 1) - index)}>{char}</tspan>)}
  </text>;
}

function RankReorder({spec}: {spec: RankReorderSpec}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  const at = spec.reorder.at;
  const headlight = ease((time - spec.leadHighlight.at) / .15);
  const oldAlpha = 1 - ease((time - at + .025) / .115);
  const newTitle = clamp((time - at) / .28);
  return (
    <div style={{position: "absolute", inset: 0, background: "linear-gradient(#000 17%,#030303 25%,#2b2b2b 51%,#5b5b5b 80%,#686866 100%)"}}>
      <svg width={360} height={640} viewBox="0 0 360 640" style={{position: "absolute", inset: 0}}>
        <defs>
          <linearGradient id="latepost-rank-neutral" x2="0" y2="1">
            <stop stopColor="#242424" stopOpacity={.75}/><stop offset="1" stopColor="#7a7a7a" stopOpacity={.19}/>
          </linearGradient>
          <linearGradient id="latepost-rank-red" x1="0" x2="1" y1="0" y2="0">
            <stop stopColor="#f0130b"/><stop offset=".68" stopColor="#fd0805"/><stop offset="1" stopColor="#ff0804"/>
          </linearGradient>
        </defs>
        <RevealingText text={spec.firstTitle} x={mix(49, 28, ease(time / .24))} y={136} progress={clamp((time + .06) / .29)} alpha={oldAlpha} size={27} color="#f5f5f3"/>
        <RevealingText text={spec.secondTitle} x={mix(31, 15, ease((time - at) / .36))} y={136} progress={newTitle} size={27} color="#f5f5f3"/>
        <text x={30} y={158} fontFamily={sans} fontStyle="italic" fill="#a3a3a0" fontSize={12} opacity={ease((time + .04) / .29)}>{spec.sourceLine}</text>
        {rankLeft.map((left, index) => {
          const y = rowTop + rowStep * index;
          const entrance = ease((time + .07 - index * .025) / .24);
          return (
            <g key={index} opacity={entrance}>
              <rect x={0} y={y} width={360} height={65} fill="url(#latepost-rank-neutral)"/>
              {index === 0 && <rect x={0} y={y} width={360 * headlight} height={65} fill="url(#latepost-rank-red)"/>}
              <text x={left} y={y + 47} fontFamily="'Times New Roman',serif" fontWeight={750} fontSize={45} fill="#eb130d">{index + 1}.</text>
              {index === 0 && <text x={left} y={y + 47} fontFamily="'Times New Roman',serif" fontWeight={750} fontSize={45} fill="#fff" opacity={headlight}>1.</text>}
            </g>
          );
        })}
      </svg>
      {spec.rows.map((row, index) => {
        const stop = row.nextRank - 1;
        const progress = ease((time - at + .035) / .405);
        const incoming = ease((time + .085 - index * .028) / .23);
        const movement = 42 * (incoming - 1);
        const top = rowTop + rowStep * mix(index, stop, progress);
        const foreground = stop === 0 && progress > 0 || index === 0 && progress === 0;
        return (
          <div key={index} style={{position:"absolute", left:movement, top, width:360, height:65, opacity:incoming, zIndex:foreground ? 2 : 1}}>
            <Img src={asset(row.image)} style={{position:"absolute", left:mix(vehicleLeft[index], vehicleLeft[stop], progress), top:5, width:124, height:57, objectFit:"contain", objectPosition:"left center"}}/>
            <div style={{position:"absolute", left:mix(namesLeft[index], namesLeft[stop], progress), top:21, whiteSpace:"nowrap", color:"#fff", fontFamily:condensed, fontSize:20, fontWeight:750, transform:"scaleX(.74)", transformOrigin:"left center"}}>
              {row.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const mediaRoot = "portrait-mg/latepost/data-batch";
const demo: PortraitDemo = {
  fps: 30, durationInFrames: 189, reference: "晚点LatePost · BV1WaHN6GEuN · 11.6–17.9",
  spec: {
    firstTitle: "2024 全年小型车销量榜",
    secondTitle: "2026 上半年小型车销量榜",
    sourceLine: "数据来源：乘联会零售销量",
    rows: [
      {name: "比亚迪海鸥", image: `${mediaRoot}/rank-seagull.png`, nextRank: 3},
      {name: "五菱缤果", image: `${mediaRoot}/rank-mini.png`, nextRank: 4},
      {name: "比亚迪海豚", image: `${mediaRoot}/rank-dolphin.png`, nextRank: 2},
      {name: "吉利星愿", image: `${mediaRoot}/rank-xingyuan.png`, nextRank: 1},
    ],
    leadHighlight: {at: 1.54},
    reorder: {at: 4.07},
  } satisfies RankReorderSpec,
};

export const rankReorder = {
  ...rankReorderContract,
  Component: RankReorder,
  demo,
} as const;
