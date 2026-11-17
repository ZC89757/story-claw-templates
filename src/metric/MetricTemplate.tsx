import type {CSSProperties} from "react";
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {easeOut, formatNumeric, metricProgress, numericValue} from "./evaluate";
import {EditorialMetricTemplate} from "./EditorialMetricTemplate";
import type {MetricPoint, MetricSpec} from "./types";

type Props = {spec: MetricSpec; style?: string; css?: CSSProperties};

const W = 1920;
const H = 1080;
const INK = "#f1f4f5";
const MUTED = "#93a1a8";

const METRIC_STYLES = [
  "before-after-slider-scrub", "oscilloscope-stream",
   "needle-sweep-selftest", "tape-scroll-fixed-pointer", "hatch-depth",

     "radial-ripple-phone-chips",
  "gauge-readout-moves",
] as const;

type MetricStyle = (typeof METRIC_STYLES)[number];
type SfxName = "click-shutter.mp3" | "gear-lock-metallic.mp3" | "impact-cine.mp3" | "pop.mp3" | "sparkle.mp3" | "whoosh-big.mp3" | "whoosh-fast.mp3";
type MetricRenderer = MetricStyle;

type MetricRecipe = {
  renderer: MetricRenderer;
  sfx: SfxName;
  volume: number;
  background: string;
  accent: string;
  secondary: string;
  light?: boolean;
};

// The catalog's group is an exact recipe selector. It is deliberately not inferred
// from a substring: new catalog styles must add a recipe and a renderer branch.
const METRIC_RECIPES = {
  "before-after-slider-scrub": {renderer: "before-after-slider-scrub", sfx: "whoosh-fast.mp3", volume: 0.17, background: "#202328", accent: "#f4c35a", secondary: "#86cbe1"},
  "oscilloscope-stream": {renderer: "oscilloscope-stream", sfx: "sparkle.mp3", volume: 0.12, background: "#08151a", accent: "#5ee7d7", secondary: "#f27b5b"},

  "needle-sweep-selftest": {renderer: "needle-sweep-selftest", sfx: "gear-lock-metallic.mp3", volume: 0.18, background: "#11191e", accent: "#f0714b", secondary: "#8ed6df"},
  "tape-scroll-fixed-pointer": {renderer: "tape-scroll-fixed-pointer", sfx: "click-shutter.mp3", volume: 0.15, background: "#eef0eb", accent: "#b45309", secondary: "#263342", light: true},
  "hatch-depth": {renderer: "hatch-depth", sfx: "pop.mp3", volume: 0.12, background: "#0a0a0c", accent: "#5b8def", secondary: "#8fb2f7"},

  "radial-ripple-phone-chips": {renderer: "radial-ripple-phone-chips", sfx: "sparkle.mp3", volume: 0.12, background: "#eef0f1", accent: "#5f78e8", secondary: "#ed7863", light: true},
  "gauge-readout-moves": {renderer: "gauge-readout-moves", sfx: "click-shutter.mp3", volume: 0.15, background: "#0f161d", accent: "#6ed7c5", secondary: "#f2a75a"},

} as const satisfies Record<MetricStyle, MetricRecipe>;

