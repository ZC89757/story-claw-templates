import type {CSSProperties, ReactNode} from "react";
import {useId} from "react";
import {useVideoConfig} from "remotion";
import {type PortraitDemo} from "../../common";
import {assetRoot, diffusionContract, type DiffusionSpec} from "./contracts";
import {progress, song, Still, time30, useTime} from "./shared";

type Camera = {x: number; y: number; scale: number};
type Point = [number, number];
const cameraBeats: [number, Camera][] = [
  [0, {x: -82, y: 158, scale: 1.26}],
  [29, {x: 32, y: 25, scale: 1.48}],
  [51, {x: 31, y: 23, scale: 1.49}],
  [60, {x: 29, y: 23, scale: 1.50}],
  [76, {x: -206, y: -88, scale: 1.50}],
  [128, {x: -216, y: -88, scale: 1.53}],
  [148, {x: -141, y: -110, scale: 1.56}],
  [231, {x: -140, y: -106, scale: 1.59}],
  [258, {x: -138, y: -104, scale: 1.60}],
  [278, {x: -34, y: -345, scale: 1.51}],
  [383, {x: -32, y: -352, scale: 1.54}],
  [407, {x: -3, y: -11, scale: 1.03}],
  [470, {x: 0, y: 5, scale: 1.00}],
  [493, {x: 0, y: 13, scale: 1.00}],
];
function cameraAt(time: number): Camera {
  const next = cameraBeats.findIndex(([frame]) => time < time30(frame));
  if (next < 1) return cameraBeats.at(-1)![1];
  const [[a, begin], [b, end]] = cameraBeats.slice(next - 1, next + 1);
  const u = progress(time, time30(a), time30(b-a));
  return {x: begin.x+(end.x-begin.x)*u, y: begin.y+(end.y-begin.y)*u, scale: begin.scale+(end.scale-begin.scale)*u};
}

function ProjectionText({x, y, children, facing, size, color, width = .72, style}: {
  x: number; y: number; children: ReactNode; facing: -1 | 0 | 1; size: number; color: string;
  width?: number; style?: CSSProperties;
}) {
  return <div style={{position: "absolute", left: x, top: y, font: `900 ${size}px/.93 ${song}`,
    whiteSpace: "nowrap", transformOrigin: "left top", transform: `skewY(${facing * 30}deg) scaleX(${width})`,
    color, ...style}}>{children}</div>;
}

function Plate({x, y, facing, label, opacity, paint}: {
  x: number; y: number; facing: -1 | 1; label: string; opacity: number; paint: string;
}) {
  const slant = 32*facing;
  return <div style={{position: "absolute", left: x, top: y, opacity}}>
    <svg width="60" height="86" style={{position: "absolute", overflow: "visible"}}>
      <path d={`M0 0L56 ${slant}V${slant+68}L0 68Z`} fill={`url(#${paint})`} stroke="#af091575" strokeWidth=".7"/>
      <path d={`M0 0L56 ${slant}L${facing < 0 ? 20 : 92} ${slant-22}L${facing < 0 ? -37 : 37} -22Z`}
        fill="#780710" opacity=".19" />
    </svg>
    <ProjectionText x={8} y={9} facing={facing} size={27} width={.81} color="#f1c1b8">
      {label.slice(0,2)}<br />{label.slice(2)}
    </ProjectionText>
  </div>;
}

function Cube({x,y,opacity,paint}: {x: number; y: number; opacity: number; paint: string}) {
  return <g transform={`translate(${x} ${y})`} opacity={opacity}>
    <path d="M0 0l31 -17 31 17 -31 17Z" fill="#b7000a"/>
    <path d="M0 0l31 17v41L0 41Z" fill={`url(#${paint})`} />
    <path d="M31 17L62 0v41L31 58Z" fill="#8b030c" />
    <path d="M31 17L49 8v39l-18 11Z" fill="#d9000e" opacity=".55"/>
  </g>;
}
function Arrow({start, end, progress: drawn}: {start: Point; end: Point; progress: number}) {
  if (drawn === 0) return null;
  const dx = end[0] - start[0], dy = end[1] - start[1];
  const x = start[0] + dx*drawn, y = start[1] + dy*drawn;
  return <g>
    <path d={`M${start[0]} ${start[1]} L${x} ${y}`} stroke="#efefec" strokeWidth=".60" />
    <path d="M0 0l-5 -2.2 .9 2.2 -.9 2.2Z" fill="#efefec"
      transform={`translate(${x} ${y}) rotate(${Math.atan2(dy,dx)*180/Math.PI})`} />
  </g>;
}
function Medallions({sources, spots, opacity}: {sources: string[]; spots: Point[]; opacity: number}) {
  return <>{sources.map((source, i) => <Still key={i} source={source} style={{left: spots[i][0] - 12, top: spots[i][1] - 16,
    width: 24, height: 32, opacity}} />)}</>;
}
function LineCaption({text, x,y, opacity, skew}: {
  text: string; x: number; y: number; opacity: number; skew: -1 | 0 | 1;
}) {
  return <ProjectionText x={x} y={y} facing={skew} size={21} color="#e00008" width={.87}
    style={{background: "#090909", padding: "0 2px", opacity, textShadow: "0 1px #790007"}}>{text}</ProjectionText>;
}

