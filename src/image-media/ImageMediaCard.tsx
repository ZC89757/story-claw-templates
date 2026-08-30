import {CSSProperties, ReactNode} from "react";
import {Img, staticFile} from "remotion";
import {normalizePublicImagePath, resolveImageSource} from "./source";
import {ImageMediaItem} from "./types";

type Props = {
  item: ImageMediaItem;
  progress: number;
  accent: string;
  compact?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
};

const WINDOWS_ABSOLUTE_PATH = /^[A-Za-z]:[\\/]/;

const renderableSource = (value: string): string => {
  const source = resolveImageSource(value);
  if (source.kind === "url") return source.value;
  if (WINDOWS_ABSOLUTE_PATH.test(source.value)) return `file:///${source.value.replaceAll("\\", "/")}`;
  return staticFile(normalizePublicImagePath(source.value).replace(/^\/+/, ""));
};

const PromptCard = ({value}: {value: string}) => <div style={{position: "absolute", inset: 0, padding: 28, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", background: "#e7e1d5", color: "#263b3a", overflow: "hidden"}}>
  <div style={{fontSize: 16, fontWeight: 950, letterSpacing: 1.5, color: "#b44a3b"}}>AI IMAGE PROMPT</div>
  <div style={{marginTop: 17, fontSize: 23, lineHeight: 1.35, fontWeight: 750, overflowWrap: "anywhere"}}>{value}</div>
</div>;

export const ImageMediaCard = ({item, progress, accent, compact = false, children, style}: Props) => {
  const source = resolveImageSource(item.image);
  const imageContent = source.kind === "prompt"
    ? <PromptCard value={source.value} />
    : <Img src={renderableSource(source.value)} style={{display: "block", width: "100%", height: "100%", objectFit: "contain"}} />;
  const label = item.label || (source.kind === "prompt" ? "待生成图片" : "图片素材");
  return <div style={{position: "relative", overflow: "hidden", background: "#fffdf8", border: `4px solid ${accent}`, boxShadow: compact ? "7px 8px 0 rgba(42,48,45,.15)" : "12px 14px 0 rgba(42,48,45,.16)", opacity: progress, ...style}}>
    <div style={{position: "absolute", inset: 0, opacity: 0.12, pointerEvents: "none", backgroundImage: "linear-gradient(135deg, transparent 0 47%, #ffffff 48% 52%, transparent 53% 100%)", backgroundSize: "22px 22px"}} />
    <div style={{position: "absolute", inset: compact ? 13 : 18, bottom: compact ? 48 : 62, overflow: "hidden", border: "2px solid #283b39", background: "#d9d4c9"}}>{imageContent}</div>
    <div style={{position: "absolute", left: compact ? 16 : 22, right: compact ? 16 : 22, bottom: compact ? 14 : 18, minHeight: compact ? 24 : 31, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12}}>
      <div style={{fontSize: compact ? 17 : 22, lineHeight: 1.1, fontWeight: 950, color: "#253a38", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{label}</div>
      <div style={{fontSize: compact ? 11 : 13, lineHeight: 1, fontWeight: 950, letterSpacing: 1.2, color: accent}}>IMAGE</div>
    </div>
    {children}
  </div>;
};
