import {createContext, useContext} from "react";
import type {CSSProperties, ReactNode} from "react";
import {AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {TitleLayout, titleFontSize} from "./TitleLayout";
import {clamp01, titleElapsed, titleHasStarted} from "./evaluate";
import type {TitleSpec} from "./types";

type Props = {spec: TitleSpec; style?: string; css?: CSSProperties};
type TitleRendererProps = {text: string; frame: number};
type TitleRenderer = (props: TitleRendererProps) => ReactNode;

const W = 1920;
const H = 1080;
const INK = "#f4f7f7";
const MUTED = "#93a2a8";
const ACCENT = "#ef6b42";
const CYAN = "#8ad3df";
const DARK = "#0e1518";
const MONO = '"Cascadia Mono", Consolas, monospace';
const SERIF = 'ui-serif, Georgia, "Times New Roman", serif';
const POOL = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789#$%&*+";

/**
 * A Shotcraft group names one authored typography recipe.  Do not replace this
 * closed list with suffix/keyword matching: that was the source of different
 * catalog groups silently rendering the same title animation.
 */
export const SHOTCRAFT_TITLE_STYLE_NAMES = [
  "brace-expand",
  "cel-flash-stomp",
  "countdown-arc-scatter",
  "flying-words",
  "glitch-cycle",
  "gradient-word-sweep",
  "marker-underline-title",
  "outline-word-fill",
  "paper-title-card",
  "pill-chip-slot-cycle-handled",
  "pill-slot-cycle",
  "text-column-converge",
  "title-demote-to-label",
  "split-text-stagger",
  "drift-assembly",
  "tracking-expand",
  "text-on-path",
  "scramble-decode",
  "letter-drop-physics",
  "font-weight-pump",
  "karaoke-fill-sync",
  "terminal-typewriter",
  "error-retype",
  "typing-code-block",
  "vertical-word-roll-blur-cycle",
  "word-relay-filmstrip",
  "word-relay-geometry",
  "text-as-mask",
  "letterspace-materialize",
  "brand-ink-open",
  "document-typewriter-reveal",
  "split-flap-title",
] as const;

type ShotcraftTitleStyle = (typeof SHOTCRAFT_TITLE_STYLE_NAMES)[number];

const progress = (frame: number, start: number, duration: number) => clamp01((frame - start) / Math.max(1, duration));
const easeOut = (value: number) => 1 - Math.pow(1 - clamp01(value), 3);
const easeInOut = (value: number) => {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const pulseAt = (frame: number, at: number, duration = 8) => {
  const t = (frame - at) / duration;
  return t < 0 || t > 1 ? 0 : Math.pow(Math.sin(t * Math.PI), 1.3);
};
const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
};
const glyphs = (text: string) => Array.from(text.trim() || "标题");
const words = (text: string) => {
  const spaced = text.trim().split(/\s+/).filter(Boolean);
  if (spaced.length > 1) return spaced;
  const chars = glyphs(text).filter((char) => char.trim());
  return chars.length <= 4 ? chars : [chars.slice(0, Math.ceil(chars.length / 2)).join(""), chars.slice(Math.ceil(chars.length / 2)).join("")];
};
const titleSize = (text: string, scale = 1) => Math.min(154, Math.max(48, titleFontSize(text) * scale));

const Text = ({text, opacity = 1, scale = 1, x = 0, y = 0, rotate = 0, color = INK, size, family, weight = 950, extra}: {
  text: string;
  opacity?: number;
  scale?: number;
  x?: number;
  y?: number;
  rotate?: number;
  color?: string;
  size?: number;
  family?: string;
  weight?: number | string;
  extra?: CSSProperties;
}) => <div style={{
  position: "absolute",
  left: 120,
  right: 120,
  top: H / 2 - (size ?? titleSize(text)) * 0.62,
  color,
  fontFamily: family ?? '"Microsoft YaHei", Arial, sans-serif',
  fontSize: size ?? titleSize(text),
  lineHeight: 1.08,
  fontWeight: weight,
  textAlign: "center",
  letterSpacing: "0.02em",
  opacity,
  transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotate}deg)`,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  ...extra,
}}>{text}</div>;

/**
 * Standalone previews keep the authored colour wash, while the episode
 * compositor can opt into a transparent root so the raw plate remains visible
 * outside the actual title/card artwork.
 */
const TransparentRootContext = createContext(false);
const Background = ({children, color = "transparent"}: {children: ReactNode; color?: string}) => {
  const transparent = useContext(TransparentRootContext);
  return <AbsoluteFill style={{background: transparent ? "transparent" : color, overflow: "hidden"}}>{children}</AbsoluteFill>;
};

// 01 · braces pull apart while a clipped title is revealed between them.
const BraceExpand = ({text, frame}: TitleRendererProps) => {
  const p = easeOut(progress(frame, 8, 30));
  const distance = 168 * p;
  const reveal = progress(frame, 14, 24);
  return <Background><div style={{position: "absolute", left: W / 2, top: H / 2}}>
    <div style={{position: "absolute", left: -520, top: -70, width: 1040, height: 150, overflow: "hidden", clipPath: `inset(0 ${(1 - reveal) * 50}% 0 ${(1 - reveal) * 50}%)`, display: "flex", alignItems: "center", justifyContent: "center", color: INK, fontSize: titleSize(text, 0.9), fontWeight: 900, whiteSpace: "nowrap"}}>{text}</div>
    {["{", "}"].map((brace, index) => <div key={brace} style={{position: "absolute", left: 0, top: 0, color: INK, fontSize: 92, fontWeight: 900, opacity: progress(frame, 6, 8), transform: `translate(-50%, -50%) translateX(${index ? distance : -distance}px) scale(${0.68 + p * 0.32})`}}>{brace}</div>)}
  </div></Background>;
};

// 02 · an anime/cel background flashes only behind a hard-stomped word stage.
const CelFlashStomp = ({text, frame}: TitleRendererProps) => {
  const parts = words(text);
  const stage = Math.min(parts.length - 1, Math.floor(Math.max(0, frame) / 22));
  const start = stage * 22;
  const land = easeOut(progress(frame, start, 7));
  const flash = frame >= start + 7 && frame < start + 15 && Math.floor((frame - start - 7) / 2) % 2 === 0;
  return <Background color={flash ? "#d7d8d2" : "#1a2226"}>
    <div style={{position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, ${stage % 2 ? "rgba(138,211,223,.28)" : "rgba(239,107,66,.28)"}, transparent 48%)`}} />
    <Text text={parts[stage]} opacity={1} scale={1.2 - land * 0.22 + pulseAt(frame, start, 7) * 0.12} rotate={(stage % 2 ? -1 : 1) * (1 - land) * 5} size={166} color={flash ? "#172025" : INK} extra={{textShadow: "0 10px 0 rgba(0,0,0,.3)"}} />
    <div style={{position: "absolute", left: 560, right: 560, bottom: 190, height: 14, background: ACCENT, transform: `scaleX(${progress(frame, start + 8, 10)})`, transformOrigin: "left"}} />
  </Background>;
};

