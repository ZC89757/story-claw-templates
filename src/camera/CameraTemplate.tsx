import {createContext, useContext} from "react";
import type {CSSProperties, ReactNode} from "react";
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {cameraProgress, easeInOut, easeOut} from "./evaluate";
import type {CameraSpec} from "./types";

type Props = {
  spec: CameraSpec;
  style?: string;
  baseFile?: string;
  /** Number of source-video frames to skip when this layer starts mid-episode. */
  baseTrimBeforeFrames?: number;
  css?: CSSProperties;
};

const W = 1920;
const H = 1080;
const INK = "#f1f6f8";
const MUTED = "#8da2aa";
const PANEL = "#142128";
const GRID = "rgba(138,211,223,.17)";

/**
 * A camera group is a closed motion recipe.  These names deliberately match
 * the catalog one-for-one: treating group as a keyword string used to merge
 * different moves was the reason `basic-3d-scene` and `terminal-3d` once
 * looked identical in Story Claw.
 */
export const CAMERA_STYLE_IDS = [
  "basic-3d-scene",
  "bullet-time-freeze-orbit",
  "crash-zoom-punch",
  "cursor-flyover",
  "dolly-zoom",
  "drone-dive-landing",
  "dutch-roll-to-level",
  "exploded-view",
  "graze-face-tour",
  "multiplane",
  "overhead-tabletop-drop",
  "pull-back-isolation",
  "slow-push-in",
  "steep-tilt-glide",
  "terminal-3d",
  "tilt-reveal",
] as const;

export type CameraStyle = (typeof CAMERA_STYLE_IDS)[number];
type CameraSfxName = "click-camera.mp3" | "gear-lock-metallic.mp3" | "glitch-electric-small.mp3" | "impact-cine.mp3" | "keyboard.mp3" | "riser-cine.mp3" | "swoosh-quick.mp3" | "whoosh-big.mp3" | "whoosh-fast.mp3";

type CameraRecipe = {
  renderer: CameraStyle;
  sfx: CameraSfxName;
  volume: number;
  accent: string;
  secondary: string;
};

// Fixed colour, intensity and sound live in the recipe.  The model only needs
// the semantic anchor text plus the time at which a move should begin.
const CAMERA_RECIPES = {
  "basic-3d-scene": {renderer: "basic-3d-scene", sfx: "whoosh-big.mp3", volume: .16, accent: "#8ad3df", secondary: "#ad8cff"},
  "bullet-time-freeze-orbit": {renderer: "bullet-time-freeze-orbit", sfx: "riser-cine.mp3", volume: .16, accent: "#81d7ff", secondary: "#ffb76c"},
  "crash-zoom-punch": {renderer: "crash-zoom-punch", sfx: "impact-cine.mp3", volume: .23, accent: "#ff6b53", secondary: "#f7d469"},
  "cursor-flyover": {renderer: "cursor-flyover", sfx: "click-camera.mp3", volume: .16, accent: "#9aa8ff", secondary: "#82e1da"},
  "dolly-zoom": {renderer: "dolly-zoom", sfx: "whoosh-big.mp3", volume: .17, accent: "#f0b567", secondary: "#8ccbe2"},
  "drone-dive-landing": {renderer: "drone-dive-landing", sfx: "whoosh-big.mp3", volume: .19, accent: "#70d8c7", secondary: "#f1a06d"},
  "dutch-roll-to-level": {renderer: "dutch-roll-to-level", sfx: "swoosh-quick.mp3", volume: .16, accent: "#ef765b", secondary: "#9acfe0"},
  "exploded-view": {renderer: "exploded-view", sfx: "glitch-electric-small.mp3", volume: .15, accent: "#c69aff", secondary: "#72d8bf"},
  "graze-face-tour": {renderer: "graze-face-tour", sfx: "swoosh-quick.mp3", volume: .15, accent: "#f4d279", secondary: "#91cfe8"},
  "multiplane": {renderer: "multiplane", sfx: "whoosh-fast.mp3", volume: .15, accent: "#89d5e2", secondary: "#e8a26d"},
  "overhead-tabletop-drop": {renderer: "overhead-tabletop-drop", sfx: "whoosh-big.mp3", volume: .17, accent: "#a4d9b6", secondary: "#efb169"},
  "pull-back-isolation": {renderer: "pull-back-isolation", sfx: "riser-cine.mp3", volume: .16, accent: "#f2c35d", secondary: "#8db9ff"},
  "slow-push-in": {renderer: "slow-push-in", sfx: "whoosh-fast.mp3", volume: .12, accent: "#ef7e61", secondary: "#9bd4e4"},
  "steep-tilt-glide": {renderer: "steep-tilt-glide", sfx: "swoosh-quick.mp3", volume: .17, accent: "#bd9bff", secondary: "#78d6c8"},
  "terminal-3d": {renderer: "terminal-3d", sfx: "keyboard.mp3", volume: .15, accent: "#9dffcf", secondary: "#7887af"},
  "tilt-reveal": {renderer: "tilt-reveal", sfx: "whoosh-big.mp3", volume: .17, accent: "#ffb96b", secondary: "#8dd4e5"},
} as const satisfies Record<CameraStyle, CameraRecipe>;

export const isCameraStyle = (style: string): style is CameraStyle =>
  (CAMERA_STYLE_IDS as readonly string[]).includes(style);

const cameraRecipeFor = (style: CameraStyle): CameraRecipe => {
  const recipe = CAMERA_RECIPES[style];
  if (!recipe) throw new Error(`Unsupported camera style: ${style}`);
  return recipe;
};

