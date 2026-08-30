import type {CSSProperties} from "react";
import {useCurrentFrame, useVideoConfig} from "remotion";
import {TitleLayout, titleFontSize} from "./TitleLayout";
import {clamp01, easeOutCubic, titleElapsed, titleHasStarted} from "./evaluate";
import type {TitleSpec} from "./types";
import {TitleSfx} from "./TitleSfx";

/** Shotcraft blur-slide was tuned at 30 fps; the title keeps that timing at any render fps. */
export const BLUR_SLIDE_TITLE_DURATION_FRAMES = 114;
export const BLUR_SLIDE_TITLE_DURATION_SECONDS = BLUR_SLIDE_TITLE_DURATION_FRAMES / 30;

const splitUnits = (text: string): string[] => {
  const trimmed = text.trim();
  // Shotcraft uses word-level reveals. For CJK text without spaces, characters are
  // the only reliable units available from the compact Function Calling spec.
  return /\s/u.test(trimmed) ? trimmed.split(/\s+/u) : Array.from(trimmed);
};

const remap = (value: number, start: number, end: number): number =>
  clamp01((value - start) / Math.max(Number.EPSILON, end - start));

type LineProps = {
  units: string[];
  progress: number;
  stagger: number;
  gap: string;
  dy: number;
  fontSize: number;
};

const RevealLine = ({units, progress, stagger, gap, dy, fontSize}: LineProps) => (
  <div style={{
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    columnGap: gap,
    rowGap: "0.12em",
    fontSize,
    lineHeight: 1.15,
    fontWeight: 850,
    maxWidth: 1640,
  }}>
    {units.map((unit, index) => {
      const unitProgress = easeOutCubic(remap(progress, index * stagger, index * stagger + 0.32));
      return <span
        key={`${index}-${unit}`}
        style={{
          display: "inline-block",
          opacity: unitProgress,
          transform: `translateY(${(1 - unitProgress) * dy}px)`,
          filter: `blur(${(1 - unitProgress) * 10}px)`,
          whiteSpace: "pre",
        }}
      >{unit}</span>;
    })}
  </div>
);

type Props = {spec: TitleSpec; style?: CSSProperties};

/**
 * Shotcraft's low-energy professional reveal: one shared eased progress drives
 * opacity, vertical motion and blur so those channels settle together.
 */
export const BlurSlideTitleTemplate = ({spec, style}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  if (!titleHasStarted(spec, seconds)) return null;

  const units = splitUnits(spec.text);
  const normalized = titleElapsed(spec, seconds) / BLUR_SLIDE_TITLE_DURATION_SECONDS;
  const titleProgress = remap(normalized, 0.06, 0.62);
  // Keep the original 3.5-frame feel for short labels, while preventing long
  // CJK strings from pushing the last unit outside the reveal window.
  const stagger = Math.min(0.055, 0.72 / Math.max(1, units.length - 1));
  const isWordLevel = /\s/u.test(spec.text.trim());
  const fontSize = Math.min(126, Math.max(62, titleFontSize(spec.text) * 1.15));

  return <TitleLayout spec={spec} style={style}>
    <TitleSfx baseAt={spec.at} cues={[{at: 0.16, file: "transition-soft.mp3", volume: 0.32, duration: 0.9}]} />
    <RevealLine
      units={units}
      progress={titleProgress}
      stagger={stagger}
      gap={isWordLevel ? "0.32em" : "0.12em"}
      dy={40}
      fontSize={fontSize}
    />
  </TitleLayout>;
};
