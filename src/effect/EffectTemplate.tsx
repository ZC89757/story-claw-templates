import type {CSSProperties, ReactNode} from "react";
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {deterministic, easeInOut, easeOut, effectProgress} from "./evaluate";
import type {EffectItem, EffectSpec} from "./types";

type Props = {spec: EffectSpec; style?: string; css?: CSSProperties};

const W = 1920;
const H = 1080;
const ACCENT = "#ef6b42";
const CYAN = "#8ad3df";
const INK = "#f4f6f7";

export const EFFECT_STYLES = [
  "anime-impact", "assemble-then-type-flyin", "attention-bounce", "aurora-bloom-bg-flip",
  "brand-frame-snap", "corner-spotlight-reveal", "dashboard-glow-highlight-pill", "flyline-arc",
  "glow-orb-ambient", "glow-wake-sleep-panel", "halation-bloom", "hit-counter",
  "impact-burst-kit", "kanada-perspective-snap", "line-boil", "line-unfold-panel",
  "misregistration-hit", "orb-flyline-relay", "pop-burst-confirm", "reticle-lock-on",
  "scan-bracket-sweep", "scanline-annotate-focus", "scanline-assemble-flyin", "score-slam",
  "sheen-sweep", "slide-spotlight-pan", "spotlight-sweep", "crane-rise-reveal",
  "dataviz-landscape-open", "fracture", "icon-field-colorize", "stroke-segment-build",
  "grain-dissolve", "logo-shrink-wordmark-lockup", "logo-sting-button", "neon-triple-marquee",
] as const;

type EffectStyle = (typeof EFFECT_STYLES)[number];
type SfxName = "click-camera.mp3" | "glitch-electric-small.mp3" | "impact-cine.mp3" | "pop.mp3" | "sparkle.mp3" | "swoosh-quick.mp3" | "transition-snap.mp3" | "transition-soft.mp3" | "whoosh-big.mp3" | "whoosh-fast.mp3";

type EffectRecipe = {renderer: EffectStyle; sfx: SfxName};

export const EFFECT_RECIPES = {
  "anime-impact": {renderer: "anime-impact", sfx: "impact-cine.mp3"},
  "assemble-then-type-flyin": {renderer: "assemble-then-type-flyin", sfx: "whoosh-fast.mp3"},
  "attention-bounce": {renderer: "attention-bounce", sfx: "pop.mp3"},
  "aurora-bloom-bg-flip": {renderer: "aurora-bloom-bg-flip", sfx: "transition-soft.mp3"},
  "brand-frame-snap": {renderer: "brand-frame-snap", sfx: "transition-snap.mp3"},
  "corner-spotlight-reveal": {renderer: "corner-spotlight-reveal", sfx: "swoosh-quick.mp3"},
  "dashboard-glow-highlight-pill": {renderer: "dashboard-glow-highlight-pill", sfx: "sparkle.mp3"},
  "flyline-arc": {renderer: "flyline-arc", sfx: "whoosh-fast.mp3"},
  "glow-orb-ambient": {renderer: "glow-orb-ambient", sfx: "transition-soft.mp3"},
  "glow-wake-sleep-panel": {renderer: "glow-wake-sleep-panel", sfx: "swoosh-quick.mp3"},
  "halation-bloom": {renderer: "halation-bloom", sfx: "sparkle.mp3"},
  "hit-counter": {renderer: "hit-counter", sfx: "impact-cine.mp3"},
  "impact-burst-kit": {renderer: "impact-burst-kit", sfx: "impact-cine.mp3"},
  "kanada-perspective-snap": {renderer: "kanada-perspective-snap", sfx: "whoosh-big.mp3"},
  "line-boil": {renderer: "line-boil", sfx: "transition-soft.mp3"},
  "line-unfold-panel": {renderer: "line-unfold-panel", sfx: "swoosh-quick.mp3"},
  "misregistration-hit": {renderer: "misregistration-hit", sfx: "transition-snap.mp3"},
  "orb-flyline-relay": {renderer: "orb-flyline-relay", sfx: "whoosh-fast.mp3"},
  "pop-burst-confirm": {renderer: "pop-burst-confirm", sfx: "pop.mp3"},
  "reticle-lock-on": {renderer: "reticle-lock-on", sfx: "click-camera.mp3"},
  "scan-bracket-sweep": {renderer: "scan-bracket-sweep", sfx: "swoosh-quick.mp3"},
  "scanline-annotate-focus": {renderer: "scanline-annotate-focus", sfx: "click-camera.mp3"},
  "scanline-assemble-flyin": {renderer: "scanline-assemble-flyin", sfx: "whoosh-fast.mp3"},
  "score-slam": {renderer: "score-slam", sfx: "impact-cine.mp3"},
  "sheen-sweep": {renderer: "sheen-sweep", sfx: "sparkle.mp3"},
  "slide-spotlight-pan": {renderer: "slide-spotlight-pan", sfx: "swoosh-quick.mp3"},
  "spotlight-sweep": {renderer: "spotlight-sweep", sfx: "transition-soft.mp3"},
  "crane-rise-reveal": {renderer: "crane-rise-reveal", sfx: "whoosh-big.mp3"},
  "dataviz-landscape-open": {renderer: "dataviz-landscape-open", sfx: "whoosh-big.mp3"},
  "fracture": {renderer: "fracture", sfx: "transition-snap.mp3"},
  "icon-field-colorize": {renderer: "icon-field-colorize", sfx: "sparkle.mp3"},
  "stroke-segment-build": {renderer: "stroke-segment-build", sfx: "impact-cine.mp3"},
  "grain-dissolve": {renderer: "grain-dissolve", sfx: "transition-soft.mp3"},
  "logo-shrink-wordmark-lockup": {renderer: "logo-shrink-wordmark-lockup", sfx: "transition-snap.mp3"},
  "logo-sting-button": {renderer: "logo-sting-button", sfx: "impact-cine.mp3"},
  "neon-triple-marquee": {renderer: "neon-triple-marquee", sfx: "swoosh-quick.mp3"},
} as const satisfies Record<EffectStyle, EffectRecipe>;

