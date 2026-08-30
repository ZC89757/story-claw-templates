import type {CSSProperties, ReactNode} from "react";
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {showcaseEaseOutCubic, showcaseItemProgress} from "./evaluate";
import type {ShowcaseItem, ShowcaseSpec} from "./types";

type Props = {spec: ShowcaseSpec; style?: string; css?: CSSProperties};

/**
 * Kept beside the renderer table intentionally: catalog ids must be handled
 * explicitly here. Do not replace this with keyword matching or a fallback.
 */
export const SHOWCASE_STYLE_IDS = [
  "ai-stream-response",
  "autolayout-gap-dial",
  "panel-to-canvas",
  "diagram-cascade",
  "chip-grid-single-select-blackout",
  "chip-lift-to-user-pill",
  "dialogue-duet",
  "cast-ensemble",
  "command-palette-summon",
  "glass-pill-dictation-typing",
  "hashtag-to-pill-materialize",
  "cursor-performance",
  "keycap-smash-cut",
  "picker-carousel-feature-cycle",
  "segmented-thumb-hero",
  "theme-sweep-toggle",
  "palette-theme-ripple",
  "type-and-filter",
  "avatar-bracket-carousel",
  "bezier-source-converge-merge",
  "card-stack",
  "carousel-3d",
  "cloner-depth-echo",
  "deck-deal-flyin",
  "doc-park-left-pill-deal",
  "draw-svg-trace",
  "axial-stretch",
  "contact-shadow-lift",
  "floating-glossy-label-pills",
  "integration-hub-map",
  "list-reveal",
  "list-stack-press",
  "morph-from-primitive",
  "neon-frame-forerun",
  "neon-frame-orbit-drop",
  "page-waterfall-wall",
  "masking-tape-slap",
  "popup-book-rise",
  "product-card-progressive-assemble",
  "radial-wave",
  "research-card-stack-scroll",
  "row-embed",
  "runway-ground-skim",
  "skeleton-reveal",
  "svg-shape-morph",
  "value-stagger-gradient",
  "bento-light-up",
  "grid-wave-flip",
  "wireframe-draw-on",
  "spotlight-hero-card",
  "magician-card-flourish",
  "outro-group-photo-launch",
  "ui-strip-away-outro",
  "icon-flip-bloom",
  "input-morph-assemble",
] as const;

export type ShowcaseStyle = (typeof SHOWCASE_STYLE_IDS)[number];

type RendererProps = {items: ShowcaseItem[]; seconds: number};
type ShowcaseRenderer = (props: RendererProps) => ReactNode;

const WIDTH = 1920;
const HEIGHT = 1080;
const INK = "#e9edf0";
const MUTED = "#9da8ae";
const ACCENT = "#ef6b42";
const CYAN = "#8ab5c2";
const PANEL = "#1b2328";
const LINE = "#334149";
const COLORS = [ACCENT, CYAN, "#d8b45d", "#b98ad6", "#72bd91", "#e48c9a"];

const clamp = (value: number): number => Math.max(0, Math.min(1, value));
const ease = (value: number): number => showcaseEaseOutCubic(clamp(value));
const progress = (item: ShowcaseItem, seconds: number, duration = 0.34): number =>
  ease((seconds - item.at) / duration);
const visible = (items: ShowcaseItem[], limit = 9): ShowcaseItem[] => items.slice(0, limit);
const color = (index: number): string => COLORS[index % COLORS.length];
const copy = (items: ShowcaseItem[], index: number, fallback: string): string =>
  items[index % Math.max(1, items.length)]?.text ?? fallback;

const STYLE_SOUND: Readonly<Record<ShowcaseStyle, string>> = {
  "ai-stream-response": "whoosh-fast.mp3",
  "autolayout-gap-dial": "transition-snap.mp3",
  "panel-to-canvas": "whoosh-fast.mp3",
  "diagram-cascade": "transition-snap.mp3",
  "chip-grid-single-select-blackout": "transition-snap.mp3",
  "chip-lift-to-user-pill": "whoosh-fast.mp3",
  "dialogue-duet": "whoosh-fast.mp3",
  "cast-ensemble": "whoosh-fast.mp3",
  "command-palette-summon": "whoosh-fast.mp3",
  "glass-pill-dictation-typing": "keyboard.mp3",
  "hashtag-to-pill-materialize": "keyboard.mp3",
  "cursor-performance": "whoosh-fast.mp3",
  "keycap-smash-cut": "impact-cine.mp3",
  "picker-carousel-feature-cycle": "transition-snap.mp3",
  "segmented-thumb-hero": "transition-snap.mp3",
  "theme-sweep-toggle": "transition-snap.mp3",
  "palette-theme-ripple": "transition-soft.mp3",
  "type-and-filter": "keyboard.mp3",
  "avatar-bracket-carousel": "whoosh-fast.mp3",
  "bezier-source-converge-merge": "transition-snap.mp3",
  "card-stack": "whoosh-fast.mp3",
  "carousel-3d": "whoosh-fast.mp3",
  "cloner-depth-echo": "whoosh-fast.mp3",
  "deck-deal-flyin": "whoosh-fast.mp3",
  "doc-park-left-pill-deal": "transition-soft.mp3",
  "draw-svg-trace": "glitch-electric-small.mp3",
  "axial-stretch": "whoosh-fast.mp3",
  "contact-shadow-lift": "whoosh-fast.mp3",
  "floating-glossy-label-pills": "whoosh-fast.mp3",
  "integration-hub-map": "transition-snap.mp3",
  "list-reveal": "whoosh-fast.mp3",
  "list-stack-press": "transition-snap.mp3",
  "morph-from-primitive": "whoosh-fast.mp3",
  "neon-frame-forerun": "glitch-electric-small.mp3",
  "neon-frame-orbit-drop": "glitch-electric-small.mp3",
  "page-waterfall-wall": "transition-soft.mp3",
  "masking-tape-slap": "transition-soft.mp3",
  "popup-book-rise": "transition-soft.mp3",
  "product-card-progressive-assemble": "transition-snap.mp3",
  "radial-wave": "glitch-electric-small.mp3",
  "research-card-stack-scroll": "transition-soft.mp3",
  "row-embed": "whoosh-fast.mp3",
  "runway-ground-skim": "whoosh-fast.mp3",
  "skeleton-reveal": "transition-soft.mp3",
  "svg-shape-morph": "glitch-electric-small.mp3",
  "value-stagger-gradient": "transition-snap.mp3",
  "bento-light-up": "glitch-electric-small.mp3",
  "grid-wave-flip": "transition-snap.mp3",
  "wireframe-draw-on": "glitch-electric-small.mp3",
  "spotlight-hero-card": "whoosh-big.mp3",
  "magician-card-flourish": "whoosh-big.mp3",
  "outro-group-photo-launch": "whoosh-big.mp3",
  "ui-strip-away-outro": "whoosh-big.mp3",
  "icon-flip-bloom": "transition-snap.mp3",
  "input-morph-assemble": "transition-snap.mp3",
};

const FixedSfx = ({style, items}: {style: ShowcaseStyle; items: ShowcaseItem[]}) => {
  const {fps} = useVideoConfig();
  const file = STYLE_SOUND[style];
  return <>
    <Sequence from={Math.round(0.05 * fps)} durationInFrames={Math.max(1, Math.round(0.8 * fps))} layout="none">
      <Audio src={staticFile("audio/" + file)} volume={file === "impact-cine.mp3" ? 0.24 : 0.2} />
    </Sequence>
    {items.slice(0, 8).map((item, index) => <Sequence
      key={item.id + "-sfx"}
      from={Math.max(0, Math.round((item.at + 0.28) * fps))}
      durationInFrames={Math.max(1, Math.round(0.32 * fps))}
      layout="none"
    ><Audio src={staticFile("audio/pop.mp3")} volume={0.12 - index * 0.008} /></Sequence>)}
  </>;
};

const Header = ({title}: {title?: string}) => title
  ? <div style={{position: "absolute", left: 92, top: 58, fontSize: 40, fontWeight: 850, color: INK}}>{title}</div>
  : null;

const TextBar = ({item, p, x, y, width, tint = ACCENT}: {
  item: ShowcaseItem;
  p: number;
  x: number;
  y: number;
  width: number;
  tint?: string;
}) => <div style={{
  position: "absolute", left: x, top: y, width, height: 72, borderRadius: 14,
  display: "flex", alignItems: "center", padding: "0 26px", boxSizing: "border-box",
  background: PANEL, border: "2px solid " + LINE, color: INK, fontSize: 30, fontWeight: 750,
  opacity: p, transform: "translateY(" + ((1 - p) * 54) + "px)",
}}><span style={{width: 16, height: 16, borderRadius: 5, background: tint, marginRight: 18, flex: "0 0 auto"}} />{item.text}</div>;

const Card = ({item, p, index, x, y, width = 390, height = 250, transform = "", tint}: {
  item: ShowcaseItem;
  p: number;
  index: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  transform?: string;
  tint?: string;
}) => <div style={{
  position: "absolute", left: x, top: y, width, height, borderRadius: 20,
  background: PANEL, border: "2px solid " + (tint ?? LINE), boxShadow: "0 20px 44px rgba(0,0,0,.24)",
  opacity: p, transform, overflow: "hidden",
}}><div style={{position: "absolute", left: 24, top: 24, width: 64, height: 11, borderRadius: 6, background: tint ?? color(index), opacity: 0.86}} />
  <div style={{position: "absolute", left: 24, right: 24, top: 62, fontSize: 30, lineHeight: 1.2, fontWeight: 800, color: INK, overflowWrap: "anywhere"}}>{item.text}</div>
  <div style={{position: "absolute", left: 24, right: 24, bottom: 26, height: 8, borderRadius: 4, background: LINE}} />
</div>;

const Cursor = ({x, y, scale = 1, tint = "#f6f7f8", rotate = 0}: {x: number; y: number; scale?: number; tint?: string; rotate?: number}) =>
  <div style={{position: "absolute", left: x, top: y, width: 0, height: 0, borderLeft: "18px solid transparent", borderRight: "10px solid transparent", borderBottom: "34px solid " + tint, transform: "rotate(" + rotate + "deg) scale(" + scale + ")", transformOrigin: "0 0", filter: "drop-shadow(0 5px 5px rgba(0,0,0,.34))"}} />;

/**
 * Video Shotcraft's Axial Stretch is deliberately a velocity-driven card
 * entrance, rather than a list reveal.  Each card travels in from the right;
 * its instantaneous horizontal speed stretches X and squashes Y, followed by
 * a short landing rebound.  `item.at` is the beginning of that card's flight.
 */