const recipeFor = (style: string): MetricRecipe => {
  const recipe = METRIC_RECIPES[style as MetricStyle];
  if (!recipe) throw new Error(`Unsupported metric style: ${style}`);
  return recipe;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress;
const smooth = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const local = (seconds: number, at: number, duration: number) => clamp01((seconds - at) / duration);
const reveal = (point: MetricPoint, seconds: number) => easeOut(metricProgress(point.at, seconds));
const valueAt = (point: MetricPoint, progress: number) => {
  const number = numericValue(point.value);
  return number === undefined ? point.value : formatNumeric(number * easeOut(progress), point.value);
};

const FixedSfx = ({points, recipe}: {points: MetricPoint[]; recipe: MetricRecipe}) => {
  const {fps} = useVideoConfig();
  return <>{points.slice(0, 8).map((point, index) => <Sequence key={`${point.id}-metric-sfx`} from={Math.max(0, Math.round((point.at + 0.34) * fps))} durationInFrames={Math.max(1, Math.round(0.42 * fps))} layout="none"><Audio src={staticFile(`audio/${recipe.sfx}`)} volume={Math.max(0.05, recipe.volume - index * 0.012)} /></Sequence>)}</>;
};

const Header = ({title, light}: {title?: string; light?: boolean}) => title ? <div style={{position: "absolute", left: 90, top: 58, color: light ? "#171b20" : INK, fontSize: 40, fontWeight: 850, letterSpacing: "-0.03em", zIndex: 20}}>{title}</div> : null;
const Footer = ({recipe}: {recipe: MetricRecipe}) => <div style={{position: "absolute", left: 90, bottom: 62, color: recipe.light ? "#69727b" : MUTED, fontSize: 18, letterSpacing: "0.14em", fontWeight: 700, zIndex: 20}}>METRIC / {recipe.renderer.toUpperCase()}</div>;

const Dashboard = ({points, after, recipe}: {points: MetricPoint[]; after: boolean; recipe: MetricRecipe}) => <div style={{position: "absolute", inset: 0, padding: "164px 174px 126px", filter: after ? "none" : "grayscale(1) contrast(.58) brightness(1.14)"}}><div style={{height: 78, borderRadius: 18, background: after ? "#18242b" : "#697076", border: "2px solid rgba(255,255,255,.12)", display: "flex", alignItems: "center", padding: "0 28px", gap: 14}}><span style={{width: 16, height: 16, borderRadius: "50%", background: recipe.accent}} /><span style={{width: 130, height: 14, borderRadius: 8, background: after ? recipe.secondary : "#d6d9dc"}} /><span style={{marginLeft: "auto", width: 220, height: 14, borderRadius: 8, background: "rgba(255,255,255,.18)"}} /></div><div style={{display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 26, marginTop: 30}}>{points.slice(0, 6).map((point, index) => <div key={point.id} style={{height: 310, borderRadius: 22, background: after ? "#1b282e" : "#7a8084", padding: 28, boxSizing: "border-box", boxShadow: "0 16px 32px rgba(0,0,0,.18)"}}><div style={{width: `${40 + (index * 17) % 42}%`, height: 14, borderRadius: 8, background: after ? "rgba(255,255,255,.26)" : "#d8dade"}} /><div style={{height: 120, marginTop: 36, display: "flex", alignItems: "flex-end", gap: 10}}>{Array.from({length: 8}).map((_, bar) => <span key={bar} style={{flex: 1, height: `${24 + ((index * 31 + bar * 17) % 70)}%`, borderRadius: "7px 7px 2px 2px", background: after ? (bar % 3 ? recipe.secondary : recipe.accent) : "#d7d9dd"}} />)}</div><div style={{marginTop: 25, fontSize: 38, fontWeight: 850, color: after ? "#fff" : "#e4e6e7"}}>{point.value}</div></div>)}</div></div>;

const BeforeAfterSlider = ({points, seconds, recipe}: SceneProps) => {
  const p = local(seconds, points[0]!.at, 2.7);
  const position = p < .30 ? lerp(8, 76, easeOut(p / .30)) : p < .43 ? lerp(76, 70, smooth((p - .30) / .13)) : p < .60 ? 70 : lerp(70, 42, smooth((p - .60) / .40));
  return <><Dashboard points={points} after={false} recipe={recipe} /><div style={{position: "absolute", inset: 0, clipPath: `inset(0 ${100 - position}% 0 0)`}}><Dashboard points={points} after recipe={recipe} /></div><div style={{position: "absolute", left: `${position}%`, top: 0, bottom: 0, width: 6, transform: "translateX(-50%)", background: "#fff", boxShadow: "0 0 18px rgba(0,0,0,.45)"}} /><div style={{position: "absolute", left: `${position}%`, top: "50%", width: 94, height: 94, marginLeft: -47, marginTop: -47, borderRadius: "50%", background: "#fff", border: "3px solid #41515a", display: "flex", alignItems: "center", justifyContent: "center", color: "#34454d", fontSize: 30, fontWeight: 900, letterSpacing: "-0.25em", paddingRight: 7, boxSizing: "border-box"}}>◀▶</div><div style={{position: "absolute", left: 210, top: 190, padding: "11px 20px", borderRadius: 10, color: "#d5d8dc", background: "rgba(17,20,22,.82)", fontSize: 20, fontWeight: 800, letterSpacing: ".11em"}}>BEFORE</div><div style={{position: "absolute", right: 210, top: 190, padding: "11px 20px", borderRadius: 10, color: "#172229", background: "rgba(255,255,255,.9)", fontSize: 20, fontWeight: 800, letterSpacing: ".11em"}}>AFTER</div></>;
};

type SceneProps = {points: MetricPoint[]; seconds: number; recipe: MetricRecipe};

const Oscilloscope = ({points, seconds, recipe}: SceneProps) => {
  const p = local(seconds, points[0]!.at, 1.9);
  const wave = Array.from({length: 64}, (_, index) => {
    const x = 230 + index * 23;
    const spike = Math.exp(-Math.pow((index / 63 - .71) / .035, 2)) * 180;
    const y = 540 + Math.sin(index * .53) * 38 + Math.sin(index * .17) * 24 - spike;
    return `${x},${y}`;
  }).join(" ");
  const headX = 230 + 63 * 23 * p;
  return <><div style={{position: "absolute", left: 170, right: 170, top: 260, bottom: 230, borderRadius: 28, border: "2px solid rgba(121,218,211,.23)", background: "linear-gradient(rgba(94,231,215,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(94,231,215,.06) 1px, transparent 1px)", backgroundSize: "54px 54px"}} /><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: "absolute", inset: 0}}><polyline points={wave} fill="none" stroke={recipe.accent} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2200" strokeDashoffset={(1 - p) * 2200} /></svg><div style={{position: "absolute", left: headX - 16, top: 524 + Math.sin(p * 33) * 22, width: 32, height: 32, borderRadius: "50%", background: "#fff", boxShadow: `0 0 ${24 + 24 * Math.sin(p * 15) ** 2}px ${recipe.accent}`}} /><div style={{position: "absolute", left: 238, top: 310, color: recipe.secondary, fontWeight: 800, fontSize: 22, letterSpacing: ".18em"}}>LIVE SIGNAL / 12.8 KHZ</div><div style={{position: "absolute", right: 248, top: 700, color: INK, fontSize: 52, fontWeight: 900}}>{valueAt(points[0]!, p)}</div></>;
};

