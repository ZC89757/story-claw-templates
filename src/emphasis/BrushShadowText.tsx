import {CSSProperties} from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";

type Props = {spec: {text: string; at: number}; description?: boolean; style?: CSSProperties};
const clamp = (n: number) => Math.max(0, Math.min(1, n));

/** Shared brush-shadow group: chapter words land; other text wipes on left to right. */
export const BrushShadowText = ({spec, description = false, style}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const elapsed = frame / fps - spec.at;
  if (elapsed < 0) return null;
  const chapter = !description && /^[海陆空]$/.test(spec.text.trim());
  const chars = Array.from(spec.text);
  const fontSize = chapter ? 900 : description ? (chars.length > 28 ? 112 : 132) : chars.length <= 4 ? 360 : chars.length <= 8 ? Math.min(270, 1640 / chars.length) : 220;
  // Balance long headings so their final character can never become an orphan line.
  const heading = !chapter && !description && chars.length > 8
    ? chars.slice(0, Math.ceil(chars.length / 2)).join("") + "\n" + chars.slice(Math.ceil(chars.length / 2)).join("")
    : spec.text;
  const drop = elapsed < 0.32 ? -1160 * (1 - Math.pow(clamp(elapsed / 0.32), 2))
    : elapsed < 0.49 ? -48 * Math.sin((elapsed - 0.32) / 0.17 * Math.PI) : 0;
  const wipe = clamp(elapsed / 0.5);
  const shadow = chapter ? 24 : description ? 7 : 12;
  return <AbsoluteFill style={{background: "transparent", alignItems: "center", justifyContent: "center", overflow: "hidden", ...style}}>
    <div style={{width: 1840, padding: "36px 45px 70px", boxSizing: "border-box", textAlign: "center", fontFamily: '"STXingkai", "华文行楷", "STKaiti", "KaiTi", serif', fontSize, fontWeight: 400, lineHeight: chapter ? 1 : 1.18, color: "#fffef7", whiteSpace: "pre-wrap", overflowWrap: "anywhere", transform: chapter ? `translateY(${drop}px)` : undefined, clipPath: chapter ? undefined : `inset(0 ${(1 - wipe) * 100}% 0 0)`, WebkitTextStroke: chapter ? "2px rgba(28,22,10,.7)" : "1px rgba(28,22,10,.7)", paintOrder: "stroke fill", textShadow: `${shadow}px ${shadow}px 0 #ffcc20, ${shadow * 2}px ${shadow * 2}px 0 rgba(255,190,0,.32), 0 12px 28px rgba(0,0,0,.8)`}}>{heading}</div>
  </AbsoluteFill>;
};