// 03 · a countdown dial sweeps scattered numerals until the selected numeral becomes the title.
const CountdownArcScatter = ({text, frame}: TitleRendererProps) => {
  const p = easeOut(progress(frame, 2, 38));
  const numbers = [45, 35, 28, 22, 17, 10, 5, 4, 3];
  return <Background color="#eef0ed"><div style={{position: "absolute", inset: 0, color: "#182329"}}>
    {numbers.map((number, index) => {
      const a = (-110 + index * 27) * (1 - p) + (index - 4) * 5;
      const rad = (a * Math.PI) / 180;
      const x = Math.cos(rad) * 380;
      const y = Math.sin(rad) * 250;
      const chosen = number === 5;
      return <div key={number} style={{position: "absolute", left: W / 2 + x, top: H / 2 + y, color: chosen ? ACCENT : "#33434a", fontSize: chosen ? 96 : 56, fontWeight: 900, opacity: chosen ? 1 : 0.18 + (1 - p) * 0.48, transform: `translate(-50%,-50%) rotate(${a + 90}deg) scale(${chosen ? 1 + p * 0.15 : 1})`}}>{number}</div>;
    })}
    <Text text={text} opacity={progress(frame, 30, 20)} y={82} color="#182329" size={titleSize(text, 0.78)} />
    <svg width={W} height={H} style={{position: "absolute", inset: 0}}><path d="M 530 635 A 470 330 0 0 1 1390 635" fill="none" stroke={ACCENT} strokeWidth="8" strokeDasharray="1450" strokeDashoffset={1450 * (1 - p)} /></svg>
  </div></Background>;
};

// 04 · deterministic title fragments travel through a perspective word tunnel.
const FlyingWords = ({text, frame}: TitleRendererProps) => {
  const terms = [...words(text), "MOTION", "LAYOUT", "BEAT", "FRAME", "DEPTH", "CUT"];
  return <Background color="#070b0e"><div style={{position: "absolute", inset: 0, perspective: 920}}>
    {Array.from({length: 22}).map((_, index) => {
      const cycle = ((frame / 104 + index / 22) % 1);
      const z = -900 + cycle * 1550;
      const angle = index * 2.399 + seeded(index * 9) * 0.7;
      const radius = 140 + seeded(index * 17) * 520;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.58;
      const opacity = Math.max(0, Math.sin(cycle * Math.PI)) * 0.82;
      return <div key={index} style={{position: "absolute", left: "50%", top: "50%", color: index % 3 ? CYAN : ACCENT, fontSize: 31 + seeded(index + 2) * 40, fontWeight: 850, opacity, transform: `translate(-50%,-50%) translate3d(${x}px,${y}px,${z}px) rotateZ(${seeded(index + 91) * 20 - 10}deg)`, whiteSpace: "nowrap"}}>{terms[index % terms.length]}</div>;
    })}
    <Text text={text} opacity={easeOut(progress(frame, 16, 26))} scale={1 + Math.max(0, 1 - frame / 120) * 0.08} size={titleSize(text, 0.72)} />
  </div></Background>;
};

// 05 · status phrases glitch-cycle before the real supplied title is cleanly locked.
const GlitchCycle = ({text, frame}: TitleRendererProps) => {
  const phases = ["INITIALIZING", "LOADING ASSETS", "COMPILING", text];
  const phase = Math.min(phases.length - 1, Math.floor(frame / 24));
  const local = frame % 24;
  const phrase = phases[phase];
  return <Background color="#07080c"><div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO}}>
    <div style={{fontSize: titleSize(phrase, 0.84), letterSpacing: "0.08em", fontWeight: 850, color: phase === 3 ? INK : CYAN, textShadow: phase === 3 ? "none" : `-${local % 5}px 0 rgba(239,107,66,.45), ${local % 3}px 0 rgba(138,211,223,.45)`}}>{glyphs(phrase).map((char, index) => {
      const unstable = phase < 3 && (local < 5 || local > 18 || (index + frame) % 11 === 0);
      return <span key={`${index}-${char}`} style={{display: "inline-block", minWidth: char === " " ? "0.45em" : "0.63em"}}>{unstable ? POOL[Math.floor(seeded(index * 91 + Math.floor(frame / 2)) * POOL.length)] : char}</span>;
    })}</div>
    <div style={{position: "absolute", left: 430, right: 430, bottom: 250, height: 6, background: "#27353b"}}><div style={{height: "100%", width: `${Math.min(100, (frame / 88) * 100)}%`, background: ACCENT}} /></div>
  </div></Background>;
};

// 06 · an electrical multicolour fill sweeps across an outlined title.
const GradientWordSweep = ({text, frame}: TitleRendererProps) => {
  const p = easeOut(progress(frame, 8, 38));
  const edge = Math.max(0, Math.min(100, p * 124 - 16));
  return <Background color="#11151b"><Text text={text} opacity={0.72 + p * 0.28} size={titleSize(text, 1.08)} extra={{
    color: "transparent",
    WebkitTextStroke: "2px rgba(215,230,236,.48)",
    backgroundImage: `linear-gradient(94deg, #59c2ff 0%, #9d6bff 30%, #ff6ed4 60%, #ffc46b 100%)`,
    backgroundSize: "100% 100%",
    WebkitBackgroundClip: "text",
    clipPath: `inset(0 ${100 - edge}% 0 0)`,
    filter: `drop-shadow(0 0 ${10 + p * 18}px rgba(191,108,255,.5))`,
  }} />
  <div style={{position: "absolute", left: `${edge}%`, top: 260, bottom: 260, width: 5, background: "#fff", boxShadow: "0 0 38px 15px #ffb4dd", opacity: p < 0.96 ? 1 : 0}} />
</Background>;
};

// 07 · a settled title receives a rough marker underline drawn from left to right.
const MarkerUnderlineTitle = ({text, frame}: TitleRendererProps) => {
  const titleP = easeOut(progress(frame, 4, 22));
  const lineP = easeOut(progress(frame, 26, 30));
  return <Background color="#f1efe8"><Text text={text} opacity={titleP} y={(1 - titleP) * 48} color="#1e292d" size={titleSize(text, 1.04)} extra={{fontStyle: "italic"}} />
    <svg width={W} height={H} style={{position: "absolute", inset: 0, overflow: "visible"}}><path d="M 530 690 C 770 716, 1095 660, 1410 686" fill="none" stroke={ACCENT} strokeWidth="24" strokeLinecap="round" strokeDasharray="920" strokeDashoffset={920 * (1 - lineP)} opacity={lineP} /><path d="M 544 697 C 795 718, 1080 671, 1390 692" fill="none" stroke="#f99b7e" strokeWidth="6" strokeLinecap="round" strokeDasharray="880" strokeDashoffset={880 * (1 - lineP)} opacity={lineP * 0.8} /></svg>
  </Background>;
};