const AxialStretch = ({items, seconds}: RendererProps) => {
  const cards = visible(items, 3);
  const cardWidth = 380;
  const cardHeight = 230;
  const gap = 60;
  const rowWidth = cards.length * cardWidth + Math.max(0, cards.length - 1) * gap;
  const rowLeft = (WIDTH - rowWidth) / 2;
  const rowTop = (HEIGHT - cardHeight) / 2;
  const startX = WIDTH + 60;
  const flightSeconds = 36 / 30;
  const reboundSeconds = 8 / 30;
  const inOutQuart = (value: number): number => {
    const t = clamp(value);
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  };
  const positionAt = (time: number, start: number, target: number): number =>
    startX + (target - startX) * inOutQuart((time - start) / flightSeconds);
  const rebound = (time: number, land: number): {x: number; y: number} => {
    const t = clamp((time - land) / reboundSeconds);
    if (t <= 0.5) {
      const p = ease(t / 0.5);
      return {x: 1 - p * 0.15, y: 1 + p * 0.1};
    }
    const p = ease((t - 0.5) / 0.5);
    return {x: 0.85 + p * 0.15, y: 1.1 - p * 0.1};
  };

  return <>{cards.map((item, index) => {
    const targetX = rowLeft + index * (cardWidth + gap);
    const start = item.at;
    const land = start + flightSeconds;
    const x = positionAt(seconds, start, targetX);
    // Match the source's one-frame position derivative (30 fps) so the
    // stretch exists only during fast travel, never while the card is still.
    const velocity = Math.abs(positionAt(seconds, start, targetX) - positionAt(seconds - 1 / 30, start, targetX));
    const speed = clamp((velocity - 2) / (140 - 2));
    const landing = rebound(seconds, land);
    const stretchX = (1 + speed * 1.2) * landing.x;
    const stretchY = (1 - speed * 0.28) * landing.y;
    const opacity = clamp((seconds - start) / 0.12);
    return <div key={item.id}>
      <div style={{position: "absolute", left: targetX, top: rowTop, width: cardWidth, height: cardHeight, border: "2px dashed " + LINE, borderRadius: 14, boxSizing: "border-box", opacity: 0.72}} />
      <div style={{position: "absolute", left: 0, top: rowTop, transform: "translateX(" + x + "px) scaleX(" + stretchX + ") scaleY(" + stretchY + ")", transformOrigin: "100% 50%", opacity}}>
        <Card item={item} p={1} index={index} x={0} y={0} width={cardWidth} height={cardHeight} />
      </div>
    </div>;
  })}</>;
};

/**
 * Video Shotcraft's List Reveal is a calm, vertical menu: every row uses a
 * lightly overshooting scale-in while the entire finished stack drifts upward.
 * It intentionally has no lateral flight or velocity stretch.  `item.at`
 * controls each individual row's entrance.
 */
