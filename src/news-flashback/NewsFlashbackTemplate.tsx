import {CSSProperties} from "react";
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {NewsFlashbackPage, NewsFlashbackSpec} from "./types";

type Props = {spec: NewsFlashbackSpec; style?: CSSProperties};

const fontSizeFor = (text: string) => {
  const length = Array.from(text).length;
  if (length <= 2) return 360;
  if (length <= 4) return 280;
  if (length <= 8) return 175;
  if (length <= 12) return 145;
  return 125;
};

const FLASHBACK_PALETTE = ["#dc2f3b", "#76b900", "#2d64f0", "#13a8c2", "#f08a35", "#204ce5", "#7dd3fc", "#9b7ade"];

const NEWS_CADENCE_FRAMES = 6;
const NEWS_TOTAL_FRAMES = 132;
const NEWS_CARD = {width: 1420, height: 820};

const FlashbackPage = ({image, source, title, x, y, scale, rotate, opacity, blur, zIndex, accent}: NewsFlashbackPage & {
  x: number;
  y: number;
  scale: number;
  rotate: number;
  opacity: number;
  blur: number;
  zIndex: number;
  accent: string;
}) => <div style={{
  position: "absolute",
  left: 250,
  top: 130,
  width: NEWS_CARD.width,
  height: NEWS_CARD.height,
  padding: 12,
  boxSizing: "border-box",
  background: "rgba(247,249,249,.96)",
  border: `4px solid ${accent}`,
  boxShadow: "0 24px 70px rgba(0,0,0,.62), 0 0 0 1px rgba(255,255,255,.48) inset",
  transform: `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${rotate}deg)`,
  transformOrigin: "center center",
  opacity,
  filter: `blur(${blur}px) saturate(.82) contrast(1.03)`,
  overflow: "hidden",
  zIndex,
}}>
  <Img src={staticFile(image)} style={{display: "block", width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top"}} />
  <div style={{position: "absolute", left: 20, right: 20, bottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center", color: "rgba(16,24,29,.78)", fontFamily: '"Cascadia Mono", Consolas, monospace', fontSize: 17, letterSpacing: "0.04em"}}>
    <span>{source ?? "WEB SOURCE"}</span>
    <span>{title ?? "ARTICLE IMAGE"}</span>
  </div>
</div>;

/**
 * 网页资料闪回：整屏翻页展示真实网页截图，中央压着被资料支撑的那句话。
 * 这是 scene 图层（不透明、覆盖原画），不要当成透明叠加的 emphasis 使用。
 */
export const NewsFlashbackTemplate = ({spec, style}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const elapsed = Math.max(0, frame - Math.round(spec.at * fps));
  if (elapsed <= 0) return null;
  const cut = Math.floor(elapsed / NEWS_CADENCE_FRAMES);
  const cutProgress = (elapsed % NEWS_CADENCE_FRAMES) / NEWS_CADENCE_FRAMES;
  const pages = spec.pages ?? [];
  const pageCount = Math.max(1, pages.length);
  const current = pages[cut % pageCount] ?? {image: "", source: "WEB SOURCE", title: "ARTICLE IMAGE"};
  const previous = pages[(cut - 1 + pageCount) % pageCount] ?? current;
  const next = pages[(cut + 1) % pageCount] ?? current;
  const reveal = Math.min(1, elapsed / Math.max(1, Math.round(0.32 * fps)));
  const fadeOut = Math.min(1, Math.max(0, (elapsed - NEWS_TOTAL_FRAMES) / Math.max(1, Math.round(0.42 * fps))));
  const titleSize = Math.min(132, Math.max(54, fontSizeFor(spec.text) * 0.7));
  const shutter = elapsed % NEWS_CADENCE_FRAMES <= 1;
  const scanY = (elapsed * 34) % 1180;
  const titleOpacity = Math.max(0, (0.22 + reveal * 0.78) * (1 - fadeOut));
  const pageOpacity = Math.max(0, (0.86 + reveal * 0.14) * (1 - fadeOut));

  return <AbsoluteFill style={{background: "transparent", overflow: "hidden", ...style}}>
    <Sequence from={Math.round((spec.at + 0.02) * fps)} durationInFrames={Math.max(1, Math.round(1.1 * fps))} layout="none">
      <Audio src={staticFile("audio/riser-cine.mp3")} volume={0.12} />
    </Sequence>
    <Sequence from={Math.round((spec.at + 0.1) * fps)} durationInFrames={Math.max(1, Math.round(0.72 * fps))} layout="none">
      <Audio src={staticFile("audio/gear-lock-metallic.mp3")} volume={0.16} />
    </Sequence>
    {pages.map((_, index) => {
      const cutFrame = Math.round(spec.at * fps) + index * NEWS_CADENCE_FRAMES;
      return <Sequence key={`news-click-${index}`} from={cutFrame} durationInFrames={Math.max(1, Math.round(0.18 * fps))} layout="none">
        <Audio src={staticFile("audio/click-shutter.mp3")} volume={0.11} />
      </Sequence>;
    })}

    <div style={{position: "absolute", inset: 0, background: "rgba(9,14,18,.58)", opacity: Math.max(0, (0.58 + reveal * 0.2) * (1 - fadeOut))}} />
    <div style={{position: "absolute", inset: 54, border: "1px solid rgba(213,237,238,.4)", opacity: Math.max(0, (0.35 + reveal * 0.45) * (1 - fadeOut))}} />
    <div style={{position: "absolute", left: 96, right: 96, top: 102, display: "flex", justifyContent: "space-between", alignItems: "center", color: "rgba(233,245,245,.74)", fontFamily: '"Cascadia Mono", Consolas, monospace', fontSize: 18, letterSpacing: "0.14em", opacity: Math.max(0, (0.45 + reveal * 0.35) * (1 - fadeOut))}}>
      <span>ARTICLE FLASHBACK / {String((cut % pageCount) + 1).padStart(2, "0")}</span>
      <span>24 FPS / LIVE CUT</span>
    </div>

    <FlashbackPage {...previous} accent={FLASHBACK_PALETTE[(cut - 1 + pageCount) % FLASHBACK_PALETTE.length]} x={-340 + cutProgress * 250} y={30} scale={0.88} rotate={-2.2} opacity={pageOpacity * 0.28} blur={2.8} zIndex={1} />
    <FlashbackPage {...current} accent={FLASHBACK_PALETTE[cut % FLASHBACK_PALETTE.length]} x={-cutProgress * 270} y={0} scale={0.96} rotate={-0.6 - cutProgress * 1.2} opacity={pageOpacity} blur={shutter ? 1.2 : 0} zIndex={2} />
    <FlashbackPage {...next} accent={FLASHBACK_PALETTE[(cut + 1) % FLASHBACK_PALETTE.length]} x={1080 - cutProgress * 270} y={42} scale={0.88} rotate={2.5 - cutProgress * 1.2} opacity={pageOpacity * 0.32} blur={2.8} zIndex={1} />

    <div style={{position: "absolute", left: 250, right: 250, top: "50%", transform: `translateY(-50%) translateY(${(1 - reveal) * 120}px) scale(${0.9 + reveal * 0.1})`, opacity: titleOpacity, textAlign: "center", color: "#f7fbfb", fontFamily: '"Microsoft YaHei", Arial, sans-serif', fontSize: titleSize, lineHeight: 1.02, fontWeight: 950, letterSpacing: 0, WebkitTextStroke: "3px rgba(8,16,20,.9)", paintOrder: "stroke fill", textShadow: "0 0 24px rgba(128,220,225,.55), 0 18px 36px rgba(0,0,0,.72)", overflowWrap: "anywhere", zIndex: 8}}>{spec.text}</div>
    <div style={{position: "absolute", left: 118, right: 118, top: scanY - 580, height: 260, background: "linear-gradient(180deg, transparent, rgba(203,239,239,.16), transparent)", opacity: Math.max(0, 0.76 * (1 - fadeOut)), zIndex: 9}} />
    {shutter ? <div style={{position: "absolute", inset: 0, background: "rgba(248,252,251,.54)", mixBlendMode: "screen", opacity: Math.max(0, 0.8 * (1 - fadeOut)), zIndex: 10}} /> : null}
    <div style={{position: "absolute", left: 116, right: 116, bottom: 110, display: "flex", justifyContent: "space-between", color: "rgba(244,248,248,.64)", fontFamily: '"Cascadia Mono", Consolas, monospace', fontSize: 17, letterSpacing: "0.1em", opacity: Math.max(0, (0.3 + reveal * 0.5) * (1 - fadeOut)), zIndex: 9}}>
      <span>PAGE {String((cut % pageCount) + 1).padStart(2, "0")}</span>
      <span>PROJECTOR GATE</span>
    </div>
  </AbsoluteFill>;
};
