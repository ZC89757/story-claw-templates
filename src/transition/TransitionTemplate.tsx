import type {CSSProperties} from "react";
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {easeInOut, transitionProgress} from "./evaluate";
import type {TransitionSpec} from "./types";

type Props = {spec: TransitionSpec; style?: string; css?: CSSProperties};

const W = 1920;
const H = 1080;
const ACCENT = "#ef6b42";
const CYAN = "#8ad3df";

const TRANSITION_STYLES = [
  "bottom-push-stack-wipe", "bubble-swarm-takeover", "card-flip-reveal", "card-flock-tumble",
  "circle-match-iris", "color-block-step-wipe", "cube-navigation", "gradient-transition",
  "line-carry-transition", "mosaic-reframe", "cube-rotate", "barn-door-split", "paper-plane-messenger",
  "ink-bleed-reveal", "glitch-displace", "invisible-cut", "versus-slam", "light-leak-burn",
  "shared-element-morph", "letterform-zoom", "flash-cut", "shot-transitions-4", "shot-transitions-5",
  "shot-transitions-6", "whip-pan", "mask-wipe", "clock-wipe", "blinds-slice", "white-flash-logo-simplify-cut",
] as const;

type TransitionStyle = (typeof TRANSITION_STYLES)[number];
type SfxName = "glitch-electric-small.mp3" | "impact-cine.mp3" | "riser-cine.mp3" | "swoosh-quick.mp3" | "transition-snap.mp3" | "transition-soft.mp3" | "whoosh-big.mp3" | "whoosh-fast.mp3";

type TransitionRecipe = {
  renderer: TransitionStyle;
  sfx: SfxName;
  volume: number;
  accent: string;
  secondary: string;
};