// 08 · huge outlined letters compress in, a dashed orbit closes, then the fill snaps on.
const OutlineWordFill = ({text, frame}: TitleRendererProps) => {
  const arrive = easeOut(progress(frame, 4, 28));
  const fill = progress(frame, 38, 6);
  const orbit = easeOut(progress(frame, 14, 42));
  return <Background color="#0b1116"><div style={{position: "absolute", left: W / 2 - 300, top: H / 2 - 300, width: 600, height: 600, borderRadius: "50%", border: "3px dashed rgba(138,211,223,.56)", opacity: orbit * 0.8, transform: `scale(${3.1 - orbit * 2.1}) rotate(${frame * 0.7}deg)`}} />
    <Text text={text} opacity={arrive} scale={3.1 - arrive * 2.1} size={titleSize(text, 1.1)} extra={{color: fill > 0 ? INK : "transparent", WebkitTextStroke: "3px #c2d4d9", textShadow: fill > 0 ? `0 0 ${(1 - fill) * 40}px ${ACCENT}` : "none"}} />
    <div style={{position: "absolute", left: 120, right: 120, top: H / 2, height: 2, background: CYAN, opacity: orbit * 0.5, transform: `scaleX(${orbit})`}} />
  </Background>;
};

// 09 · letterpress words settle onto a warm paper card; one word takes an accent underline.
const PaperTitleCard = ({text, frame}: TitleRendererProps) => {
  const parts = words(text);
  const accentIndex = Math.floor(parts.length / 2);
  return <Background color="#252624"><div style={{position: "absolute", left: 290, top: 238, width: 1340, height: 600, padding: "86px 110px", boxSizing: "border-box", background: "#e9e1d1", border: "3px solid #25292a", boxShadow: "24px 24px 0 #d96b49", transform: `translateY(${(1 - easeOut(progress(frame, 4, 24))) * 180}px) rotate(${(1 - easeOut(progress(frame, 4, 24))) * -3}deg)`}}>
    <div style={{display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 .34em", color: "#25282a", fontFamily: SERIF, fontSize: titleSize(text, 0.78), fontWeight: 850, lineHeight: 1.22}}>{parts.map((part, index) => {
      const p = easeOut(progress(frame, 16 + index * 5, 18));
      const accent = index === accentIndex;
      return <span key={`${part}-${index}`} style={{position: "relative", opacity: p, transform: `scale(${1.26 - p * 0.26})`, filter: `blur(${(1 - p) * 8}px)`, color: accent ? ACCENT : "#25282a"}}>{part}{accent ? <i style={{position: "absolute", left: 0, right: 0, bottom: -13, height: 7, background: ACCENT, transform: `scaleX(${easeOut(progress(frame, 45, 18))})`, transformOrigin: "left"}} /> : null}</span>;
    })}</div>
  </div></Background>;
};

// 10 · a central chip vertically rolls through alternatives and physically pushes side text apart.
const PillChipSlotCycleHandled = ({text, frame}: TitleRendererProps) => {
  const alternatives = ["SALE", "FLOW", "ADMIN", "REPORT"];
  const step = Math.min(alternatives.length - 1, Math.floor(Math.max(0, frame - 8) / 20));
  const local = easeOut(progress(frame, 8 + step * 20, 10));
  const active = alternatives[step];
  const width = 155 + active.length * 22;
  return <Background color="#f6f5f1"><div style={{position: "absolute", left: W / 2, top: H / 2, display: "flex", alignItems: "center", transform: "translate(-50%,-50%)", color: "#161b1d", fontSize: 58, fontWeight: 900}}>
    <span style={{transform: `translateX(${-width * 0.08}px)`}}>YOUR</span>
    <div style={{position: "relative", margin: "0 28px", width, height: 88, overflow: "hidden", borderRadius: 44, background: "#172126", color: "#fff", transition: "none"}}>{alternatives.map((item, index) => <span key={item} style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", transform: `translateY(${(index - step - local) * 88}px)`, opacity: Math.max(0, 1 - Math.abs(index - step - local))}}>{item}</span>)}</div>
    <span style={{transform: `translateX(${width * 0.08}px)`}}>{text.length > 14 ? "READY" : text}</span>
  </div></Background>;
};

// 11 · sentence ending pill is a slot machine that cycles upward then resolves to the supplied sentence.
const PillSlotCycle = ({text, frame}: TitleRendererProps) => {
  const labels = ["ASK", "FIND", "SUM", "DRAFT"];
  const step = Math.min(labels.length, Math.floor(Math.max(0, frame - 10) / 17));
  const local = easeOut(progress(frame, 10 + step * 17, 8));
  const resolved = step >= labels.length;
  return <Background color="#11181c"><div style={{position: "absolute", left: W / 2, top: H / 2, transform: "translate(-50%,-50%)", display: "flex", alignItems: "center", color: INK, fontSize: 70, fontWeight: 900, whiteSpace: "nowrap"}}>
    <span style={{opacity: resolved ? 0 : 1, transform: `translateX(${resolved ? -60 : 0}px)`}}>ONE TOOL TO</span>
    {!resolved ? <div style={{position: "relative", marginLeft: 28, width: 250, height: 86, overflow: "hidden", borderRadius: 18, border: `2px solid ${ACCENT}`, background: "#263840"}}>{labels.map((label, index) => <span key={label} style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", transform: `translateY(${(index - step - local) * 90}px)`}}>{label}</span>)}</div> : <span style={{position: "absolute", left: "50%", transform: `translateX(-50%) scale(${0.82 + easeOut(progress(frame, 78, 16)) * 0.18})`, opacity: easeOut(progress(frame, 78, 16))}}>{text}</span>}
  </div></Background>;
};

// 12 · a fixed left label watches a right-hand descriptor cycle, then both converge once.
const TextColumnConverge = ({text, frame}: TitleRendererProps) => {
  const phrases = ["LAYOUT", "MOTION", "TIMING", "SYSTEM", text];
  const phase = Math.min(phrases.length - 1, Math.floor(Math.max(0, frame - 8) / 12));
  const isLast = phase === phrases.length - 1;
  const join = isLast ? easeInOut(progress(frame, 8 + (phrases.length - 1) * 12 + 10, 32)) : 0;
  const left = interpolate(join, [0, 1], [540, 720]);
  const right = interpolate(join, [0, 1], [1380, 1200]);
  return <Background color="#060708"><div style={{position: "absolute", left, top: 480, color: INK, fontFamily: MONO, fontSize: 54, letterSpacing: 6, fontWeight: 700}}>NEW</div>
    <div style={{position: "absolute", right: W - right, top: 480, maxWidth: 700, color: CYAN, fontFamily: MONO, fontSize: 54, letterSpacing: 4, fontWeight: 700, whiteSpace: "nowrap", transform: "translateX(-100%)"}}>{phrases[phase]}</div>
    <div style={{position: "absolute", left: 720, top: 558, color: MUTED, fontFamily: MONO, fontSize: 26, letterSpacing: 4, opacity: join}}>COMING / NOW</div>
  </Background>;
};

// 13 · a big title resolves, demotes to a top-left section label, and lets document skeletons grow beneath it.
const TitleDemoteToLabel = ({text, frame}: TitleRendererProps) => {
  const reveal = easeOut(progress(frame, 0, 16));
  const demote = easeInOut(progress(frame, 34, 24));
  const x = interpolate(demote, [0, 1], [960, 180]);
  const y = interpolate(demote, [0, 1], [520, 112]);
  const scale = interpolate(demote, [0, 1], [1, 0.33]);
  return <Background color="#121a1e"><div style={{position: "absolute", left: x, top: y, color: INK, fontSize: titleSize(text, 1.04), fontWeight: 950, transform: `translate(${-(1 - demote) * 50}%, -50%) scale(${scale})`, transformOrigin: "left center", opacity: reveal, filter: `blur(${(1 - reveal) * 12}px)`, whiteSpace: "nowrap"}}>{text}</div>
    <div style={{position: "absolute", left: 180, top: 220, right: 180, display: "flex", flexDirection: "column", gap: 28}}>{[1, 0.82, 0.9, 0.48, 1].map((width, index) => { const p = easeOut(progress(frame, 46 + index * 5, 22)); return <div key={index} style={{height: index === 4 ? 250 : 26, width: `${width * 100}%`, background: index === 4 ? "#203038" : "#485962", borderRadius: index === 4 ? 18 : 13, opacity: p, transform: `translateY(${(1 - p) * 34}px)`}} />; })}</div>
  </Background>;
};

// 14 · every glyph rises out of its own clipped baseline box with a growing rule below.
const SplitTextStagger = ({text, frame}: TitleRendererProps) => {
  const chars = glyphs(text);
  const size = titleSize(text, 1.02);
  const line = easeOut(progress(frame, 12, 30));
  return <Background><div style={{position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
    <div style={{display: "flex", maxWidth: 1640, overflow: "hidden"}}>{chars.map((char, index) => {
      const rise = easeOut(progress(frame, 12 + index * 2, 14));
      const settle = easeOut(progress(frame, 26 + index * 2, 6));
      const y = (1 - rise) * 120 - (1 - settle) * 10;
      return <span key={`${index}-${char}`} style={{display: "inline-flex", height: size * 1.3, alignItems: "flex-end", overflow: "hidden"}}><i style={{display: "inline-block", minWidth: char === " " ? "0.35em" : "0.6em", color: INK, fontStyle: "normal", fontSize: size, fontWeight: 900, transform: `translateY(${y}%)`}}>{char === " " ? "\u00a0" : char}</i></span>;
    })}</div>
    <div style={{marginTop: 16, width: Math.min(1240, chars.length * size * 0.62), height: 3, background: ACCENT, transform: `scaleX(${line})`, transformOrigin: "left"}} />
  </div></Background>;
};

// 15 · letterforms drift in from deterministic vectors, each locks with a short dark pulse.
const DriftAssembly = ({text, frame}: TitleRendererProps) => {
  const chars = glyphs(text);
  const size = titleSize(text, 1.0);
  const breath = pulseAt(frame, 78, 24) * 0.04;
  return <Background><div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 + breath})`}}>{chars.map((char, index) => {
    const enter = easeOut(progress(frame, index * 3, 45));
    const angle = seeded(index + 1) * Math.PI * 2;
    const magnitude = 260 + seeded(index + 101) * 110;
    const lock = index * 3 + 45;
    const hit = pulseAt(frame, lock, 8);
    return <span key={`${index}-${char}`} style={{display: "inline-block", minWidth: char === " " ? "0.34em" : "0.58em", color: hit > 0 ? "#fff" : INK, fontSize: size, fontWeight: 900, opacity: 0.28 + enter * 0.72, transform: `translate(${Math.cos(angle) * magnitude * (1 - enter)}px, ${Math.sin(angle) * magnitude * (1 - enter)}px)`, filter: `blur(${(1 - enter) * 8}px)`, WebkitTextStroke: hit > 0 ? `${hit * 3}px #000` : undefined}}>{char === " " ? "\u00a0" : char}</span>;
  })}</div></Background>;
};

// 16 · characters begin squeezed into the word centre and expand their tracking without reflow jitter.
const TrackingExpand = ({text, frame}: TitleRendererProps) => {
  const chars = glyphs(text);
  const p = easeOut(progress(frame, 4, 48));
  const size = titleSize(text, 1.08);
  const centre = (chars.length - 1) / 2;
  return <Background><div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", filter: `blur(${(1 - p) * 10}px)`, opacity: 0.55 + p * 0.45, transform: `scaleX(${0.92 + p * 0.08})`}}>{chars.map((char, index) => {
    const offset = (index - centre) * (1 - p) * -0.56 * size;
    return <span key={`${index}-${char}`} style={{display: "inline-block", minWidth: char === " " ? "0.36em" : "0.62em", color: INK, fontSize: size, fontWeight: 900, letterSpacing: "0.12em", transform: `translateX(${offset}px)`}}>{char === " " ? "\u00a0" : char}</span>;
  })}</div></Background>;
};