const NeedleSweep = ({points, seconds, recipe}: SceneProps) => {
  const p = local(seconds, points[0]!.at, 1.55);
  const raw = numericValue(points[0]!.value) ?? 72;
  const target = Math.min(.95, Math.max(.08, (raw % 100) / 100));
  const sweep = p < .52 ? easeOut(p / .52) * 1.05 : p < .78 ? lerp(1.05, target, smooth((p - .52) / .26)) : target;
  const angle = -132 + sweep * 264;
  return <><div style={{position: "absolute", left: 450, top: 166, width: 1020, height: 760, borderRadius: "510px 510px 0 0", border: "40px solid #26363c", borderBottom: 0, boxSizing: "border-box", overflow: "hidden"}} /><div style={{position: "absolute", left: 490, top: 206, width: 940, height: 680, borderRadius: "470px 470px 0 0", border: `32px solid ${recipe.accent}`, borderBottom: 0, boxSizing: "border-box", clipPath: `inset(0 ${(1 - sweep) * 100}% 0 0)`, opacity: .9}} />{Array.from({length: 13}).map((_, index) => <span key={index} style={{position: "absolute", left: 955, top: 315, width: 8, height: 74, background: "#d5e1df", borderRadius: 6, transformOrigin: "4px 275px", transform: `rotate(${-130 + index * (260 / 12)}deg)`, opacity: .45 + (index % 3 === 0 ? .4 : 0)}} />)}<div style={{position: "absolute", left: 952, top: 388, width: 16, height: 314, background: recipe.accent, borderRadius: 10, transformOrigin: "8px 264px", transform: `rotate(${angle}deg)`, boxShadow: `0 0 24px ${recipe.accent}`}} /><div style={{position: "absolute", left: 925, top: 651, width: 70, height: 70, background: "#f4f1e9", borderRadius: "50%", boxShadow: "0 4px 16px rgba(0,0,0,.35)"}} /><div style={{position: "absolute", left: 0, right: 0, top: 716, textAlign: "center", color: INK, fontSize: 84, fontWeight: 900}}>{valueAt(points[0]!, Math.min(1, p * 1.45))}</div><div style={{position: "absolute", left: 0, right: 0, top: 818, textAlign: "center", color: MUTED, fontSize: 24, letterSpacing: ".2em", fontWeight: 800}}>{p < .7 ? "SYSTEM SELF TEST" : "READING LOCKED"}</div></>;
};

