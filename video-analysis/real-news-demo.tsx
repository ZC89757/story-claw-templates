import React from "react";
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import capture from "./dom-capture/capture.json";

type Rect = {x: number; y: number; width: number; height: number};
type CaptureManifest = {
  url: string;
  title: string;
  text: string;
  viewport: {width: number; height: number; deviceScaleFactor: number};
  rects: Rect[];
  unionRect: Rect;
  baseImage: string;
  highlightedImage: string;
};

type Entrance = "fade" | "slide-right" | "cut";

const manifest = capture as CaptureManifest;
const ENTRANCES: Entrance[] = ["fade", "slide-right", "cut"];
const ENTRANCE_LABEL: Record<Entrance, string> = {
  fade: "FADE",
  "slide-right": "SLIDE FROM RIGHT",
  cut: "HARD CUT",
};
const SCENE_SECONDS = 6;
const PAGE = {x: 72, y: 96, width: 1400, barHeight: 46};
const CAMERA_ZOOM = 1.34;
const CAMERA_FOCUS_FRAMES = 24;
const HIGHLIGHT_REVEAL_FRAMES = 18;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeOut = (value: number) => 1 - Math.pow(1 - clamp01(value), 3);

const clipForRect = (rect: Rect, progress: number, imageWidth: number, imageHeight: number) => {
  const revealedRight = rect.x + rect.width * clamp01(progress);
  return `inset(${rect.y}px ${Math.max(0, imageWidth - revealedRight)}px ${Math.max(0, imageHeight - rect.y - rect.height)}px ${rect.x}px)`;
};

const BrowserBar = ({url}: {url: string}) => <div style={{
  position: "absolute",
  left: 0,
  top: 0,
  width: PAGE.width,
  height: PAGE.barHeight,
  zIndex: 10,
  display: "flex",
  alignItems: "center",
  gap: 9,
  padding: "0 18px",
  boxSizing: "border-box",
  background: "#e8ecea",
  borderRadius: "14px 14px 0 0",
  color: "#5e6965",
  fontFamily: "Consolas, monospace",
  fontSize: 14,
  whiteSpace: "nowrap",
  overflow: "hidden",
}}>
  <i style={{width: 12, height: 12, borderRadius: "50%", background: "#ef625d", flex: "0 0 auto"}} />
  <i style={{width: 12, height: 12, borderRadius: "50%", background: "#e6b34f", flex: "0 0 auto"}} />
  <i style={{width: 12, height: 12, borderRadius: "50%", background: "#59bd69", flex: "0 0 auto"}} />
  <span style={{marginLeft: 12, overflow: "hidden", textOverflow: "ellipsis"}}>{url}</span>
</div>;

const HighlightedPage = ({localFrame, fps}: {localFrame: number; fps: number}) => {
  const imageWidth = manifest.viewport.width;
  const imageHeight = manifest.viewport.height;
  const target = manifest.unionRect;
  const targetCenterX = target.x + target.width / 2;
  const targetCenterY = target.y + target.height / 2;
  const focusStart = 1.4 * fps;
  const focusProgress = easeOut((localFrame - focusStart) / CAMERA_FOCUS_FRAMES);
  const revealProgress = easeOut((localFrame - focusStart) / HIGHLIGHT_REVEAL_FRAMES);
  const cameraX = (imageWidth / 2 - targetCenterX * CAMERA_ZOOM) * focusProgress;
  const cameraY = (imageHeight / 2 - targetCenterY * CAMERA_ZOOM) * focusProgress;
  const cameraScale = 1 + (CAMERA_ZOOM - 1) * focusProgress;

  return <div style={{position: "absolute", left: 0, top: PAGE.barHeight, width: PAGE.width, height: imageHeight, overflow: "hidden", background: "#080b0e"}}>
    <div style={{position: "absolute", left: 0, top: 0, width: imageWidth, height: imageHeight, transform: `translate3d(${cameraX}px,${cameraY}px,0) scale(${cameraScale})`, transformOrigin: "top left"}}>
      <Img src={staticFile(manifest.baseImage)} style={{position: "absolute", left: 0, top: 0, display: "block", width: imageWidth, height: imageHeight}} />
      {manifest.rects.map((rect, index) => <Img
        key={`${rect.x}-${rect.y}-${index}`}
        src={staticFile(manifest.highlightedImage)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          display: "block",
          width: imageWidth,
          height: imageHeight,
          clipPath: clipForRect(rect, revealProgress, imageWidth, imageHeight),
        }}
      />)}
    </div>
  </div>;
};