const Sfx = ({style}: {style: string}) => {
  const {fps} = useVideoConfig();
  const file = EFFECT_RECIPES[style as EffectStyle]?.sfx;
  if (!file) throw new Error(`Unsupported effect style: ${style}`);
  return <Sequence from={Math.round(0.06 * fps)} durationInFrames={Math.max(1, Math.round(0.85 * fps))} layout="none">
    <Audio src={staticFile(`audio/${file}`)} volume={0.18} />
  </Sequence>;
};

const CueText = ({text, p, index = 0, x = 0, y = 0, style}: {text: string; p: number; index?: number; x?: number; y?: number; style?: CSSProperties}) => (
  <div style={{
    position: "absolute",
    left: 220,
    right: 220,
    top: 455 + (index % 3) * 86,
    textAlign: "center",
    color: INK,
    fontSize: 76,
    fontWeight: 900,
    letterSpacing: "0.02em",
    opacity: 0.08 + p * 0.86,
    transform: `translate(${x}px,${y + (1 - p) * 42}px) scale(${0.92 + p * 0.08})`,
    textShadow: `0 0 ${12 + p * 24}px rgba(239,107,66,${0.24 + p * 0.5})`,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    ...style,
  }}>{text}</div>
);

const Burst = ({p}: {p: number}) => <>
  <div style={{position: "absolute", left: W / 2 - 10, top: H / 2 - 10, width: 20, height: 20, borderRadius: "50%", background: ACCENT, opacity: 1 - p, transform: `scale(${1 + p * 22})`, boxShadow: `0 0 0 ${p * 70}px rgba(239,107,66,${0.45 * (1 - p)})`}} />
  {Array.from({length: 18}).map((_, index) => {
    const angle = (index / 18) * Math.PI * 2;
    const length = 100 + p * (240 + (index % 4) * 35);
    return <span key={index} style={{position: "absolute", left: W / 2, top: H / 2, width: length, height: 5 + (index % 3) * 2, background: index % 2 ? CYAN : ACCENT, transformOrigin: "0 50%", transform: `rotate(${angle}rad) scaleX(${easeOut(p)})`, opacity: (1 - p) * 0.9}} />;
  })}
</>;

