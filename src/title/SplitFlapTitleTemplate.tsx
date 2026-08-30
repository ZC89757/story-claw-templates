import type {CSSProperties, ReactNode} from "react";
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {TitleLayout} from "./TitleLayout";
import {titleElapsed, titleHasStarted} from "./evaluate";
import type {TitleSpec} from "./types";
import {TitleSfx, type TitleSfxCue} from "./TitleSfx";

export const SPLIT_FLAP_TITLE_DURATION_FRAMES = 140;
export const SPLIT_FLAP_TITLE_DURATION_SECONDS = SPLIT_FLAP_TITLE_DURATION_FRAMES / 30;

const DESIGN_FPS = 30;
const START = 22;
const STAGGER = 4;
const FLIP = 5;
const NFLIP = 3;
const CELL_W = 118;
const CELL_H = 156;
const SPACE_W = 52;
const CELL_GAP = 12;
const BOARD_PADDING = 24;
const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&";
const FLAP_BG = "#262624";
const FLAP_INK = "#f4f4f2";

const random01 = (seed: number): number => {
  const x = Math.sin(seed * 127.3) * 43758.5453;
  return x - Math.floor(x);
};

const garble = (index: number, pass: number): string =>
  CHARSET[Math.floor(random01(index * 7.13 + pass * 3.71 + 1) * CHARSET.length)];

const Half = ({ch, part}: {ch: string; part: "top" | "bottom"}) => (
  <div style={{
    position: "absolute",
    left: 0,
    top: part === "top" ? 0 : CELL_H / 2,
    width: CELL_W,
    height: CELL_H / 2,
    overflow: "hidden",
    background: FLAP_BG,
    borderRadius: part === "top" ? "10px 10px 0 0" : "0 0 10px 10px",
  }}>
    <div style={{
      position: "absolute",
      left: 0,
      top: part === "top" ? 0 : -CELL_H / 2,
      width: CELL_W,
      height: CELL_H,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Helvetica, Arial, sans-serif",
      fontWeight: 800,
      fontSize: 100,
      color: FLAP_INK,
    }}>{ch}</div>
  </div>
);

const FlapCell = ({target, index, frame}: {target: string; index: number; frame: number}) => {
  const sequence = [garble(index, 0), garble(index, 1), garble(index, 2), target];
  const local = frame - (START + index * STAGGER);
  const done = local >= NFLIP * FLIP;
  const clickY = done
    ? interpolate(local, [15, 17, 19, 22], [0, 6, -1.5, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    })
    : 0;

  let topChar = sequence[0];
  let bottomChar = sequence[0];
  let flap: ReactNode = null;
  if (done) {
    topChar = target;
    bottomChar = target;
  } else if (local > 0) {
    const pass = Math.min(NFLIP - 1, Math.floor(local / FLIP));
    const from = sequence[pass];
    const to = sequence[pass + 1];
    const progress = Easing.in(Easing.quad)((local - pass * FLIP) / FLIP);
    topChar = to;
    bottomChar = from;
    if (progress < 0.5) {
      const degrees = progress * 2 * 90;
      flap = <div style={{
        position: "absolute",
        inset: 0,
        transform: `rotateX(${-degrees}deg)`,
        transformOrigin: `center ${CELL_H / 2}px`,
        backfaceVisibility: "hidden",
        filter: `brightness(${1 - progress * 2 * 0.45})`,
        zIndex: 2,
      }}><Half ch={from} part="top" /></div>;
    } else {
      const degrees = 90 - (progress - 0.5) * 2 * 90;
      flap = <div style={{
        position: "absolute",
        inset: 0,
        transform: `rotateX(${degrees}deg)`,
        transformOrigin: `center ${CELL_H / 2}px`,
        backfaceVisibility: "hidden",
        filter: `brightness(${0.55 + (progress - 0.5) * 2 * 0.45})`,
        zIndex: 2,
      }}><Half ch={to} part="bottom" /></div>;
    }
  }

  return <div style={{
    position: "relative",
    width: CELL_W,
    height: CELL_H,
    transform: `translateY(${clickY}px)`,
    perspective: 420,
    borderRadius: 10,
    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.3)",
  }}>
    <Half ch={topChar} part="top" />
    <Half ch={bottomChar} part="bottom" />
    {flap}
    <div style={{
      position: "absolute",
      left: 0,
      top: CELL_H / 2 - 2,
      width: CELL_W,
      height: 4,
      background: "#141412",
      zIndex: 3,
    }} />
  </div>;
};

type Props = {spec: TitleSpec; style?: CSSProperties};

/** Shotcraft split-flap title with dynamic text and a compact, overlay-safe board. */
export const SplitFlapTitleTemplate = ({spec, style}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  if (!titleHasStarted(spec, seconds)) return null;

  const frameAtDesignRate = Math.floor(titleElapsed(spec, seconds) * DESIGN_FPS);
  const chars = Array.from(spec.text.trim().replace(/\s+/gu, " "));
  let letterIndex = 0;
  const contentWidth = chars.reduce(
    (total, char, index) => total + (index ? CELL_GAP : 0) + (char === " " ? SPACE_W : CELL_W),
    0,
  );
  const boardWidth = contentWidth + BOARD_PADDING * 2;
  const boardHeight = CELL_H + BOARD_PADDING * 2;
  const scale = Math.min(1, 1640 / Math.max(1, boardWidth));
  const scaledWidth = boardWidth * scale;
  const scaledHeight = boardHeight * scale;
  let sfxLetterIndex = 0;
  const sfxCues: TitleSfxCue[] = chars.flatMap((char) => {
    if (char === " ") return [];
    const cue = {
      at: (START + (sfxLetterIndex++) * STAGGER + NFLIP * FLIP) / DESIGN_FPS,
      file: "gear-lock-metallic.mp3",
      volume: 0.2,
      duration: 0.34,
    } satisfies TitleSfxCue;
    return [cue];
  });

  return <TitleLayout spec={spec} style={style}>
    <TitleSfx baseAt={spec.at} cues={sfxCues} />
    <div style={{position: "relative", width: scaledWidth, height: scaledHeight, maxWidth: "100%"}}>
      <div style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: boardWidth,
        height: boardHeight,
        boxSizing: "border-box",
        padding: BOARD_PADDING,
        display: "flex",
        alignItems: "center",
        gap: CELL_GAP,
        overflow: "hidden",
        background: "rgba(22, 23, 22, 0.94)",
        border: "1px solid rgba(244, 244, 242, 0.18)",
        borderRadius: 14,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}>
        {chars.map((char, index) => {
          if (char === " ") return <div key={`${index}-space`} style={{width: SPACE_W, height: CELL_H, flex: "0 0 auto"}} />;
          const cell = <FlapCell key={`${index}-${char}`} target={char} index={letterIndex} frame={frameAtDesignRate} />;
          letterIndex += 1;
          return cell;
        })}
      </div>
    </div>
  </TitleLayout>;
};