const clamp = (value: number): number => Math.min(1, Math.max(0, value));
const lerp = (from: number, to: number, amount: number): number => from + (to - from) * amount;
const smooth = (value: number): number => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const pulse = (value: number): number => Math.pow(Math.max(0, Math.sin(clamp(value) * Math.PI)), 1.6);

type LayerProps = {
  baseFile?: string;
  accent: string;
  secondary: string;
  style?: CSSProperties;
};

const BaseTrimBeforeContext = createContext(0);

/** Source footage when available, or the same formal plate used by preview MP4s. */
const BaseLayer = ({baseFile, accent, secondary, style}: LayerProps) => {
  const contextTrimBefore = useContext(BaseTrimBeforeContext);
  const trimBefore = Number.isFinite(contextTrimBefore) ? Math.max(0, Math.trunc(contextTrimBefore)) : 0;
  const layerStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    ...style,
  };
  return baseFile
    ? <OffthreadVideo src={staticFile(baseFile)} muted trimBefore={trimBefore} style={layerStyle} />
    : <PreviewPlate accent={accent} secondary={secondary} style={layerStyle} />;
};

const PreviewPlate = ({accent, secondary, style}: {accent: string; secondary: string; style: CSSProperties}) => <div style={{background: "radial-gradient(circle at 67% 24%, rgba(138,211,223,.22), transparent 32%), linear-gradient(135deg,#0d181d,#172c34 52%,#10171b)", overflow: "hidden", ...style}}>
  <div style={{position: "absolute", inset: 68, border: "3px solid rgba(222,242,246,.42)", borderRadius: 30, background: "rgba(8,15,19,.28)", boxShadow: "inset 0 0 0 2px rgba(255,255,255,.05)"}} />
  <div style={{position: "absolute", left: 180, top: 170, width: 780, height: 190, borderRadius: 24, background: "rgba(9,18,23,.68)", border: "2px solid rgba(255,255,255,.35)", boxShadow: "0 24px 60px rgba(0,0,0,.26)"}}>
    <div style={{position: "absolute", left: 42, top: 36, width: 170, height: 15, borderRadius: 8, background: accent}} />
    <div style={{position: "absolute", left: 42, top: 82, width: 565, height: 18, borderRadius: 9, background: "rgba(239,246,248,.72)"}} />
    <div style={{position: "absolute", left: 42, top: 122, width: 410, height: 12, borderRadius: 6, background: "rgba(239,246,248,.32)"}} />
  </div>
  <div style={{position: "absolute", right: 188, bottom: 170, width: 570, height: 332, borderRadius: 28, background: "linear-gradient(145deg,rgba(138,211,223,.42),rgba(15,28,35,.86))", border: "2px solid rgba(255,255,255,.36)", boxShadow: "0 28px 72px rgba(0,0,0,.35)", transform: "rotate(-7deg)"}}>
    {Array.from({length: 6}).map((_, index) => <div key={index} style={{position: "absolute", left: 48 + index * 76, bottom: 46, width: 42, height: 45 + ((index * 37) % 150), borderRadius: "9px 9px 3px 3px", background: index % 2 ? accent : secondary, opacity: .74}} />)}
  </div>
</div>;

/** Shared generated-video plate used by camera and <sc-video> previews. */
export const CameraPreviewPlate = ({accent, secondary, label}: {
  accent: string;
  secondary: string;
  label?: string;
}) => <div style={{position: "absolute", inset: 0, background: "#080c0f", overflow: "hidden"}}>
  <PreviewPlate accent={accent} secondary={secondary} style={{position: "absolute", inset: 0}} />
  {label ? <div style={{position: "absolute", left: 94, bottom: 90, color: accent, fontSize: 42, fontWeight: 900, fontFamily: '"Microsoft YaHei", Arial, sans-serif'}}>{label}</div> : null}
</div>;

const CameraSfx = ({recipe}: {recipe: CameraRecipe}) => {
  const {fps} = useVideoConfig();
  return <Sequence from={Math.round(.05 * fps)} durationInFrames={Math.max(1, Math.round(.88 * fps))} layout="none">
    <Audio src={staticFile(`audio/${recipe.sfx}`)} volume={recipe.volume} />
  </Sequence>;
};