const Reticle = ({p, scan = false}: {p: number; scan?: boolean}) => <>
  <div style={{position: "absolute", left: 420, top: 245, width: 1080, height: 590, border: "2px solid rgba(138,211,223,.72)", opacity: 0.25 + p * 0.65, transform: `scale(${2.2 - p * 1.2})`}} />
  {["left:420;top:245;border-right:0;border-bottom:0", "right:420;top:245;border-left:0;border-bottom:0", "left:420;bottom:245;border-right:0;border-top:0", "right:420;bottom:245;border-left:0;border-top:0"].map((raw, index) => <span key={index} style={{position: "absolute", width: 92, height: 92, border: `8px solid ${index % 2 ? CYAN : ACCENT}`, opacity: p, transform: `scale(${0.35 + p * 0.65})`, ...(Object.fromEntries(raw.split(";").map((part) => { const [key, value] = part.split(":"); return [key, `${value}px`]; })) as CSSProperties)}} />)}
  {scan ? <div style={{position: "absolute", left: 330, right: 330, top: `${250 + p * 560}px`, height: 5, background: CYAN, boxShadow: `0 0 26px ${CYAN}`, opacity: 0.9}} /> : null}
</>;

const GridAssembly = ({p}: {p: number}) => <div style={{position: "absolute", left: 310, top: 220, width: 1300, height: 650, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridTemplateRows: "repeat(3, 1fr)", gap: 18}}>{Array.from({length: 12}).map((_, index) => {
  const q = easeOut(Math.max(0, Math.min(1, p * 1.5 - index * 0.06)));
  const dx = (index % 2 ? 1 : -1) * (1 - q) * 160;
  const dy = (index % 3 - 1) * (1 - q) * 100;
  return <div key={index} style={{border: `2px solid ${index % 3 ? "#39535c" : ACCENT}`, background: index % 2 ? "rgba(138,211,223,.10)" : "rgba(239,107,66,.12)", opacity: q, transform: `translate(${dx}px,${dy}px) rotate(${(1 - q) * (index % 2 ? 8 : -8)}deg) scale(${0.65 + q * 0.35})`}} />;
})}</div>;

const OrbField = ({p, sleep = false}: {p: number; sleep?: boolean}) => <>{Array.from({length: 5}).map((_, index) => {
  const x = 12 + ((index * 23) % 78);
  const y = 18 + ((index * 37) % 64);
  const q = sleep ? Math.max(0, 1 - p * 1.25) : p;
  return <div key={index} style={{position: "absolute", left: `${x}%`, top: `${y}%`, width: 280 + index * 42, height: 280 + index * 42, borderRadius: "50%", background: index % 2 ? "rgba(138,211,223,.30)" : "rgba(239,107,66,.30)", filter: "blur(70px)", opacity: q * 0.75, transform: `translate(-50%,-50%) translate(${Math.sin(p * Math.PI * 2 + index) * 110}px,${Math.cos(p * Math.PI * 1.7 + index) * 80}px)`}} />;
})}</>;

const ShardField = ({p}: {p: number}) => <div style={{position: "absolute", inset: 120, display: "grid", gridTemplateColumns: "repeat(5,1fr)", gridTemplateRows: "repeat(4,1fr)", gap: 8}}>{Array.from({length: 20}).map((_, index) => {
  const angle = (index % 2 ? 1 : -1) * (1 - p) * (12 + (index % 5) * 4);
  const distance = (1 - p) * (80 + (index % 4) * 36);
  return <div key={index} style={{border: `2px solid ${index % 3 ? CYAN : ACCENT}`, background: index % 2 ? "rgba(138,211,223,.22)" : "rgba(239,107,66,.22)", transform: `translate(${Math.cos(index * 1.7) * distance}px,${Math.sin(index * 1.7) * distance}px) rotate(${angle}deg)`, opacity: 0.18 + p * 0.72}} />;
})}</div>;

const DataLandscape = ({p}: {p: number}) => <div style={{position: "absolute", left: 180, right: 180, bottom: 130, height: 660, perspective: 900, transform: `translateY(${(1 - p) * 120}px) rotateX(${(1 - p) * 34}deg)`}}>{Array.from({length: 16}).map((_, index) => { const h = 90 + ((index * 47) % 360) * p; return <div key={index} style={{position: "absolute", left: `${index * 6.6}%`, bottom: 0, width: 34, height: h, background: index % 3 ? CYAN : ACCENT, opacity: 0.3 + p * 0.6, boxShadow: `0 0 22px ${index % 3 ? CYAN : ACCENT}`}} />; })}</div>;

const DotField = ({p}: {p: number}) => <div style={{position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "repeat(16,1fr)", gridTemplateRows: "repeat(8,1fr)", padding: 100, gap: 18}}>{Array.from({length: 128}).map((_, index) => { const q = easeOut(Math.max(0, Math.min(1, p * 1.4 - ((index * 17) % 19) * 0.025))); return <span key={index} style={{borderRadius: "50%", background: index % 5 ? "#91a3ab" : ACCENT, opacity: q * (0.4 + (index % 3) * 0.2), transform: `scale(${0.2 + q * 0.8})`}} />; })}</div>;

