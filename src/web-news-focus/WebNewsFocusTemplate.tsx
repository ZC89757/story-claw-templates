import type {CSSProperties} from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  Easing,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type {
  WebNewsFocusCapture,
  WebNewsFocusRect,
  WebNewsFocusSpec,
} from "./types";

type Props = {spec: WebNewsFocusSpec; style?: CSSProperties};

const WIDTH = 1920;
const HEIGHT = 1080;
const PAGE = {left: 120, top: 60, width: 1680, height: 960, barHeight: 48};
const CAMERA_ZOOM = 1.36;
const CAMERA_FOCUS_FRAMES = 18;
const HIGHLIGHT_REVEAL_FRAMES = 14;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const ease = (value: number): number => Easing.out(Easing.cubic)(clamp01(value));
const mix = (from: number, to: number, amount: number): number => from + (to - from) * amount;

const centerOf = (rect: WebNewsFocusRect) => ({
  x: rect.x + rect.width / 2,
  y: rect.y + rect.height / 2,
});

const clipForRect = (
  rect: WebNewsFocusRect,
  progress: number,
  imageWidth: number,
  imageHeight: number,
): string => {
  const revealedRight = rect.x + rect.width * clamp01(progress);
  return `inset(${rect.y}px ${Math.max(0, imageWidth - revealedRight)}px ${Math.max(0, imageHeight - rect.y - rect.height)}px ${rect.x}px)`;
};

const canonicalUrlLabel = (url: string): string => {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname === "/" ? "" : parsed.pathname}`;
  } catch {
    return url;
  }
};

const captureOrThrow = (spec: WebNewsFocusSpec): WebNewsFocusCapture => {
  if (!spec.capture) {
    throw new Error("web-news-focus requires Provider browser capture before Remotion rendering");
  }
  if (spec.capture.highlights.length !== spec.highlights.length) {
    throw new Error("web-news-focus capture/highlight count mismatch");
  }
  return spec.capture;
};

const cameraFor = ({
  frame,
  fps,
  spec,
  capture,
  imageScale,
  imageLeft,
  imageTop,
  durationInFrames,
}: {
  frame: number;
  fps: number;
  spec: WebNewsFocusSpec;
  capture: WebNewsFocusCapture;
  imageScale: number;
  imageLeft: number;
  imageTop: number;
  durationInFrames: number;
}) => {
  const seconds = frame / fps;
  const pageCenter = {x: WIDTH / 2, y: HEIGHT / 2};
  const points = capture.highlights.map((highlight) => {
    const center = centerOf(highlight.unionRect);
    return {
      x: PAGE.left + imageLeft + center.x * imageScale,
      y: PAGE.top + PAGE.barHeight + imageTop + center.y * imageScale,
    };
  });
  let activeIndex = -1;
  for (let index = 0; index < spec.highlights.length; index++) {
    if (seconds >= spec.highlights[index].at - 0.16) activeIndex = index;
  }
  if (activeIndex < 0) return {x: 0, y: 0, zoom: 1};

  const current = points[activeIndex] ?? pageCenter;
  const previous = activeIndex === 0 ? pageCenter : points[activeIndex - 1] ?? pageCenter;
  const focusStart = spec.highlights[activeIndex].at - 0.16;
  const focusProgress = ease((seconds - focusStart) / (CAMERA_FOCUS_FRAMES / fps));
  const x = mix(previous.x, current.x, focusProgress);
  const y = mix(previous.y, current.y, focusProgress);
  const zoomIn = ease((seconds - (spec.highlights[activeIndex].at - 0.03)) / (0.42));
  const nextAt = spec.highlights[activeIndex + 1]?.at;
  const zoomOutStart = nextAt === undefined
    ? Math.max(spec.highlights[activeIndex].at + 1.05, durationInFrames / fps - 0.48)
    : nextAt - 0.22;
  const zoomOut = ease((seconds - zoomOutStart) / 0.32);
  const startZoom = activeIndex === 0 ? 1 : 1.2;
  const focusedZoom = mix(startZoom, CAMERA_ZOOM, zoomIn);
  const zoom = mix(focusedZoom, Math.min(focusedZoom, 1.16), zoomOut);
  return {
    x: WIDTH / 2 - x * zoom,
    y: HEIGHT / 2 - y * zoom,
    zoom,
  };
};

const BrowserBar = ({url}: {url: string}) => <div style={{
  position: "absolute",
  left: 0,
  top: 0,
  width: PAGE.width,
  height: PAGE.barHeight,
  display: "flex",
  alignItems: "center",
  gap: 9,
  padding: "0 18px",
  boxSizing: "border-box",
  background: "#e7ecea",
  color: "#55635e",
  fontFamily: "Consolas, 'Cascadia Mono', monospace",
  fontSize: 15,
  whiteSpace: "nowrap",
  overflow: "hidden",
  zIndex: 3,
}}>
  <i style={{width: 12, height: 12, borderRadius: "50%", background: "#ef625d", flex: "0 0 auto"}} />
  <i style={{width: 12, height: 12, borderRadius: "50%", background: "#e6b34f", flex: "0 0 auto"}} />
  <i style={{width: 12, height: 12, borderRadius: "50%", background: "#59bd69", flex: "0 0 auto"}} />
  <span style={{marginLeft: 14, overflow: "hidden", textOverflow: "ellipsis"}}>{canonicalUrlLabel(url)}</span>
</div>;

const WebPage = ({spec, capture, frame, fps, durationInFrames}: {
  spec: WebNewsFocusSpec;
  capture: WebNewsFocusCapture;
  frame: number;
  fps: number;
  durationInFrames: number;
}) => {
  const imageWidth = capture.viewport.width;
  const imageHeight = capture.viewport.height;
  const contentWidth = PAGE.width - 36;
  const contentHeight = PAGE.height - PAGE.barHeight - 18;
  const imageScale = Math.min(contentWidth / imageWidth, contentHeight / imageHeight);
  const imageLeft = (PAGE.width - imageWidth * imageScale) / 2;
  const imageTop = (contentHeight - imageHeight * imageScale) / 2;
  const camera = cameraFor({
    frame,
    fps,
    spec,
    capture,
    imageScale,
    imageLeft,
    imageTop,
    durationInFrames,
  });
  const seconds = frame / fps;
  const imageStyle: CSSProperties = {
    position: "absolute",
    left: imageLeft,
    top: imageTop,
    display: "block",
    width: imageWidth * imageScale,
    height: imageHeight * imageScale,
  };

  return <div style={{
    position: "absolute",
    inset: 0,
    transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.zoom})`,
    transformOrigin: "0 0",
  }}>
    <div style={{
      position: "absolute",
      left: PAGE.left,
      top: PAGE.top,
      width: PAGE.width,
      height: PAGE.height,
      overflow: "hidden",
      borderRadius: 12,
      background: "#dfe5e2",
      boxShadow: "0 30px 96px rgba(0,0,0,.62), 0 0 0 1px rgba(255,255,255,.28)",
    }}>
      <BrowserBar url={spec.url} />
      <div style={{position: "absolute", left: 0, top: PAGE.barHeight, right: 0, bottom: 0, overflow: "hidden", background: "#f1f3f0"}}>
        <Img src={staticFile(capture.baseImage)} style={imageStyle} />
        {capture.highlights.map((highlight, index) => {
          const reveal = ease((seconds - spec.highlights[index].at) / (HIGHLIGHT_REVEAL_FRAMES / fps));
          return highlight.rects.map((rect, rectIndex) => {
            const displayRect = {
              x: rect.x * imageScale,
              y: rect.y * imageScale,
              width: rect.width * imageScale,
              height: rect.height * imageScale,
            };
            return <Img
              key={`highlight-${index}-${rectIndex}`}
              src={staticFile(capture.highlightedImage)}
              style={{
                ...imageStyle,
                clipPath: clipForRect(displayRect, reveal, imageWidth * imageScale, imageHeight * imageScale),
                opacity: reveal <= 0 ? 0 : 1,
              }}
            />;
          });
        })}
      </div>
    </div>
  </div>;
};