// Exact lookup is intentional: group is the style selector, not a string from which
// a generic animation may be guessed. Every catalog group must have one renderer.
const TRANSITION_RECIPES = {
  "bottom-push-stack-wipe": {renderer: "bottom-push-stack-wipe", sfx: "whoosh-big.mp3", volume: .20, accent: "#ef6b42", secondary: "#162631"},
  "bubble-swarm-takeover": {renderer: "bubble-swarm-takeover", sfx: "transition-soft.mp3", volume: .17, accent: "#f5b96a", secondary: "#8ad3df"},
  "card-flip-reveal": {renderer: "card-flip-reveal", sfx: "swoosh-quick.mp3", volume: .17, accent: "#f0b55d", secondary: "#496d8c"},
  "card-flock-tumble": {renderer: "card-flock-tumble", sfx: "impact-cine.mp3", volume: .20, accent: "#a98cff", secondary: "#f06a85"},
  "circle-match-iris": {renderer: "circle-match-iris", sfx: "transition-soft.mp3", volume: .15, accent: "#ef6b42", secondary: "#8ad3df"},
  "color-block-step-wipe": {renderer: "color-block-step-wipe", sfx: "transition-snap.mp3", volume: .18, accent: "#f15c4d", secondary: "#f1c84b"},
  "cube-navigation": {renderer: "cube-navigation", sfx: "whoosh-big.mp3", volume: .17, accent: "#77bed0", secondary: "#ef6b42"},
  "gradient-transition": {renderer: "gradient-transition", sfx: "transition-soft.mp3", volume: .13, accent: "#ad7cff", secondary: "#ff916b"},
  "line-carry-transition": {renderer: "line-carry-transition", sfx: "swoosh-quick.mp3", volume: .15, accent: "#fff6df", secondary: "#ef6b42"},
  "mosaic-reframe": {renderer: "mosaic-reframe", sfx: "transition-soft.mp3", volume: .14, accent: "#ef6b42", secondary: "#8ad3df"},
  "cube-rotate": {renderer: "cube-rotate", sfx: "whoosh-big.mp3", volume: .18, accent: "#ef6b42", secondary: "#314b63"},
  "barn-door-split": {renderer: "barn-door-split", sfx: "swoosh-quick.mp3", volume: .17, accent: "#ef6b42", secondary: "#8ad3df"},
  "paper-plane-messenger": {renderer: "paper-plane-messenger", sfx: "whoosh-fast.mp3", volume: .16, accent: "#f6f0dc", secondary: "#4b8aa8"},
  "ink-bleed-reveal": {renderer: "ink-bleed-reveal", sfx: "transition-soft.mp3", volume: .16, accent: "#131313", secondary: "#ded0b8"},
  "glitch-displace": {renderer: "glitch-displace", sfx: "glitch-electric-small.mp3", volume: .20, accent: "#f25763", secondary: "#5bd2e7"},
  "invisible-cut": {renderer: "invisible-cut", sfx: "transition-snap.mp3", volume: .12, accent: "#f8f8f3", secondary: "#111827"},
  "versus-slam": {renderer: "versus-slam", sfx: "impact-cine.mp3", volume: .22, accent: "#f15d49", secondary: "#ffffff"},
  "light-leak-burn": {renderer: "light-leak-burn", sfx: "transition-soft.mp3", volume: .15, accent: "#ff874e", secondary: "#ffe0a1"},
  "shared-element-morph": {renderer: "shared-element-morph", sfx: "whoosh-fast.mp3", volume: .15, accent: "#76d8dd", secondary: "#f4f0e7"},
  "letterform-zoom": {renderer: "letterform-zoom", sfx: "riser-cine.mp3", volume: .16, accent: "#ffffff", secondary: "#ef6b42"},
  "flash-cut": {renderer: "flash-cut", sfx: "transition-snap.mp3", volume: .19, accent: "#ffffff", secondary: "#ef6b42"},
  "shot-transitions-4": {renderer: "shot-transitions-4", sfx: "whoosh-big.mp3", volume: .18, accent: "#0b0e14", secondary: "#ffffff"},
  "shot-transitions-5": {renderer: "shot-transitions-5", sfx: "riser-cine.mp3", volume: .17, accent: "#8ad3df", secondary: "#ef6b42"},
  "shot-transitions-6": {renderer: "shot-transitions-6", sfx: "transition-snap.mp3", volume: .17, accent: "#ffffff", secondary: "#ef6b42"},
  "whip-pan": {renderer: "whip-pan", sfx: "whoosh-fast.mp3", volume: .20, accent: "#ffffff", secondary: "#ef6b42"},
  "mask-wipe": {renderer: "mask-wipe", sfx: "whoosh-big.mp3", volume: .17, accent: "#ffffff", secondary: "#8ad3df"},
  "clock-wipe": {renderer: "clock-wipe", sfx: "transition-snap.mp3", volume: .16, accent: "#ef6b42", secondary: "#ffffff"},
  "blinds-slice": {renderer: "blinds-slice", sfx: "transition-snap.mp3", volume: .17, accent: "#8ad3df", secondary: "#ef6b42"},
  "white-flash-logo-simplify-cut": {renderer: "white-flash-logo-simplify-cut", sfx: "transition-snap.mp3", volume: .19, accent: "#ffffff", secondary: "#4b75c8"},
} as const satisfies Record<TransitionStyle, TransitionRecipe>;