const Grain = ({p}: {p: number}) => <div style={{position: "absolute", inset: 180}}>{Array.from({length: 120}).map((_, index) => { const x = (index * 83) % 100; const y = (index * 47) % 100; const q = easeOut(Math.max(0, Math.min(1, p * 1.5 - (index % 17) * 0.025))); return <i key={index} style={{position: "absolute", left: `${x}%`, top: `${y}%`, width: 4 + (index % 4) * 2, height: 4 + (index % 4) * 2, borderRadius: "50%", background: index % 3 ? CYAN : ACCENT, opacity: q * (1 - p * 0.45), transform: `translate(${(1 - q) * ((index % 2 ? 1 : -1) * 140)}px,${(1 - q) * 80}px)`}} />; })}</div>;

type BodyProps = {text: string; items: EffectItem[]; p: number; frame: number; seconds: number};
const glow = (p: number) => Math.pow(Math.max(0, Math.sin(p * Math.PI * 4)), 8);
const dots = (p: number, count = 18, accent = ACCENT, secondary = CYAN) => <>{Array.from({length: count}).map((_, index) => { const a = Math.PI * 2 * index / count; const d = easeOut(p) * (110 + (index % 6) * 52); return <i key={index} style={{position: "absolute", left: W / 2, top: H / 2, width: 6 + index % 5 * 3, height: 6 + index % 5 * 3, borderRadius: index % 3 ? "50%" : 2, background: index % 2 ? accent : secondary, opacity: (1 - p) * .82, transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px)`}} />; })}</>;
const explicitCue = ({text, p, frame, kind}: BodyProps & {kind: EffectStyle}) => {
  const pulse = glow(p);
  switch (kind) {
    case "anime-impact": return <><div style={{position: "absolute", inset: 0, background: "#fff", opacity: Math.max(0, .85 - p * 4), mixBlendMode: "screen"}} />{Array.from({length: 28}).map((_, index) => <i key={index} style={{position: "absolute", left: W / 2, top: H / 2, width: 420 + index % 5 * 115, height: 5 + index % 3 * 3, background: index % 4 ? "#fff" : ACCENT, opacity: Math.max(0, .9 - p * 3), transformOrigin: "0 50%", transform: `rotate(${index / 28 * Math.PI * 2}rad) scaleX(${easeOut(p * 3)})`}} />)}<CueText text={text} p={p} /></>;
    case "assemble-then-type-flyin": return <><GridAssembly p={p} /><div style={{position: "absolute", left: 300, right: 300, top: 440, display: "flex", justifyContent: "center", perspective: "680px"}}>{Array.from(text.slice(0, 18)).map((ch, index) => { const q = easeOut(Math.max(0, Math.min(1, (p - .34 - index * .025) / .38))); return <span key={`${ch}-${index}`} style={{display: "inline-block", color: INK, fontSize: 106, fontWeight: 950, opacity: q, transform: `translate3d(${(1 - q) * (deterministic(index) - .5) * 280}px,${(1 - q) * (deterministic(index + 33) - .5) * 210}px,${-120 * (1 - q)}px) rotateX(${(1 - q) * (deterministic(index + 71) - .5) * 260}deg) rotateY(${(1 - q) * (deterministic(index + 89) - .5) * 300}deg)`}}>{ch === " " ? "\u00a0" : ch}</span>; })}</div></>;
    case "attention-bounce": { const jump = Math.max(0, Math.sin(Math.min(1, p * 1.2) * Math.PI * 4)); return <><div style={{position: "absolute", left: 250, right: 250, top: 850, height: 8, background: CYAN}} /><div style={{position: "absolute", left: 470, top: 570 - jump * (100 + p * 180), width: 300, height: 300, borderRadius: 56, background: `linear-gradient(145deg,${ACCENT},${CYAN})`, transform: `scale(${1 + (1 - jump) * .12},${1 - (1 - jump) * .12})`}} /><GridAssembly p={Math.max(0, (p - .62) * 3)} /><CueText text={text} p={Math.max(0, (p - .72) * 3)} index={-3} /></>; }
    case "aurora-bloom-bg-flip": return <><OrbField p={Math.min(1, p * 1.5)} /><div style={{position: "absolute", inset: 0, background: "#080910", opacity: Math.max(0, (p - .62) * 2.65)}} /><CueText text={text} p={p < .62 ? Math.max(0, 1 - p * 1.45) : Math.max(0, (p - .74) * 4)} /></>;
    case "brand-frame-snap": { const snap = p > .66; const color = snap ? "#1bc47d" : "#3e7bfa"; return <><div style={{position: "absolute", inset: 40, border: `${22 + pulse * 8}px solid ${color}`, opacity: easeOut(p), boxSizing: "border-box"}} /><GridAssembly p={p} /><CueText text={text} p={p} /></>; }
    case "corner-spotlight-reveal": return <><div style={{position: "absolute", inset: 0, background: `radial-gradient(circle ${120 + p * 1700}px at 5% 8%, transparent 0%, rgba(4,5,10,.16) 38%, rgba(3,3,8,.9) 76%)`}} /><div style={{position: "absolute", left: 0, top: 0, width: 250 + p * 1280, height: 7, background: CYAN, boxShadow: `0 0 28px 10px ${CYAN}`}} /><CueText text={text} p={p} /></>;
    case "dashboard-glow-highlight-pill": return <><GridAssembly p={p} /><div style={{position: "absolute", left: 590 + p * 520, top: 670, width: 160 * p, height: 48, borderRadius: 30, background: "#e6bc56", boxShadow: "0 0 35px #e6bc56"}} /><div style={{position: "absolute", left: 805, top: 310, width: 350, height: 220, border: "4px solid #e6bc56", borderRadius: 18, opacity: Math.max(0, (p - .55) * 2.2)}} /><CueText text={text} p={p} index={-3} /></>;
    case "flyline-arc": return <><svg width={W} height={H} style={{position: "absolute", inset: 0}}><path d="M 230 780 C 560 160, 1120 920, 1700 300" fill="none" stroke={CYAN} strokeWidth="7" strokeDasharray="1900" strokeDashoffset={1900 * (1 - p)} /><circle cx={230 + p * 1470} cy={780 - Math.sin(p * Math.PI) * 425} r={19 + pulse * 12} fill={ACCENT} /></svg><CueText text={text} p={p} /></>;
    case "glow-orb-ambient": return <><OrbField p={p} /><div style={{position: "absolute", left: 560, top: 305, width: 800, height: 480, border: `3px solid ${CYAN}`, borderRadius: 38, background: "rgba(7,12,17,.66)", boxShadow: `0 0 ${40 + pulse * 80}px ${ACCENT}`}} /><CueText text={text} p={p} /></>;
    case "glow-wake-sleep-panel": return <><div style={{position: "absolute", left: 350 + p * 90, top: 175 + p * 36, width: 1220, height: 720, transform: "perspective(1500px) rotateY(-12deg) rotateX(8deg) rotateZ(-5deg)", borderRadius: 32, background: `radial-gradient(circle 620px at ${-300 + p * 2440}px 130px, rgba(208,164,255,.75), rgba(6,6,12,.95) 75%)`, opacity: p < .80 ? easeOut(p * 2.2) : Math.max(0, 1 - (p - .8) * 3.6)}}><div style={{position: "absolute", left: -420 + p * 2450, top: -18, width: 780, height: 42, background: "#f4d6ff", filter: "blur(12px)", boxShadow: "0 0 36px 14px #a15fec"}} /></div><CueText text={text} p={p} /></>;
    case "halation-bloom": return <><div style={{position: "absolute", inset: 0, display: "grid", placeItems: "center", filter: `blur(${20 + p * 35}px) brightness(1.9)`, opacity: p * .65, transform: `scale(${.8 + p * .75})`}}><span style={{fontSize: 166, color: "#fff1d9", fontWeight: 950}}>{text}</span></div><CueText text={text} p={p} /></>;
    case "hit-counter": return <><div style={{position: "absolute", left: 200, right: 200, top: 380, display: "flex", justifyContent: "space-between"}}>{[.25, .50, .74].map((at, index) => { const q = easeOut(Math.max(0, Math.min(1, (p - at + .12) / .12))); return <div key={index} style={{width: 370, height: 260, border: "3px dashed #8ad3df", transform: `translateY(${(1 - q) * -430}px)`, opacity: q}}><div style={{position: "absolute", inset: 20, background: index % 2 ? "#8ad3df55" : "#ef6b4255"}} /></div>; })}</div><div style={{position: "absolute", right: 110, top: 90, color: "#fff", background: ACCENT, borderRadius: 22, fontSize: 78, fontWeight: 950, padding: "14px 34px", transform: `rotate(${-Math.floor(p * 4) * 3}deg) scale(${1 + pulse * .35})`}}>×{Math.min(3, Math.floor(p * 4))}</div><CueText text={text} p={p} index={-3} /></>;
    case "impact-burst-kit": return <><GridAssembly p={Math.max(0, p - .28)} /><Burst p={Math.max(0, p - .27)} />{dots(Math.max(0, p - .28), 22)}<CueText text={text} p={p} /></>;
    case "kanada-perspective-snap": return <><div style={{position: "absolute", left: 620, top: 280, width: 680, height: 460, perspective: `${320 + p * 1200}px`}}><div style={{position: "absolute", inset: 0, borderRadius: 34, background: `linear-gradient(145deg,${ACCENT},${CYAN})`, transform: `translateX(${(1 - p) * -830}px) scale(${1.7 - p * .7}) rotate3d(.5,1,.1,${(1 - p) * 58}deg)`, boxShadow: "38px 38px 38px rgba(0,0,0,.35)"}} /></div><CueText text={text} p={p} /></>;
    case "line-boil": return <><CueText text={text} p={p} /><div style={{position: "absolute", left: 370, right: 370, top: 680 + Math.sin(frame * .8) * 4, height: 7, background: ACCENT, transform: `rotate(${Math.sin(frame * .5)}deg)`}} /></>;
    case "line-unfold-panel": return <><div style={{position: "absolute", left: 300, right: 300, top: 230, height: 650, border: `4px solid ${CYAN}`, background: "rgba(13,23,28,.3)", opacity: p, transformOrigin: "top", transform: `scaleY(${Math.max(.03, p)})`}} /><CueText text={text} p={p} /></>;
    case "misregistration-hit": { const wobble = Math.cos(p * Math.PI * 7) * (1 - p) * 22; return <><CueText text={text} p={p} /><CueText text={text} p={p} style={{color: "#efb45b", transform: `translate(${wobble}px,${wobble * .28}px)`}} /><CueText text={text} p={p} style={{color: "#55d9df", transform: `translate(${-wobble}px,${-wobble * .28}px)`}} /></>; }
    case "orb-flyline-relay": return <><OrbField p={p} /><svg width={W} height={H} style={{position: "absolute", inset: 0}}><path d="M 430 350 C 790 120, 1220 290, 1480 480" fill="none" stroke={CYAN} strokeWidth="8" strokeDasharray="1500" strokeDashoffset={1500 * (1 - Math.min(1, p * 1.8))} /><path d="M 1480 480 C 1320 800, 1050 880, 920 800" fill="none" stroke={ACCENT} strokeWidth="8" strokeDasharray="1500" strokeDashoffset={1500 * (1 - Math.max(0, p * 2 - 1))} /></svg><CueText text={text} p={p} /></>;
    case "pop-burst-confirm": return <><div style={{position: "absolute", left: W / 2 - 145, top: H / 2 - 145, width: 290, height: 290, borderRadius: "50%", border: `13px solid #f1ad4d`, transform: `scale(${.6 + easeOut(p) * .4})`}}><span style={{position: "absolute", left: 80, top: 38, color: CYAN, fontSize: 150, fontWeight: 950}}>✓</span></div>{dots(p, 12, "#f1ad4d", CYAN)}<CueText text={text} p={p} index={3} /></>;
    case "reticle-lock-on": return <><Reticle p={p} /><div style={{position: "absolute", left: 730, top: 410, width: 460, height: 190, border: `4px solid ${ACCENT}`, opacity: p, transform: `scale(${2.1 - p * 1.1})`}} /><CueText text={text} p={p} /></>;
    case "scan-bracket-sweep": return <><div style={{position: "absolute", left: 610, top: 180, width: 700, height: 720, borderRadius: 18, background: "rgba(244,246,247,.15)", border: "2px solid #fff", overflow: "hidden"}}>{Array.from({length: 12}).map((_, index) => <i key={index} style={{position: "absolute", left: 65, right: 85 + index % 4 * 35, top: 72 + index * 44, height: 9, background: index % 4 ? "#ffffff55" : CYAN}} />)}<div style={{position: "absolute", left: 0, right: 0, top: 90 + ((p * 5) % 1) * 510, height: 5, background: CYAN, boxShadow: `0 0 20px ${CYAN}`}} /></div><Reticle p={p} /><CueText text={text} p={p} index={-3} /></>;
    case "scanline-annotate-focus": return <><div style={{position: "absolute", left: 250, right: 250, top: 120 + p * 760, height: 5, background: CYAN, boxShadow: `0 0 25px 8px ${CYAN}`}} />{[{x: 370, y: 230}, {x: 1050, y: 380}, {x: 510, y: 630}, {x: 1200, y: 690}].map((target, index) => { const q = easeOut(Math.max(0, Math.min(1, (p - .2 - index * .13) / .17))); return <div key={index}><div style={{position: "absolute", left: target.x, top: target.y, width: 340, height: 150, border: `4px solid ${ACCENT}`, opacity: q, transform: `scale(${1.75 - q * .75})`}} /><span style={{position: "absolute", left: target.x + 350, top: target.y, color: CYAN, opacity: q, fontSize: 19, fontWeight: 800}}>FOCUS 0{index + 1}</span></div>; })}</>;
    case "scanline-assemble-flyin": return <><GridAssembly p={p} /><div style={{position: "absolute", left: 240, right: 240, top: 110 + p * 800, height: 5, background: CYAN, boxShadow: `0 0 24px 8px ${CYAN}`}} /><CueText text={text} p={p} index={-3} /></>;
    case "score-slam": return <><div style={{position: "absolute", left: -100, right: -100, top: H / 2 - 38, height: 76, background: ACCENT, transform: `skewY(-8deg) scaleX(${easeOut(p)})`, boxShadow: `0 0 42px ${ACCENT}`}} /><div style={{position: "absolute", left: 0, right: 0, top: 310, textAlign: "center", color: "#fff", fontSize: 210, fontWeight: 950, transform: `scale(${1.6 - p * .6})`, opacity: p}}>SCORE</div><CueText text={text} p={p} index={3} /></>;
    case "sheen-sweep": return <><CueText text={text} p={p} /><div style={{position: "absolute", left: -420 + p * 2750, top: -100, width: 320, height: 1280, transform: "skewX(-22deg)", background: "linear-gradient(90deg,transparent,rgba(255,255,255,.9),transparent)", mixBlendMode: "screen"}} /></>;
    case "slide-spotlight-pan": return <><div style={{position: "absolute", left: 350 - 140 + p * 260, top: 185, width: 1220, height: 720, borderRadius: 32, transform: "perspective(1500px) rotateY(-14deg) rotateX(7deg) rotateZ(-8deg)", background: `radial-gradient(circle 520px at ${-180 + p * 1650}px 110px, #f3d4ff77, rgba(5,5,12,.95) 76%)`}} /><CueText text={text} p={p} /></>;
    case "spotlight-sweep": return <><div style={{position: "absolute", inset: 0, background: `radial-gradient(circle ${180 + p * 650}px at ${120 + p * 1680}px 430px, rgba(255,255,255,.1), rgba(4,4,11,.86) 72%)`}} /><CueText text={text} p={p} /></>;
    case "crane-rise-reveal": return <><div style={{position: "absolute", left: 130, top: 100, width: 1660, height: 870, overflow: "hidden", border: "2px solid #8ad3df"}}><div style={{position: "absolute", inset: 0, transformOrigin: "left top", transform: `translate(${-1300 * (1 - p)}px,${-1260 * (1 - p)}px) scale(${1 + (1 - p) * 2.2})`}}>{Array.from({length: 8}).map((_, index) => <div key={index} style={{position: "absolute", left: 80, right: 80, top: 80 + index * 104, height: 76, border: "2px solid #ffffff44", background: "#ffffff12"}} />)}</div></div><CueText text={text} p={p} index={-3} /></>;
    case "dataviz-landscape-open": return <><svg width={W} height={H} style={{position: "absolute", inset: 0}}>{["M -100 870 C 390 620 580 790 1340 420", "M -80 570 C 360 540 820 700 1340 420", "M 40 1020 C 620 700 760 730 1340 420", "M 340 120 C 610 450 980 310 1340 420"].map((d, index) => <path key={index} d={d} fill="none" stroke={index % 2 ? CYAN : ACCENT} strokeWidth={index ? 5 : 10} strokeDasharray="2200" strokeDashoffset={2200 * (1 - p)} opacity={.28 + index * .14} />)}</svg><CueText text={text} p={p} index={-3} /></>;
    case "fracture": return <><ShardField p={p} /><CueText text={text} p={p} /></>;
    case "icon-field-colorize": return <><DotField p={p} /><div style={{position: "absolute", left: 700, top: 350, width: 520, height: 330, border: `5px solid ${ACCENT}`, opacity: p, transform: `scale(${.75 + p * .25})`}} /><CueText text={text} p={p} index={3} /></>;
    case "stroke-segment-build": return <><svg width={W} height={H} style={{position: "absolute", inset: 0}}>{Array.from({length: 16}).map((_, index) => { const rank = [7,2,12,4,0,14,9,1,10,5,15,6,3,13,8,11].indexOf(index); const q = easeOut(Math.max(0, Math.min(1, (p - .08 - rank * .045) / .14))); return <line key={index} x1={430 + index % 4 * 250} y1={310 + Math.floor(index / 4) * 145} x2={550 + index % 4 * 250} y2={310 + Math.floor(index / 4) * 145 + (index % 3 - 1) * 80} stroke={index % 3 ? INK : ACCENT} strokeWidth="18" opacity={q} />; })}</svg><CueText text={text} p={Math.max(0, (p - .78) * 5)} /></>;
    case "grain-dissolve": return <><Grain p={p} /><div style={{position: "absolute", left: 430, top: 410, width: 1060, height: 250, border: `2px dashed ${CYAN}`, opacity: p < .7 ? p : 0, transform: "rotate(-4deg)"}} /><CueText text={text} p={Math.max(0, (p - .62) * 2.7)} /></>;
    case "logo-shrink-wordmark-lockup": return <><div style={{position: "absolute", left: W / 2 - 90, top: H / 2 - 90, width: 180, height: 180, borderRadius: "50%", border: `20px solid ${ACCENT}`, transform: `translateX(${-Math.max(0, p - .36) * 390}px) scale(${5.2 - p * 4.2})`, boxShadow: `0 0 42px ${ACCENT}`}} /><CueText text={text} p={Math.max(0, (p - .48) * 2.3)} x={170} /></>;
    case "logo-sting-button": return <><div style={{position: "absolute", inset: 0, background: "#000", opacity: .65 + p * .30}} />{p > .62 && p < .75 ? <GridAssembly p={1} /> : null}<div style={{position: "absolute", left: W / 2 - 260, top: H / 2 - 100, color: INK, fontSize: 105, fontWeight: 950, opacity: p > .75 ? 1 : Math.max(0, (p - .28) * 2.1)}}>{text}</div></>;
    case "neon-triple-marquee": return <><div style={{position: "absolute", inset: 0, background: "#050308"}} />{["BETTER", "FASTER", "STRONGER"].map((word, index) => <div key={word} style={{position: "absolute", left: ((frame * (index === 1 ? -18 : 14)) % 920) - 900, top: 150 + index * 285, width: 3800, fontSize: 205, lineHeight: 1, fontWeight: 950, color: "transparent", WebkitTextStroke: `${5 + (index === Math.floor(frame / 15) % 3 ? 3 : 0)}px ${index === 0 ? "#4d9fff" : index === 1 ? "#ff4dd2" : "#ffb347"}`, opacity: .4 + (index === Math.floor(frame / 15) % 3 ? .6 : 0), filter: `drop-shadow(0 0 24px ${index === 0 ? "#4d9fff" : index === 1 ? "#ff4dd2" : "#ffb347"})`}}>{Array.from({length: 7}).map((_, copy) => <span key={copy}>{copy === 0 ? text : word} · </span>)}</div>)}</>;
    default: { const impossible: never = kind; throw new Error(`Missing effect renderer: ${impossible}`); }
  }
};
const EffectBody = ({style, ...props}: BodyProps & {style: string}): ReactNode => {
  const recipe = EFFECT_RECIPES[style as EffectStyle];
  if (!recipe) throw new Error(`Unsupported effect style: ${style}`);
  return explicitCue({...props, kind: recipe.renderer});
};

export const EffectTemplate = ({spec, style = "line-unfold-panel", css}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  const rawProgress = effectProgress(spec.at, seconds);
  const p = easeInOut(rawProgress);
  // Keep the geometry clamped through easing, but use the raw progression to
  // retire the overlay. Previously p could never exceed 1, so p >= 1.08 was
  // unreachable and completed effects froze for the entire scene window.
  if (seconds < spec.at || rawProgress > 1.08) return null;
  const items = spec.items ?? [];
  return <AbsoluteFill style={{background: "transparent", overflow: "hidden", pointerEvents: "none", ...css}}>
    <EffectBody style={style} text={spec.text} items={items} p={p} frame={frame} seconds={seconds} />
    <Sfx style={style} />
  </AbsoluteFill>;
};