// 17 · glyphs travel along a rising cubic curve, then individually level into the reading baseline.
const TextOnPath = ({text, frame}: TitleRendererProps) => {
  const chars = glyphs(text);
  const size = titleSize(text, 0.84);
  const cubic = (t: number) => {
    const u = 1 - t;
    return {x: u * u * u * 250 + 3 * u * u * t * 730 + 3 * u * t * t * 1210 + t * t * t * 1570, y: u * u * u * 790 + 3 * u * u * t * 800 + 3 * u * t * t * 650 + t * t * t * 330};
  };
  const tangent = (t: number) => {
    const u = 1 - t;
    const dx = 3 * u * u * 480 + 6 * u * t * 480 + 3 * t * t * 360;
    const dy = 3 * u * u * 10 - 6 * u * t * 150 - 3 * t * t * 320;
    return Math.atan2(dy, dx) * 180 / Math.PI;
  };
  const pathP = easeOut(progress(frame, 8, 50));
  return <Background><svg width={W} height={H} style={{position: "absolute", inset: 0}}><path d="M 250 790 C 730 800, 1210 650, 1570 330" fill="none" stroke={CYAN} strokeWidth="5" strokeDasharray="1640" strokeDashoffset={1640 * (1 - pathP)} opacity=".55" /></svg>
    {chars.map((char, index) => {
      const travel = easeOut(progress(frame, index * 2, 45));
      const level = easeOut(progress(frame, 53 + index * 2, 12));
      const point = cubic(Math.min(1, travel));
      const destinationX = W / 2 + (index - (chars.length - 1) / 2) * size * 0.58;
      const destinationY = H / 2;
      return <span key={`${index}-${char}`} style={{position: "absolute", left: point.x + (destinationX - point.x) * level, top: point.y + (destinationY - point.y) * level, color: INK, fontSize: size, fontWeight: 900, opacity: travel, transform: `translate(-50%,-50%) rotate(${tangent(travel) * (1 - level)}deg)`}}>{char === " " ? "\u00a0" : char}</span>;
    })}
  </Background>;
};

// 18 · seeded characters scramble and lock left-to-right with a two-frame highlight strike.
const ScrambleDecode = ({text, frame}: TitleRendererProps) => {
  const chars = glyphs(text);
  const size = titleSize(text, 0.94);
  return <Background color="#07090c"><div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO}}>{chars.map((char, index) => {
    const lock = 18 + index * 6;
    const locked = frame >= lock;
    const flash = frame >= lock && frame < lock + 2;
    const noise = POOL[Math.floor(seeded(index * 101 + Math.floor(frame / 2)) * POOL.length)];
    return <span key={`${index}-${char}`} style={{display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: char === " " ? "0.42em" : "0.7em", height: size * 1.15, color: flash ? "#101416" : locked ? INK : CYAN, background: flash ? INK : "transparent", fontSize: size, fontWeight: 900}}>{char === " " ? "\u00a0" : locked ? char : noise}</span>;
  })}</div></Background>;
};