const Scene = ({entrance, localFrame, fps}: {entrance: Entrance; localFrame: number; fps: number}) => {
  const entranceProgress = easeOut(localFrame / (0.72 * fps));
  const opacity = entrance === "fade" ? entranceProgress : 1;
  const translateX = entrance === "slide-right" ? (1 - entranceProgress) * 980 : 0;
  return <div style={{position: "absolute", inset: 0, opacity, transform: `translate3d(${translateX}px,0,0)`}}>
    <div style={{position: "absolute", left: PAGE.x, top: PAGE.y, width: PAGE.width, height: PAGE.barHeight + manifest.viewport.height, borderRadius: 14, overflow: "hidden", boxShadow: "0 28px 90px rgba(0,0,0,.62)"}}>
      <BrowserBar url={manifest.url} />
      <HighlightedPage localFrame={localFrame} fps={fps} />
    </div>
    <div style={{position: "absolute", left: 1530, right: 70, top: 310, opacity: entranceProgress}}>
      <div style={{fontFamily: "Consolas, monospace", fontSize: 15, color: "#56e5a1", letterSpacing: 1.5, marginBottom: 18}}>DOM HIGHLIGHT</div>
      <div style={{fontSize: 36, lineHeight: 1.16, fontWeight: 900, overflowWrap: "anywhere"}}>{manifest.text}</div>
      <div style={{height: 3, width: 260, background: "#35d592", marginTop: 24}} />
      <div style={{marginTop: 22, color: "#a9b8b0", fontSize: 17, lineHeight: 1.6}}>浏览器 Range 定位原文，CSS Highlight 生成高亮；模板只做遮罩显现和固定镜头推近。</div>
    </div>
  </div>;
};

export const RealNewsDemo = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sceneIndex = Math.min(ENTRANCES.length - 1, Math.floor(frame / (SCENE_SECONDS * fps)));
  const entrance = ENTRANCES[sceneIndex];
  const localFrame = frame - sceneIndex * SCENE_SECONDS * fps;
  return <AbsoluteFill style={{background: "#070b0d", color: "#effaf4", overflow: "hidden"}}>
    <div style={{position: "absolute", inset: 0, opacity: 0.25, backgroundImage: "linear-gradient(rgba(96,164,139,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(96,164,139,.18) 1px, transparent 1px)", backgroundSize: "64px 64px", transform: "perspective(500px) rotateX(58deg) translateY(250px) scale(1.55)"}} />
    <div style={{position: "absolute", left: 72, top: 42, fontFamily: "Consolas, monospace", fontSize: 18, letterSpacing: 2, color: "#7fd4ae"}}>AI HOT / DOM CAPTURED NEWS</div>
    <div style={{position: "absolute", right: 70, top: 42, fontFamily: "Consolas, monospace", fontSize: 15, color: "#789087"}}>ENTRANCE / {ENTRANCE_LABEL[entrance]}</div>
    <Scene entrance={entrance} localFrame={localFrame} fps={fps} />
    <div style={{position: "absolute", left: 72, right: 70, bottom: 40, display: "flex", justifyContent: "space-between", fontFamily: "Consolas, monospace", fontSize: 14, color: "#789087"}}><span>URL + TEXT + AT + ENTRANCE</span><span>CAMERA / ZOOM / EASING FIXED</span></div>
  </AbsoluteFill>;
};