const Label = ({text, color = INK, bottom = 90}: {text: string; color?: string; bottom?: number}) => <div style={{position: "absolute", left: 94, bottom, maxWidth: 1020, color, fontSize: 24, fontWeight: 850, letterSpacing: ".12em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textShadow: "0 3px 12px rgba(0,0,0,.48)"}}>{text}</div>;

const Reticle = ({accent, secondary, progress, size = 330}: {accent: string; secondary: string; progress: number; size?: number}) => <div style={{position: "absolute", left: W / 2 - size / 2, top: H / 2 - size / 2, width: size, height: size, border: `3px solid ${accent}`, opacity: .22 + progress * .62, transform: `scale(${1.85 - progress * .85})`, boxShadow: `0 0 ${18 + progress * 34}px ${accent}`}}>
  <div style={{position: "absolute", left: "50%", top: -34, width: 3, height: 68, background: secondary, transform: "translateX(-50%)"}} />
  <div style={{position: "absolute", left: -34, top: "50%", width: 68, height: 3, background: secondary, transform: "translateY(-50%)"}} />
  <div style={{position: "absolute", right: -34, top: "50%", width: 68, height: 3, background: secondary, transform: "translateY(-50%)"}} />
  <div style={{position: "absolute", left: "50%", bottom: -34, width: 3, height: 68, background: secondary, transform: "translateX(-50%)"}} />
</div>;

type CameraRendererProps = {
  baseFile?: string;
  p: number;
  frame: number;
  text: string;
  recipe: CameraRecipe;
};

type Pose = {x: number; y: number; zoom: number; rx?: number; ry?: number; rz?: number};
const interpolatePose = (p: number, poses: readonly Pose[], stops: readonly number[]): Pose => {
  let segment = stops.length - 2;
  for (let index = 0; index < stops.length - 1; index += 1) {
    if (p <= stops[index + 1]!) {
      segment = index;
      break;
    }
  }
  const start = poses[segment]!;
  const end = poses[segment + 1]!;
  const q = easeInOut((p - stops[segment]!) / Math.max(.001, stops[segment + 1]! - stops[segment]!));
  return {
    x: lerp(start.x, end.x, q),
    y: lerp(start.y, end.y, q),
    zoom: lerp(start.zoom, end.zoom, q),
    rx: lerp(start.rx ?? 0, end.rx ?? 0, q),
    ry: lerp(start.ry ?? 0, end.ry ?? 0, q),
    rz: lerp(start.rz ?? 0, end.rz ?? 0, q),
  };
};

// 01 · impress-style 3D waypoint travel.  The camera visits separate spatial cards.
const Basic3DScene = ({baseFile, p, text, recipe}: CameraRendererProps) => {
  const poses: Pose[] = [
    {x: 0, y: 0, zoom: 1.04, ry: 0, rz: 0},
    {x: -190, y: 84, zoom: 1.34, ry: 14, rz: -3},
    {x: 158, y: -124, zoom: 1.52, ry: -22, rz: 8},
    {x: 0, y: 0, zoom: .84, ry: 0, rz: 0},
  ];
  const pose = interpolatePose(p, poses, [0, .30, .62, 1]);
  const cards = [
    {x: 290, y: 232, z: -100, r: -7, label: "STEP 01"},
    {x: 1130, y: 170, z: -220, r: 12, label: "STEP 02"},
    {x: 830, y: 650, z: -390, r: -13, label: "STEP 03"},
    {x: 650, y: 390, z: 70, r: 3, label: "OVERVIEW"},
  ];
  const active = Math.min(3, Math.floor(p * 3.95));
  return <><BaseLayer baseFile={baseFile} accent={recipe.accent} secondary={recipe.secondary} style={{transform: `translate(${pose.x}px,${pose.y}px) perspective(1100px) rotateX(${pose.rx}deg) rotateY(${pose.ry}deg) rotateZ(${pose.rz}deg) scale(${pose.zoom})`, transformOrigin: "50% 50%", filter: `brightness(${.76 + p * .18}) saturate(1.08)`}} />
    <div style={{position: "absolute", inset: 0, perspective: 1100, pointerEvents: "none"}}>{cards.map((card, index) => {
      const focus = index === active || (index === 3 && p > .76);
      const distance = Math.abs(active - index);
      return <div key={card.label} style={{position: "absolute", left: card.x, top: card.y, width: index === 3 ? 610 : 350, height: index === 3 ? 238 : 168, padding: 26, boxSizing: "border-box", borderRadius: 18, background: "rgba(12,22,28,.76)", border: `2px solid ${focus ? recipe.accent : "rgba(180,205,212,.35)"}`, color: INK, opacity: .18 + (focus ? .76 : Math.max(.08, .34 - distance * .1)), filter: `blur(${focus ? 0 : 2 + distance * 1.4}px)`, transform: `translate3d(${(index - active) * 94}px,${(index % 2 ? 1 : -1) * (1 - p) * 82}px,${card.z}px) rotateY(${card.r + (index - active) * 9}deg)`, boxShadow: focus ? `0 0 0 4px ${recipe.accent}22, 0 24px 54px rgba(0,0,0,.46)` : "none"}}>
        <div style={{fontSize: 18, fontWeight: 900, letterSpacing: ".18em", color: focus ? recipe.secondary : MUTED}}>{card.label}</div>
        <div style={{fontSize: index === 3 ? 44 : 27, fontWeight: 900, marginTop: 22, lineHeight: 1.1}}>{index === active ? text : ["POSITION", "ROTATE", "SPACE", "SEE THE WHOLE"][index]}</div>
        <div style={{height: 8, width: `${44 + index * 10}%`, borderRadius: 4, background: recipe.accent, marginTop: 22, opacity: .78}} />
      </div>;
    })}</div>
    <div style={{position: "absolute", inset: 0, backgroundImage: `linear-gradient(${GRID} 1px,transparent 1px),linear-gradient(90deg,${GRID} 1px,transparent 1px)`, backgroundSize: "96px 96px", opacity: .18 + p * .28, transform: `perspective(900px) rotateX(64deg) translateY(${330 - p * 90}px) scale(1.18)`}} />
    <Label text={text} color={recipe.accent} />
  </>;
};

// 02 · frozen subject, orbiting virtual lens and a temporal shutter treatment.
const BulletTimeOrbit = ({baseFile, p, text, recipe}: CameraRendererProps) => {
  const orbit = Math.sin(p * Math.PI) * 50;
  const flash = pulse((p - .46) / .18);
  return <><BaseLayer baseFile={baseFile} accent={recipe.accent} secondary={recipe.secondary} style={{transform: `perspective(1100px) rotateY(${orbit}deg) rotateX(${Math.sin(p * Math.PI) * -8}deg) scale(${1.04 + Math.sin(p * Math.PI) * .09})`, transformOrigin: "50% 50%", filter: `saturate(${1 + p * .26}) contrast(${1 + p * .15})`}} />
    <Reticle accent={recipe.accent} secondary={recipe.secondary} progress={p} size={246} />
    {Array.from({length: 4}).map((_, index) => <div key={index} style={{position: "absolute", left: W / 2, top: H / 2, width: 150 + index * 170 + p * 320, height: 150 + index * 170 + p * 320, borderRadius: "50%", border: `2px solid ${index % 2 ? recipe.secondary : recipe.accent}`, opacity: (1 - p) * (.18 + index * .08), transform: "translate(-50%,-50%)"}} />)}
    <div style={{position: "absolute", inset: 0, background: `rgba(220,246,255,${flash * .72})`, mixBlendMode: "screen"}} />
    <div style={{position: "absolute", left: 0, right: 0, top: 88, textAlign: "center", color: recipe.accent, fontSize: 22, fontWeight: 900, letterSpacing: ".28em", opacity: .35 + p * .65}}>TEMPORAL ORBIT / FREEZE</div>
    <Label text={text} />
  </>;
};

// 03 · hold, very fast target punch-in, then an overshoot rebound.
const CrashZoomPunch = ({baseFile, p, text, recipe}: CameraRendererProps) => {
  const punch = p < .26 ? 0 : p < .43 ? easeInOut((p - .26) / .17) : 1;
  const rebound = p < .43 ? 0 : p < .56 ? 1 - easeOut((p - .43) / .13) * .12 : .88;
  const zoom = 1 + punch * 1.56 * rebound;
  const streak = pulse((p - .27) / .19);
  return <><BaseLayer baseFile={baseFile} accent={recipe.accent} secondary={recipe.secondary} style={{transform: `translate(${-punch * 154}px,${-punch * 78}px) scale(${zoom})`, transformOrigin: "58% 62%", filter: `blur(${streak * 5}px) contrast(${1 + punch * .18})`}} />
    {Array.from({length: 12}).map((_, index) => <div key={index} style={{position: "absolute", left: W / 2, top: H / 2, width: 360 + index * 130, height: 5 + (index % 3) * 3, background: index % 2 ? recipe.accent : recipe.secondary, transformOrigin: "0 50%", transform: `rotate(${index * 30}deg) scaleX(${streak * 1.25})`, opacity: streak * .6}} />)}
    <div style={{position: "absolute", inset: 0, border: `${8 + streak * 20}px solid ${recipe.accent}`, opacity: streak * .55, boxSizing: "border-box", transform: `scale(${1.15 - streak * .15})`}} />
    <div style={{position: "absolute", left: W / 2 - 230, top: H / 2 - 112, width: 460, height: 224, border: `4px solid ${recipe.secondary}`, opacity: punch * .8, transform: `scale(${1.9 - punch * .9})`, boxShadow: `0 0 42px ${recipe.accent}`}} />
    <Label text={text} color={recipe.secondary} />
  </>;
};

// 04 · a cursor tours four corners; its waypoint, zoom and click ring are one move.
const CursorFlyover = ({baseFile, p, text, recipe}: CameraRendererProps) => {
  const points: Pose[] = [
    {x: 0, y: 0, zoom: .96},
    {x: 122, y: 72, zoom: 1.46},
    {x: -138, y: 72, zoom: 1.46},
    {x: -138, y: -82, zoom: 1.46},
    {x: 122, y: -82, zoom: 1.46},
  ];
  const pose = interpolatePose(p, points, [0, .22, .43, .65, .87]);
  const cursorX = W / 2 - pose.x * 1.65;
  const cursorY = H / 2 - pose.y * 1.7;
  const landed = [0.22, .43, .65, .87].map((at) => pulse((p - at) / .11)).reduce((sum, item) => Math.max(sum, item), 0);
  return <><BaseLayer baseFile={baseFile} accent={recipe.accent} secondary={recipe.secondary} style={{transform: `translate(${pose.x}px,${pose.y}px) scale(${pose.zoom})`, transformOrigin: "50% 50%", filter: `brightness(${.84 + p * .12})`}} />
    <svg width={W} height={H} style={{position: "absolute", inset: 0, pointerEvents: "none", filter: "drop-shadow(0 5px 8px rgba(0,0,0,.5))"}}>
      <path d="M4 2 L4 42 L14 32 L23 54 L31 50 L22 28 L42 27 Z" transform={`translate(${cursorX} ${cursorY}) scale(1.35)`} fill="#fff" stroke="#121b20" strokeWidth="2.5" />
    </svg>
    <div style={{position: "absolute", left: cursorX, top: cursorY, width: 58 + landed * 150, height: 58 + landed * 150, borderRadius: "50%", border: `3px solid ${recipe.accent}`, opacity: landed * .82, transform: "translate(-50%,-50%)", boxShadow: `0 0 28px ${recipe.accent}`}} />
    <div style={{position: "absolute", left: 72, top: 66, color: recipe.accent, fontSize: 22, fontWeight: 900, letterSpacing: ".2em", opacity: .82}}>CURSOR / FEATURE TOUR</div>
    <Label text={text} />
  </>;
};

// 05 · the world expands and defocuses while a central reading plane holds steady.
const DollyZoom = ({baseFile, p, text, recipe}: CameraRendererProps) => {
  const push = easeOut(p);
  return <><BaseLayer baseFile={baseFile} accent={recipe.accent} secondary={recipe.secondary} style={{transform: `scale(${1 + push * .7})`, transformOrigin: "50% 50%", filter: `blur(${push * 4}px) saturate(${1 - push * .14}) brightness(${.98 - push * .18})`}} />
    <div style={{position: "absolute", left: W / 2 - 372, top: H / 2 - 215, width: 744, height: 430, borderRadius: 28, border: `4px solid ${recipe.accent}`, background: "rgba(8,16,20,.16)", boxShadow: `0 0 ${20 + push * 48}px ${recipe.accent}55, inset 0 0 0 1px rgba(255,255,255,.28)`, opacity: .56 + push * .38}}>
      <div style={{position: "absolute", left: 44, right: 44, top: 54, height: 14, borderRadius: 7, background: recipe.secondary, opacity: .75}} />
      <div style={{position: "absolute", left: 44, right: 128, top: 94, height: 10, borderRadius: 5, background: "rgba(255,255,255,.54)"}} />
      <div style={{position: "absolute", left: 44, bottom: 46, color: INK, fontSize: 44, fontWeight: 900, letterSpacing: ".02em"}}>{text}</div>
    </div>
    <div style={{position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 50%,transparent 24%,rgba(0,0,0,${.12 + push * .52}) 100%)`}} />
  </>;
};

// 06 · high-altitude pitched view dives and levels out over a landing reticle.
const DroneDiveLanding = ({baseFile, p, text, recipe}: CameraRendererProps) => {
  const landing = easeOut(p);
  return <><BaseLayer baseFile={baseFile} accent={recipe.accent} secondary={recipe.secondary} style={{transform: `perspective(1000px) rotateX(${(1 - landing) * 22}deg) scale(${1.48 - landing * .48}) translateY(${(1 - landing) * 100}px)`, transformOrigin: "50% 70%", filter: `brightness(${.68 + landing * .32}) contrast(${1 + landing * .1})`}} />
    <div style={{position: "absolute", left: 0, right: 0, bottom: -160 + landing * 160, height: 670, backgroundImage: `linear-gradient(${recipe.accent}66 2px,transparent 2px),linear-gradient(90deg,${recipe.accent}66 2px,transparent 2px)`, backgroundSize: "122px 92px", transform: "perspective(850px) rotateX(67deg)", transformOrigin: "bottom center", opacity: .18 + landing * .38}} />
    <Reticle accent={recipe.accent} secondary={recipe.secondary} progress={landing} size={180} />
    <div style={{position: "absolute", right: 88, top: 74, color: recipe.secondary, fontSize: 20, fontWeight: 900, letterSpacing: ".18em", opacity: .5 + landing * .5}}>ALT {Math.round(1200 - landing * 1050)} M</div>
    <Label text={text} />
  </>;
};

// 07 · a skewed frame rolls cleanly level; the warm guard frame makes the roll legible.
const DutchRollToLevel = ({baseFile, p, text, recipe}: CameraRendererProps) => {
  const level = easeOut(p);
  return <><BaseLayer baseFile={baseFile} accent={recipe.accent} secondary={recipe.secondary} style={{transform: `rotate(${-11 + level * 11}deg) scale(${1.09 - level * .05})`, transformOrigin: "50% 50%", filter: `brightness(${.82 + level * .18})`}} />
    <div style={{position: "absolute", inset: 34, border: `10px solid ${recipe.accent}`, opacity: .18 + (1 - level) * .48, boxSizing: "border-box", transform: `rotate(${-7 + level * 7}deg)`, boxShadow: `0 0 36px ${recipe.accent}`}} />
    <div style={{position: "absolute", left: 142, right: 142, top: H / 2, height: 3, background: recipe.secondary, opacity: .28 + level * .5, transform: `rotate(${-11 + level * 11}deg)`}} />
    <Label text={text} color={recipe.secondary} />
  </>;
};

// 08 · the scene breaks into offset planes, then locks back into one perspective.
const ExplodedView = ({baseFile, p, text, recipe}: CameraRendererProps) => {
  const settle = easeInOut(p);
  return <><BaseLayer baseFile={baseFile} accent={recipe.accent} secondary={recipe.secondary} style={{transform: `perspective(980px) rotateX(${(1 - settle) * 18}deg) rotateY(${(1 - settle) * -17}deg) scale(${1 + (1 - settle) * .12})`, filter: `saturate(${.84 + settle * .18})`}} />
    {Array.from({length: 9}).map((_, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const dx = (col - 1) * (1 - settle) * 310;
      const dy = (row - 1) * (1 - settle) * 210;
      return <div key={index} style={{position: "absolute", left: 190 + col * 520, top: 160 + row * 290, width: 480, height: 260, border: `2px solid ${index % 2 ? recipe.secondary : recipe.accent}`, background: "rgba(13,24,29,.10)", opacity: .08 + (1 - settle) * .54, transform: `translate(${dx}px,${dy}px) rotate(${(col - row) * (1 - settle) * 8}deg)`, boxShadow: `0 0 ${24 * (1 - settle)}px ${recipe.accent}`}} />;
    })}
    <div style={{position: "absolute", left: W / 2 - 200, top: H / 2 - 66, width: 400, textAlign: "center", color: recipe.accent, fontSize: 24, fontWeight: 900, letterSpacing: ".18em", opacity: 1 - settle * .32}}>EXPLODED / ALIGNING</div>
    <Label text={text} />
  </>;
};

// 09 · a shallow lateral graze keeps a face/subject plane close while light scans across it.
const GrazeFaceTour = ({baseFile, p, text, recipe}: CameraRendererProps) => {
  const travel = easeInOut(p);
  return <><BaseLayer baseFile={baseFile} accent={recipe.accent} secondary={recipe.secondary} style={{transform: `perspective(900px) rotateY(${Math.sin(travel * Math.PI * 1.4) * 10}deg) scale(${1.18 + travel * .08}) translateX(${(travel - .5) * -176}px)`, transformOrigin: "56% 50%", filter: `contrast(${1 + travel * .12})`}} />
    <div style={{position: "absolute", left: `${-24 + travel * 140}%`, top: 0, width: 26, height: "100%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,.92),transparent)", boxShadow: `0 0 42px 18px ${recipe.accent}`, opacity: .65}} />
    <div style={{position: "absolute", left: 456, top: 246, width: 792, height: 570, border: `3px solid ${recipe.secondary}`, borderRadius: "46%", opacity: .18 + travel * .44, transform: `scale(${1.24 - travel * .24})`, boxShadow: `0 0 32px ${recipe.secondary}`}} />
    <Label text={text} color={recipe.accent} />
  </>;
};

// 10 · explicit three-plane parallax: background drifts slowly, a clipped middle plane follows,
// and foreground strips sweep rapidly.  The same source video is reused only when real footage
// is supplied; it is never an alternate preview-only animation.
const Multiplane = ({baseFile, p, text, recipe}: CameraRendererProps) => {
  const drive = easeInOut(p) * 520;
  return <>
    <BaseLayer baseFile={baseFile} accent={recipe.accent} secondary={recipe.secondary} style={{transform: `translateX(${-drive * .28}px) scale(1.08)`, filter: "blur(2px) saturate(.84)", opacity: .72}} />
    <BaseLayer baseFile={baseFile} accent={recipe.accent} secondary={recipe.secondary} style={{transform: `translateX(${-drive * .62}px) scale(1.04)`, clipPath: "inset(16% 12% 18% 12% round 30px)", boxShadow: "0 28px 64px rgba(0,0,0,.38)"}} />
    <BaseLayer baseFile={baseFile} accent={recipe.accent} secondary={recipe.secondary} style={{transform: `translateX(${-drive * 1.22}px) scale(1.1)`, clipPath: "polygon(0 8%,28% 8%,22% 92%,0 92%)", filter: "blur(1.4px)", opacity: .76}} />
    <BaseLayer baseFile={baseFile} accent={recipe.accent} secondary={recipe.secondary} style={{transform: `translateX(${-drive * 1.45 + 540}px) scale(1.1)`, clipPath: "polygon(75% 10%,100% 10%,100% 92%,68% 92%)", filter: "blur(2.4px)", opacity: .64}} />
    <div style={{position: "absolute", inset: 0, border: `2px solid ${recipe.accent}88`, opacity: .36, pointerEvents: "none"}} />
    <Label text={text} color={recipe.secondary} />
  </>;
};

// 11 · a high tabletop angle lowers into a readable frontal camera position.
const OverheadTabletopDrop = ({baseFile, p, text, recipe}: CameraRendererProps) => {
  const drop = easeOut(p);
  return <><BaseLayer baseFile={baseFile} accent={recipe.accent} secondary={recipe.secondary} style={{transform: `perspective(1050px) rotateX(${62 - drop * 62}deg) translateX(${(1 - drop) * -78}px) scale(${.88 + drop * .12})`, transformOrigin: "50% 72%", filter: `brightness(${.76 + drop * .24})`}} />
    <div style={{position: "absolute", left: 190, right: 190, top: 122, bottom: 100, border: `3px solid ${recipe.accent}`, opacity: .18 + (1 - drop) * .48, transform: `perspective(850px) rotateX(${62 - drop * 62}deg)`, transformOrigin: "50% 72%"}} />
    {Array.from({length: 7}).map((_, index) => <div key={index} style={{position: "absolute", left: 254 + index * 206, top: 200 + (index % 2) * 430, width: 154, height: 88, border: `2px solid ${index % 2 ? recipe.secondary : recipe.accent}`, background: "rgba(13,25,29,.18)", opacity: .18 + drop * .52, transform: `perspective(850px) rotateX(${(1 - drop) * 50}deg) translateY(${(1 - drop) * -150}px)`}} />)}
    <Label text={text} />
  </>;
};

// 12 · start in an intimate close-up, pull back, then fade the surrounding context away.
const PullBackIsolation = ({baseFile, p, text, recipe}: CameraRendererProps) => {
  const pull = easeOut(p);
  return <><BaseLayer baseFile={baseFile} accent={recipe.accent} secondary={recipe.secondary} style={{transform: `scale(${1.86 - pull * 1.08})`, transformOrigin: "50% 50%", filter: `brightness(${.96 - pull * .24})`}} />
    <div style={{position: "absolute", inset: 0, background: `rgba(2,5,8,${Math.max(0, (pull - .42) / .58) * .74})`}} />
    {Array.from({length: 8}).map((_, index) => {
      const angle = index / 8 * Math.PI * 2;
      const distance = 310 + (index % 3) * 105;
      const fade = clamp((pull - .18 - index * .055) / .34);
      return <div key={index} style={{position: "absolute", left: W / 2 + Math.cos(angle) * distance - 118, top: H / 2 + Math.sin(angle) * distance * .62 - 68, width: 236, height: 136, borderRadius: 16, border: `2px solid ${recipe.secondary}`, background: "rgba(16,30,36,.78)", opacity: .68 * (1 - fade), transform: `scale(${1.18 - pull * .35})`, filter: `brightness(${1 - fade * .72})`}} />;
    })}
    <div style={{position: "absolute", left: W / 2 - 278, top: H / 2 - 158, width: 556, height: 316, borderRadius: 26, border: `4px solid ${recipe.accent}`, background: "rgba(255,255,255,.05)", boxShadow: `0 0 ${pull * 54}px ${recipe.accent}`, opacity: .45 + pull * .45}} />
    <div style={{position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 50%,transparent 20%,rgba(0,0,0,${.12 + pull * .6}) 100%)`}} />
    <Label text={text} color={recipe.accent} />
  </>;
};

// 13 · an almost imperceptible accelerating push with a compressive vignette.
const SlowPushIn = ({baseFile, p, text, recipe}: CameraRendererProps) => {
  const accelerating = p * p;
  return <><BaseLayer baseFile={baseFile} accent={recipe.accent} secondary={recipe.secondary} style={{transform: `scale(${1 + accelerating * .15})`, transformOrigin: "50% 50%", filter: `brightness(${1 - accelerating * .16})`}} />
    <div style={{position: "absolute", inset: 0, background: `radial-gradient(ellipse 62% 55% at 50% 50%,transparent 42%,rgba(0,0,0,${accelerating * .58}) 100%)`}} />
    <div style={{position: "absolute", left: W / 2, top: H / 2, transform: "translate(-50%,-50%)", color: "rgba(255,255,255,.84)", fontSize: 136, fontWeight: 950, letterSpacing: "-.06em", opacity: .10 + accelerating * .5, textShadow: `0 0 ${24 + accelerating * 40}px ${recipe.accent}`}}>×{(1 + accelerating * 9).toFixed(1)}</div>
    <Label text={text} color={recipe.secondary} />
  </>;
};

// 14 · a steep side-on plane glides level across the frame.
const SteepTiltGlide = ({baseFile, p, text, recipe}: CameraRendererProps) => {
  const glide = easeInOut(p);
  return <><BaseLayer baseFile={baseFile} accent={recipe.accent} secondary={recipe.secondary} style={{transform: `perspective(900px) rotateY(${-56 + glide * 56}deg) translateX(${(1 - glide) * -188}px) scale(${.94 + glide * .06})`, transformOrigin: "50% 50%", filter: `brightness(${.74 + glide * .26})`}} />
    <div style={{position: "absolute", left: `${4 + glide * 86}%`, top: 0, width: 10, height: "100%", background: recipe.accent, boxShadow: `0 0 38px 16px ${recipe.accent}`, opacity: .45 + glide * .35}} />
    <div style={{position: "absolute", left: 132, top: 132, width: 330, height: 3, background: recipe.secondary, opacity: .6, transform: `scaleX(${glide})`, transformOrigin: "left"}} />
    <Label text={text} />
  </>;
};

type TerminalWindowProps = {index: number; p: number; focus: number; text: string; recipe: CameraRecipe};
const TerminalWindow = ({index, p, focus, text, recipe}: TerminalWindowProps) => {
  const commands = ["$ story-claw analyze", "$ compose motion --beat", "$ render --camera=3d"];
  const command = index === 1 ? `$ ${text.slice(0, 24) || "compile scene"}` : commands[index]!;
  const typed = command.slice(0, Math.floor(command.length * clamp((p - index * .12) / .31)));
  const outputs = index === 0 ? ["timeline ready", "anchors mapped", "scene queued"] : index === 1 ? ["camera path ready", "depth planes linked", "cut markers locked"] : ["rendering 60 fps", "motion blur on", "export complete"];
  return <div style={{position: "absolute", left: 280 + index * 510, top: 286 + (index % 2 ? 138 : -32), width: 510, height: 314, borderRadius: 18, overflow: "hidden", background: "#0d1118", border: `2px solid ${focus > .68 ? recipe.accent : "#344057"}`, boxShadow: `0 28px 64px rgba(0,0,0,.58), 0 0 ${focus * 38}px ${recipe.accent}66`, opacity: .28 + focus * .72, filter: `blur(${(1 - focus) * 2.5}px) brightness(${.68 + focus * .32})`, transform: `translate3d(${(index - 1) * (1 - focus) * 178}px,${(1 - focus) * (index % 2 ? 80 : -70)}px,0) rotateY(${(index - 1) * 17}deg) scale(${.85 + focus * .15})`}}>
    <div style={{height: 48, background: "linear-gradient(180deg,#252c3d,#171c29)", borderBottom: "1px solid #30394d", display: "flex", alignItems: "center", padding: "0 18px", boxSizing: "border-box", gap: 9}}>{["#ff6058", "#ffbd2e", "#28ca42"].map((color) => <span key={color} style={{width: 12, height: 12, borderRadius: "50%", background: color}} />)}<span style={{marginLeft: 13, color: "#7785a2", fontFamily: "Consolas, monospace", fontSize: 16}}>camera node {index + 1}</span></div>
    <div style={{position: "absolute", left: 24, top: 80, right: 24, color: recipe.accent, fontFamily: "Consolas, monospace", fontWeight: 700, fontSize: 19, whiteSpace: "nowrap", overflow: "hidden"}}>{typed}<span style={{opacity: Math.floor(p * 20) % 2 ? 1 : .15}}>▌</span></div>
    {outputs.map((output, outputIndex) => {
      const q = clamp((p - .28 - index * .10 - outputIndex * .06) / .18);
      return <div key={output} style={{position: "absolute", left: 24, top: 124 + outputIndex * 38, color: outputIndex === 0 ? "#d5deef" : "#8190aa", fontFamily: "Consolas, monospace", fontSize: 17, opacity: q, transform: `translateX(${(1 - q) * -20}px)`}}>› {output}</div>;
    })}
  </div>;
};

// 15 · a different 3D recipe from Basic3D: terminals, typed commands and focus travel.
const Terminal3D = ({baseFile, p, text, recipe}: CameraRendererProps) => {
  const focusIndex = Math.min(2, Math.floor(p * 3));
  const path = interpolatePose(p, [
    {x: 104, y: 35, zoom: 1.12, ry: 7},
    {x: 0, y: -54, zoom: 1.22, ry: -9},
    {x: -116, y: 52, zoom: 1.16, ry: 10},
  ], [0, .40, .78]);
  return <><BaseLayer baseFile={baseFile} accent={recipe.accent} secondary={recipe.secondary} style={{transform: `translate(${path.x}px,${path.y}px) perspective(920px) rotateY(${path.ry}deg) scale(${path.zoom})`, transformOrigin: "50% 50%", filter: "brightness(.46) saturate(.68)"}} />
    <div style={{position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%,rgba(37,49,84,.42),rgba(4,6,12,.66) 66%)"}} />
    <div style={{position: "absolute", inset: 0, perspective: 1100}}>{[0, 1, 2].map((index) => <TerminalWindow key={index} index={index} p={p} focus={index === focusIndex ? 1 : .18 + Math.max(0, .5 - Math.abs(p * 3 - index))} text={text} recipe={recipe} />)}</div>
    <div style={{position: "absolute", left: 90, top: 68, color: recipe.accent, fontSize: 22, fontWeight: 900, letterSpacing: ".2em"}}>TERMINAL / EXECUTION PATH</div>
    <Label text={text} color={recipe.accent} />
  </>;
};

// 16 · a bottom-hinged camera tilt clears the frame like a physical reveal.
const TiltReveal = ({baseFile, p, text, recipe}: CameraRendererProps) => {
  const reveal = easeOut(p);
  return <><BaseLayer baseFile={baseFile} accent={recipe.accent} secondary={recipe.secondary} style={{transform: `perspective(1050px) rotateX(${(1 - reveal) * 62}deg) translateY(${(1 - reveal) * 96}px) scale(${.94 + reveal * .06})`, transformOrigin: "50% 100%", filter: `brightness(${.7 + reveal * .3})`}} />
    <div style={{position: "absolute", left: 0, right: 0, bottom: 0, height: `${(1 - reveal) * 100}%`, background: "linear-gradient(180deg,rgba(7,11,14,.05),#071015)", borderTop: `4px solid ${recipe.accent}`, boxShadow: `0 -18px 42px ${recipe.accent}44`}} />
    <div style={{position: "absolute", left: 190, right: 190, bottom: 126, height: 3, background: recipe.secondary, transform: `scaleX(${reveal})`, transformOrigin: "left", opacity: .75}} />
    <Label text={text} color={recipe.secondary} />
  </>;
};

type CameraRenderer = (props: CameraRendererProps) => ReactNode;

/** Every catalog group resolves to exactly one authored camera renderer. */
const CAMERA_RENDERERS: Readonly<Record<CameraStyle, CameraRenderer>> = {
  "basic-3d-scene": Basic3DScene,
  "bullet-time-freeze-orbit": BulletTimeOrbit,
  "crash-zoom-punch": CrashZoomPunch,
  "cursor-flyover": CursorFlyover,
  "dolly-zoom": DollyZoom,
  "drone-dive-landing": DroneDiveLanding,
  "dutch-roll-to-level": DutchRollToLevel,
  "exploded-view": ExplodedView,
  "graze-face-tour": GrazeFaceTour,
  "multiplane": Multiplane,
  "overhead-tabletop-drop": OverheadTabletopDrop,
  "pull-back-isolation": PullBackIsolation,
  "slow-push-in": SlowPushIn,
  "steep-tilt-glide": SteepTiltGlide,
  "terminal-3d": Terminal3D,
  "tilt-reveal": TiltReveal,
};

const CameraBody = (props: CameraRendererProps) => {
  const renderer = CAMERA_RENDERERS[props.recipe.renderer];
  if (!renderer) throw new Error(`Missing camera renderer: ${props.recipe.renderer}`);
  return <>{renderer(props)}</>;
};

export const CameraTemplate = ({spec, style = "slow-push-in", baseFile, baseTrimBeforeFrames = 0, css}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (!isCameraStyle(style)) throw new Error(`Unsupported camera style: ${style}`);
  const recipe = cameraRecipeFor(style);
  // The runtime Sequence already maps this layer's frame to the instance-root
  // timeline. Adding a second offset here would double-shift split fragments.
  const seconds = frame / fps;
  const activeItem = [...(spec.items ?? [])].reverse().find((item) => item.at <= seconds);
  const moveStart = activeItem?.at ?? spec.at;
  const p = cameraProgress(Math.max(0, seconds - moveStart));
  const text = activeItem?.text ?? spec.text;
  return <AbsoluteFill style={{background: "#080c0f", overflow: "hidden", fontFamily: '"Microsoft YaHei", Arial, sans-serif', ...css}}>
    <BaseTrimBeforeContext.Provider value={baseTrimBeforeFrames}>
      <CameraBody baseFile={baseFile} p={p} frame={frame} text={text} recipe={recipe} />
      <CameraSfx recipe={recipe} />
    </BaseTrimBeforeContext.Provider>
  </AbsoluteFill>;
};