// 19 · each letter falls under gravity, bounces twice, keeps a tilt, then snaps neatly together.
const LetterDropPhysics = ({text, frame}: TitleRendererProps) => {
  const chars = glyphs(text);
  const size = titleSize(text, 1.06);
  const baseline = H / 2 + 65;
  const charState = (index: number) => {
    const start = 10 + index * 5;
    const t = frame - start;
    if (t <= 0) return {y: -650, rotation: 0};
    if (t < 24) return {y: -650 + 650 * (t / 24) ** 2, rotation: 0};
    const bounce = t - 24;
    if (bounce < 16) return {y: -195 * Math.sin((bounce / 16) * Math.PI), rotation: (seeded(index + 3) - 0.5) * 12};
    if (bounce < 27) return {y: -58 * Math.sin(((bounce - 16) / 11) * Math.PI), rotation: (seeded(index + 3) - 0.5) * 12};
    return {y: 0, rotation: (seeded(index + 3) - 0.5) * 12};
  };
  const tidy = easeOut(progress(frame, 104, 10));
  return <Background><div style={{position: "absolute", left: 300, right: 300, top: baseline + 14, height: 3, background: "#50636a"}} />
    <div style={{position: "absolute", left: 0, right: 0, top: baseline - size, display: "flex", justifyContent: "center"}}>{chars.map((char, index) => {
      const state = charState(index);
      return <span key={`${index}-${char}`} style={{display: "inline-block", minWidth: char === " " ? "0.34em" : "0.61em", color: INK, fontSize: size, fontWeight: 900, transform: `translateY(${state.y * (1 - tidy)}px) rotate(${state.rotation * (1 - tidy)}deg) scale(${1 + (1 - tidy) * 0.05})`}}>{char === " " ? "\u00a0" : char}</span>;
    })}</div>
  </Background>;
};

// 20 · five low-frequency beats thicken the title strokes and light beat-reference dots.
const FontWeightPump = ({text, frame}: TitleRendererProps) => {
  const beats = [20, 38, 56, 74, 92];
  const env = Math.max(...beats.map((beat) => pulseAt(frame, beat, 11)));
  const accentBeat = Math.max(pulseAt(frame, 56, 11), pulseAt(frame, 92, 11));
  return <Background><Text text={text} size={titleSize(text, 1.08)} weight={env > 0.12 ? 950 : 450} scale={1 + accentBeat * 0.075} extra={{WebkitTextStroke: `${env * 9}px ${INK}`, textShadow: `0 0 ${env * 30}px ${ACCENT}`}} />
    <div style={{position: "absolute", left: 720, right: 720, bottom: 224, display: "flex", justifyContent: "space-between"}}>{beats.map((beat, index) => <i key={beat} style={{width: 18, height: 18, borderRadius: "50%", background: ACCENT, opacity: 0.28 + pulseAt(frame, beat, 11) * 0.72, transform: `scale(${1 + pulseAt(frame, beat, 11)})`}} />)}</div>
  </Background>;
};

// 21 · a karaoke-style fill travels word by word with a small read-head underline.
const KaraokeFillSync = ({text, frame}: TitleRendererProps) => {
  const parts = words(text);
  const start = 12;
  const duration = Math.max(16, 82 / parts.length);
  return <Background color="#12181c"><div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3em", fontSize: titleSize(text, 0.92), fontWeight: 900}}>{parts.map((part, index) => {
    const p = progress(frame, start + index * duration, duration * 0.82);
    const active = p > 0 && p < 1;
    return <span key={`${part}-${index}`} style={{position: "relative", color: "#68777e"}}><span>{part}</span><span style={{position: "absolute", inset: 0, color: ACCENT, clipPath: `inset(0 ${100 - p * 100}% 0 0)`}}>{part}</span>{active ? <i style={{position: "absolute", left: 0, bottom: -17, width: `${p * 100}%`, height: 7, background: ACCENT}} /> : null}</span>;
  })}</div></Background>;
};

// 22 · terminal command types in, pauses, and executes into a compact result lock-up.
const TerminalTypewriter = ({text, frame}: TitleRendererProps) => {
  const command = text.trim() || "build --ready";
  const count = Math.min(command.length, Math.max(0, Math.floor((frame - 10) / 2)));
  const executeAt = 10 + command.length * 2 + 12;
  const execute = easeOut(progress(frame, executeAt, 9));
  return <Background color="#0b1114">{frame < executeAt + 9 ? <div style={{position: "absolute", left: 350, top: 330, width: 1220, padding: "34px 46px", boxSizing: "border-box", borderRadius: 18, border: "2px solid #36535b", background: "#111b1f", color: "#b8e8d7", fontFamily: MONO, fontSize: 52, boxShadow: "0 24px 70px rgba(0,0,0,.42)"}}><span style={{color: ACCENT}}>$ </span>{command.slice(0, count)}<i style={{fontStyle: "normal", opacity: frame % 14 < 7 ? 1 : 0}}>|</i></div> : <>
    <div style={{position: "absolute", inset: 0, background: "#17262c", transform: `scale(${1.08 - execute * 0.08})`}} />
    <Text text={text} opacity={execute} y={(1 - execute) * 62} scale={1.18 - execute * 0.18} size={titleSize(text, 0.94)} />
    <div style={{position: "absolute", left: 756, right: 756, top: 678, height: 8, background: ACCENT, transform: `scaleX(${execute})`}} />
  </>}</Background>;
};

// 23 · a first typing pass is visibly backspaced, then the exact supplied text is decisively retyped.
const ErrorRetype = ({text, frame}: TitleRendererProps) => {
  const chars = glyphs(text);
  const keep = Math.max(1, Math.floor(chars.length * 0.34));
  const initial = chars.slice(0, Math.max(keep + 1, Math.ceil(chars.length * 0.62))).join("");
  const firstEnd = 4 + initial.length * 2;
  const deleteStart = firstEnd + 15;
  const deleteEnd = deleteStart + (initial.length - keep) * 2;
  const retypeStart = deleteEnd + 5;
  let visible = "";
  if (frame < firstEnd) visible = initial.slice(0, Math.max(0, Math.floor((frame - 4) / 2)));
  else if (frame < deleteStart) visible = initial;
  else if (frame < deleteEnd) visible = initial.slice(0, Math.max(keep, initial.length - Math.floor((frame - deleteStart) / 2)));
  else visible = chars.slice(0, Math.min(chars.length, keep + Math.floor((frame - retypeStart) / 1.5))).join("");
  const cursor = frame < retypeStart + (chars.length - keep) * 1.5 + 20 && (frame < deleteStart || frame % 10 < 5);
  return <Background color="#f2f0e9"><div style={{position: "absolute", left: 200, right: 200, top: 460, color: "#1a2225", fontFamily: MONO, fontSize: titleSize(text, 0.9), fontWeight: 700, textAlign: "center", whiteSpace: "pre-wrap"}}>{visible}<span style={{color: ACCENT, opacity: cursor ? 1 : 0}}>|</span></div>
    {frame >= deleteStart && frame < deleteEnd ? <div style={{position: "absolute", left: 310, right: 310, top: 594, height: 5, background: "#d65757", transform: `scaleX(${progress(frame, deleteStart, deleteEnd - deleteStart)})`, transformOrigin: "left"}} /> : null}
  </Background>;
};

