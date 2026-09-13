import {CSSProperties} from "react";
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {NewsReportPage, NewsReportSpec} from "./types";

type Props = {spec: NewsReportSpec; style?: CSSProperties};
const PAGE_WIDTH = 1180;
const PAGE_HEIGHT = 720;
const ENTRANCE_FRAMES = 15;
const PAGE_GAP_FRAMES = 8;
const REVIEW_CYCLE_FRAMES = 42;
const PAPER_COLORS = ["#f7f1e5", "#fffaf0", "#eee7d8", "#f4eee3", "#faf6ec", "#e9e3d6"];
const PAPER_ROTATIONS = [-3.2, 1.8, -1.1, 2.6, -2.1, 0.8, -1.7, 1.4];
const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const easeOutBack = (value: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const x = clamp01(value) - 1;
  return 1 + c3 * x * x * x + c1 * x * x;
};
const sourceLabel = (source?: string): string => source?.trim() || "NEWS DESK";

const Paper = ({page, index, frame, pageCount}: {page: NewsReportPage; index: number; frame: number; pageCount: number}) => {
  const start = index * PAGE_GAP_FRAMES;
  const progress = easeOutBack(clamp01((frame - start) / ENTRANCE_FRAMES));
  const visible = frame >= start;
  const restingX = (index - (pageCount - 1) / 2) * 19;
  const restingY = (index - (pageCount - 1) / 2) * 13;
  const launchX = -470 + (index % 3) * 170;
  const launchY = 210 + (index % 2) * 90;
  const review = index === pageCount - 1 && progress >= 1
    ? Math.sin((frame - pageCount * PAGE_GAP_FRAMES) / REVIEW_CYCLE_FRAMES * Math.PI * 2)
    : 0;
  const x = restingX + (1 - progress) * launchX + review * 12;
  const y = restingY + (1 - progress) * launchY - Math.max(0, review) * 13;
  const rotate = PAPER_ROTATIONS[index % PAPER_ROTATIONS.length] * (1 - progress) + review * 0.65;
  const scale = 0.92 + progress * 0.08 + Math.max(0, review) * 0.012;
  const opacity = visible ? Math.min(1, progress + 0.12) : 0;
  return <div style={{position: "absolute", left: 180, top: 74, width: PAGE_WIDTH, height: PAGE_HEIGHT, padding: 18, boxSizing: "border-box", background: PAPER_COLORS[index % PAPER_COLORS.length], border: "1px solid rgba(53,45,36,.28)", boxShadow: "18px 24px 0 rgba(26,23,19,.14), 0 28px 60px rgba(26,23,19,.3), inset 0 0 0 1px rgba(255,255,255,.62)", transform: `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg) scale(${scale})`, transformOrigin: "center bottom", opacity, zIndex: index + 1, overflow: "hidden"}}>
    <div style={{position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.18, backgroundImage: "linear-gradient(transparent 96%, rgba(72,57,42,.2) 100%), linear-gradient(90deg, rgba(255,255,255,.4), transparent 18%, transparent 82%, rgba(56,45,34,.08))", backgroundSize: "100% 11px, 100% 100%"}} />
    <div style={{position: "absolute", left: 26, right: 26, top: 22, display: "flex", justifyContent: "space-between", color: "rgba(42,38,33,.58)", fontFamily: '"Cascadia Mono", Consolas, monospace', fontSize: 15, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase"}}><span>{sourceLabel(page.source)}</span><span>REPORT {String(index + 1).padStart(2, "0")}</span></div>
    <div style={{position: "absolute", left: 24, right: 24, top: 62, bottom: 60, overflow: "hidden", background: "#d9d4c9", border: "1px solid rgba(42,38,33,.52)"}}><Img src={staticFile(page.image)} style={{display: "block", width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top"}} /></div>
    <div style={{position: "absolute", left: 28, right: 28, bottom: 22, display: "flex", justifyContent: "space-between", gap: 18, color: "rgba(42,38,33,.78)", fontFamily: '"Microsoft YaHei", Arial, sans-serif', fontSize: 18, fontWeight: 800}}><span style={{overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{page.title ?? "NEWS REPORT"}</span><span style={{fontFamily: '"Cascadia Mono", Consolas, monospace', fontSize: 13, letterSpacing: "0.1em"}}>PAGE</span></div>
  </div>;
};

export const NewsReportTemplate = ({spec, style}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const elapsed = Math.max(0, frame - Math.round(spec.at * fps));
  const settled = clamp01((elapsed - spec.pages.length * PAGE_GAP_FRAMES) / 20);
  return <AbsoluteFill style={{background: "transparent", overflow: "hidden", ...style}}>
    <Sequence from={Math.round((spec.at + 0.02) * fps)} durationInFrames={Math.max(1, Math.round(1.2 * fps))} layout="none"><Audio src={staticFile("audio/whoosh-big.mp3")} volume={0.12} /></Sequence>
    {spec.pages.map((_, index) => <Sequence key={`paper-sound-${index}`} from={Math.round(spec.at * fps) + index * PAGE_GAP_FRAMES} durationInFrames={Math.max(1, Math.round(0.2 * fps))} layout="none"><Audio src={staticFile("audio/click-shutter.mp3")} volume={0.08} /></Sequence>)}
    <div style={{position: "absolute", inset: 0, background: "rgba(11,16,19,.58)"}} />
    <div style={{position: "absolute", left: 122, right: 122, top: 66, height: 1, background: "rgba(236,228,211,.42)", opacity: 0.55 + settled * 0.35}} />
    <div style={{position: "absolute", left: 122, top: 84, color: "rgba(242,236,223,.68)", fontFamily: '"Cascadia Mono", Consolas, monospace', fontSize: 16, fontWeight: 800, letterSpacing: "0.14em", opacity: 0.42 + settled * 0.4}}>PRESS ARCHIVE / {String(spec.pages.length).padStart(2, "0")} REPORTS</div>
    {spec.pages.map((page, index) => <Paper key={`${index}-${page.image}`} page={page} index={index} frame={elapsed} pageCount={spec.pages.length} />)}
    <div style={{position: "absolute", left: 122, right: 122, bottom: 76, display: "flex", justifyContent: "space-between", color: "rgba(242,236,223,.56)", fontFamily: '"Cascadia Mono", Consolas, monospace', fontSize: 14, fontWeight: 800, letterSpacing: "0.11em", opacity: 0.38 + settled * 0.46}}><span>ARCHIVE STACK</span><span>STACKED PAPERS / {spec.pages.length}</span></div>
  </AbsoluteFill>;
};