export const WebNewsFocusTemplate = ({spec, style}: Props) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const capture = captureOrThrow(spec);
  const entranceProgress = ease(frame / Math.max(1, Math.round(0.64 * fps)));
  const opacity = spec.entrance === "fade" ? entranceProgress : 1;
  const translateX = spec.entrance === "slide-right" ? (1 - entranceProgress) * WIDTH : 0;

  return <AbsoluteFill style={{background: "#070b0d", color: "#edf7f1", overflow: "hidden", ...style}}>
    <div style={{position: "absolute", inset: 0, opacity: 0.2, backgroundImage: "linear-gradient(rgba(109,170,145,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(109,170,145,.18) 1px, transparent 1px)", backgroundSize: "72px 72px", transform: "perspective(700px) rotateX(58deg) translateY(290px) scale(1.5)", transformOrigin: "50% 100%"}} />
    <div style={{position: "absolute", left: 120, top: 22, color: "#83d5ae", fontFamily: "Consolas, 'Cascadia Mono', monospace", fontSize: 15, letterSpacing: "0.12em"}}>REAL WEB / DOM FOCUS</div>
    <div style={{position: "absolute", right: 120, top: 22, color: "#718b80", fontFamily: "Consolas, 'Cascadia Mono', monospace", fontSize: 14, letterSpacing: "0.08em"}}>ENTRANCE / {spec.entrance.toUpperCase()}</div>
    <div style={{position: "absolute", inset: 0, opacity, transform: `translate3d(${translateX}px, 0, 0)`}}>
      <WebPage spec={spec} capture={capture} frame={frame} fps={fps} durationInFrames={durationInFrames} />
    </div>
    <Sequence from={0} durationInFrames={Math.max(1, Math.round(0.9 * fps))} layout="none">
      <Audio src={staticFile("audio/whoosh-fast.mp3")} volume={spec.entrance === "cut" ? 0.1 : 0.13} />
    </Sequence>
    {spec.highlights.map((highlight, index) => <Sequence
      key={`focus-sound-${index}`}
      from={Math.max(0, Math.round(highlight.at * fps))}
      durationInFrames={Math.max(1, Math.round(0.18 * fps))}
      layout="none"
    >
      <Audio src={staticFile("audio/click-shutter.mp3")} volume={0.07} />
    </Sequence>)}
  </AbsoluteFill>;
};