// 24 · left code lines fade in by line while a right editor types the same semantic title character by character.
const TypingCodeBlock = ({text, frame}: TitleRendererProps) => {
  const source = `const cue = \"${text.replaceAll("\"", "'")}\";`;
  const lines = ["import { motion } from 'story-claw';", source, "motion.title(cue);", "// ready"];
  const flat = lines.join("\n");
  const typed = Math.min(flat.length, Math.max(0, Math.floor((frame - 10) * 1.3)));
  return <Background color="#090b11"><div style={{position: "absolute", left: 100, top: 160, width: 790, height: 720, padding: "36px 42px", boxSizing: "border-box", border: "1px solid #303950", borderRadius: 14, background: "#10131d", color: "#dce4ee", fontFamily: MONO, fontSize: 28, lineHeight: 1.8}}><div style={{color: "#5b6684", fontSize: 18, letterSpacing: 3, marginBottom: 18}}>LINE REVEAL</div>{lines.map((line, index) => { const p = easeOut(progress(frame, 10 + index * 12, 20)); return <div key={index} style={{opacity: p, transform: `translateY(${(1 - p) * 16}px)`, color: index === 1 ? "#c3e88d" : index === 0 ? "#c792ea" : "#e8eaf0"}}>{line}</div>; })}</div>
    <div style={{position: "absolute", right: 100, top: 160, width: 790, height: 720, padding: "36px 42px", boxSizing: "border-box", border: "1px solid #303950", borderRadius: 14, background: "#10131d", color: "#82aaff", fontFamily: MONO, fontSize: 28, lineHeight: 1.8, whiteSpace: "pre-wrap"}}><div style={{color: "#5b6684", fontSize: 18, letterSpacing: 3, marginBottom: 18}}>CHAR TYPING</div>{flat.slice(0, typed)}<span style={{background: "#3a4468", color: "#fff"}}>{typed < flat.length ? flat[typed] : " "}</span></div>
  </Background>;
};

// 25 · three-row word roller swaps terms with blur depth and colours the centre row.
const VerticalWordRollBlurCycle = ({text, frame}: TitleRendererProps) => {
  const list = [...words(text), "DATA", "TEAMS", "EVERYONE"].slice(0, 4);
  while (list.length < 4) list.push("NEXT");
  const step = Math.min(3, Math.floor(Math.max(0, frame - 12) / 22));
  const local = easeOut(progress(frame, 12 + step * 22, 13));
  const offset = step + local * (step < 3 ? 1 : 0);
  return <Background color="#f7f7fa"><div style={{position: "absolute", left: W / 2 - 420, top: H / 2 - 58, display: "flex", alignItems: "center", gap: 20, color: "#111518", fontSize: 55, fontWeight: 900}}><span>BUILT FOR</span><div style={{position: "relative", width: 420, height: 168, overflow: "hidden"}}><div style={{position: "absolute", top: 56 - offset * 56, left: 0}}>{[...list, list.at(-1)!].map((word, index) => {
    const distance = Math.abs(index - offset);
    return <div key={`${word}-${index}`} style={{height: 56, display: "flex", alignItems: "center", color: distance < 0.5 ? "#4b4bf5" : "#b9b9be", filter: `blur(${Math.min(5, distance * 3)}px)`, opacity: Math.max(0.12, 1 - distance * 0.58)}}>{word}</div>;
  })}</div></div></div></Background>;
};

// 26 · page-filmstrip cards scroll on the left while a large right-hand relay word changes independently.
const WordRelayFilmstrip = ({text, frame}: TitleRendererProps) => {
  const relay = [...words(text), "DISCOVER", "DECIDE", "DELIVER"].slice(0, 4);
  while (relay.length < 4) relay.push("MOVE");
  const stage = Math.min(relay.length - 1, Math.floor(Math.max(0, frame - 10) / 24));
  const local = easeInOut(progress(frame, 10 + stage * 24, 12));
  return <Background color="#101419"><div style={{position: "absolute", left: 110, top: 110, width: 780, height: 860, overflow: "hidden"}}><div style={{transform: `translateY(${-stage * 275 - local * 275}px)`}}>{Array.from({length: 6}).map((_, index) => <div key={index} style={{height: 230, marginBottom: 45, padding: 34, boxSizing: "border-box", background: index % 2 ? "#e8e8e3" : "#20272d", color: index % 2 ? "#1a2023" : "#f2f4f4", borderRadius: 12, fontFamily: SERIF, fontSize: 46, fontWeight: 800}}>ARTICLE / {String(index + 1).padStart(2, "0")}<div style={{height: 10, width: "76%", marginTop: 34, background: index % 2 ? "#8d9698" : "#6d8f98"}} /></div>)}</div></div>
    <div style={{position: "absolute", left: 1010, right: 120, top: 340, color: INK, fontFamily: SERIF, fontSize: 116, lineHeight: 0.96, fontWeight: 700, textAlign: "right"}}><div style={{opacity: 0.35}}>COMPUTER</div><div style={{transform: `translateY(${(1 - local) * 36}px)`, opacity: 0.35 + local * 0.65}}>{relay[stage]}</div></div>
  </Background>;
};

// 27 · benefit words relay through individual circle geometry and a final metallic sweep.
const WordRelayGeometry = ({text, frame}: TitleRendererProps) => {
  const relay = [...words(text), "BETTER", "STRONGER"].slice(0, 3);
  while (relay.length < 3) relay.push("STRONGER");
  const stage = Math.min(2, Math.floor(frame / 32));
  const local = easeOut(progress(frame, stage * 32, 14));
  const last = stage === 2;
  return <Background color="#07080c"><div style={{position: "absolute", left: W / 2, top: H / 2, width: 560, height: 390, transform: "translate(-50%,-50%)"}}>
    {stage === 0 ? <circle /> : null}
    <svg width="560" height="390" viewBox="0 0 560 390" style={{position: "absolute", inset: 0}}>{stage === 0 ? <circle cx="280" cy="195" r="136" fill="none" stroke="#59647a" strokeWidth="4" strokeDasharray="12 16" transform={`rotate(${frame * 1.1} 280 195)`} /> : stage === 1 ? [160, 280, 400].map((x) => <circle key={x} cx={x} cy="195" r="96" fill="none" stroke="#718097" strokeWidth="4" strokeDasharray="620" strokeDashoffset={620 * (1 - local)} />) : null}</svg>
    <div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: last ? "transparent" : INK, fontSize: 96, fontWeight: 900, WebkitTextStroke: "2px #7f8b9b", background: last ? `linear-gradient(100deg,#5b6272 0%,#fff 45%,#5b6272 90%)` : undefined, backgroundSize: last ? "260% 100%" : undefined, backgroundPosition: last ? `${120 - local * 135}% 0` : undefined, WebkitBackgroundClip: last ? "text" : undefined, opacity: local}}>{relay[stage]}</div>
  </div></Background>;
};