const TapeScroll = ({points, seconds, recipe}: SceneProps) => {
  const p = local(seconds, points[0]!.at, 1.75);
  const target = Math.max(120, Math.min(480, numericValue(points[0]!.value) ?? 420));
  const reading = p < .22 ? lerp(60, 140, smooth(p / .22)) : p < .55 ? lerp(140, target + 42, smooth((p - .22) / .33)) : p < .72 ? lerp(target + 42, target - 5, easeOut((p - .55) / .17)) : lerp(target - 5, target, easeOut((p - .72) / .22));
  return <><div style={{position: "absolute", inset: 0, background: "linear-gradient(145deg,#eef0eb,#dfe5e7)"}} /><div style={{position: "absolute", left: 805, top: 168, width: 310, height: 760, background: "#f9faf8", border: "3px solid #b8c1c5", borderRadius: 16, overflow: "hidden", boxShadow: "0 18px 38px rgba(31,42,49,.18)"}}>{Array.from({length: 41}).map((_, index) => { const unit = index * 20; const y = 380 + (reading - unit) * 2.8; const major = unit % 100 === 0; return y > -40 && y < 800 ? <div key={unit} style={{position: "absolute", left: 0, right: 22, top: y, height: major ? 5 : 2, background: major ? "#2d3943" : "#8f9aa0"}}><span style={{position: "absolute", right: 20, top: -26, color: "#4d5b62", fontSize: 28, fontWeight: 800}}>{unit}</span></div> : null; })}</div><div style={{position: "absolute", left: 782, top: 495, width: 358, height: 112, border: `6px solid ${recipe.accent}`, borderRadius: 12, boxSizing: "border-box", background: "rgba(255,255,255,.26)"}} /><svg width="74" height="72" viewBox="0 0 74 72" style={{position: "absolute", left: 715, top: 515}}><polygon points="4,4 70,36 4,68" fill={recipe.accent} /></svg><div style={{position: "absolute", left: 1220, top: 437, width: 360, height: 220, borderRadius: 18, background: "#25323a", padding: "28px 38px", boxSizing: "border-box", color: "#e9efed"}}><div style={{fontSize: 18, color: "#aeb8bb", letterSpacing: ".17em", fontWeight: 800}}>{points[0]!.label.toUpperCase()}</div><div style={{fontSize: 105, lineHeight: 1, fontWeight: 900, color: recipe.accent, marginTop: 18}}>{Math.round(reading)}</div></div></>;
};

