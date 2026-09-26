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
const PAGE = {left: 120, top: 60, width: 1680, height: 960, barHeight: 48};
const CAMERA_TARGET_LINE_HEIGHT = 34;
const CAMERA_MAX_ZOOM = 2.8;
const CAMERA_FOCUS_FRAMES = 18;
const HIGHLIGHT_REVEAL_FRAMES = 14;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const ease = (value: number): number => Easing.out(Easing.cubic)(clamp01(value));
const mix = (from: number, to: number, amount: number): number => from + (to - from) * amount;

const centerOf = (rect: WebNewsFocusRect) => ({
  x: rect.x + rect.width / 2,
  y: rect.y + rect.height / 2,
});

const median = (values: number[]): number => {
  if (!values.length) return 1;
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.floor(ordered.length / 2)];
};

const targetZoomFor = (
  highlight: WebNewsFocusCapture["highlights"][number],
  imageScale: number,
  contentWidth: number,
  contentHeight: number,
): number => {
  const lineHeight = median(highlight.rects.map((rect) => rect.height).filter((height) => height > 0));
  const lineHeightZoom = CAMERA_TARGET_LINE_HEIGHT / (lineHeight * imageScale);
  const widthZoom = contentWidth * 0.92 / (highlight.unionRect.width * imageScale);
  const heightZoom = contentHeight * 0.8 / (highlight.unionRect.height * imageScale);
  return Math.max(1, Math.min(CAMERA_MAX_ZOOM, lineHeightZoom, widthZoom, heightZoom));
};

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
  contentWidth,
  contentHeight,
}: {
  frame: number;
  fps: number;
  spec: WebNewsFocusSpec;
  capture: WebNewsFocusCapture;
  imageScale: number;
  contentWidth: number;
  contentHeight: number;
}) => {
  const seconds = frame / fps;
  const pageCenter = {x: contentWidth / 2, y: contentHeight / 2};
  const points = capture.highlights.map((highlight) => {
    const center = centerOf(highlight.unionRect);
    return {
      x: center.x * imageScale,
      y: center.y * imageScale,
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
  const focus = {
    x: mix(previous.x, current.x, focusProgress),
    y: mix(previous.y, current.y, focusProgress),
  };
  const previousZoom = activeIndex === 0
    ? 1
    : targetZoomFor(capture.highlights[activeIndex - 1], imageScale, contentWidth, contentHeight);
  const currentZoom = targetZoomFor(capture.highlights[activeIndex], imageScale, contentWidth, contentHeight);
  const zoom = mix(previousZoom, currentZoom, focusProgress);
  const imageWidth = capture.viewport.width * imageScale;
  const imageHeight = capture.viewport.height * imageScale;
  const x = clamp(
    contentWidth / 2 - focus.x * zoom,
    Math.min(0, contentWidth - imageWidth * zoom),
    0,
  );
  const y = clamp(
    contentHeight / 2 - focus.y * zoom,
    Math.min(0, contentHeight - imageHeight * zoom),
    0,
  );
  return {
    x,
    y,
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

const WebPage = ({spec, capture, frame, fps}: {
  spec: WebNewsFocusSpec;
  capture: WebNewsFocusCapture;
  frame: number;
  fps: number;
}) => {
  const imageWidth = capture.viewport.width;
  const imageHeight = capture.viewport.height;
  const contentWidth = PAGE.width - 36;
  const contentHeight = PAGE.height - PAGE.barHeight - 18;
  const imageScale = contentWidth / imageWidth;
  const camera = cameraFor({
    frame,
    fps,
    spec,
    capture,
    imageScale,
    contentWidth,
    contentHeight,
  });
  const seconds = frame / fps;
  const imageStyle: CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    display: "block",
    width: imageWidth * imageScale,
    height: imageHeight * imageScale,
  };

  return <div style={{
    position: "absolute",
    inset: 0,
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
      <div style={{position: "absolute", left: 0, top: PAGE.barHeight, right: 0, bottom: 18, overflow: "hidden", background: "#f1f3f0"}}>
        <div style={{position: "absolute", inset: 0, overflow: "hidden"}}>
          <div style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: imageWidth * imageScale,
            height: imageHeight * imageScale,
            transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.zoom})`,
            transformOrigin: "0 0",
          }}>
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
      <WebPage spec={spec} capture={capture} frame={frame} fps={fps} />
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
