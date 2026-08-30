import {CSSProperties, useMemo} from "react";
import {AbsoluteFill, Audio, useCurrentFrame, useVideoConfig} from "remotion";
import {evaluateImageMediaItem} from "../image-media/evaluate";
import {ImageMediaCard} from "../image-media/ImageMediaCard";
import {ImageGridSpec} from "../image-media/types";

type Props = {spec: ImageGridSpec; audioSrc?: string; style?: CSSProperties};

const COLORS = ["#c34d3d", "#2d8b82", "#d0952e", "#567eab", "#8a659e", "#6b7e3b", "#b76d43", "#3f7070"];

export const ImageGridTemplate = ({spec, audioSrc, style}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  const columns = spec.images.length <= 2
    ? spec.images.length
    : spec.images.length === 3
      ? 3
      : spec.images.length <= 4
        ? 2
        : spec.images.length <= 6
          ? 3
          : 4;
  const rows = Math.ceil(spec.images.length / columns);
  const cards = useMemo(() => spec.images.map((item, index) => ({item, index})), [spec.images]);
  return <AbsoluteFill style={{background: "#f3f0e9", color: "#243734", fontFamily: '"Microsoft YaHei", "Noto Sans SC", Arial, sans-serif', overflow: "hidden", ...style}}>
    {audioSrc ? <Audio src={audioSrc} /> : null}
    <div style={{position: "absolute", inset: 0, backgroundImage: "radial-gradient(#9a9b91 1.1px, transparent 1.1px)", backgroundSize: "26px 26px", opacity: 0.18}} />
    <div style={{position: "absolute", left: 70, top: 50, zIndex: 20, display: "flex", alignItems: "flex-start", gap: 16}}>
      <div style={{width: 10, height: 62, background: "#2d8b82", transform: "rotate(2deg)"}} />
      <div>
        {spec.title ? <div style={{fontSize: 44, lineHeight: 1.05, fontWeight: 950}}>{spec.title}</div> : null}
        <div style={{marginTop: spec.title ? 11 : 0, fontSize: 16, fontWeight: 900, letterSpacing: 2.1, color: "#6a716b"}}>IMAGE GRID</div>
      </div>
    </div>
    <div style={{position: "absolute", right: 70, top: 53, zIndex: 20, width: 250, borderTop: "3px solid #283c39", paddingTop: 9, textAlign: "right", fontSize: 14, lineHeight: 1.35, fontWeight: 950, letterSpacing: 1.2, color: "#283c39"}}>PARALLEL IMAGES<br/><span style={{color: "#2d8b82"}}>{cards.length} IMAGES</span></div>

    <div style={{position: "absolute", left: 110, right: 110, top: 184, bottom: 108, display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`, gap: 24}}>
      {cards.map(({item, index}) => {
        const state = evaluateImageMediaItem(item, seconds);
        const direction = index % 4;
        const entryX = direction === 1 ? 90 : direction === 3 ? -90 : 0;
        const entryY = direction === 0 ? 70 : direction === 2 ? -70 : 0;
        return <ImageMediaCard
          key={`${item.at}-${index}-${item.image}`}
          item={item}
          progress={state.progress}
          accent={COLORS[index % COLORS.length]}
          compact
          style={{minWidth: 0, minHeight: 0, transform: `translate(${(1 - state.progress) * entryX}px, ${(1 - state.progress) * entryY}px) scale(${0.9 + state.progress * 0.1})`, transformOrigin: "center"}}
        />;
      })}
    </div>
    <div style={{position: "absolute", left: 70, right: 70, bottom: 43, zIndex: 20, display: "flex", alignItems: "center", gap: 15, color: "#5e6964", fontSize: 14, fontWeight: 900, letterSpacing: 1.1}}>
      <div style={{height: 3, flex: 1, background: "#c9c2b5"}} /><span>IMAGE GRID / {cards.length} IMAGES</span><div style={{height: 3, flex: 1, background: "#c9c2b5"}} />
    </div>
  </AbsoluteFill>;
};