const recipeFor = (style: string): TransitionRecipe => {
  const recipe = TRANSITION_RECIPES[style as TransitionStyle];
  if (!recipe) throw new Error(`Unsupported transition style: ${style}`);
  return recipe;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress;
const smooth = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const pulse = (p: number) => Math.sin(Math.PI * clamp01(p));

const FixedSfx = ({recipe}: {recipe: TransitionRecipe}) => {
  const {fps} = useVideoConfig();
  return <Sequence from={Math.round(.08 * fps)} durationInFrames={Math.max(1, Math.round(.8 * fps))} layout="none"><Audio src={staticFile(`audio/${recipe.sfx}`)} volume={recipe.volume} /></Sequence>;
};

const Cover = ({color, opacity = 1}: {color: string; opacity?: number}) => <div style={{position: "absolute", inset: 0, background: color, opacity}} />;
const Label = ({text, color = "#fff"}: {text: string; color?: string}) => <div style={{position: "absolute", left: 0, right: 0, top: "50%", transform: "translateY(-50%)", textAlign: "center", color, fontSize: 96, lineHeight: 1, fontWeight: 950, letterSpacing: ".04em", textShadow: "0 6px 26px rgba(0,0,0,.25)"}}>{text.slice(0, 16)}</div>;
type BodyProps = {p: number; e: number; text: string; recipe: TransitionRecipe};

const BottomPushStack = ({e, text, recipe}: BodyProps) => <>
  <div style={{position: "absolute", inset: 0, background: "#15232e"}}><Label text={text} color="#b6d5df" /></div>
  <div style={{position: "absolute", left: 0, right: 0, height: H, top: H - e * H, background: recipe.accent, boxShadow: "0 -18px 45px rgba(0,0,0,.3)"}}>
    <div style={{position: "absolute", left: 100, right: 100, top: 110, height: 14, borderRadius: 8, background: "rgba(255,255,255,.45)"}} />
    <div style={{position: "absolute", left: 110, top: 184, width: 520, height: 410, borderRadius: 28, background: "rgba(255,255,255,.17)", border: "2px solid rgba(255,255,255,.4)"}} />
    <Label text={text} />
  </div>
</>;

const BubbleSwarm = ({p, e, recipe}: BodyProps) => <>{Array.from({length: 34}).map((_, index) => { const stagger = clamp01((p - (index % 9) * .027) / .73); const grow = easeInOut(stagger); const angle = index * 2.399; const radius = 830 - grow * 600; const x = W / 2 + Math.cos(angle) * radius; const y = H / 2 + Math.sin(angle) * radius * .57; const size = 32 + (index % 7) * 24 + grow * (220 + (index % 5) * 70); return <div key={index} style={{position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: "50%", background: `radial-gradient(circle at 34% 27%,rgba(255,255,255,.94),${index % 3 ? recipe.accent : recipe.secondary} 48%,rgba(255,255,255,.18))`, border: "2px solid rgba(255,255,255,.5)", opacity: .08 + grow * .92, boxShadow: "inset -18px -18px 32px rgba(0,0,0,.12), 0 8px 22px rgba(0,0,0,.18)"}} />; })}<Cover color="#f7f7f4" opacity={smooth((p - .5) / .25) * .24} /></>;

const CardFlip = ({p, e, text, recipe}: BodyProps) => <>{Array.from({length: 3}).map((_, index) => { const q = clamp01((p - index * .14) / .60); const rotate = q * 180; const front = rotate < 90; return <div key={index} style={{position: "absolute", left: 290 + index * 470, top: 285, width: 380, height: 510, transformStyle: "preserve-3d", transform: `perspective(1200px) rotateY(${rotate}deg)`}}><div style={{position: "absolute", inset: 0, borderRadius: 30, backfaceVisibility: "hidden", background: "linear-gradient(145deg,#2a4558,#152731)", border: "2px solid rgba(255,255,255,.25)", padding: 34, boxSizing: "border-box"}}><div style={{height: 22, width: 150, borderRadius: 12, background: recipe.accent}} /><div style={{height: 170, marginTop: 36, borderRadius: 18, background: "rgba(255,255,255,.18)"}} /><div style={{height: 16, marginTop: 28, borderRadius: 8, background: "rgba(255,255,255,.3)"}} /></div><div style={{position: "absolute", inset: 0, borderRadius: 30, backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: recipe.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: 64, fontWeight: 950, padding: 32, boxSizing: "border-box"}}>{front ? "" : text.slice(0, 8)}</div></div>; })}</>;

const CardFlock = ({p, e, text, recipe}: BodyProps) => <>{Array.from({length: 3}).map((_, index) => { const q = clamp01((p - index * .08) / .60); const targetX = 420 + index * 345; const targetY = 325 + index * 42; const x = lerp(index === 0 ? -300 : W + 200, targetX, easeInOut(q)); const y = lerp(index === 1 ? H + 170 : -230, targetY, easeInOut(q)); return <div key={index} style={{position: "absolute", left: x, top: y, width: 520, height: 340, borderRadius: 28, background: `linear-gradient(145deg,${index % 2 ? recipe.secondary : recipe.accent},#111827)`, border: "2px solid rgba(255,255,255,.36)", transform: `perspective(1000px) rotate(${(1 - q) * (index % 2 ? -46 : 38)}deg) rotateY(${(1 - q) * (index % 2 ? 70 : -70)}deg)`, boxShadow: "0 28px 44px rgba(0,0,0,.42)"}}><div style={{position: "absolute", inset: 30, borderRadius: 18, border: "2px solid rgba(255,255,255,.3)"}} /></div>; })}<div style={{position: "absolute", left: "50%", top: "50%", width: 80 + e * 1650, height: 80 + e * 1650, borderRadius: "50%", background: recipe.accent, transform: "translate(-50%,-50%)", opacity: smooth((p - .62) / .23) * .82}} /><Label text={text} /></>;

const CircleIris = ({p, e, recipe}: BodyProps) => <><div style={{position: "absolute", left: W / 2, top: H / 2, width: 80 + e * 2500, height: 80 + e * 2500, borderRadius: "50%", background: `radial-gradient(circle,${recipe.secondary} 0 7%,${recipe.accent} 8% 66%,transparent 67%)`, transform: "translate(-50%,-50%)", boxShadow: "0 0 0 14px rgba(255,255,255,.7)"}} /><div style={{position: "absolute", left: W / 2 - 58, top: H / 2 - 58, width: 116, height: 116, borderRadius: "50%", border: "12px solid #fff", opacity: 1 - e}} /></>;

const ColorBlockStep = ({p, recipe}: BodyProps) => <>{Array.from({length: 5}).map((_, index) => { const q = clamp01((p - index * .13) / .15); const size = 110 + q * (2400 - index * 55); return <div key={index} style={{position: "absolute", left: index % 2 ? W - size : 0, top: index % 3 ? H - size : 0, width: size, height: size, background: index % 2 ? recipe.accent : recipe.secondary, opacity: q, borderRadius: index === 4 ? 0 : 18}} />; })}</>;

const CubeNavigation = ({p, e, text, recipe}: BodyProps) => <div style={{position: "absolute", left: "50%", top: "50%", width: 560, height: 560, transformStyle: "preserve-3d", transform: `translate(-50%,-50%) perspective(1300px) rotateX(${-18 + e * 11}deg) rotateY(${-38 + e * 112}deg) scale(${.62 + e * .38})`}}>{[0, 90, 180, 270].map((angle, index) => <div key={angle} style={{position: "absolute", inset: 0, background: index % 2 ? recipe.secondary : recipe.accent, transform: `rotateY(${angle}deg) translateZ(280px)`, border: "2px solid rgba(255,255,255,.55)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 52, fontWeight: 900}}>{index === 1 ? text.slice(0, 8) : `MODULE ${index + 1}`}</div>)}</div>;

const GradientTransition = ({p, recipe}: BodyProps) => <div style={{position: "absolute", inset: 0, background: `radial-gradient(circle at ${20 + p * 55}% ${30 + Math.sin(p * Math.PI) * 24}%,${recipe.secondary},transparent 47%), conic-gradient(from ${p * 300}deg at 50% 50%,${recipe.accent},#21143d,${recipe.secondary},${recipe.accent})`, opacity: .25 + .75 * pulse(p)}} />;

const LineCarry = ({p, e, recipe}: BodyProps) => <><div style={{position: "absolute", left: -120 + e * 2180, top: 418, width: 520, height: 18, borderRadius: 10, background: "#fff", boxShadow: `0 0 38px 12px ${recipe.accent}`}} /><div style={{position: "absolute", left: -120 + e * 2180, top: 418, width: 18, height: 360, background: recipe.secondary, boxShadow: `0 0 28px 8px ${recipe.secondary}`}} /><div style={{position: "absolute", left: -120 + e * 2180, top: 760, width: 430, height: 18, borderRadius: 10, background: "#fff"}} /></>;

const MosaicReframe = ({p, e, recipe}: BodyProps) => <div style={{position: "absolute", inset: 0}}>{Array.from({length: 12}).map((_, index) => { const row = Math.floor(index / 4); const column = index % 4; const phase = clamp01((p - index * .018) / .75); const fromX = 140 + column * 420; const fromY = 190 + row * 270; const toX = 150 + (index % 3) * 560; const toY = 150 + Math.floor(index / 3) * 210; const w = lerp(370, index === 0 ? 940 : 270, phase); const h = lerp(230, index === 0 ? 530 : 160, phase); return <div key={index} style={{position: "absolute", left: lerp(fromX, toX, phase), top: lerp(fromY, toY, phase), width: w, height: h, borderRadius: 18, background: index % 2 ? recipe.secondary : recipe.accent, border: "3px solid rgba(255,255,255,.7)", opacity: .3 + .7 * phase, overflow: "hidden"}}><div style={{position: "absolute", inset: 18, border: "2px solid rgba(255,255,255,.38)", borderRadius: 12}} /></div>; })}</div>;

const CubeRotate = ({e, recipe}: BodyProps) => <div style={{position: "absolute", inset: 0, perspective: "1500px", overflow: "hidden"}}><div style={{position: "absolute", inset: 0, background: recipe.secondary, transformOrigin: "left center", transform: `rotateY(${-90 * e}deg)`, boxShadow: "18px 0 40px rgba(0,0,0,.4)"}} /><div style={{position: "absolute", inset: 0, background: recipe.accent, transformOrigin: "right center", transform: `rotateY(${90 - 90 * e}deg)`, opacity: e}} /></div>;

const BarnDoor = ({e, recipe}: BodyProps) => <><div style={{position: "absolute", left: 0, top: 0, width: `${50 * e}%`, bottom: 0, background: recipe.accent, boxShadow: "18px 0 32px rgba(0,0,0,.22)"}} /><div style={{position: "absolute", right: 0, top: 0, width: `${50 * e}%`, bottom: 0, background: recipe.secondary, boxShadow: "-18px 0 32px rgba(0,0,0,.22)"}} /><div style={{position: "absolute", left: "50%", top: 0, width: 6, bottom: 0, background: "#fff", opacity: 1 - e}} /></>;

const PaperPlane = ({p, e, recipe}: BodyProps) => {
  const x = lerp(160, 1660, easeInOut(p));
  const y = 700 - Math.sin(p * Math.PI) * 460;
  const angle = lerp(-18, 20, p);
  return <><div style={{position: "absolute", left: 80, top: 610, width: 390, height: 260, borderRadius: 26, background: "rgba(255,255,255,.2)", border: "2px solid rgba(255,255,255,.55)"}} /><div style={{position: "absolute", left: 1450, top: 250, width: 390, height: 260, borderRadius: 26, background: "rgba(255,255,255,.2)", border: "2px solid rgba(255,255,255,.55)", opacity: e}} /><svg width="190" height="150" viewBox="0 0 190 150" style={{position: "absolute", left: x - 95, top: y - 75, transform: `rotate(${angle}deg)`, filter: "drop-shadow(0 13px 13px rgba(0,0,0,.25))"}}><path d="M8 71 180 10 117 138 86 88Z" fill={recipe.accent} stroke="#fff" strokeWidth="5" /><path d="m86 88 94-78-62 128" fill={recipe.secondary} /></svg></>;
};

const InkBleed = ({p, e, recipe}: BodyProps) => <>{Array.from({length: 42}).map((_, index) => { const angle = (Math.PI * 2 * index) / 42; const stagger = clamp01((p - (index % 5) * .028) / .75); const radius = 24 + stagger * (720 + (index % 7) * 85); const size = 70 + (index % 6) * 44 + stagger * 280; return <div key={index} style={{position: "absolute", left: W / 2 + Math.cos(angle) * radius - size / 2, top: H / 2 + Math.sin(angle) * radius * .66 - size / 2, width: size, height: size, borderRadius: `${45 + (index % 4) * 12}% ${55 - (index % 5) * 9}% ${52 + (index % 3) * 13}% ${48 - (index % 4) * 8}%`, background: recipe.accent, opacity: .32 + stagger * .68}} />; })}</>;

const GlitchDisplace = ({p, recipe}: BodyProps) => <>{Array.from({length: 18}).map((_, index) => { const q = clamp01((p - index * .025) / .58); const y = (index * 77) % H; const width = 760 + (index % 5) * 255; const displacement = (index % 2 ? 1 : -1) * (1 - q) * 220; return <div key={index} style={{position: "absolute", left: -120 + displacement, top: y, width, height: 10 + (index % 6) * 12, background: index % 2 ? recipe.secondary : recipe.accent, opacity: (1 - q) * .82, transform: `skewX(${(index % 3 - 1) * 18}deg)`}} />; })}<Cover color="#fff" opacity={pulse(p) * .12} /></>;

const InvisibleCut = ({p, recipe}: BodyProps) => <>{p < .46 ? <div style={{position: "absolute", left: 0, top: 0, bottom: 0, width: `${p / .46 * 110}%`, background: "linear-gradient(105deg,transparent 0%,rgba(255,255,255,.9) 46%,rgba(255,255,255,.98) 54%,transparent 100%)", filter: "blur(8px)"}} /> : <Cover color={recipe.secondary} opacity={.15} />}<div style={{position: "absolute", left: `${p * 128 - 28}%`, top: -120, width: 270, height: 1320, background: recipe.accent, transform: "rotate(18deg)", opacity: .55}} /></>;

const VersusSlam = ({p, e, text, recipe}: BodyProps) => <><div style={{position: "absolute", left: 0, top: 0, bottom: 0, width: `${50 * e}%`, background: recipe.accent, transform: `skewX(${-e * 11}deg)`}} /><div style={{position: "absolute", right: 0, top: 0, bottom: 0, width: `${50 * e}%`, background: recipe.secondary, transform: `skewX(${e * 11}deg)`}} /><Label text={text || "VS"} /><div style={{position: "absolute", left: 0, right: 0, top: H / 2 - 10, height: 20, background: "#fff", transform: `scaleX(${e})`, boxShadow: `0 0 40px ${recipe.accent}`}} /></>;

const LightLeak = ({p, recipe}: BodyProps) => <><div style={{position: "absolute", inset: 0, background: `linear-gradient(110deg, transparent 0%,${recipe.accent} 28%,${recipe.secondary} 48%,transparent 70%)`, opacity: pulse(p) * .82, filter: "blur(18px)", transform: `translateX(${lerp(-35, 35, p)}%)`}} /><Cover color="#fff4d7" opacity={pulse(p) * .34} /></>;

const SharedElementMorph = ({p, e, recipe}: BodyProps) => <><div style={{position: "absolute", left: lerp(230, 740, easeInOut(p)), top: lerp(360, 190, easeInOut(p)), width: lerp(300, 850, e), height: lerp(300, 700, e), borderRadius: lerp(150, 34, e), background: `linear-gradient(145deg,${recipe.accent},${recipe.secondary})`, boxShadow: "0 20px 60px rgba(0,0,0,.3)"}} /><div style={{position: "absolute", left: lerp(340, 810, easeInOut(p)), top: lerp(470, 380, easeInOut(p)), color: "#fff", fontSize: lerp(46, 88, e), fontWeight: 950}}>{"●"}</div></>;

const LetterformZoom = ({p, e, text, recipe}: BodyProps) => <><div style={{position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,-50%) scale(${.3 + e * 18})`, color: recipe.accent, fontSize: 560, fontWeight: 950, lineHeight: .8, opacity: 1 - smooth((p - .75) / .2)}}>{(text || "O").slice(0, 1)}</div><div style={{position: "absolute", inset: 0, border: `${Math.max(0, 100 - e * 120)}px solid ${recipe.secondary}`, opacity: .75}} /></>;

const FlashCut = ({p}: BodyProps) => <Cover color="#fff" opacity={pulse(p) * .95} />;
const DarkTunnel = ({p, e, text}: BodyProps) => <><div style={{position: "absolute", inset: 0, background: "#080b10"}}>{Array.from({length: 12}).map((_, index) => <div key={index} style={{position: "absolute", left: "50%", top: "50%", width: 120 + index * 170, height: 80 + index * 110, border: "4px solid rgba(255,255,255,.15)", transform: `translate(-50%,-50%) scale(${1 + p * (index + 1) * .15})`, opacity: 1 - p}} />)}</div><Label text={text} /></>;
const FocusHandoff = ({p, e, recipe}: BodyProps) => <><div style={{position: "absolute", inset: 0, background: `radial-gradient(circle at ${20 + e * 60}% 50%,rgba(255,255,255,.9),${recipe.secondary} 4%,${recipe.accent} 19%,transparent 47%)`, filter: `blur(${(1 - e) * 24}px)`}} /><div style={{position: "absolute", inset: 0, background: "rgba(0,0,0,.16)", opacity: 1 - e}} /></>;
const BlackCard = ({p, text}: BodyProps) => <><Cover color="#050505" opacity={smooth((p - .15) / .18)} /><Label text={text} /></>;
const WhipPan = ({p, recipe}: BodyProps) => <div style={{position: "absolute", inset: -120, background: `repeating-linear-gradient(98deg,transparent 0 46px,${recipe.secondary} 47px 62px,${recipe.accent} 63px 88px)`, opacity: .15 + pulse(p) * .7, filter: `blur(${18 + (1 - p) * 28}px)`, transform: `translateX(${lerp(-360, 520, easeInOut(p))}px)`}} />;
const MaskWipe = ({p, e, recipe}: BodyProps) => <><div style={{position: "absolute", left: W / 2, top: H / 2, width: 120 + e * 2600, height: 120 + e * 1600, borderRadius: 38, transform: "translate(-50%,-50%) rotate(12deg)", border: `32px solid ${recipe.accent}`, boxShadow: "0 0 0 9999px rgba(8,12,14,.78)"}} /><div style={{position: "absolute", left: W / 2, top: H / 2, width: 70 + e * 2200, height: 70 + e * 1300, borderRadius: 30, transform: "translate(-50%,-50%) rotate(12deg)", background: recipe.secondary, opacity: .24}} /></>;
const ClockWipe = ({e, recipe}: BodyProps) => <><div style={{position: "absolute", inset: 0, background: `conic-gradient(from -90deg at 50% 50%, ${recipe.accent} 0deg, ${recipe.accent} ${e * 360}deg, transparent ${e * 360}deg)`}} /><div style={{position: "absolute", left: W / 2 - 5, top: 70, width: 10, height: H / 2 - 70, background: "#fff", transformOrigin: "50% 100%", transform: `rotate(${e * 360}deg)`, boxShadow: "0 0 22px rgba(255,255,255,.8)"}} /></>;
const BlindsSlice = ({p, recipe}: BodyProps) => <div style={{position: "absolute", inset: 0, display: "flex"}}>{Array.from({length: 12}).map((_, index) => { const q = clamp01((p * 1.2 - index * .035) / .72); return <div key={index} style={{flex: 1, height: "100%", background: index % 2 ? recipe.secondary : recipe.accent, transform: `scaleX(${q})`, transformOrigin: "left center", opacity: .88, borderRight: "2px solid rgba(255,255,255,.4)"}} />; })}</div>;
const WhiteFlashLogo = ({p, e, text, recipe}: BodyProps) => <><Cover color="#fff" opacity={clamp01((p - .05) / .22) * (1 - smooth((p - .48) / .24))} /><div style={{position: "absolute", inset: 0, background: `linear-gradient(110deg,${recipe.accent},${recipe.secondary},#f3ba63,${recipe.accent})`, backgroundSize: "240% 100%", backgroundPosition: `${p * 100}% 50%`, opacity: 1 - smooth((p - .35) / .22)}}><Label text={text} /></div><div style={{position: "absolute", inset: 0, background: "#fff", opacity: smooth((p - .45) / .22)}}><Label text={text} color={recipe.secondary} /></div></>;

const TransitionBody = ({renderer, ...props}: BodyProps & {renderer: TransitionStyle}) => {
  switch (renderer) {
    case "bottom-push-stack-wipe": return <BottomPushStack {...props} />;
    case "bubble-swarm-takeover": return <BubbleSwarm {...props} />;
    case "card-flip-reveal": return <CardFlip {...props} />;
    case "card-flock-tumble": return <CardFlock {...props} />;
    case "circle-match-iris": return <CircleIris {...props} />;
    case "color-block-step-wipe": return <ColorBlockStep {...props} />;
    case "cube-navigation": return <CubeNavigation {...props} />;
    case "gradient-transition": return <GradientTransition {...props} />;
    case "line-carry-transition": return <LineCarry {...props} />;
    case "mosaic-reframe": return <MosaicReframe {...props} />;
    case "cube-rotate": return <CubeRotate {...props} />;
    case "barn-door-split": return <BarnDoor {...props} />;
    case "paper-plane-messenger": return <PaperPlane {...props} />;
    case "ink-bleed-reveal": return <InkBleed {...props} />;
    case "glitch-displace": return <GlitchDisplace {...props} />;
    case "invisible-cut": return <InvisibleCut {...props} />;
    case "versus-slam": return <VersusSlam {...props} />;
    case "light-leak-burn": return <LightLeak {...props} />;
    case "shared-element-morph": return <SharedElementMorph {...props} />;
    case "letterform-zoom": return <LetterformZoom {...props} />;
    case "flash-cut": return <FlashCut {...props} />;
    case "shot-transitions-4": return <DarkTunnel {...props} />;
    case "shot-transitions-5": return <FocusHandoff {...props} />;
    case "shot-transitions-6": return <BlackCard {...props} />;
    case "whip-pan": return <WhipPan {...props} />;
    case "mask-wipe": return <MaskWipe {...props} />;
    case "clock-wipe": return <ClockWipe {...props} />;
    case "blinds-slice": return <BlindsSlice {...props} />;
    case "white-flash-logo-simplify-cut": return <WhiteFlashLogo {...props} />;
    default: {
      const unreachable: never = renderer;
      throw new Error(`Missing transition renderer: ${unreachable}`);
    }
  }
};

export const TransitionTemplate = ({spec, style = "flash-cut", css}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  const p = transitionProgress(spec.at, seconds);
  // transitionProgress is clamped for geometry, while this raw elapsed value owns
  // the overlay lifetime. It prevents a completed cover from freezing on screen.
  const elapsed = (seconds - spec.at) / .72;
  if (seconds < spec.at || elapsed >= 1.08) return null;
  const recipe = recipeFor(style);
  return <AbsoluteFill style={{background: "transparent", overflow: "hidden", pointerEvents: "none", ...css}}><TransitionBody renderer={recipe.renderer} p={p} e={easeInOut(p)} text={spec.text} recipe={recipe} /><FixedSfx recipe={recipe} /></AbsoluteFill>;
};