// 28 · a moving dashboard-like grid is visible only inside huge text, then the mask bursts open.
const TextAsMask = ({text, frame}: TitleRendererProps) => {
  const enter = easeOut(progress(frame, 8, 20));
  const burst = easeInOut(progress(frame, 82, 26));
  const font = Math.min(300, Math.max(150, 1120 / Math.max(3, glyphs(text).length)));
  const mask = `linear-gradient(#fff 0 0)`;
  return <Background color="#091015"><div style={{position: "absolute", inset: 0, background: "linear-gradient(125deg,#1e3e4a,#0c161c 48%,#45231d)", backgroundSize: "180% 180%", backgroundPosition: `${35 + frame * 1.3}% 50%`, opacity: burst}} />
    <div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 + burst * 20})`, transformOrigin: "60% 50%", WebkitMaskImage: mask, maskImage: mask, overflow: "hidden"}}>
      <div style={{position: "absolute", left: 0, right: 0, top: 0, bottom: 0, transform: `translateX(${110 - frame * 3}px) scale(1.16)`, backgroundImage: "linear-gradient(rgba(138,211,223,.24) 1px, transparent 1px), linear-gradient(90deg, rgba(239,107,66,.24) 1px, transparent 1px)", backgroundSize: "82px 82px"}} />
      <div style={{position: "relative", color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,.3)", background: "linear-gradient(90deg,#9ee9f4,#f4f7f7,#f18767)", WebkitBackgroundClip: "text", fontSize: font, fontWeight: 950, letterSpacing: "-0.06em", opacity: enter, transform: `scale(${1 + burst * 0.02})`, whiteSpace: "nowrap"}}>{text}</div>
    </div>
  </Background>;
};

// 29 · individual characters materialize from wide letterspace and flickering opacity (not tracking-expand's centre squeeze).
const LetterspaceMaterialize = ({text, frame}: TitleRendererProps) => {
  const chars = glyphs(text);
  const size = titleSize(text, 1.02);
  return <Background><div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center"}}>{chars.map((char, index) => {
    const p = easeOut(progress(frame, 8 + index * 3, 22));
    const blur = (1 - p) * 12;
    const space = (1 - p) * (index % 2 ? 110 : -110);
    return <span key={`${index}-${char}`} style={{display: "inline-block", minWidth: char === " " ? "0.38em" : "0.6em", color: INK, fontSize: size, fontWeight: 900, opacity: p, transform: `translateX(${space}px) translateY(${(1 - p) * (index % 2 ? 36 : -36)}px)`, filter: `blur(${blur}px)`, letterSpacing: `${(1 - p) * 12}px`}}>{char === " " ? "\u00a0" : char}</span>;
  })}</div><div style={{position: "absolute", left: 430, right: 430, bottom: 246, height: 2, background: CYAN, opacity: easeOut(progress(frame, 40, 24))}} /></Background>;
};

// 30 · crosshair ink draw, letterpress wordmark, typed kicker, then a brief clean hold.
const BrandInkOpen = ({text, frame}: TitleRendererProps) => {
  const vertical = easeOut(progress(frame, 0, 10));
  const horizontal = easeOut(progress(frame, 8, 12));
  const word = easeOut(progress(frame, 18, 26));
  const kicker = Math.min(18, Math.max(0, Math.floor((frame - 38) / 2)));
  const exit = easeInOut(progress(frame, 90, 8));
  return <Background color="#ede9df"><svg width={W} height={H} style={{position: "absolute", inset: 0, opacity: 1 - exit}}><path d="M 960 190 L 960 890" fill="none" stroke="#283035" strokeWidth="3" strokeDasharray="700" strokeDashoffset={700 * (1 - vertical)} /><path d="M 470 540 L 1450 540" fill="none" stroke="#283035" strokeWidth="3" strokeDasharray="980" strokeDashoffset={980 * (1 - horizontal)} /></svg>
    <Text text={text} opacity={word * (1 - exit)} scale={1.3 - word * 0.3 - exit * 0.08} y={-36 - exit * 44} color="#202528" size={titleSize(text, 1.06)} family={SERIF} extra={{textShadow: "0 2px 0 #fff, 0 5px 10px rgba(0,0,0,.12)"}} />
    <div style={{position: "absolute", left: 0, right: 0, top: 648, textAlign: "center", color: "#586167", fontFamily: MONO, fontSize: 24, letterSpacing: 4, opacity: word * (1 - exit)}}>{"RESEARCH / MOTION / ".slice(0, kicker)}<span style={{color: ACCENT, opacity: frame % 12 < 6 ? 1 : 0}}>|</span></div>
    <div style={{position: "absolute", left: 760, right: 760, top: 622, height: 6, background: ACCENT, transform: `scaleX(${easeOut(progress(frame, 31, 12))})`}} />
  </Background>;
};

// 31 · a document page lifts on, types its heading, then reveals paragraph lines as a readable document scene.
const DocumentTypewriterReveal = ({text, frame}: TitleRendererProps) => {
  const page = easeOut(progress(frame, 0, 22));
  const count = Math.min(text.length, Math.max(0, Math.floor((frame - 14) / 2)));
  return <Background color="#172126"><div style={{position: "absolute", left: 360, top: 125, width: 1200, height: 830, padding: "78px 104px", boxSizing: "border-box", overflow: "hidden", background: "#f5f1e7", color: "#222b2d", borderRadius: 8, boxShadow: "0 34px 92px rgba(0,0,0,.4)", opacity: page, transform: `translateY(${(1 - page) * 230}px) rotate(${(1 - page) * -2.5}deg)`}}>
    <div style={{color: "#798280", fontFamily: MONO, fontSize: 19, letterSpacing: 4}}>DOCUMENT / 01</div>
    <div style={{marginTop: 58, minHeight: 105, fontSize: titleSize(text, 0.6), lineHeight: 1.14, fontWeight: 900}}>{text.slice(0, count)}<span style={{color: ACCENT, opacity: frame % 12 < 6 ? 1 : 0}}>|</span></div>
    <div style={{marginTop: 58, display: "flex", flexDirection: "column", gap: 24}}>{[0.92, 0.78, 0.86, 0.65, 0.89].map((width, index) => { const p = easeOut(progress(frame, 38 + index * 7, 22)); return <div key={index} style={{width: `${width * 100}%`, height: 18, borderRadius: 9, background: "#b8c0bb", opacity: p, transform: `translateX(${(1 - p) * 70}px)`}} />; })}</div>
  </div></Background>;
};

// 32 · individual mechanical split flaps cycle through noise, rotate on X, and settle left-to-right.
const SplitFlapTitle = ({text, frame}: TitleRendererProps) => {
  const chars = glyphs(text).slice(0, 15);
  const cellWidth = Math.min(100, Math.max(54, 1280 / Math.max(1, chars.length)));
  const cellHeight = cellWidth * 1.28;
  return <Background><div style={{position: "absolute", left: W / 2, top: H / 2, display: "flex", gap: 7, transform: "translate(-50%,-50%)"}}>{chars.map((char, index) => {
    const start = 14 + index * 4;
    const p = easeOut(progress(frame, start, 16));
    const face = p > 0.76 ? char : POOL[Math.floor(seeded(index * 31 + Math.floor(frame / 2)) * POOL.length)];
    return <div key={`${index}-${char}`} style={{width: cellWidth, height: cellHeight, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", overflow: "hidden", borderRadius: 7, border: "2px solid #52646b", background: "linear-gradient(#253237 0 49%, #182226 51% 100%)", color: p > 0.76 ? INK : CYAN, fontFamily: MONO, fontSize: cellWidth * 0.66, fontWeight: 950, transform: `perspective(600px) rotateX(${(1 - p) * 180}deg)`, boxShadow: "0 16px 32px rgba(0,0,0,.34)"}}>{face === " " ? "" : face}</div>;
  })}</div></Background>;
};

const TITLE_RENDERERS: Record<ShotcraftTitleStyle, TitleRenderer> = {
  "brace-expand": BraceExpand,
  "cel-flash-stomp": CelFlashStomp,
  "countdown-arc-scatter": CountdownArcScatter,
  "flying-words": FlyingWords,
  "glitch-cycle": GlitchCycle,
  "gradient-word-sweep": GradientWordSweep,
  "marker-underline-title": MarkerUnderlineTitle,
  "outline-word-fill": OutlineWordFill,
  "paper-title-card": PaperTitleCard,
  "pill-chip-slot-cycle-handled": PillChipSlotCycleHandled,
  "pill-slot-cycle": PillSlotCycle,
  "text-column-converge": TextColumnConverge,
  "title-demote-to-label": TitleDemoteToLabel,
  "split-text-stagger": SplitTextStagger,
  "drift-assembly": DriftAssembly,
  "tracking-expand": TrackingExpand,
  "text-on-path": TextOnPath,
  "scramble-decode": ScrambleDecode,
  "letter-drop-physics": LetterDropPhysics,
  "font-weight-pump": FontWeightPump,
  "karaoke-fill-sync": KaraokeFillSync,
  "terminal-typewriter": TerminalTypewriter,
  "error-retype": ErrorRetype,
  "typing-code-block": TypingCodeBlock,
  "vertical-word-roll-blur-cycle": VerticalWordRollBlurCycle,
  "word-relay-filmstrip": WordRelayFilmstrip,
  "word-relay-geometry": WordRelayGeometry,
  "text-as-mask": TextAsMask,
  "letterspace-materialize": LetterspaceMaterialize,
  "brand-ink-open": BrandInkOpen,
  "document-typewriter-reveal": DocumentTypewriterReveal,
  "split-flap-title": SplitFlapTitle,
};

const TITLE_SFX: Record<ShotcraftTitleStyle, {file: string; volume: number}> = {
  "brace-expand": {file: "transition-soft.mp3", volume: 0.17},
  "cel-flash-stomp": {file: "impact-cine.mp3", volume: 0.21},
  "countdown-arc-scatter": {file: "click-shutter.mp3", volume: 0.16},
  "flying-words": {file: "whoosh-fast.mp3", volume: 0.16},
  "glitch-cycle": {file: "glitch-electric-small.mp3", volume: 0.18},
  "gradient-word-sweep": {file: "sparkle.mp3", volume: 0.15},
  "marker-underline-title": {file: "transition-soft.mp3", volume: 0.14},
  "outline-word-fill": {file: "riser-cine.mp3", volume: 0.16},
  "paper-title-card": {file: "transition-soft.mp3", volume: 0.16},
  "pill-chip-slot-cycle-handled": {file: "pop.mp3", volume: 0.14},
  "pill-slot-cycle": {file: "pop.mp3", volume: 0.14},
  "text-column-converge": {file: "transition-soft.mp3", volume: 0.14},
  "title-demote-to-label": {file: "whoosh-fast.mp3", volume: 0.15},
  "split-text-stagger": {file: "whoosh-fast.mp3", volume: 0.16},
  "drift-assembly": {file: "riser-cine.mp3", volume: 0.16},
  "tracking-expand": {file: "transition-soft.mp3", volume: 0.15},
  "text-on-path": {file: "whoosh-big.mp3", volume: 0.17},
  "scramble-decode": {file: "glitch-electric-small.mp3", volume: 0.18},
  "letter-drop-physics": {file: "impact-cine.mp3", volume: 0.18},
  "font-weight-pump": {file: "pop.mp3", volume: 0.16},
  "karaoke-fill-sync": {file: "sparkle.mp3", volume: 0.14},
  "terminal-typewriter": {file: "keyboard.mp3", volume: 0.12},
  "error-retype": {file: "keyboard.mp3", volume: 0.12},
  "typing-code-block": {file: "keyboard.mp3", volume: 0.12},
  "vertical-word-roll-blur-cycle": {file: "pop.mp3", volume: 0.14},
  "word-relay-filmstrip": {file: "transition-snap.mp3", volume: 0.16},
  "word-relay-geometry": {file: "sparkle.mp3", volume: 0.15},
  "text-as-mask": {file: "riser-cine.mp3", volume: 0.17},
  "letterspace-materialize": {file: "transition-soft.mp3", volume: 0.14},
  "brand-ink-open": {file: "transition-soft.mp3", volume: 0.15},
  "document-typewriter-reveal": {file: "keyboard.mp3", volume: 0.11},
  "split-flap-title": {file: "click-shutter.mp3", volume: 0.17},
};

const TitleSfx = ({style}: {style: ShotcraftTitleStyle}) => {
  const {fps} = useVideoConfig();
  const sound = TITLE_SFX[style];
  return <Sequence from={Math.round(0.06 * fps)} durationInFrames={Math.max(1, Math.round(0.85 * fps))} layout="none"><Audio src={staticFile(`audio/${sound.file}`)} volume={sound.volume} /></Sequence>;
};

/**
 * Explicit adapter for the imported Shotcraft title family.  The outer title
 * contract remains exactly TitleSpec; group selects an already-authored fixed
 * motion recipe and no visual tuning is requested from the model.
 */
export const ShotcraftTitleTemplate = ({spec, style = "split-text-stagger", css, transparentBackground = false}: Props & {transparentBackground?: boolean}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  if (!titleHasStarted(spec, seconds)) return null;
  const renderer = TITLE_RENDERERS[style as ShotcraftTitleStyle];
  if (!renderer) return null;
  const localFrame = Math.floor(titleElapsed(spec, seconds) * fps);
  return <TransparentRootContext.Provider value={transparentBackground}>
    <TitleLayout spec={spec} style={css}>
      <AbsoluteFill style={{background: "transparent"}}>
        <TitleSfx style={style as ShotcraftTitleStyle} />
        {renderer({text: spec.text, frame: localFrame})}
      </AbsoluteFill>
    </TitleLayout>
  </TransparentRootContext.Provider>;
};
