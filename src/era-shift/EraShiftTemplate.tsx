import {CSSProperties} from "react";
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {eraShiftEaseInOut, eraShiftProgress, evaluateEraShiftItem} from "./evaluate";
import type {EraShiftItem, EraShiftSpec} from "./types";

type Props = {spec: EraShiftSpec; style?: CSSProperties};

const DEFAULT_FOREGROUND = "era-shift/foreground/jensen-huang.png";
const GAME_COLORS = ["#67d4e8", "#ec5e83", "#f0b14b", "#8d7cf6", "#5fd39d", "#e6e0cf"];
const AI_COLORS = ["#72d6a0", "#f1c75b", "#c5a7ff", "#7eb3ff", "#f09a69", "#82e2df"];
const ITEM_STAGGER = 0.18;
const ITEM_INSET = 0.58;
const FIELD_IN_AT = 0.22;
const FIELD_IN_DURATION = 0.58;
const SWITCH_DURATION = 0.82;

const RING_SLOTS = [
  {left: 78, top: 184, rotate: -8}, {left: 352, top: 112, rotate: 5},
  {left: 1252, top: 142, rotate: 7}, {left: 1530, top: 230, rotate: -6},
  {left: 88, top: 666, rotate: 6}, {left: 362, top: 786, rotate: -5},
  {left: 1268, top: 736, rotate: -7}, {left: 1538, top: 642, rotate: 8},
];

const hash = (text: string) => [...text].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 997, 17);

const staticAssetPath = (source: string, kind: "foreground" | "logo"): string => {
  const value = source.trim().replace(/^public[\\/]+/i, "").replace(/^\/+/, "");
  if (value.startsWith("assets/") || value.startsWith("era-shift/") || value.startsWith("ai-company-logos/")) return value;
  return kind === "foreground" ? `era-shift/foreground/${value}` : `era-shift/logos/${value}`;
};

const GridField = ({kind, opacity}: {kind: "gaming" | "ai"; opacity: number}) => {
  const lines = Array.from({length: 13});
  const gaming = kind === "gaming";
  const tint = gaming ? "#78d6ef" : "#91e8ba";
  return <AbsoluteFill style={{opacity, overflow: "hidden", pointerEvents: "none"}}>
    <div style={{position: "absolute", inset: 0, background: gaming
      ? "radial-gradient(circle at 50% 48%, #172d3a 0%, #080c12 48%, #000 100%)"
      : "radial-gradient(circle at 50% 44%, #19372d 0%, #080d0b 48%, #000 100%)"}} />
    <div style={{position: "absolute", inset: -160, opacity: 0.48, transform: `rotate(${gaming ? -8 : 8}deg) scale(1.1)`, backgroundImage: `linear-gradient(${tint}22 1px, transparent 1px), linear-gradient(90deg, ${tint}22 1px, transparent 1px)`, backgroundSize: "80px 80px"}} />
    {lines.map((_, index) => <div key={index} style={{position: "absolute", left: gaming ? -180 : 980, top: 130 + index * 82, width: 960, height: 2, opacity: 0.42, background: `${(gaming ? GAME_COLORS : AI_COLORS)[index % 6]}66`, transform: `rotate(${gaming ? -12 + index * 2 : 12 - index * 1.8}deg)`, transformOrigin: "left center"}} />)}
    <div style={{position: "absolute", left: "50%", top: "50%", width: 900, height: 900, transform: "translate(-50%, -50%)", border: `1px solid ${tint}33`, borderRadius: "50%", boxShadow: `0 0 100px ${tint}22`}} />
  </AbsoluteFill>;
};