const HatchDepth = ({points, seconds, recipe}: SceneProps) => <div style={{position: "absolute", inset: 0, padding: "220px 250px", boxSizing: "border-box", background: "#0a0a0c"}}>{points.slice(0, 6).map((point) => { const p = local(seconds, point.at, .7); const grow = easeOut(p); const morph = smooth((p - .5) / .35); const ratio = Math.min(.94, Math.max(.18, (numericValue(point.value) ?? 50) / 120)); const width = ratio * grow * 100; return <div key={point.id} style={{height: 74, display: "flex", alignItems: "center", gap: 28, marginBottom: 24}}><div style={{width: 210, textAlign: "right", color: morph > .5 ? "#5c626f" : "#aeb3c0", fontSize: 24, fontWeight: 750}}>{point.label}</div><div style={{position: "relative", flex: 1, height: 46}}><div style={{position: "absolute", inset: 0, width: `${width}%`, borderRadius: 6, border: "1px solid #666b76", background: "repeating-linear-gradient(45deg,#565860 0 5px,transparent 5px 12px)", opacity: 1 - morph}} /><div style={{position: "absolute", inset: 0, width: `${width}%`, borderRadius: 6, background: `linear-gradient(90deg,${recipe.accent},${recipe.secondary})`, opacity: morph}} /><div style={{position: "absolute", left: `calc(${width}% + 16px)`, top: 3, color: recipe.secondary, fontSize: 27, fontWeight: 850, opacity: morph}}>{point.value}</div></div></div>; })}<div style={{position: "absolute", left: 250, top: 120, color: "#e8eaf0", fontSize: 22, fontWeight: 850, letterSpacing: ".15em"}}>METRICS <span style={{color: "#67d17c"}}>● LIVE</span></div></div>;

const PhoneRipples = ({points, seconds, recipe}: SceneProps) => {
  const p = local(seconds, points[0]!.at, 1.6);
  return <><div style={{position: "absolute", inset: 0, background: "linear-gradient(135deg,#f4f5f5,#d9e0e3)"}} />{Array.from({length: 4}).map((_, index) => { const q = (p * 1.15 + index * .24) % 1; return <div key={index} style={{position: "absolute", left: "50%", top: "50%", width: 280 + q * 1180, height: 280 + q * 1180, transform: "translate(-50%,-50%)", border: `4px solid ${recipe.accent}`, borderRadius: "50%", opacity: (1 - q) * .23}} />; })}<div style={{position: "absolute", left: 730, top: 142, width: 460, height: 790, borderRadius: 58, background: "#11151d", border: "12px solid #fff", boxShadow: "0 28px 55px rgba(43,57,63,.27)", padding: 25, boxSizing: "border-box"}}><div style={{height: 46, width: 165, borderRadius: 24, background: "#11151d", margin: "0 auto"}} /><div style={{height: 584, marginTop: 20, borderRadius: 28, background: `linear-gradient(160deg,${recipe.accent},${recipe.secondary})`, padding: 24, boxSizing: "border-box"}}><div style={{color: "rgba(255,255,255,.76)", fontWeight: 800, fontSize: 18}}>{points[0]!.label}</div><div style={{color: "#fff", fontSize: 76, fontWeight: 950, marginTop: 50}}>{valueAt(points[0]!, p)}</div>{Array.from({length: 4}).map((_, index) => <div key={index} style={{height: 58, borderRadius: 12, marginTop: 18, background: "rgba(255,255,255,.24)", transform: `translateX(${Math.sin(seconds * 3 + index) * 7}px)`}} />)}</div></div>{points.slice(1, 4).map((point, index) => { const enter = smooth((p - .30 - index * .12) / .28); const side = index % 2 ? 1 : -1; return <div key={point.id} style={{position: "absolute", left: side < 0 ? 250 : 1320, top: 330 + index * 150, width: 290, padding: "21px 26px", borderRadius: 38, background: "rgba(255,255,255,.9)", color: "#26323b", boxShadow: "0 15px 32px rgba(0,0,0,.12)", opacity: enter, transform: `translateX(${side * (1 - enter) * 110}px) scale(${.84 + enter * .16})`}}><div style={{fontWeight: 800, fontSize: 20}}>{point.label}</div><div style={{fontWeight: 900, fontSize: 33, color: recipe.accent, marginTop: 4}}>{point.value}</div></div>; })}</>;
};

