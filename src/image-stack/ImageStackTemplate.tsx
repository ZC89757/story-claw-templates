import {CSSProperties, useMemo} from "react";
import {AbsoluteFill, Audio, useCurrentFrame, useVideoConfig} from "remotion";
import {evaluateImageMediaItem} from "../image-media/evaluate";
import {ImageMediaCard} from "../image-media/ImageMediaCard";
import {ImageStackSpec} from "../image-media/types";

type Props = {spec: ImageStackSpec; audioSrc?: string; style?: CSSProperties};

const WIDTH = 1920;
const HEIGHT = 1080;
const COLORS = ["#c34d3d", "#2d8b82", "#d0952e", "#567eab", "#8a659e", "#6b7e3b", "#b76d43", "#3f7070"];
const ROTATIONS = [-2.8, 1.6, -1.1, 2.25, -1.7, 1.15, -2, 1.35];

export const ImageStackTemplate = ({spec, audioSrc, style}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  const cards = useMemo(() => spec.images.map((item, index) => ({item, index})), [spec.images]);
  return <AbsoluteFill style={{background: "#f3f0e9", color: "#243734", fontFamily: '"Microsoft YaHei", "Noto Sans SC", Arial, sans-serif', overflow: "hidden", ...style}}>
    {audioSrc ? <Audio src={audioSrc} /> : null}
    <div style={{position: "absolute", inset: 0, backgroundImage: "linear-gradient(#d8d2c6 1px, transparent 1px), linear-gradient(90deg, #d8d2c6 1px, transparent 1px)", backgroundSize: "56px 56px", opacity: 0.22}} />
    <div style={{position: "absolute", left: 70, top: 52, zIndex: 20, display: "flex", alignItems: "flex-start", gap: 16}}>
      <div style={{width: 10, height: 62, background: "#bf4b3b", transform: "rotate(-2deg)"}} />
      <div>
        {spec.title ? <div style={{fontSize: 44, lineHeight: 1.05, fontWeight: 950}}>{spec.title}</div> : null}
        <div style={{marginTop: spec.title ? 11 : 0, fontSize: 16, fontWeight: 900, letterSpacing: 2.1, color: "#6a716b"}}>IMAGE STACK</div>
      </div>
    </div>
    <div style={{position: "absolute", right: 70, top: 54, zIndex: 20, width: 250, borderTop: "3px solid #283c39", paddingTop: 9, textAlign: "right", fontSize: 14, lineHeight: 1.35, fontWeight: 950, letterSpacing: 1.2, color: "#283c39"}}>LAYERED IMAGES<br/><span style={{color: "#bf4b3b"}}>{cards.length} IMAGES</span></div>

    <div style={{position: "absolute", left: 240, top: 204, width: 1440, height: 750}}>
      <div style={{position: "absolute", left: 0, top: 22, width: 300, color: "#53625d"}}>
        <div style={{fontSize: 17, fontWeight: 950, letterSpacing: 1.1}}>LAYERED VIEW</div>
        <div style={{marginTop: 15, width: 132, height: 5, background: "#bf4b3b"}} />
        <div style={{marginTop: 17, maxWidth: 235, fontSize: 18, lineHeight: 1.45, fontWeight: 650}}>图片逐张进入同一画面。</div>
      </div>
      <div style={{position: "absolute", left: 330, top: 0, width: 840, height: 650}}>
        {cards.map(({item, index}) => {
          const state = evaluateImageMediaItem(item, seconds);
          const restingX = index * 31;
          const restingY = index * 18;
          const progress = state.progress;
          const enterX = (1 - progress) * (-520 - (index % 2) * 110);
          const enterY = (1 - progress) * (150 + index * 22);
          return <ImageMediaCard
            key={`${item.at}-${index}-${item.image}`}
            item={item}
            progress={progress}
            accent={COLORS[index % COLORS.length]}
            style={{position: "absolute", left: restingX, top: restingY, width: 660, height: 430, zIndex: index + 1, transform: `translate(${enterX}px, ${enterY}px) rotate(${ROTATIONS[index % ROTATIONS.length] * (0.25 + progress * 0.75)}deg) scale(${0.92 + progress * 0.08})`, transformOrigin: "center bottom"}}
          />;
        })}
      </div>
      <div style={{position: "absolute", right: 0, bottom: 5, width: 225, color: "#53625d", textAlign: "right"}}>
        <div style={{fontSize: 15, fontWeight: 950, letterSpacing: 1.2}}>STACKED IMAGES</div>
        <div style={{marginTop: 13, fontSize: 17, lineHeight: 1.45, fontWeight: 650}}>每张图片保持独立。</div>
      </div>
    </div>
    <div style={{position: "absolute", left: 70, right: 70, bottom: 45, zIndex: 20, display: "flex", alignItems: "center", gap: 15, color: "#5e6964", fontSize: 14, fontWeight: 900, letterSpacing: 1.1}}>
      <div style={{height: 3, flex: 1, background: "#c9c2b5"}} /><span>IMAGE STACK / {cards.length} IMAGES</span><div style={{height: 3, flex: 1, background: "#c9c2b5"}} />
    </div>
  </AbsoluteFill>;
};