const BrandMark = ({item, index, seconds, baseAt, tone}: {item: EraShiftItem; index: number; seconds: number; baseAt: number; tone: "gaming" | "ai"}) => {
  const entryAt = baseAt + index * ITEM_STAGGER;
  const state = evaluateEraShiftItem(item, seconds, entryAt);
  // Provider resolves omitted logos from the fixed package scanner. A direct
  // component preview without a matching asset intentionally falls back to text.
  const asset = item.logo ? staticAssetPath(item.logo, "logo") : undefined;
  const accent = tone === "gaming" ? GAME_COLORS[index % GAME_COLORS.length] : AI_COLORS[index % AI_COLORS.length];
  const slot = RING_SLOTS[(index + (tone === "gaming" ? 0 : 2)) % RING_SLOTS.length];
  const angle = slot.rotate + ((hash(item.text) % 5) - 2) * 1.3;
  return <div style={{position: "absolute", left: slot.left, top: slot.top, width: 220, minHeight: 138, opacity: state.progress, transform: `translateY(${(1 - state.progress) * 30}px) rotate(${angle}deg) scale(${0.84 + state.progress * 0.16})`, transformOrigin: "center", display: "flex", alignItems: "center", justifyContent: "center", zIndex: tone === "gaming" ? 12 : 14, filter: `drop-shadow(0 0 18px ${accent}55)`}}>
    <div style={{width: "100%", minHeight: 124, padding: "16px 12px 14px", boxSizing: "border-box", border: `1px solid ${accent}99`, background: tone === "gaming" ? "#071018cc" : "#07130dcc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: `inset 0 0 24px ${accent}18, 0 10px 24px #0008`}}>
      {asset ? <img src={staticFile(asset)} style={{width: 76, height: 54, objectFit: "contain", filter: `drop-shadow(0 0 10px ${accent}66)`}} /> : <div style={{fontSize: 34, lineHeight: 1, fontWeight: 950, color: "#f3f7f4"}}>{item.text.slice(0, 2).toUpperCase()}</div>}
      <div style={{fontSize: item.text.length > 28 ? 14 : 18, lineHeight: 1.15, maxWidth: 194, fontWeight: 900, color: tone === "gaming" ? "#f3f7f4" : "#e7fff0", textAlign: "center", whiteSpace: "normal", overflowWrap: "anywhere", textShadow: `0 0 14px ${accent}88`}}>{item.text}</div>
    </div>
  </div>;
};

const StateLabel = ({children, opacity, right}: {children: string; opacity: number; right?: boolean}) => <div style={{position: "absolute", top: 54, ...(right ? {right: 62} : {left: 62}), opacity, color: "#d7f8e2", fontSize: 14, fontWeight: 900, letterSpacing: 2.6, zIndex: 18}}>{children}</div>;

export const EraShiftTemplate = ({spec, style}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  const switchAt = Math.max(0, spec.switchAt);
  const fieldProgress = eraShiftEaseInOut(eraShiftProgress(FIELD_IN_AT, seconds, FIELD_IN_DURATION));
  const switchProgress = eraShiftEaseInOut(eraShiftProgress(switchAt, seconds, SWITCH_DURATION));
  const foregroundProgress = eraShiftEaseInOut(eraShiftProgress(0.08, seconds, 0.66));
  const image = staticAssetPath(spec.image || DEFAULT_FOREGROUND, "foreground");

  return <AbsoluteFill style={{background: "#000", color: "#f5f5ed", overflow: "hidden", fontFamily: '"Microsoft YaHei", "Noto Sans SC", Arial, sans-serif', ...style}}>
    <GridField kind="gaming" opacity={fieldProgress * (1 - switchProgress)} />
    <GridField kind="ai" opacity={fieldProgress * switchProgress} />

    <div style={{position: "absolute", inset: 0, zIndex: 8, opacity: fieldProgress * (1 - switchProgress)}}>
      {spec.startItems.map((item, index) => <BrandMark key={`start-${item.text}-${index}`} item={item} index={index} seconds={seconds} baseAt={ITEM_INSET} tone="gaming" />)}
    </div>
    <div style={{position: "absolute", inset: 0, zIndex: 9, opacity: fieldProgress * switchProgress}}>
      {spec.endItems.map((item, index) => <BrandMark key={`end-${item.text}-${index}`} item={item} index={index} seconds={seconds} baseAt={switchAt + 0.08} tone="ai" />)}
    </div>

    <StateLabel opacity={fieldProgress * (1 - switchProgress)}>起始状态</StateLabel>
    <StateLabel opacity={fieldProgress * switchProgress} right>最终状态</StateLabel>
    <div style={{position: "absolute", left: 62, right: 62, top: 78, height: 1, background: "#b8f3cf44", opacity: fieldProgress, zIndex: 18}} />

    <div style={{position: "absolute", left: "50%", top: 126, width: 650, height: 850, transform: `translateX(-50%) translateY(${56 - foregroundProgress * 56}px) scale(${0.9 + foregroundProgress * 0.1})`, transformOrigin: "bottom center", opacity: foregroundProgress, zIndex: 40, filter: "drop-shadow(24px 24px 0 rgba(0,0,0,.38))"}}>
      <img src={staticFile(image)} style={{width: "100%", height: "100%", objectFit: "contain", objectPosition: "center bottom"}} />
      <div style={{position: "absolute", inset: 0, background: "linear-gradient(90deg, #000 0%, transparent 32%, transparent 68%, #000 100%)", opacity: 0.42, pointerEvents: "none"}} />
    </div>
  </AbsoluteFill>;
};
