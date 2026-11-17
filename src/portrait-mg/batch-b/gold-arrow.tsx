import type {CSSProperties} from "react";
import {Sequence, useCurrentFrame, useVideoConfig} from "remotion";
import {clamp, ease, PortraitMedia, type PortraitMediaRef} from "../common";
import {ReferenceArtwork} from "../reference-artwork";

type TimedText = {text: string; at?: number};
type GoldArrowSpec = {
  _duration?: number;
  background?: PortraitMediaRef | null;
  subject: PortraitMediaRef & {at?: number};
  first: TimedText;
  second: TimedText;
  arrow: {at: number};
  firstSubtitle?: {text: string} | null;
  secondSubtitle?: {text: string} | null;
};

const full: CSSProperties = {position:"absolute", inset:0};
const box = (left: number, top: number, width: number, height: number): CSSProperties =>
  ({position:"absolute", left, top, width, height});
const wave: PortraitMediaRef = {source:"portrait-mg/batch-b/gold-reference-decoration.mp4", sourceStart:0};

function GoldPlate({label, subtitle, x, age}: {
  label: string;
  subtitle?: {text: string} | null;
  x: number;
  age: number;
}) {
  if (age < 0) return null;
  const caption = subtitle === undefined ? "price" : subtitle?.text;
  return <div style={{
    ...box(x,139,118,82), boxSizing:"border-box", borderRadius:10,
    background:"linear-gradient(155deg,#c49e543d,transparent 47%),linear-gradient(112deg,#795722,#4b3013)",
    border:"1px solid #ead48da1", boxShadow:"inset 0 1px 0 #ffe5ab66,0 4px 9px #120a0775",
    opacity:clamp(age * 9),
  }}>
    <div style={{
      ...box(2,caption ? 13 : 0,112,caption ? 40 : 80), display:"grid", placeItems:"center",
      fontFamily:'Arial Black,"Microsoft YaHei",sans-serif', fontWeight:900, fontStyle:"italic",
      fontSize:33, fontVariantNumeric:"tabular-nums", letterSpacing:1.15,
      color:"#fffae9", textShadow:"0 2px 3px #29180573", whiteSpace:"nowrap",
      clipPath:"inset(0 " + (100 * (1 - ease(age / .3))) + "% 0 0)",
    }}>{label}</div>
    {caption && <div style={{
      ...box(1,55,114,14), textAlign:"center", whiteSpace:"nowrap",
      fontFamily:'Arial,"Microsoft YaHei",sans-serif', fontSize:10, fontWeight:600, letterSpacing:.6, color:"#f0da9e",
    }}>{caption}</div>}
  </div>;
}

export function GoldArrow({spec}: {spec: GoldArrowSpec}) {
  const {fps} = useVideoConfig();
  const time = useCurrentFrame() / fps;
  const arrowAge = time - spec.arrow.at;
  const entry = ease(time / .4);
  const frames = spec._duration === undefined ? undefined : Math.max(1, Math.round(spec._duration * fps));
  const presentFrames = Math.round((spec.subject.at ?? 0) * fps);
  return <div style={{...full, overflow:"hidden", background:"#090b0c"}}>
    <Sequence durationInFrames={frames} layout="none">
      {spec.background && <>
        <PortraitMedia media={spec.background} style={{...full, filter:"blur(3px) brightness(.86)", transform:"scale(1.04)"}}/>
        <div style={{...full, background:"linear-gradient(180deg,#09131b5c,#09131b65 48%,#09131b91)"}}/>
      </>}
      <div style={spec.background ? {
        ...full, mixBlendMode:"screen", opacity:.64,
        maskImage:"linear-gradient(180deg,transparent 33%,#000 36% 44%,transparent 47%)",
      } : full}>
        <PortraitMedia media={wave} style={{...full, filter:spec.background ? "brightness(.84) contrast(1.22)" : undefined}}/>
      </div>
    </Sequence>
    <div style={{
      ...box(24,294,312,166), filter:"blur(" + 12 * (1 - entry) + "px)",
      transform:"translateY(" + -80 * (1 - entry) + "px)", opacity:clamp(time * 10),
    }}>
      <Sequence from={presentFrames} layout="none">
        <PortraitMedia media={spec.subject} style={{...full, objectFit:"contain"}}/>
      </Sequence>
    </div>
    <GoldPlate x={13} label={spec.first.text} subtitle={spec.firstSubtitle} age={time - (spec.first.at ?? 0)}/>
    <GoldPlate x={229} label={spec.second.text} subtitle={spec.secondSubtitle} age={time - (spec.second.at ?? 0)}/>
    {arrowAge >= 0 && <div style={{
      ...box(135,165,90,30),
      clipPath:"inset(0 " + (100 * (1 - ease(arrowAge / .3))) + "% 0 0)",
    }}>
      <ReferenceArtwork kind="dash" width={90} height={30} time={arrowAge} phase={1}/>
    </div>}
  </div>;
}
