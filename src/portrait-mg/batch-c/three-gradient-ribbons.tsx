import type {CSSProperties} from "react";
import {Sequence, useVideoConfig} from "remotion";
import {clamp, ease, PortraitMedia, type PortraitMediaRef} from "../common";

type Label = {text: string; at?: number};
const fill: CSSProperties = {position: "absolute", inset: 0};
const width = 242;
const height = 64;
const strips = 72;
const palettes = [
  {light: "#219177", dark: "#0c4c41", edge: "#9debd2", ink: "#edfdf7"},
  {light: "#247ba7", dark: "#124361", edge: "#a4e5fc", ink: "#effaff"},
  {light: "#7064a9", dark: "#382b68", edge: "#ddc8ff", ink: "#f9f3ff"},
];
const sparkles = [
  [29,96,1.1],[306,143,.9],[44,191,.9],[325,225,1.3],
  [21,276,.8],[334,310,.9],[40,351,1.2],[316,367,.8],
  [35,432,1.2],[286,462,.9],[97,477,.7],[321,515,1.15],
];

function RibbonFace({label, theme}: {label: Label; theme: typeof palettes[number]}) {
  return <div style={{
    ...fill, boxSizing: "border-box", display: "grid", placeItems: "center", borderRadius: 11,
    border: "1px solid " + theme.edge + "85",
    background: "linear-gradient(165deg,#ffffff24,transparent 41%),linear-gradient(105deg," + theme.light + "," + theme.dark + " 92%)",
    boxShadow: "inset 0 1px 0 #ffffff27,inset 0 -1px 0 #0004",
  }}>
    <span style={{
      position: "absolute", top: 16, left: 13, width: 2, height: 30, borderRadius: 2, background: theme.edge,
    }}/>
    <span style={{
      color: theme.ink, fontFamily: 'BatchCSans,"Microsoft YaHei",sans-serif', fontSize: 34,
      fontWeight: 800, lineHeight: 1.1, letterSpacing: 3, whiteSpace: "pre", textShadow: "0 2px 3px #050d2355",
      paddingLeft: 3,
    }}>{label.text}</span>
  </div>;
}

function Ribbon({label, age, index}: {label: Label; age: number; index: number}) {
  const progress = ease(age / .68);
  const theme = palettes[index];
  const face = <RibbonFace label={label} theme={theme}/>;
  return <div style={{
    position: "absolute", left: (360 - width) / 2, top: 112 + index * 123, width, height, perspective: 440,
    transform: "translate(" + (-118 * (1 - progress)) + "px," + (42 * (1 - progress)) + "px)",
    filter: "drop-shadow(0 6px 9px #03091273)",
  }}>
    {progress === 1 ? face : Array.from({length: strips}, (_, slice) => {
      const offset = slice * width / strips;
      const angle = (1 - clamp(progress * 1.7 - slice / 120)) * 2.1;
      return <div key={slice} style={{
        position: "absolute", top: -Math.sin(angle) * 36, left: offset, height,
        width: width / strips + .7, overflow: "hidden",
        transform: "scaleX(" + Math.max(.1, Math.cos(angle)) + ") rotateY(" + angle * .2 + "rad)",
        transformOrigin: "left center",
      }}>
        <div style={{position: "absolute", inset: 0, left: -offset, width}}>{face}</div>
        <div style={{...fill, background: "#030d18", opacity: angle * .13}}/>
      </div>;
    })}
  </div>;
}

export function ThreeGradientRibbons({background, labels, time, duration}: {
  background?: PortraitMediaRef | null;
  labels: readonly Label[];
  time: number;
  duration?: number;
}) {
  const {fps} = useVideoConfig();
  return <>
    {background && <Sequence durationInFrames={duration === undefined ? undefined : Math.max(1, Math.round(duration * fps))} layout="none">
      <PortraitMedia media={background} style={{
        ...fill, filter: "blur(3px) brightness(.86) saturate(.88)", transform: "scale(1.04)",
      }}/>
    </Sequence>}
    <div style={{
      ...fill, background: background
        ? "linear-gradient(180deg,#06131e45,#06131e35 50%,#07111e76)"
        : "radial-gradient(ellipse at 58% 35%,#19354e,#0a1b2a 59%,#0a111c)",
    }}/>
    <svg width={360} height={640} style={fill} aria-hidden="true">
      {sparkles.map(([x,y,radius],i)=><circle key={i}
        cx={x + 6 * Math.sin(time * .58 + i)} cy={y - time * 3}
        r={radius} fill="#b5e9f5" opacity={.12 + .23 * Math.pow(Math.sin(time * 1.04 + i * 1.73),2)}/>)}
    </svg>
    {labels.map((label,index)=>{
      const age = time - (label.at ?? 0);
      return age < 0 ? null : <Ribbon key={index} label={label} age={age} index={index}/>;
    })}
  </>;
}