const ListReveal = ({items, seconds}: RendererProps) => {
  const rows = visible(items, 8);
  const rowWidth = 960;
  const rowHeight = 104;
  const gap = 36;
  const totalHeight = rows.length * rowHeight + Math.max(0, rows.length - 1) * gap;
  const left = (WIDTH - rowWidth) / 2;
  const top = (HEIGHT - totalHeight) / 2;
  const firstAt = rows[0]?.at ?? 0;
  const lastAt = rows[rows.length - 1]?.at ?? firstAt;
  const driftDuration = Math.max(3.6, lastAt - firstAt + 1.2);
  const drift = 64 - clamp((seconds - firstAt) / driftDuration) * 128;
  const outBack = (value: number): number => {
    const t = clamp(value);
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };

  return <div style={{position: "absolute", left, top, width: rowWidth, transform: "translateY(" + drift + "px)"}}>{rows.map((item, index) => {
    const p = outBack((seconds - item.at) / 0.86);
    const entered = Math.max(0, p);
    return <div key={item.id} style={{position: "relative", height: rowHeight, marginBottom: index === rows.length - 1 ? 0 : gap, display: "flex", alignItems: "center", gap: 44, padding: "0 52px", borderRadius: 40, boxSizing: "border-box", background: "#161a26", border: "2px solid #262c40", opacity: Math.min(1, entered * 2.2), transform: "scale(" + (0.78 + entered * 0.22) + ") translateY(" + (56 * (1 - entered)) + "px)", transformOrigin: "center"}}>
      <div style={{width: 60, height: 60, borderRadius: 18, flex: "none", background: "linear-gradient(140deg," + color(index) + "," + COLORS[(index + 3) % COLORS.length] + ")", boxShadow: "inset 0 2px 0 rgba(255,255,255,.32)"}} />
      <div style={{flex: 1, color: "#c6cde2", fontSize: 38, fontWeight: 750, lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{item.text}</div>
      <div style={{color: color(index), fontSize: 24, letterSpacing: ".12em", fontWeight: 900}}>{String(index + 1).padStart(2, "0")}</div>
    </div>;
  })}</div>;
};

const StreamResponse = ({items, seconds}: RendererProps) => {
  const prompt = copy(items, 0, "分析这组信息");
  const typed = prompt.slice(0, Math.floor(prompt.length * ease(seconds / 0.42)));
  return <><div style={{position: "absolute", left: 320, top: 180, width: 1280, height: 108, borderRadius: 22, background: "#25333a", border: "2px solid " + LINE, padding: "28px 38px", boxSizing: "border-box", fontSize: 34, fontWeight: 750, color: INK}}><span style={{color: ACCENT, marginRight: 22}}>›</span>{typed}<span style={{opacity: Math.floor(seconds * 5) % 2 ? 1 : 0, color: ACCENT}}>_</span></div>
  {visible(items, 7).map((item, index) => {
    const p = progress(item, seconds);
    return <div key={item.id} style={{position: "absolute", left: 420, top: 340 + index * 86, right: 350, height: 64, display: "flex", alignItems: "center", opacity: p, transform: "translateX(" + ((1 - p) * 100) + "px)"}}>
      <span style={{width: 28, height: 28, borderRadius: "50%", border: "3px solid " + color(index), marginRight: 22, transform: "scale(" + (0.55 + p * 0.45) + ")"}}>✓</span>
      <span style={{fontSize: 30, fontWeight: 700, color: INK}}>{item.text.slice(0, Math.floor(item.text.length * p))}</span>
      <span style={{marginLeft: "auto", width: p * 180, height: 6, borderRadius: 4, background: color(index), opacity: 0.7}} />
    </div>;
  })}</>;
};

const GapDial = ({items, seconds}: RendererProps) => {
  const p = ease(seconds / 1.35);
  const count = Math.max(3, Math.min(6, items.length || 5));
  const gap = 22 + p * 118;
  const blockWidth = 180;
  const total = count * blockWidth + (count - 1) * gap;
  const left = (WIDTH - total) / 2;
  return <><div style={{position: "absolute", left: 820, top: 170, width: 280, height: 116, borderRadius: 58, background: "#e7ecee", color: "#142228", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, fontWeight: 900, transform: "scale(" + (0.78 + p * 0.22) + ")"}}>GAP {Math.round(gap)}</div>
  <div style={{position: "absolute", left: left - 30, top: 430, width: total + 60, height: 150, border: "3px solid " + ACCENT, borderRadius: 30, opacity: 0.35 + p * 0.65}} />
  {Array.from({length: count}).map((_, index) => {
    const q = ease((p - index * 0.05) / 0.8);
    return <div key={index} style={{position: "absolute", left: left + index * (blockWidth + gap), top: 455, width: blockWidth, height: 100, borderRadius: 18, background: index % 2 ? "#26363c" : PANEL, border: "2px solid " + color(index), opacity: q, transform: "scale(" + (0.82 + q * 0.18) + ")"}}><div style={{position: "absolute", left: 18, top: 34, color: INK, fontSize: 22, fontWeight: 800}}>{copy(items, index, "组件 " + (index + 1))}</div></div>;
  })}</>;
};

const PanelToCanvas = ({items, seconds}: RendererProps) => <><div style={{position: "absolute", left: 120, top: 160, width: 480, bottom: 140, borderRadius: 24, background: "#152128", border: "2px solid " + LINE}}>
  <div style={{height: 72, padding: "22px 28px", color: INK, fontSize: 28, fontWeight: 850, borderBottom: "2px solid " + LINE}}>可选模块</div>
  {visible(items, 5).map((item, index) => {
    const p = progress(item, seconds);
    return <div key={item.id} style={{position: "absolute", left: 28, right: 28, top: 112 + index * 96, height: 66, borderRadius: 12, background: "#24343a", opacity: 1 - p * 0.3, transform: "translateX(" + (p * 36) + "px)"}}><span style={{position: "absolute", left: 18, top: 18, width: 24, height: 24, border: "2px solid " + color(index), borderRadius: 6}} /><span style={{position: "absolute", left: 60, top: 20, color: INK, fontSize: 22, fontWeight: 700}}>{item.text}</span></div>;
  })}</div>
  {visible(items, 5).map((item, index) => {
    const p = progress(item, seconds);
    const col = index % 2;
    const row = Math.floor(index / 2);
    return <Card key={item.id} item={item} p={p} index={index} x={760 + col * 500} y={230 + row * 260} width={410} height={210} transform={"translate3d(" + ((1 - p) * -700) + "px," + ((1 - p) * (index - 2) * 70) + "px,0) rotate(" + ((1 - p) * (index % 2 ? 10 : -10)) + "deg)"} />;
  })}</>;

const DiagramCascade = ({items, seconds}: RendererProps) => {
  const nodes = visible(items, 7);
  const root = nodes[0];
  const children = nodes.slice(1);
  return <><svg width={WIDTH} height={HEIGHT} style={{position: "absolute", inset: 0}}>{children.map((item, index) => {
    const p = progress(item, seconds);
    const x = 310 + (index % 3) * 650;
    const y = index < 3 ? 430 : 720;
    return <path key={item.id + "-edge"} d={"M 960 350 C 960 430 " + x + " " + (y - 80) + " " + x + " " + y} fill="none" stroke={color(index + 1)} strokeWidth="6" strokeDasharray="900" strokeDashoffset={900 * (1 - p)} opacity={p} />;
  })}</svg>
  {root ? <div style={{position: "absolute", left: 710, top: 210, width: 500, height: 120, borderRadius: 20, background: "#26343b", border: "3px solid " + ACCENT, display: "flex", alignItems: "center", justifyContent: "center", color: INK, fontSize: 34, fontWeight: 900, opacity: progress(root, seconds), transform: "scale(" + (0.75 + progress(root, seconds) * 0.25) + ")"}}>{root.text}</div> : null}
  {children.map((item, index) => {
    const p = progress(item, seconds);
    const x = 160 + (index % 3) * 650;
    const y = index < 3 ? 430 : 720;
    return <div key={item.id} style={{position: "absolute", left: x, top: y, width: 300, height: 96, borderRadius: 16, background: PANEL, border: "2px solid " + color(index + 1), color: INK, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 16, boxSizing: "border-box", fontSize: 24, fontWeight: 800, opacity: p, transform: "translateY(" + ((1 - p) * 70) + "px) scale(" + (0.84 + p * 0.16) + ")"}}>{item.text}</div>;
  })}</>;
};

const ChipGrid = ({items, seconds}: RendererProps) => {
  const active = Math.min(Math.max(0, items.length - 1), Math.floor(seconds / 0.55));
  const p = ease(seconds / 0.45);
  return <><div style={{position: "absolute", inset: 0, background: "#edf0f1", opacity: p}} />
  <div style={{position: "absolute", left: 290, top: 250, width: 1340, height: 580, borderRadius: 30, background: "#f8f9f9", boxShadow: "0 28px 70px rgba(0,0,0,.3)", padding: 56, boxSizing: "border-box", opacity: p}}>
    <div style={{fontSize: 42, fontWeight: 900, color: "#15191b", marginBottom: 46}}>选择一个重点</div>
    {Array.from({length: 12}).map((_, index) => <div key={index} style={{position: "absolute", left: 56 + (index % 4) * 300, top: 160 + Math.floor(index / 4) * 130, width: 250, height: 76, borderRadius: 38, display: "flex", alignItems: "center", justifyContent: "center", background: index === active ? "#0f1518" : "#e0e5e6", color: index === active ? "#fff" : "#677277", fontSize: 24, fontWeight: 800, opacity: index === active ? 1 : 0.32 + index / 24, transform: "scale(" + (index === active ? 1.1 : 1) + ")"}}>{copy(items, index, "选项 " + (index + 1))}</div>)}
  </div></>;
};

const ChipLift = ({items, seconds}: RendererProps) => {
  const p = ease(seconds / 0.9);
  const selected = copy(items, 0, "核心用户");
  return <>{Array.from({length: 12}).map((_, index) => {
    const active = index === 5;
    const row = Math.floor(index / 4);
    const col = index % 4;
    return <div key={index} style={{position: "absolute", left: 520 + col * 220, top: 330 + row * 110, width: 160, height: 62, borderRadius: 31, background: "#26343a", border: "2px solid " + (active ? ACCENT : LINE), color: INK, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 750, opacity: active ? 1 - p : 1, transform: "scale(" + (active ? 1 - p * 0.15 : 1) + ")"}}>{active ? selected.slice(0, 8) : "标签 " + (index + 1)}</div>;
  })}<div style={{position: "absolute", left: 510 - p * 170, top: 475 - p * 185, width: 190 + p * 850, height: 68 + p * 82, borderRadius: 80, background: "linear-gradient(135deg, " + ACCENT + ", #f8b05a)", color: "#182127", opacity: p, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 + p * 20, fontWeight: 900, boxShadow: "0 24px 55px rgba(239,107,66,.36)"}}><span style={{width: 46, height: 46, borderRadius: "50%", background: "#17262b", marginRight: 22}} />{selected}</div></>;
};

const DialogueDuet = ({items, seconds}: RendererProps) => {
  const first = items[0];
  const second = items[1] ?? first;
  const p1 = first ? progress(first, seconds) : 0;
  const p2 = second ? progress(second, seconds) : 0;
  return <><Cursor x={300 + p1 * 370} y={780 - Math.sin(p1 * Math.PI) * 270} tint={CYAN} rotate={-35} /><Cursor x={1620 - p2 * 370} y={780 - Math.sin(p2 * Math.PI) * 270} tint={ACCENT} rotate={35} />
  <div style={{position: "absolute", left: 260, top: 300, width: 540, minHeight: 126, padding: 28, boxSizing: "border-box", borderRadius: "30px 30px 30px 6px", background: "#24404a", color: INK, fontSize: 30, fontWeight: 750, opacity: p1, transform: "translateX(" + ((1 - p1) * -160) + "px)"}}>{first?.text}</div>
  <div style={{position: "absolute", right: 260, top: 500, width: 540, minHeight: 126, padding: 28, boxSizing: "border-box", borderRadius: "30px 30px 6px 30px", background: "#4a2b24", color: INK, fontSize: 30, fontWeight: 750, opacity: p2, transform: "translateX(" + ((1 - p2) * 160) + "px)"}}>{second?.text}</div></>;
};

const CursorCast = ({items, seconds}: RendererProps) => {
  const p = ease(seconds / 0.9);
  const count = Math.max(4, Math.min(7, items.length || 4));
  return <><div style={{position: "absolute", left: 560, top: 410, width: 800, height: 220, borderRadius: 30, background: PANEL, border: "2px solid " + LINE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, fontWeight: 900, color: INK, opacity: p}}>{copy(items, 0, "一起协作完成")}</div>
  {Array.from({length: count}).map((_, index) => {
    const angle = index / count * Math.PI * 2;
    const x = 960 + Math.cos(angle) * (370 - p * 110);
    const y = 530 + Math.sin(angle) * (250 - p * 70);
    const q = ease((p - index * 0.06) / 0.78);
    return <div key={index}><Cursor x={x} y={y} scale={0.8 + q * 0.28} tint={color(index)} rotate={index % 2 ? 25 : -25} /><span style={{position: "absolute", left: x + 5, top: y + 38, width: 32, height: 32, borderRadius: "50%", background: color(index), opacity: q}} /></div>;
  })}</>;
};

const CommandPalette = ({items, seconds}: RendererProps) => {
  const p = ease(seconds / 0.36);
  return <div style={{position: "absolute", left: 500, top: 210, width: 920, minHeight: 560, padding: 30, boxSizing: "border-box", borderRadius: 26, background: "#edf1f2", boxShadow: "0 38px 90px rgba(0,0,0,.42)", color: "#192329", opacity: p, transform: "translateY(" + ((1 - p) * -100) + "px) scale(" + (0.9 + p * 0.1) + ")"}}>
    <div style={{height: 78, borderBottom: "2px solid #c6d0d4", display: "flex", alignItems: "center", gap: 16, fontSize: 32, fontWeight: 850}}><span style={{width: 28, height: 28, borderRadius: 8, background: ACCENT}} />{copy(items, 0, "搜索命令")}<span style={{marginLeft: "auto", width: 4, height: 38, background: ACCENT}} /></div>
    <div style={{paddingTop: 22}}>{visible(items, 6).map((item, index) => {
      const q = progress(item, seconds);
      return <div key={item.id} style={{height: 68, marginBottom: 10, display: "flex", alignItems: "center", padding: "0 22px", borderRadius: 13, background: index === 0 && q > 0.92 ? "#d4dde0" : "transparent", opacity: q, transform: "translateY(" + ((1 - q) * 22) + "px)", fontSize: 27, fontWeight: 700}}><span style={{width: 18, height: 18, borderRadius: 5, background: color(index), marginRight: 18}} />{item.text}<span style={{marginLeft: "auto", color: "#77878d", fontSize: 19}}>⌘{index + 1}</span></div>;
    })}</div>
  </div>;
};

const DictationPill = ({items, seconds}: RendererProps) => {
  const p = ease(seconds / 0.55);
  const text = copy(items, 0, "说出你的想法");
  return <><div style={{position: "absolute", left: 410, top: 405, width: 1100, height: 150, borderRadius: 75, background: "linear-gradient(135deg, rgba(255,255,255,.24), rgba(138,211,223,.08))", border: "2px solid rgba(220,245,248,.65)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.45), 0 28px 68px rgba(0,0,0,.35)", display: "flex", alignItems: "center", padding: "0 50px", boxSizing: "border-box", opacity: p, transform: "scale(" + (0.82 + p * 0.18) + ")"}}>
    <span style={{fontSize: 38, fontWeight: 800, color: INK}}>{text.slice(0, Math.floor(text.length * p))}<span style={{opacity: Math.floor(seconds * 5) % 2 ? 1 : 0}}>│</span></span>
    <div style={{marginLeft: "auto", display: "flex", gap: 7, alignItems: "center"}}>{Array.from({length: 5}).map((_, index) => <span key={index} style={{width: 8, height: 18 + Math.abs(Math.sin(seconds * 9 + index)) * 34 * p, background: CYAN, borderRadius: 6}} />)}</div>
  </div></>;
};

const HashtagPill = ({items, seconds}: RendererProps) => {
  const p = ease(seconds / 0.9);
  const text = copy(items, 0, "#话题");
  return <><div style={{position: "absolute", left: 0, right: 0, top: 265, textAlign: "center", fontSize: 150, fontWeight: 950, color: INK, opacity: 1 - p, transform: "scale(" + (1 + p * 0.18) + ")"}}>{text.slice(0, Math.floor(text.length * Math.min(1, seconds / 0.42)))}<span style={{opacity: Math.floor(seconds * 6) % 2 ? 1 : 0}}>_</span></div>
  <div style={{position: "absolute", left: 520 - p * 130, top: 400, width: 880 + p * 260, height: 170, borderRadius: 100, background: "linear-gradient(110deg, " + ACCENT + ", #fbcb76)", color: "#1c282c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60 - p * 18, fontWeight: 900, opacity: p, transform: "rotate(" + ((1 - p) * -8) + "deg)"}}>{text}</div></>;
};

const CursorPerformance = ({items, seconds}: RendererProps) => {
  const p = ease(seconds / 0.82);
  const x = 160 + p * 1390;
  const y = 830 - Math.sin(p * Math.PI) * 560;
  return <><div style={{position: "absolute", left: 390, top: 210, width: 1140, height: 660, border: "3px solid " + LINE, borderRadius: 28, background: PANEL, transform: "scale(" + (1 + Math.max(0, p - 0.58) * 0.3) + ")", transformOrigin: "72% 30%"}}>{visible(items, 5).map((item, index) => <div key={item.id} style={{position: "absolute", left: 70 + (index % 2) * 520, top: 110 + Math.floor(index / 2) * 170, width: 430, height: 110, borderRadius: 18, background: "#25333a", border: "2px solid " + (index === 2 ? ACCENT : LINE), display: "flex", alignItems: "center", padding: 24, boxSizing: "border-box", color: INK, fontSize: 25, fontWeight: 750, opacity: progress(item, seconds)}}>{item.text}</div>)}</div><Cursor x={x} y={y} scale={1.25} rotate={-28} /><span style={{position: "absolute", left: x - 12, top: y + 14, width: 48 * Math.max(0, Math.sin(p * Math.PI)), height: 48 * Math.max(0, Math.sin(p * Math.PI)), borderRadius: "50%", background: ACCENT, opacity: 0.7}} /></>;
};

const KeycapSmash = ({items, seconds}: RendererProps) => {
  const p = ease(seconds / 0.48);
  const shock = Math.max(0, Math.sin(p * Math.PI));
  return <><div style={{position: "absolute", left: 760, top: 270 + p * 120, width: 400, height: 320, borderRadius: 48, background: "#e4e9ea", color: "#162126", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 124, fontWeight: 950, boxShadow: "0 " + (44 - p * 34) + "px 0 #738087, 0 32px 70px rgba(0,0,0,.42)", transform: "scaleY(" + (1 - p * 0.15) + ")"}}>⌘</div>
  {visible(items, 8).map((item, index) => {
    const angle = index / 8 * Math.PI * 2;
    const radius = p * (280 + (index % 3) * 85);
    return <div key={item.id} style={{position: "absolute", left: 945 + Math.cos(angle) * radius, top: 430 + Math.sin(angle) * radius, color: color(index), fontSize: 23, fontWeight: 850, opacity: p, transform: "rotate(" + (p * (index % 2 ? 55 : -55)) + "deg) scale(" + (0.55 + shock * 0.45) + ")"}}>{item.text}</div>;
  })}</>;
};

const PickerCarousel = ({items, seconds}: RendererProps) => {
  const list = visible(items, 7);
  const cycle = seconds * 1.75;
  const focus = Math.floor(cycle) % Math.max(1, list.length);
  const offset = (cycle % 1) * 74;
  return <div style={{position: "absolute", left: 570, top: 170, width: 780, height: 750, borderRadius: 30, background: "#f0f2f0", color: "#171b1c", overflow: "hidden", boxShadow: "0 30px 78px rgba(0,0,0,.35)"}}>
    <div style={{position: "absolute", left: 36, right: 36, top: 320, height: 86, border: "3px solid " + ACCENT, borderRadius: 14, background: "rgba(239,107,66,.12)"}} />
    {list.map((item, index) => {
      const distance = index - focus;
      const opacity = Math.max(0, 1 - Math.abs(distance) * 0.22);
      return <div key={item.id} style={{position: "absolute", left: 68, right: 68, top: 324 + distance * 86 - offset, height: 72, display: "flex", alignItems: "center", gap: 20, fontSize: 31, fontWeight: index === focus ? 900 : 650, opacity, transform: "scale(" + (index === focus ? 1.05 : 0.9) + ")"}}><span style={{width: 28, height: 28, borderRadius: 8, background: color(index)}} />{item.text}</div>;
    })}
  </div>;
};

const SegmentedHero = ({items, seconds}: RendererProps) => {
  const list = visible(items, 4);
  const p = ease(seconds / 0.85);
  const selected = Math.min(Math.max(0, list.length - 1), Math.floor(p * Math.max(1, list.length)));
  return <div style={{position: "absolute", left: 300, top: 220, width: 1320, height: 640, borderRadius: 30, background: "linear-gradient(135deg, #27363b, #172126)", overflow: "hidden"}}>
    <div style={{position: "absolute", inset: 0, background: "radial-gradient(circle at " + (24 + p * 52) + "% 52%, rgba(239,107,66,.55), transparent 32%)"}} />
    <div style={{position: "absolute", left: 100, top: 180, width: 670, color: INK, fontSize: 68, fontWeight: 950, lineHeight: 1.05, transform: "translateY(" + ((1 - p) * 80) + "px)"}}>{copy(list, selected, "重点功能")}</div>
    <div style={{position: "absolute", right: 110, top: 130, width: 310, height: 310, borderRadius: "50%", background: "#ecf1f1", border: "18px solid " + color(selected), transform: "rotate(" + (p * 220) + "deg) scale(" + (0.72 + p * 0.28) + ")"}} />
    <div style={{position: "absolute", left: 100, right: 100, bottom: 84, height: 80, display: "flex", gap: 10}}>{list.map((item, index) => <div key={item.id} style={{flex: 1, borderRadius: 14, background: index === selected ? ACCENT : "rgba(255,255,255,.16)", color: index === selected ? "#182126" : INK, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, transform: "translateY(" + (index === selected ? -12 : 0) + "px)"}}>{item.text}</div>)}</div>
  </div>;
};

const ThemeToggle = ({items, seconds}: RendererProps) => {
  const p = ease(seconds / 0.9);
  return <><div style={{position: "absolute", inset: 0, background: "#edf0ed", clipPath: "inset(0 " + ((1 - p) * 100) + "% 0 0)"}} />
  <div style={{position: "absolute", left: 620, top: 260, width: 680, height: 480, borderRadius: 34, background: p > 0.52 ? "#f4f4ef" : "#182128", border: "3px solid " + (p > 0.52 ? "#cbd0cb" : LINE), color: p > 0.52 ? "#172126" : INK}}>
    <div style={{position: "absolute", left: 80, top: 90, fontSize: 52, fontWeight: 950}}>{copy(items, 0, "主题切换")}</div>
    <div style={{position: "absolute", left: 80, bottom: 92, width: 240, height: 104, borderRadius: 52, background: p > 0.52 ? "#ced6d4" : "#334149"}}><span style={{position: "absolute", left: 12 + p * 120, top: 12, width: 80, height: 80, borderRadius: "50%", background: p > 0.52 ? "#fff5ce" : ACCENT, boxShadow: "0 0 28px rgba(239,107,66,.6)"}} /></div>
  </div></>;
};

const PaletteRipple = ({items, seconds}: RendererProps) => {
  const p = ease(seconds / 0.9);
  return <>{Array.from({length: 5}).map((_, index) => {
    const q = clamp((p - index * 0.1) / 0.7);
    return <div key={index} style={{position: "absolute", left: 960, top: 540, width: 120 + q * (400 + index * 160), height: 120 + q * (400 + index * 160), borderRadius: "50%", border: "6px solid " + color(index), opacity: (1 - q) * 0.75, transform: "translate(-50%,-50%)"}} />;
  })}<div style={{position: "absolute", left: 690, top: 375, width: 540, height: 330, borderRadius: 28, background: "#202d33", border: "2px solid " + LINE, padding: 42, boxSizing: "border-box"}}><div style={{fontSize: 38, fontWeight: 900, color: INK, marginBottom: 50}}>{copy(items, 0, "颜色系统")}</div><div style={{display: "flex", gap: 18}}>{visible(items.slice(1), 5).map((item, index) => <div key={item.id} title={item.text} style={{width: 70, height: 70, borderRadius: "50%", background: color(index + 1), opacity: progress(item, seconds), transform: "scale(" + (0.55 + progress(item, seconds) * 0.45) + ")"}} />)}</div></div></>;
};

const TypeAndFilter = ({items, seconds}: RendererProps) => {
  const p = ease(seconds / 0.7);
  const query = copy(items, 0, "搜索");
  return <><div style={{position: "absolute", left: 430, top: 190, width: 1060, height: 100, borderRadius: 18, background: "#f0f3f3", color: "#192429", display: "flex", alignItems: "center", padding: "0 34px", boxSizing: "border-box", fontSize: 34, fontWeight: 800}}><span style={{color: ACCENT, marginRight: 22}}>⌕</span>{query.slice(0, Math.floor(query.length * p))}<span style={{opacity: Math.floor(seconds * 5) % 2 ? 1 : 0}}>│</span></div>
  {visible(items.slice(1), 6).map((item, index) => {
    const q = progress(item, seconds);
    const filtered = q > 0.95 && index % 3 === 2;
    return <div key={item.id} style={{position: "absolute", left: 480, right: 480, top: 350 + index * 82, height: 62, borderRadius: 12, background: "#26353b", color: INK, padding: "0 24px", boxSizing: "border-box", display: "flex", alignItems: "center", fontSize: 25, fontWeight: 700, opacity: filtered ? 0.13 : q, transform: "translateX(" + (filtered ? 180 : (1 - q) * 100) + "px)"}}>{item.text}<span style={{marginLeft: "auto", color: filtered ? "#aeb9ba" : color(index)}}>{filtered ? "已隐藏" : "匹配"}</span></div>;
  })}</>;
};

const AvatarCarousel = ({items, seconds}: RendererProps) => {
  const list = visible(items, 6);
  const p = ease(seconds / 0.85);
  return <><div style={{position: "absolute", left: 250, top: 300, width: 1420, height: 440, borderTop: "6px solid " + ACCENT, borderBottom: "6px solid " + ACCENT, borderRadius: 34, opacity: p}} />
  {list.map((item, index) => {
    const x = 340 + index * (1240 / Math.max(1, list.length - 1));
    const q = progress(item, seconds);
    return <div key={item.id} style={{position: "absolute", left: x - 72, top: 440 + Math.sin(seconds * 2.6 + index) * 28, width: 144, height: 144, borderRadius: "50%", background: color(index), border: "8px solid #142126", boxShadow: "0 0 0 " + (12 * q) + "px rgba(255,255,255,.18)", opacity: q, transform: "scale(" + (0.42 + q * 0.58) + ")"}}><div style={{position: "absolute", left: -90, width: 320, top: 174, textAlign: "center", color: INK, fontSize: 22, fontWeight: 800}}>{item.text}</div></div>;
  })}</>;
};

const BezierConverge = ({items, seconds}: RendererProps) => {
  const list = visible(items, 7);
  return <><svg width={WIDTH} height={HEIGHT} style={{position: "absolute", inset: 0}}>{list.map((item, index) => {
    const p = progress(item, seconds);
    const sx = 220 + (index % 4) * 500;
    const sy = index < 4 ? 240 : 790;
    return <g key={item.id}><path d={"M " + sx + " " + sy + " C " + sx + " 540 960 540 960 540"} fill="none" stroke={color(index)} strokeWidth="5" strokeDasharray="1300" strokeDashoffset={1300 * (1 - p)} opacity={p * 0.8} /><circle cx={sx + (960 - sx) * p} cy={sy + (540 - sy) * p} r="18" fill={color(index)} /></g>;
  })}</svg><div style={{position: "absolute", left: 810, top: 390, width: 300, height: 300, borderRadius: "50%", background: "#26353b", border: "6px solid " + ACCENT, color: INK, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 38, boxSizing: "border-box", fontSize: 32, fontWeight: 950}}>{copy(items, 0, "汇聚")}</div></>;
};

const StackedCards = ({items, seconds}: RendererProps) => <>{visible(items, 6).map((item, index) => {
  const p = progress(item, seconds);
  return <Card key={item.id} item={item} p={p} index={index} x={560 + index * 70} y={620 - index * 58} width={620} height={280} transform={"translate3d(" + ((1 - p) * -360) + "px," + ((1 - p) * 190) + "px,0) rotate(" + ((index - 2.5) * 3 + (1 - p) * -14) + "deg)"} />;
})}</>;

const Carousel3D = ({items, seconds}: RendererProps) => {
  const list = visible(items, 7);
  return <>{list.map((item, index) => {
    const angle = index / Math.max(1, list.length) * Math.PI * 2 + seconds * 0.7;
    const depth = (Math.cos(angle) + 1) / 2;
    const p = progress(item, seconds);
    return <Card key={item.id} item={item} p={p * (0.35 + depth * 0.65)} index={index} x={960 + Math.sin(angle) * 560 - 170} y={510 + Math.cos(angle) * 85 - 105} width={340} height={210} transform={"perspective(900px) rotateY(" + (Math.sin(angle) * -38) + "deg) scale(" + (0.58 + depth * 0.48) + ")"} />;
  })}</>;
};

const ClonerEcho = ({items, seconds}: RendererProps) => <>{visible(items, 5).map((item, index) => {
  const p = progress(item, seconds);
  return <div key={item.id}>{[3, 2, 1].map((echo) => <div key={echo} style={{position: "absolute", left: 550 + index * 82 - echo * 40, top: 270 + index * 66 - echo * 28, width: 600, height: 150, borderRadius: 22, background: color(index), opacity: p * (0.08 + echo * 0.06), transform: "scale(" + (0.8 + p * 0.2) + ")"}} />)}<Card item={item} p={p} index={index} x={550 + index * 82} y={270 + index * 66} width={600} height={150} transform={"translateX(" + ((1 - p) * -280) + "px)"} /></div>;
})}</>;

const DeckDeal = ({items, seconds}: RendererProps) => <><div style={{position: "absolute", left: 810, top: 360, width: 300, height: 390, borderRadius: 22, background: "#283941", border: "4px solid " + ACCENT, transform: "rotate(-8deg)"}}><div style={{position: "absolute", inset: 22, border: "2px dashed " + CYAN, borderRadius: 14}} /></div>{visible(items, 6).map((item, index) => {
  const p = progress(item, seconds);
  const x = 260 + (index % 3) * 560;
  const y = index < 3 ? 170 : 640;
  return <Card key={item.id} item={item} p={p} index={index} x={x} y={y} width={360} height={190} transform={"translate3d(" + ((1 - p) * (960 - (x + 180))) + "px," + ((1 - p) * (555 - (y + 95))) + "px,0) rotate(" + ((1 - p) * (index % 2 ? 28 : -28)) + "deg)"} />;
})}</>;

const DocPills = ({items, seconds}: RendererProps) => <><div style={{position: "absolute", left: 210, top: 170, width: 670, height: 740, borderRadius: 24, background: "#ebeee8", color: "#1a2325", padding: 56, boxSizing: "border-box", boxShadow: "0 24px 70px rgba(0,0,0,.34)"}}><div style={{fontSize: 48, fontWeight: 950, marginBottom: 38}}>{copy(items, 0, "文档")}</div>{Array.from({length: 7}).map((_, index) => <div key={index} style={{height: 18, width: 420 - (index % 3) * 70, borderRadius: 9, background: index === 1 ? ACCENT : "#8e9997", marginBottom: 27, opacity: 0.68}} />)}</div>{visible(items.slice(1), 6).map((item, index) => {
  const p = progress(item, seconds);
  return <div key={item.id} style={{position: "absolute", left: 1010 + (index % 2) * 370, top: 260 + Math.floor(index / 2) * 170, minWidth: 280, height: 84, borderRadius: 42, background: index % 2 ? "#283940" : ACCENT, color: index % 2 ? INK : "#172126", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 28px", boxSizing: "border-box", fontSize: 23, fontWeight: 850, opacity: p, transform: "translateX(" + ((1 - p) * 420) + "px) rotate(" + ((1 - p) * (index % 2 ? 10 : -10)) + "deg)"}}>{item.text}</div>;
})}</>;

const SvgTrace = ({items, seconds}: RendererProps) => {
  const p = ease(seconds / 1.1);
  const path = "M 300 690 C 500 180 770 850 970 420 S 1410 180 1640 600";
  return <><svg width={WIDTH} height={HEIGHT} style={{position: "absolute", inset: 0}}><path d={path} fill="none" stroke={CYAN} strokeWidth="12" strokeLinecap="round" strokeDasharray="2200" strokeDashoffset={2200 * (1 - p)} /><path d={path} fill="none" stroke={ACCENT} strokeWidth="3" strokeDasharray="40 20" opacity={p} /></svg>{visible(items, 6).map((item, index) => {
    const q = progress(item, seconds);
    const x = 300 + index * 270;
    const y = 690 - Math.abs(Math.sin(index * 1.2)) * 370;
    return <div key={item.id} style={{position: "absolute", left: x - 85, top: y - 38, width: 170, minHeight: 76, borderRadius: 16, background: "#26343a", border: "2px solid " + color(index), color: INK, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 12, boxSizing: "border-box", fontSize: 20, fontWeight: 800, opacity: q, transform: "scale(" + (0.6 + q * 0.4) + ")"}}>{item.text}</div>;
  })}</>;
};

const ContactLift = ({items, seconds}: RendererProps) => <>{visible(items, 6).map((item, index) => {
  const p = progress(item, seconds);
  const x = 330 + (index % 3) * 440;
  const y = 315 + Math.floor(index / 3) * 290;
  const lift = p * (70 + (index % 2) * 24);
  return <div key={item.id}><div style={{position: "absolute", left: x + 35 - lift * 0.16, top: y + 210 + lift * 0.45, width: 340 + lift * 0.5, height: 46 + lift * 0.3, borderRadius: "50%", background: "rgba(0,0,0,.48)", filter: "blur(" + (18 + lift * 0.12) + "px)", opacity: p * 0.6}} /><Card item={item} p={p} index={index} x={x} y={y} width={360} height={210} transform={"translateY(" + (-lift) + "px) rotate(" + ((index % 2 ? 1 : -1) * lift * 0.05) + "deg)"} /></div>;
})}</>;

const GlossyPills = ({items, seconds}: RendererProps) => <>{visible(items, 8).map((item, index) => {
  const p = progress(item, seconds);
  const x = 260 + (index % 4) * 420;
  const y = 280 + Math.floor(index / 4) * 310 + Math.sin(seconds * 3.4 + index * 1.7) * 34;
  return <div key={item.id} style={{position: "absolute", left: x, top: y, minWidth: 270, height: 98, borderRadius: 49, padding: "0 36px", boxSizing: "border-box", display: "flex", alignItems: "center", background: "linear-gradient(135deg, rgba(255,255,255,.4), " + color(index) + ")", border: "2px solid rgba(255,255,255,.5)", color: "#172126", fontSize: 25, fontWeight: 900, boxShadow: "inset 0 2px 0 rgba(255,255,255,.55), 0 22px 38px rgba(0,0,0,.25)", opacity: p, transform: "translateY(" + ((1 - p) * 150) + "px) rotate(" + (Math.sin(index * 2) * 3) + "deg)"}}>{item.text}<span style={{position: "absolute", left: 22, top: 12, width: "45%", height: 12, borderRadius: 9, background: "rgba(255,255,255,.46)"}} /></div>;
})}</>;

const IntegrationHub = ({items, seconds}: RendererProps) => {
  const list = visible(items, 8);
  return <><svg width={WIDTH} height={HEIGHT} style={{position: "absolute", inset: 0}}>{list.map((item, index) => {
    const p = progress(item, seconds);
    const angle = index / Math.max(1, list.length) * Math.PI * 2 - Math.PI / 2;
    const x = 960 + Math.cos(angle) * 590;
    const y = 540 + Math.sin(angle) * 330;
    return <line key={item.id} x1="960" y1="540" x2={960 + (x - 960) * p} y2={540 + (y - 540) * p} stroke={color(index)} strokeWidth="5" opacity={p} />;
  })}</svg><div style={{position: "absolute", left: 780, top: 390, width: 360, height: 300, borderRadius: 36, background: "#26363c", border: "5px solid " + ACCENT, color: INK, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 44, boxSizing: "border-box", fontSize: 38, fontWeight: 950}}>{copy(items, 0, "集成中心")}</div>{list.map((item, index) => {
    const p = progress(item, seconds);
    const angle = index / Math.max(1, list.length) * Math.PI * 2 - Math.PI / 2;
    const x = 960 + Math.cos(angle) * 590;
    const y = 540 + Math.sin(angle) * 330;
    return <div key={item.id} style={{position: "absolute", left: x - 110, top: y - 46, width: 220, minHeight: 92, padding: 14, boxSizing: "border-box", borderRadius: 18, background: PANEL, border: "2px solid " + color(index), color: INK, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: 20, fontWeight: 800, opacity: p, transform: "scale(" + (0.55 + p * 0.45) + ")"}}>{item.text}</div>;
  })}</>;
};

const ListStackPress = ({items, seconds}: RendererProps) => <>{visible(items, 8).map((item, index) => {
  const p = progress(item, seconds);
  const compressed = Math.max(0, p - 0.68) / 0.32;
  return <div key={item.id} style={{position: "absolute", left: 410, right: 410, top: 230 + index * (92 - compressed * 38), height: 76, borderRadius: 16, background: index % 2 ? "#26343a" : "#202d33", border: "2px solid " + (index === 0 ? ACCENT : LINE), color: INK, display: "flex", alignItems: "center", padding: "0 28px", fontSize: 28, fontWeight: 800, opacity: p, transform: "translateY(" + ((1 - p) * -260) + "px) scaleY(" + (1 - compressed * 0.12) + ")"}}>{item.text}<span style={{marginLeft: "auto", color: color(index)}}>{String(index + 1).padStart(2, "0")}</span></div>;
})}</>;

const MorphPrimitive = ({items, seconds}: RendererProps) => {
  const p = ease(seconds / 0.9);
  return <><div style={{position: "absolute", left: 760 - p * 370, top: 330 - p * 120, width: 400 + p * 740, height: 400 + p * 240, borderRadius: (1 - p) * 200 + 28, background: "linear-gradient(135deg, " + ACCENT + ", #294049)", transform: "rotate(" + ((1 - p) * -38) + "deg)", opacity: 0.92}} />{visible(items, 5).map((item, index) => {
    const q = progress(item, seconds);
    return <Card key={item.id} item={item} p={q} index={index} x={430 + (index % 3) * 390} y={380 + Math.floor(index / 3) * 220} width={330} height={170} transform={"scale(" + (0.5 + q * 0.5) + ") rotate(" + ((1 - q) * (index - 2) * 20) + "deg)"} />;
  })}</>;
};

const NeonForerun = ({items, seconds}: RendererProps) => <>{visible(items, 5).map((item, index) => {
  const p = progress(item, seconds);
  const x = 390 + (index % 2) * 590;
  const y = 230 + Math.floor(index / 2) * 260;
  const runner = clamp(p * 1.35 - 0.08);
  return <div key={item.id}><div style={{position: "absolute", left: x - 14, top: y - 14, width: 470, height: 218, borderRadius: 26, border: "5px solid " + color(index), opacity: runner, clipPath: "inset(0 " + ((1 - runner) * 100) + "% 0 0)", boxShadow: "0 0 28px " + color(index)}} /><Card item={item} p={clamp((p - 0.24) / 0.76)} index={index} x={x} y={y} width={440} height={190} transform={"translateY(" + ((1 - p) * 70) + "px)"} tint={color(index)} /></div>;
})}</>;

const NeonOrbitDrop = ({items, seconds}: RendererProps) => <>{visible(items, 5).map((item, index) => {
  const p = progress(item, seconds);
  const x = 380 + (index % 3) * 470;
  const y = 350 + Math.floor(index / 3) * 270;
  const angle = (1 - p) * (160 + index * 37);
  return <div key={item.id}><div style={{position: "absolute", left: x + 160 + Math.cos(angle * Math.PI / 180) * (1 - p) * 220, top: y - 80 + Math.sin(angle * Math.PI / 180) * (1 - p) * 170, width: 42, height: 42, borderRadius: "50%", background: color(index), boxShadow: "0 0 38px " + color(index), opacity: p}} /><Card item={item} p={p} index={index} x={x} y={y} width={360} height={190} transform={"translateY(" + ((1 - p) * -260) + "px) rotateX(" + ((1 - p) * 64) + "deg)"} tint={color(index)} /></div>;
})}</>;

const WaterfallWall = ({items, seconds}: RendererProps) => <><div style={{position: "absolute", left: 220, top: 140, right: 220, bottom: 110, overflow: "hidden", border: "2px solid " + LINE, borderRadius: 26}}>{visible(items, 9).map((item, index) => {
  const p = progress(item, seconds);
  const lane = index % 3;
  return <div key={item.id} style={{position: "absolute", left: 80 + lane * 520, top: -180 + index * 165 + seconds * (80 + lane * 18), width: 420, height: 130, borderRadius: 18, background: index % 2 ? "#26353b" : "#1d292f", border: "2px solid " + color(index), color: INK, padding: 24, boxSizing: "border-box", fontSize: 25, fontWeight: 800, opacity: p, transform: "rotate(" + ((lane - 1) * 2) + "deg)"}}>{item.text}</div>;
})}</div><div style={{position: "absolute", left: 220, right: 220, top: 125, height: 90, background: "linear-gradient(#10171b, transparent)"}} /></>;

const TapeSlap = ({items, seconds}: RendererProps) => <>{visible(items, 6).map((item, index) => {
  const p = progress(item, seconds);
  const x = 310 + (index % 3) * 465;
  const y = 270 + Math.floor(index / 3) * 300;
  return <div key={item.id}><Card item={item} p={p} index={index} x={x} y={y} width={390} height={220} transform={"rotate(" + ((index % 2 ? 1 : -1) * 2) + "deg) scale(" + (0.9 + p * 0.1) + ")"} /><div style={{position: "absolute", left: x + 92, top: y - 22, width: 210, height: 48, background: "#d6c58f", border: "1px solid #b8a86e", opacity: p, transform: "rotate(" + ((index % 2 ? 1 : -1) * 13 + (1 - p) * 68) + "deg) scaleX(" + p + ")", transformOrigin: "left center", boxShadow: "0 4px 8px rgba(0,0,0,.2)"}} /></div>;
})}</>;

const PopupBook = ({items, seconds}: RendererProps) => <>{visible(items, 6).map((item, index) => {
  const p = progress(item, seconds);
  return <Card key={item.id} item={item} p={p} index={index} x={310 + (index % 3) * 445} y={250 + Math.floor(index / 3) * 310} width={370} height={230} transform={"perspective(900px) rotateX(" + ((1 - p) * -88) + "deg) translateY(" + ((1 - p) * 70) + "px)"} />;
})}</>;

const ProductAssemble = ({items, seconds}: RendererProps) => <div style={{position: "absolute", left: 570, top: 200, width: 780, height: 660, borderRadius: 30, background: PANEL, border: "3px solid " + LINE, boxShadow: "0 30px 70px rgba(0,0,0,.35)"}}><div style={{position: "absolute", left: 48, top: 46, width: 280, height: 42, borderRadius: 10, background: ACCENT, opacity: items[0] ? progress(items[0], seconds) : 1}} />{visible(items, 6).map((item, index) => {
  const p = progress(item, seconds);
  return <div key={item.id} style={{position: "absolute", left: 48 + (index % 2) * 370, top: 150 + Math.floor(index / 2) * 145, width: 310, height: 104, borderRadius: 16, background: "#293941", border: "2px solid " + color(index), color: INK, display: "flex", alignItems: "center", padding: 20, boxSizing: "border-box", fontSize: 22, fontWeight: 800, opacity: p, transform: "translate(" + ((1 - p) * (index % 2 ? 220 : -220)) + "px," + ((1 - p) * (index - 2) * 45) + "px) scale(" + (0.75 + p * 0.25) + ")"}}>{item.text}</div>;
})}</div>;

const RadialWave = ({items, seconds}: RendererProps) => {
  const p = ease(seconds / 0.9);
  return <><div style={{position: "absolute", left: 690, top: 390, width: 540, height: 300, borderRadius: 30, background: "rgba(16,23,27,.76)", border: "2px solid " + LINE, color: INK, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 900, textAlign: "center", padding: 52, boxSizing: "border-box"}}>{copy(items, 0, "波纹扩散")}</div>{Array.from({length: 153}).map((_, index) => {
    const col = index % 17;
    const row = Math.floor(index / 17);
    const distance = Math.hypot(col - 8, row - 4);
    const q = clamp((p * 9 - distance) / 1.8);
    return <span key={index} style={{position: "absolute", left: 270 + col * 86, top: 180 + row * 90, width: 12, height: 12, borderRadius: "50%", background: distance < p * 9 ? color((col + row) % COLORS.length) : "#3a4a50", opacity: 0.2 + q * 0.8, transform: "scale(" + (0.5 + q * 1.9) + ")"}} />;
  })}</>;
};

const ResearchStack = ({items, seconds}: RendererProps) => <>{visible(items, 6).map((item, index) => {
  const p = progress(item, seconds);
  return <Card key={item.id} item={item} p={p} index={index} x={570 + index * 16} y={190 + index * 72 + Math.max(0, seconds - item.at) * 64} width={700} height={230} transform={"translateY(" + ((1 - p) * 360) + "px) rotate(" + ((index % 2 ? 1 : -1) * 1.4) + "deg)"} />;
})}<div style={{position: "absolute", right: 280, top: 170, bottom: 140, width: 8, borderRadius: 5, background: LINE}}><div style={{width: 8, height: 180, borderRadius: 5, background: ACCENT, transform: "translateY(" + (Math.min(1, seconds / 3) * 460) + "px)"}} /></div></>;

const RowEmbed = ({items, seconds}: RendererProps) => <div style={{position: "absolute", left: 340, top: 150, width: 1240, height: 790, borderRadius: 26, background: "#eef0eb", color: "#172126", padding: 64, boxSizing: "border-box", boxShadow: "0 32px 80px rgba(0,0,0,.34)"}}><div style={{fontSize: 50, fontWeight: 950, marginBottom: 46}}>{copy(items, 0, "详情页")}</div>{visible(items.slice(1), 7).map((item, index) => {
  const p = progress(item, seconds);
  return <div key={item.id} style={{position: "absolute", left: 64, right: 64, top: 170 + index * 78, height: 60, borderRadius: 10, background: "#d7dfdd", opacity: p, transform: "translateX(" + ((1 - p) * (index % 2 ? 420 : -420)) + "px) scaleX(" + (0.8 + p * 0.2) + ")", transformOrigin: index % 2 ? "right center" : "left center", display: "flex", alignItems: "center", padding: "0 22px", boxSizing: "border-box", fontSize: 23, fontWeight: 800}}>{item.text}<span style={{marginLeft: "auto", color: ACCENT}}>嵌入</span></div>;
})}</div>;

const Runway = ({items, seconds}: RendererProps) => <><div style={{position: "absolute", left: 0, right: 0, bottom: 0, height: 600, backgroundImage: "linear-gradient(rgba(138,211,223,.24) 2px, transparent 2px), linear-gradient(90deg, rgba(138,211,223,.24) 2px, transparent 2px)", backgroundSize: "140px 96px", transform: "perspective(800px) rotateX(63deg) translateY(250px)", transformOrigin: "bottom center"}} />{visible(items, 6).map((item, index) => {
  const p = progress(item, seconds);
  return <Card key={item.id} item={item} p={p} index={index} x={300 + (index % 3) * 530} y={430 + Math.floor(index / 3) * 190} width={390} height={180} transform={"perspective(900px) rotateX(55deg) translateY(" + ((1 - p) * -660) + "px) scale(" + (0.72 + p * 0.28) + ")"} />;
})}</>;

const Skeleton = ({items, seconds}: RendererProps) => <>{visible(items, 6).map((item, index) => {
  const p = progress(item, seconds);
  const done = p > 0.75;
  return <div key={item.id} style={{position: "absolute", left: 330 + (index % 3) * 430, top: 290 + Math.floor(index / 3) * 260, width: 360, height: 200, borderRadius: 20, background: done ? PANEL : "transparent", border: "3px dashed " + color(index), opacity: p, transform: "rotate(" + ((1 - p) * (index % 2 ? 5 : -5)) + "deg)"}}><div style={{position: "absolute", left: 26, right: 90, top: 34, height: 18, borderRadius: 10, background: done ? color(index) : "transparent", border: done ? "none" : "2px solid " + color(index)}} /><div style={{position: "absolute", left: 26, right: 32, top: 78, height: 12, borderRadius: 7, background: done ? LINE : "transparent", border: done ? "none" : "2px solid " + LINE}} />{done ? <div style={{position: "absolute", left: 26, bottom: 28, color: INK, fontSize: 22, fontWeight: 800, opacity: (p - 0.65) / 0.35}}>{item.text}</div> : null}</div>;
})}</>;

const ShapeMorph = ({items, seconds}: RendererProps) => {
  const p = ease(seconds / 1.1);
  const path = p < 0.5 ? "M 960 260 C 1220 260 1320 420 1180 560 C 1320 730 1130 850 960 760 C 760 890 590 720 730 560 C 570 380 720 230 960 260 Z" : "M 960 210 L 1230 430 L 1140 790 L 780 790 L 690 430 Z";
  return <><svg width={WIDTH} height={HEIGHT} style={{position: "absolute", inset: 0}}><path d={path} fill="rgba(138,211,223,.18)" stroke={p < 0.5 ? ACCENT : CYAN} strokeWidth="12" transform={"rotate(" + (p * 24) + " 960 540) scale(" + (0.82 + p * 0.18) + ")"} /></svg>{visible(items, 5).map((item, index) => {
    const angle = index / 5 * Math.PI * 2 - Math.PI / 2;
    const q = progress(item, seconds);
    return <div key={item.id} style={{position: "absolute", left: 960 + Math.cos(angle) * 510 - 105, top: 540 + Math.sin(angle) * 320 - 42, width: 210, minHeight: 84, borderRadius: 16, background: PANEL, border: "2px solid " + color(index), color: INK, textAlign: "center", padding: 14, boxSizing: "border-box", fontSize: 21, fontWeight: 800, opacity: q, transform: "scale(" + (0.45 + q * 0.55) + ")"}}>{item.text}</div>;
  })}</>;
};

const ValueGradient = ({items, seconds}: RendererProps) => {
  const count = Math.max(8, Math.min(16, items.length * 2 || 12));
  return <div style={{position: "absolute", left: 260, right: 260, bottom: 190, height: 570, display: "flex", alignItems: "flex-end", gap: 24}}>{Array.from({length: count}).map((_, index) => {
    const item = items[index % Math.max(1, items.length)];
    const p = item ? progress(item, seconds - index * 0.045, 0.52) : ease(seconds / 0.7 - index * 0.045);
    const height = 90 + (1 - Math.abs(index - (count - 1) / 2) / count) * 390 * p;
    return <div key={index} style={{position: "relative", flex: 1, height, borderRadius: "18px 18px 4px 4px", background: "linear-gradient(180deg, " + color(index) + ", #273940)", opacity: 0.28 + p * 0.72, transform: "translateY(" + ((1 - p) * 170) + "px)"}}><div style={{position: "absolute", bottom: -44, width: "100%", color: INK, fontSize: 18, textAlign: "center", opacity: p}}>{item?.text.slice(0, 4)}</div></div>;
  })}</div>;
};

const Bento = ({items, seconds}: RendererProps) => <>{Array.from({length: 6}).map((_, index) => {
  const item = items[index % Math.max(1, items.length)];
  const p = item ? progress(item, seconds - index * 0.11, 0.38) : 0;
  return <div key={index} style={{position: "absolute", left: 230 + (index % 3) * 500, top: 245 + Math.floor(index / 3) * 310, width: 440, height: 260, borderRadius: 24, background: p > 0.5 ? "#26363b" : "#172126", border: "3px solid " + (p > 0.1 ? color(index) : LINE), boxShadow: "0 0 " + (p * 42) + "px " + color(index), opacity: 0.25 + p * 0.75, transform: "translateY(" + ((1 - p) * 70) + "px)"}}><div style={{position: "absolute", left: 30, top: 28, width: 72, height: 14, borderRadius: 7, background: color(index)}} /><div style={{position: "absolute", left: 30, right: 30, bottom: 34, color: INK, fontSize: 29, fontWeight: 850}}>{item?.text ?? "区块 " + (index + 1)}</div></div>;
})}</>;

const GridWave = ({items, seconds}: RendererProps) => <>{Array.from({length: 9}).map((_, index) => {
  const item = items[index % Math.max(1, items.length)];
  const row = Math.floor(index / 3);
  const col = index % 3;
  const p = item ? progress(item, seconds - (row + col) * 0.09, 0.5) : 0;
  return <div key={index} style={{position: "absolute", left: 280 + col * 470, top: 190 + row * 255, width: 420, height: 210, perspective: 900}}><div style={{position: "absolute", inset: 0, borderRadius: 20, background: p > 0.52 ? "#26373c" : color(index), border: "3px solid " + color(index), color: INK, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24, boxSizing: "border-box", fontSize: 24, fontWeight: 850, transform: "rotateY(" + ((1 - p) * 180) + "deg)", opacity: p}}>{item?.text ?? "网格 " + (index + 1)}</div></div>;
})}</>;

const Wireframe = ({items, seconds}: RendererProps) => {
  const p = ease(seconds / 1.05);
  return <><svg width={WIDTH} height={HEIGHT} style={{position: "absolute", inset: 0}}><rect x="170" y="130" width="1580" height="820" rx="34" fill="rgba(13,23,28,.42)" stroke={CYAN} strokeWidth="7" strokeDasharray="4300" strokeDashoffset={4300 * (1 - p)} /><line x1="450" y1="130" x2="450" y2="950" stroke={CYAN} strokeWidth="6" strokeDasharray="850" strokeDashoffset={850 * (1 - p)} /><line x1="450" y1="300" x2="1750" y2="300" stroke={CYAN} strokeWidth="6" strokeDasharray="1300" strokeDashoffset={1300 * (1 - p)} />{Array.from({length: 6}).map((_, index) => <rect key={index} x={520 + (index % 3) * 390} y={370 + Math.floor(index / 3) * 250} width="330" height="180" rx="18" fill="none" stroke={color(index)} strokeWidth="5" strokeDasharray="1050" strokeDashoffset={1050 * (1 - clamp((p - index * 0.06) / 0.7))} />)}</svg><div style={{position: "absolute", left: 170 + p * 1580, top: 130, width: 8, height: 820, background: "#fff", boxShadow: "0 0 35px 16px " + ACCENT, opacity: Math.sin(p * Math.PI)}} />{visible(items, 6).map((item, index) => <div key={item.id} style={{position: "absolute", left: 550 + (index % 3) * 390, top: 420 + Math.floor(index / 3) * 250, width: 270, color: INK, fontSize: 23, fontWeight: 800, textAlign: "center", opacity: progress(item, seconds)}}>{item.text}</div>)}</>;
};

const SpotlightHero = ({items, seconds}: RendererProps) => {
  const p = ease(seconds / 0.85);
  const sx = 20 + p * 55;
  const sy = 18 + Math.sin(p * Math.PI) * 42;
  return <><div style={{position: "absolute", inset: 0, background: "radial-gradient(ellipse at " + sx + "% " + sy + "%, rgba(255,250,225,.95), rgba(239,107,66,.25) 15%, transparent 48%)", opacity: p}} /><Card item={{id: "hero", text: copy(items, 0, "核心卡片"), at: 0}} p={p} index={0} x={600} y={270} width={720} height={420} transform={"translateY(" + ((1 - p) * 200) + "px) scale(" + (0.7 + p * 0.3) + ")"} tint={ACCENT} /></>;
};

const Magician = ({items, seconds}: RendererProps) => {
  const p = ease(seconds / 0.84);
  return <>{Array.from({length: 18}).map((_, index) => {
    const angle = index / 18 * Math.PI * 2;
    const radius = p * 520;
    return <div key={index} style={{position: "absolute", left: 960 + Math.cos(angle) * radius, top: 520 + Math.sin(angle) * radius, width: 8 + (index % 3) * 5, height: 80 + (index % 4) * 30, background: index % 2 ? ACCENT : CYAN, opacity: (1 - p) * 0.8, transform: "rotate(" + (angle * 180 / Math.PI + 90) + "deg)", transformOrigin: "0 0"}} />;
  })}<Card item={{id: "magic", text: copy(items, 0, "魔术卡片"), at: 0}} p={p} index={0} x={715} y={170} width={490} height={740} transform={"perspective(950px) rotateY(" + ((1 - p) * 1080) + "deg) rotateZ(" + ((1 - p) * -20) + "deg) scale(" + (0.58 + p * 0.42) + ")"} tint={ACCENT} /></>;
};

const OutroGroup = ({items, seconds}: RendererProps) => {
  const p = ease(seconds / 1);
  return <><div style={{position: "absolute", left: 560, top: 265, width: 800, height: 500, borderRadius: 32, background: "#293a40", border: "3px solid " + LINE, opacity: 1 - p * 0.55, transform: "scale(" + (1 - p * 0.18) + ")"}}>{visible(items, 7).map((item, index) => {
    const angle = index / 7 * Math.PI * 2;
    const x = 400 + Math.cos(angle) * 230 * p;
    const y = 250 + Math.sin(angle) * 150 * p;
    return <div key={item.id} style={{position: "absolute", left: x - 54, top: y - 54, width: 108, height: 108, borderRadius: "50%", background: color(index), border: "5px solid #172126", color: "#172126", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, opacity: p, transform: "translate(" + (Math.cos(angle) * p * 410) + "px," + (Math.sin(angle) * p * 320) + "px) scale(" + (0.6 + p * 0.4) + ")"}}>{item.text.slice(0, 3)}</div>;
  })}</div><div style={{position: "absolute", left: 0, right: 0, bottom: 100, textAlign: "center", color: INK, fontSize: 48, fontWeight: 950, opacity: p}}>{copy(items, 0, "一起出发")}</div></>;
};

const StripAway = ({items, seconds}: RendererProps) => <>{visible(items, 6).map((item, index) => {
  const p = progress(item, seconds);
  const dx = (index % 2 ? 1 : -1) * p * 850;
  const dy = (index % 3 - 1) * p * 170;
  return <div key={item.id} style={{position: "absolute", left: index % 2 ? 980 : 200, top: 180 + Math.floor(index / 2) * 240, width: 720, height: 180, borderRadius: 20, background: "#26363b", border: "2px solid " + color(index), color: INK, display: "flex", alignItems: "center", padding: 32, boxSizing: "border-box", fontSize: 30, fontWeight: 850, opacity: 1 - p * 0.76, transform: "translate(" + dx + "px," + dy + "px) rotate(" + ((index % 2 ? 1 : -1) * p * 9) + "deg)"}}>{item.text}</div>;
})}<div style={{position: "absolute", left: 780, top: 440, width: 360, height: 200, borderRadius: 30, background: ACCENT, color: "#172126", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, fontWeight: 950, opacity: ease(seconds / 1.4)}}>{copy(items, 0, "品牌")}</div></>;

const IconBloom = ({items, seconds}: RendererProps) => <>{visible(items, 8).map((item, index) => {
  const p = progress(item, seconds);
  return <div key={item.id} style={{position: "absolute", left: 300 + (index % 4) * 420, top: 280 + Math.floor(index / 4) * 310, width: 300, height: 210, perspective: 700}}><div style={{position: "absolute", inset: 0, borderRadius: 28, background: p > 0.52 ? color(index) : "#27363b", border: "3px solid " + color(index), color: p > 0.52 ? "#172126" : INK, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 22, boxSizing: "border-box", fontSize: 24, fontWeight: 900, transform: "rotateY(" + ((1 - p) * 180) + "deg) scale(" + (1 + Math.sin(p * Math.PI) * 0.12) + ")"}}>{item.text}</div><div style={{position: "absolute", left: 150, top: 105, width: 80 + p * 180, height: 80 + p * 180, borderRadius: "50%", border: "3px solid " + color(index), opacity: (1 - p) * 0.7, transform: "translate(-50%,-50%)"}} /></div>;
})}</>;

const InputMorph = ({items, seconds}: RendererProps) => {
  const p = ease(seconds / 0.9);
  const text = copy(items, 0, "输入想法");
  return <><div style={{position: "absolute", left: 360 - p * 70, top: 390 - p * 80, width: 1200 + p * 140, height: 150 + p * 190, borderRadius: 24 + p * 160, background: p > 0.58 ? "linear-gradient(135deg, " + ACCENT + ", " + CYAN + ")" : "#eff2f1", border: "3px solid " + (p > 0.58 ? ACCENT : "#aab5b6"), color: "#172126", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38 + p * 24, fontWeight: 950, transform: "rotate(" + (p * 8) + "deg)", boxShadow: "0 25px 70px rgba(0,0,0,.32)"}}>{p > 0.58 ? "✦" : text.slice(0, Math.floor(text.length * p))}</div></>;
};

const sceneFor = (style: ShowcaseStyle, props: RendererProps): ReactNode => {
  switch (style) {
    case "ai-stream-response": return <StreamResponse {...props} />;
    case "autolayout-gap-dial": return <GapDial {...props} />;
    case "panel-to-canvas": return <PanelToCanvas {...props} />;
    case "diagram-cascade": return <DiagramCascade {...props} />;
    case "chip-grid-single-select-blackout": return <ChipGrid {...props} />;
    case "chip-lift-to-user-pill": return <ChipLift {...props} />;
    case "dialogue-duet": return <DialogueDuet {...props} />;
    case "cast-ensemble": return <CursorCast {...props} />;
    case "command-palette-summon": return <CommandPalette {...props} />;
    case "glass-pill-dictation-typing": return <DictationPill {...props} />;
    case "hashtag-to-pill-materialize": return <HashtagPill {...props} />;
    case "cursor-performance": return <CursorPerformance {...props} />;
    case "keycap-smash-cut": return <KeycapSmash {...props} />;
    case "picker-carousel-feature-cycle": return <PickerCarousel {...props} />;
    case "segmented-thumb-hero": return <SegmentedHero {...props} />;
    case "theme-sweep-toggle": return <ThemeToggle {...props} />;
    case "palette-theme-ripple": return <PaletteRipple {...props} />;
    case "type-and-filter": return <TypeAndFilter {...props} />;
    case "avatar-bracket-carousel": return <AvatarCarousel {...props} />;
    case "bezier-source-converge-merge": return <BezierConverge {...props} />;
    case "card-stack": return <StackedCards {...props} />;
    case "carousel-3d": return <Carousel3D {...props} />;
    case "cloner-depth-echo": return <ClonerEcho {...props} />;
    case "deck-deal-flyin": return <DeckDeal {...props} />;
    case "doc-park-left-pill-deal": return <DocPills {...props} />;
    case "draw-svg-trace": return <SvgTrace {...props} />;
    case "axial-stretch": return <AxialStretch {...props} />;
    case "contact-shadow-lift": return <ContactLift {...props} />;
    case "floating-glossy-label-pills": return <GlossyPills {...props} />;
    case "integration-hub-map": return <IntegrationHub {...props} />;
    case "list-reveal": return <ListReveal {...props} />;
    case "list-stack-press": return <ListStackPress {...props} />;
    case "morph-from-primitive": return <MorphPrimitive {...props} />;
    case "neon-frame-forerun": return <NeonForerun {...props} />;
    case "neon-frame-orbit-drop": return <NeonOrbitDrop {...props} />;
    case "page-waterfall-wall": return <WaterfallWall {...props} />;
    case "masking-tape-slap": return <TapeSlap {...props} />;
    case "popup-book-rise": return <PopupBook {...props} />;
    case "product-card-progressive-assemble": return <ProductAssemble {...props} />;
    case "radial-wave": return <RadialWave {...props} />;
    case "research-card-stack-scroll": return <ResearchStack {...props} />;
    case "row-embed": return <RowEmbed {...props} />;
    case "runway-ground-skim": return <Runway {...props} />;
    case "skeleton-reveal": return <Skeleton {...props} />;
    case "svg-shape-morph": return <ShapeMorph {...props} />;
    case "value-stagger-gradient": return <ValueGradient {...props} />;
    case "bento-light-up": return <Bento {...props} />;
    case "grid-wave-flip": return <GridWave {...props} />;
    case "wireframe-draw-on": return <Wireframe {...props} />;
    case "spotlight-hero-card": return <SpotlightHero {...props} />;
    case "magician-card-flourish": return <Magician {...props} />;
    case "outro-group-photo-launch": return <OutroGroup {...props} />;
    case "ui-strip-away-outro": return <StripAway {...props} />;
    case "icon-flip-bloom": return <IconBloom {...props} />;
    case "input-morph-assemble": return <InputMorph {...props} />;
  }
};

const makeRenderer = (style: ShowcaseStyle): ShowcaseRenderer => (props) => sceneFor(style, props);

/**
 * Explicit one-to-one group dispatch. Each entry is a distinct renderer
 * closure and reaches a named scene above; unknown styles deliberately fail.
 */
export const SHOWCASE_STYLE_RENDERERS: Readonly<Record<ShowcaseStyle, ShowcaseRenderer>> = {
  "ai-stream-response": makeRenderer("ai-stream-response"),
  "autolayout-gap-dial": makeRenderer("autolayout-gap-dial"),
  "panel-to-canvas": makeRenderer("panel-to-canvas"),
  "diagram-cascade": makeRenderer("diagram-cascade"),
  "chip-grid-single-select-blackout": makeRenderer("chip-grid-single-select-blackout"),
  "chip-lift-to-user-pill": makeRenderer("chip-lift-to-user-pill"),
  "dialogue-duet": makeRenderer("dialogue-duet"),
  "cast-ensemble": makeRenderer("cast-ensemble"),
  "command-palette-summon": makeRenderer("command-palette-summon"),
  "glass-pill-dictation-typing": makeRenderer("glass-pill-dictation-typing"),
  "hashtag-to-pill-materialize": makeRenderer("hashtag-to-pill-materialize"),
  "cursor-performance": makeRenderer("cursor-performance"),
  "keycap-smash-cut": makeRenderer("keycap-smash-cut"),
  "picker-carousel-feature-cycle": makeRenderer("picker-carousel-feature-cycle"),
  "segmented-thumb-hero": makeRenderer("segmented-thumb-hero"),
  "theme-sweep-toggle": makeRenderer("theme-sweep-toggle"),
  "palette-theme-ripple": makeRenderer("palette-theme-ripple"),
  "type-and-filter": makeRenderer("type-and-filter"),
  "avatar-bracket-carousel": makeRenderer("avatar-bracket-carousel"),
  "bezier-source-converge-merge": makeRenderer("bezier-source-converge-merge"),
  "card-stack": makeRenderer("card-stack"),
  "carousel-3d": makeRenderer("carousel-3d"),
  "cloner-depth-echo": makeRenderer("cloner-depth-echo"),
  "deck-deal-flyin": makeRenderer("deck-deal-flyin"),
  "doc-park-left-pill-deal": makeRenderer("doc-park-left-pill-deal"),
  "draw-svg-trace": makeRenderer("draw-svg-trace"),
  "axial-stretch": makeRenderer("axial-stretch"),
  "contact-shadow-lift": makeRenderer("contact-shadow-lift"),
  "floating-glossy-label-pills": makeRenderer("floating-glossy-label-pills"),
  "integration-hub-map": makeRenderer("integration-hub-map"),
  "list-reveal": makeRenderer("list-reveal"),
  "list-stack-press": makeRenderer("list-stack-press"),
  "morph-from-primitive": makeRenderer("morph-from-primitive"),
  "neon-frame-forerun": makeRenderer("neon-frame-forerun"),
  "neon-frame-orbit-drop": makeRenderer("neon-frame-orbit-drop"),
  "page-waterfall-wall": makeRenderer("page-waterfall-wall"),
  "masking-tape-slap": makeRenderer("masking-tape-slap"),
  "popup-book-rise": makeRenderer("popup-book-rise"),
  "product-card-progressive-assemble": makeRenderer("product-card-progressive-assemble"),
  "radial-wave": makeRenderer("radial-wave"),
  "research-card-stack-scroll": makeRenderer("research-card-stack-scroll"),
  "row-embed": makeRenderer("row-embed"),
  "runway-ground-skim": makeRenderer("runway-ground-skim"),
  "skeleton-reveal": makeRenderer("skeleton-reveal"),
  "svg-shape-morph": makeRenderer("svg-shape-morph"),
  "value-stagger-gradient": makeRenderer("value-stagger-gradient"),
  "bento-light-up": makeRenderer("bento-light-up"),
  "grid-wave-flip": makeRenderer("grid-wave-flip"),
  "wireframe-draw-on": makeRenderer("wireframe-draw-on"),
  "spotlight-hero-card": makeRenderer("spotlight-hero-card"),
  "magician-card-flourish": makeRenderer("magician-card-flourish"),
  "outro-group-photo-launch": makeRenderer("outro-group-photo-launch"),
  "ui-strip-away-outro": makeRenderer("ui-strip-away-outro"),
  "icon-flip-bloom": makeRenderer("icon-flip-bloom"),
  "input-morph-assemble": makeRenderer("input-morph-assemble"),
};

export const isShowcaseStyle = (style: string): style is ShowcaseStyle =>
  (SHOWCASE_STYLE_IDS as readonly string[]).includes(style);

const ShowcaseBody = ({style, items, seconds}: {style: ShowcaseStyle; items: ShowcaseItem[]; seconds: number}) =>
  <>{SHOWCASE_STYLE_RENDERERS[style]({items, seconds})}</>;

export const ShowcaseTemplate = ({spec, style = "list-reveal", css}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (!isShowcaseStyle(style)) throw new Error("Unsupported showcase style: " + style);
  const seconds = frame / fps;
  return <AbsoluteFill style={{background: "#10171b", color: INK, fontFamily: '"Microsoft YaHei", Arial, sans-serif', overflow: "hidden", ...css}}>
    <div style={{position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(130,150,160,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(130,150,160,.08) 1px, transparent 1px)", backgroundSize: "64px 64px"}} />
    <Header title={spec.title} />
    <ShowcaseBody style={style} items={spec.items} seconds={seconds} />
    <FixedSfx style={style} items={spec.items} />
    <div style={{position: "absolute", left: 92, bottom: 64, color: MUTED, fontSize: 20, letterSpacing: "0.12em"}}>STORY CLAW / MOTION SYSTEM</div>
  </AbsoluteFill>;
};
