import type {CSSProperties, ReactNode} from "react";
import {Sequence, useCurrentFrame, useVideoConfig} from "remotion";
import {asset, clamp, ease, PortraitMedia} from "../common";
import {selectedVideoWindow} from "./profiles";

type Rect = readonly [number, number, number, number];
type Entry = {at?: number; text?: string; source?: string; sourceStart?: number | null};
export type SelectedSpec = Record<string, Entry> & {_duration?: number; target?: Target; _documentAspect?: number};
type Target = {x: number; y: number; width: number; height: number};
export type SceneProps = {spec: SelectedSpec};
export const full = [0, 0, 360, 640] as const;
export const box = ([left, top, width, height]: Rect): CSSProperties =>
  ({position: "absolute", left, top, width, height});
export const abs: CSSProperties = {position: "absolute", inset: 0};
const sans = '"Selected Noto", "Microsoft YaHei", sans-serif';
export const brush = '"Selected Brush", "Microsoft YaHei", sans-serif';
export const shadow = "0 2px 2px #000, 0 0 5px #0008";
export const outline = "drop-shadow(1px 0 0 #fff) drop-shadow(-1px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -1px 0 #fff)";
export const redVertical: CSSProperties = {writingMode: "vertical-rl", letterSpacing: ".13em",
  color: "#a7110d", fontFamily: brush, textShadow: "0 1px 2px #2b0307"};
export const lerp = (left: number, right: number, p: number) => left + (right - left) * p;
export const seed = (n: number) => {
  const x = Math.sin(n * 87.13 + 4.12) * 43438.13;
  return x - Math.floor(x);
};

export function useScene(spec: SelectedSpec) {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const time = frame / fps;
  const at = (key: string) => spec[key]?.at ?? 0;
  const progress = (key: string, duration: number, offset = 0) => ease((time - at(key) - offset) / duration);
  const since = (seconds: number, duration: number) => ease((time - seconds) / duration);
  const title = (key: string) => spec[key].text ?? "";
  return {frame, fps, time, at, progress, since, title, end: spec._duration ?? durationInFrames / fps};
}

export function Panel({r = full, style, children}: {r?: Rect; style?: CSSProperties; children?: ReactNode}) {
  return <div style={{...box(r), ...style}}>{children}</div>;
}

export function Caption({r, size, children, style}: {r: Rect; size: number; children: ReactNode; style?: CSSProperties}) {
  return <Panel r={r} style={{display: "grid", placeItems: "center", textAlign: "center",
    whiteSpace: "pre-line", color: "#fff", font: "900 " + size + "px/1.07 " + sans, textShadow: shadow, ...style}}>
    <span>{children}</span>
  </Panel>;
}

export function Still({entry, style}: {entry: Entry; style?: CSSProperties}) {
  return <PortraitMedia media={{source: entry.source!, sourceStart: null}} style={{...abs, ...style}}/>;
}

export function Clip({id, slot, spec, style}: {id: string; slot: string; spec: SelectedSpec; style?: CSSProperties}) {
  const {fps, durationInFrames} = useVideoConfig();
  const {start, end} = selectedVideoWindow(id, slot, spec, 0, spec._duration ?? durationInFrames / fps);
  const from = Math.round(start * fps);
  const frames = Math.max(1, Math.round(end * fps) - from);
  return <Sequence from={from} durationInFrames={frames} layout="none">
    <PortraitMedia media={{source: spec[slot].source!, sourceStart: spec[slot].sourceStart ?? 0}} style={{...abs, ...style}}/>
  </Sequence>;
}

export function Face({r, id, slot, spec, style, videoStyle, border = "1px solid #b5c3df65"}:
  {r: Rect; id: string; slot: string; spec: SelectedSpec; style?: CSSProperties; videoStyle?: CSSProperties; border?: string}) {
  return <Panel r={r} style={{borderRadius: 16, boxShadow: "0 3px 11px #0009", overflow: "hidden", border, ...style}}>
    <Clip id={id} slot={slot} spec={spec} style={videoStyle}/>
  </Panel>;
}

export function Squares({time}: {time: number}) {
  return <Panel style={{overflow: "hidden"}}>
    {[0,1,2,3,4,5,6].map(i => {
      const size = 86 + 69 * i;
      return <Panel key={i} r={[(360-size)/2,(640-size)/2,size,size]} style={{border: "3px solid #d8e0ed70",
        transform: "rotate(" + (time * (i % 2 ? 17 : 12) + 18 + i * 6) + "deg)", boxShadow: "0 0 7px #0008"}}/>;
    })}
  </Panel>;
}

