import type {CSSProperties} from "react";
import {Img} from "remotion";
import {asset} from "./common";

export type WordmarkContent = {source?: string; text?: string} | null;

export function OriginalWordmark({content, original, box, style}: {
  content?: WordmarkContent;
  original?: string;
  box: readonly [number, number, number, number];
  style?: CSSProperties;
}) {
  const [left, top, width, height] = box;
  const position: CSSProperties = {position: "absolute", left, top, width, height};
  const source = content === undefined ? original : content?.source;
  if (source) return <Img src={asset(source)} style={{...position, objectFit: content === undefined ? "fill" : "contain"}}/>;
  if (!content?.text) return null;
  return <div style={{
    ...position, display: "grid", placeItems: "center", whiteSpace: "nowrap", overflow: "hidden",
    color: "#4b4138", fontFamily: '"Segoe Print", "Brush Script MT", cursive',
    fontSize: 36, fontStyle: "italic", fontWeight: 700, letterSpacing: 1.2,
    textShadow: "0 1px #322c27", ...style,
  }}>{content.text}</div>;
}