function Diffusion({spec}: {spec: DiffusionSpec & {_duration?: number}}) {
  const time = useTime();
  const {fps, durationInFrames} = useVideoConfig();
  const duration = spec._duration ?? durationInFrames / fps;
  const camera = cameraAt(time);
  const closedPlate = progress(time, time30(2), .30);
  const closedText = progress(time, time30(16), .24);
  const closedLogos = progress(time, time30(21), .25);
  const openPlate = progress(time, time30(57), .28);
  const openText = progress(time, time30(65), .24);
  const openLogos = progress(time, time30(68), .27);
  const spreadView = progress(time, time30(258), .6) * (1 - progress(time, time30(384), .76));
  const transfer = progress(time, time30(144), .47);
  const spread = progress(time, time30(280), .39);
  // Keep the original fade speed and final opacity. A shorter window spends less
  // time on the overview before the fade. A longer window holds the finished diagram.
  const fadeStart = Math.min(time30(479), duration - time30(15));
  const fadeElapsed = Math.min(time - fadeStart, time30(14));
  const dissolve = 1 - .45 * progress(fadeElapsed, 0, .66);
  const token = useId();
  const platePaint = token + "-plate";
  const cubePaint = token + "-cube";
  return <div style={{position: "absolute", inset: 0, background: "linear-gradient(#000 30%,#242424 54%,#4b4b4b 73%,#646464 100%)"}}>
    <div style={{position: "absolute", inset: 0, clipPath: "polygon(0 30%,48% 15%,100% 33%,100% 72%,53% 89%,0 73%)",
      background: "linear-gradient(#101010 16%,#595959 88%)"}} />
    <div style={{position: "absolute", inset: 0, transformOrigin: "0 0",
      transform: `translate(${camera.x}px,${camera.y}px) scale(${camera.scale})`}}>
      <svg width="360" height="640" style={{position: "absolute", inset: 0, overflow: "visible"}}>
        <defs>
          <linearGradient id={platePaint} x1="0" y1="0" x2=".8" y2="1" gradientUnits="objectBoundingBox">
            <stop stopColor="#cf0611"/><stop offset="1" stopColor="#4d1117" stopOpacity=".62"/>
          </linearGradient>
          <linearGradient id={cubePaint} x1="0" y1="0" x2="1" y2=".28" gradientUnits="objectBoundingBox">
            <stop stopColor="#671922" stopOpacity=".7"/><stop offset="1" stopColor="#e0000d"/>
          </linearGradient>
        </defs>
        <Arrow start={[167,224]} end={[230,263]} progress={transfer * (1 - spreadView)}/>
        {([[113,379],[148,407],[198,438]] as Point[]).map((end,i) => <Arrow key={i} start={[240,370]} end={end}
          progress={progress(time,time30(273+i*2),.32)} />)}
        <Cube x={45} y={386} opacity={spread*dissolve} paint={cubePaint}/>
        <Cube x={94} y={420} opacity={progress(time,time30(282),.35)*dissolve} paint={cubePaint}/>
        <Cube x={143} y={454} opacity={progress(time,time30(284),.36)*dissolve} paint={cubePaint}/>
      </svg>
      <Plate x={119} y={173} facing={-1} label={spec.originPlate} opacity={closedPlate * (1 - spreadView)} paint={platePaint}/>
      <Plate x={221} y={271} facing={1} label={spec.receiverPlate} opacity={openPlate} paint={platePaint}/>
      <ProjectionText x={11} y={134} facing={-1} size={31} width={.54} color="#df0010" style={{opacity:closedText * (1 - spreadView),
        textShadow: "0 0 3px #9f0007"}}>{spec.originHeading}</ProjectionText>
      <ProjectionText x={19} y={173} facing={-1} size={77} width={.53} color="#fff" style={{opacity:closedText * (1 - spreadView)}}>{spec.origin}</ProjectionText>
      <ProjectionText x={239} y={166} facing={1} size={31} width={.52} color="#df0010" style={{opacity:openText,
        textShadow: "0 0 3px #9f0007"}}>{spec.receiverHeading}</ProjectionText>
      <ProjectionText x={267} y={230} facing={1} size={75} width={.52} color="#fff" style={{opacity:openText}}>{spec.receiver}</ProjectionText>
      <Medallions sources={spec.originLogos} spots={[[38,250],[61,234],[84,218]]} opacity={closedLogos * (1 - spreadView)} />
      <Medallions sources={spec.receiverLogos} spots={[[298,326],[322,342],[298,355],[322,371]]} opacity={openLogos} />
      <LineCaption text={spec.transfer} x={187} y={192} skew={1} opacity={progress(time,time30(153),.24) * (1 - spreadView)}/>
      <LineCaption text={spec.distribution} x={193} y={389} skew={0} opacity={progress(time,time30(286),.21)}/>
      <ProjectionText x={44} y={413} facing={1} size={83} width={.46} color="#fff" style={{opacity:spread*dissolve}}>{spec.spread}</ProjectionText>
    </div>
    <div style={{position: "absolute", inset: 0, pointerEvents: "none",
      background: "linear-gradient(transparent 61%,#64646425 74%,#646464 100%)"}} />
  </div>;
}

const spec: DiffusionSpec = {
  origin:"美国", receiver:"中国", originHeading:"闭源模型最强", receiverHeading:"开源模型最强",
  originPlate:"闭源模型",receiverPlate:"中国模型",transfer:"蒸馏",distribution:"开源",spread:"扩散",
  originLogos:[1,2,3].map(i=>assetRoot+`closed-${i}.png`),
  receiverLogos:[1,2,3,4].map(i=>assetRoot+`open-${i}.png`),
};
const demo: PortraitDemo = {spec, durationInFrames:494, fps:30, reference:"BV1jchK6REaB · 145.300–161.767"};
export const isometricDiffusion = {...diffusionContract,Component:Diffusion,demo} as const;