export function SparkField({time, color = "#ead499", count = 110}: {time: number; color?: string; count?: number}) {
  return <div style={{...abs, overflow: "hidden", pointerEvents: "none"}}>
    {Array.from({length: count}, (_, i) => {
      const s = .6 + 2 * seed(i + count);
      return <i key={i} style={{position: "absolute", left: 360 * seed(i), top: (640 * seed(i+count*2)+time*(4+8*seed(i+2)))%640,
        background: color, borderRadius: "50%", width: s, height: s,
        opacity: .2 + .63 * Math.pow(Math.sin(time * 1.8 + i * 7.1), 2), boxShadow: "0 0 3px " + color}}/>;
    })}
  </div>;
}

export const jagged = (base: number, points: number, amplitude: number, key: number) =>
  Array.from({length: points + 1}, (_, i) => [i * 100 / points, base + (seed(key + i) - .5) * amplitude] as const);
export const polygon = (points: readonly (readonly [number, number])[]) =>
  "polygon(" + points.map(([x,y]) => x.toFixed(3)+"% "+y.toFixed(3)+"%").join(",") + ")";
export const topRim = jagged(7, 41, 2.6, 569);
export const bottomRim = jagged(93, 43, 4, 125);
export const Torn = ({r, top = false, bottom = false, children, style}: 
  {r: Rect; top?: boolean; bottom?: boolean; children: ReactNode; style?: CSSProperties}) => {
  const upper = top ? topRim : [[0,0],[100,0]] as const;
  const lower = bottom ? bottomRim : [[0,100],[100,100]] as const;
  const clip = polygon([...upper, ...[...lower].reverse()]);
  return <Panel r={r} style={style}>
    <div style={{...abs, background: "#e9e7dc", clipPath: clip}}/>
    <div style={{...abs, clipPath: polygon([
      ...upper.map(([x,y]) => [x,y+(top ? .95 : 0)] as const),
      ...[...lower].reverse().map(([x,y]) => [x,y-(bottom ? 1.12 : 0)] as const),
    ])}}>{children}</div>
  </Panel>;
};

export function GoldFrame({signature}: {signature: string}) {
  return <>
    <Panel r={[0,0,360,640]} style={{background: "linear-gradient(156deg,#8b75512c,transparent 20% 81%,#684a2822)",
      borderLeft: "1px solid #a28b49", borderRight: "1px solid #a28b49", pointerEvents: "none"}}/>
    <Panel r={[0,551,360,89]} style={{background: "linear-gradient(#070707,#000)", borderTop: "1px solid #c2a25f"}}/>
    <Caption r={[15,585,330,33]} size={18} style={{fontFamily: "Georgia, serif", fontWeight: 400, fontStyle: "italic",
      color: "#bca6819e", letterSpacing: ".17em"}}>{signature}</Caption>
  </>;
}

export function RollNumber({value, progress, r}: {value: string; progress: number; r: Rect}) {
  const chars = value.replace(/%$/, "").split("");
  return <Panel r={r} style={{display: "flex", justifyContent: "center", alignItems: "center", font: "italic 900 91px/1 "+sans,
    color: "#fff6bf", textShadow: "0 0 11px #fff3878c, 0 3px 7px #392915", opacity: clamp(progress * 7), overflow: "hidden"}}>
    {chars.map((char, index) => {
      const digit = Number(char);
      const offset = (20 + digit) * ease(clamp((progress - index * .09) / (1 - index * .09)));
      return <span key={index} style={{position: "relative", width: ".56em", height: 91, display: "block", overflow: "hidden"}}>
        <span style={{position: "absolute", top: 0, transform: "translateY(" + (-offset * 91) + "px)"}}>
          {Array.from({length: 32}, (_, n) => <span key={n} style={{height: 91, display: "block", overflow: "hidden"}}>{n % 10}</span>)}
        </span>
      </span>;
    })}
    <span style={{fontSize: 53, marginTop: 19}}>%</span>
  </Panel>;
}

export function SelectedFonts() {
  return <style>{"@font-face{font-family:Selected Noto;src:url('"+asset("portrait-mg/restored-titles/noto-sans-sc.woff2")+"')}"+
    "@font-face{font-family:Selected Brush;src:url('"+asset("portrait-mg/restored-titles/pangmen-brush.ttf")+"')}"}</style>;
}