const GaugeReadout = ({points, seconds, recipe}: SceneProps) => {
  const p = local(seconds, points[0]!.at, 1.35);
  const target = Math.max(.12, Math.min(.94, (numericValue(points[0]!.value) ?? 72) / 100));
  const ratio = target * easeOut(p);
  const angle = -145 + ratio * 290;
  return <><div style={{position: "absolute", left: 252, top: 235, width: 780, height: 610, borderRadius: 34, background: "#18242c", border: "2px solid #2b3e47", boxShadow: "0 24px 46px rgba(0,0,0,.25)"}}><div style={{position: "absolute", left: 130, top: 96, width: 520, height: 350, borderRadius: "520px 520px 0 0", border: "30px solid #2d4149", borderBottom: 0, overflow: "hidden"}} /><div style={{position: "absolute", left: 130, top: 96, width: 520, height: 350, borderRadius: "520px 520px 0 0", border: `30px solid ${recipe.accent}`, borderBottom: 0, clipPath: `inset(0 ${(1 - ratio) * 100}% 0 0)`}} /><div style={{position: "absolute", left: 385, top: 171, width: 10, height: 210, borderRadius: 8, background: recipe.secondary, transformOrigin: "5px 190px", transform: `rotate(${angle}deg)`}} /><div style={{position: "absolute", left: 366, top: 345, width: 48, height: 48, borderRadius: "50%", background: "#f3f4e8"}} /><div style={{position: "absolute", bottom: 73, left: 0, right: 0, textAlign: "center", color: "#eef7f3", fontSize: 54, fontWeight: 900}}>{valueAt(points[0]!, p)}</div></div><div style={{position: "absolute", left: 1100, top: 235, width: 570, height: 610, display: "flex", flexDirection: "column", gap: 20}}>{points.slice(0, 4).map((point, index) => { const enter = reveal(point, seconds); return <div key={point.id} style={{flex: 1, borderRadius: 20, padding: "20px 28px", background: "#172329", border: "2px solid #2d3e45", opacity: enter, transform: `translateX(${(1 - enter) * 80}px)`}}><div style={{color: MUTED, fontSize: 18, fontWeight: 800, letterSpacing: ".12em"}}>{point.label.toUpperCase()}</div><div style={{color: index ? recipe.secondary : recipe.accent, fontSize: 48, fontWeight: 900, marginTop: 9}}>{valueAt(point, enter)}</div></div>; })}</div></>;
};

const MetricBody = ({renderer, points, seconds, recipe}: SceneProps & {renderer: MetricRenderer}) => {
  switch (renderer) {
    case "before-after-slider-scrub": return <BeforeAfterSlider points={points} seconds={seconds} recipe={recipe} />;
    case "oscilloscope-stream": return <Oscilloscope points={points} seconds={seconds} recipe={recipe} />;

    case "needle-sweep-selftest": return <NeedleSweep points={points} seconds={seconds} recipe={recipe} />;
    case "tape-scroll-fixed-pointer": return <TapeScroll points={points} seconds={seconds} recipe={recipe} />;
    case "hatch-depth": return <HatchDepth points={points} seconds={seconds} recipe={recipe} />;

    case "radial-ripple-phone-chips": return <PhoneRipples points={points} seconds={seconds} recipe={recipe} />;
    case "gauge-readout-moves": return <GaugeReadout points={points} seconds={seconds} recipe={recipe} />;

    default: {
      const unreachable: never = renderer;
      throw new Error(`Missing metric renderer: ${unreachable}`);
    }
  }
};

const StandardMetricTemplate = ({spec, style = "gauge-readout-moves", css}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const recipe = recipeFor(style);
  return <AbsoluteFill style={{background: recipe.background, color: INK, fontFamily: '"Microsoft YaHei", Arial, sans-serif', overflow: "hidden", ...css}}><MetricBody renderer={recipe.renderer} points={spec.points} seconds={frame / fps} recipe={recipe} /><Header title={spec.title} light={recipe.light} /><Footer recipe={recipe} /><FixedSfx points={spec.points} recipe={recipe} /></AbsoluteFill>;
};
export const MetricTemplate=(props:Props)=>props.style==="editorial-ledger"?<EditorialMetricTemplate spec={props.spec}/>:<StandardMetricTemplate {...props}/>;
