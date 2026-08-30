import type {CSSProperties} from "react";
import {TitleLayout, titleFontSize} from "./TitleLayout";
import {clamp01, titleElapsed, titleHasStarted} from "./evaluate";
import type {TitleSpec} from "./types";
import {useCurrentFrame, useVideoConfig} from "remotion";
import {TitleSfx} from "./TitleSfx";

export const SCRAMBLE_TITLE_DURATION_FRAMES = 96;
export const SCRAMBLE_TITLE_DURATION_SECONDS = SCRAMBLE_TITLE_DURATION_FRAMES / 30;

const POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+=<>/\\";

// Deterministic noise is required for Remotion renders and for stable retries.
const random01 = (seed: number): number => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

type Props = {spec: TitleSpec; style?: CSSProperties};

/** Shotcraft scramble/decode title, generalized to the Function Calling text. */
export const ScrambleTitleTemplate = ({spec, style}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  if (!titleHasStarted(spec, seconds)) return null;

  const chars = Array.from(spec.text);
  const elapsed = titleElapsed(spec, seconds);
  const normalized = clamp01(elapsed / SCRAMBLE_TITLE_DURATION_SECONDS);
  const designFrame = Math.floor(elapsed * 30);
  const activeCount = Math.max(1, chars.filter((char) => char !== " ").length);
  const fontSize = Math.min(92, Math.max(42, titleFontSize(spec.text) * 0.82));
  let activeIndex = 0;

  return <TitleLayout spec={spec} style={style}>
    <TitleSfx baseAt={spec.at} cues={[{at: 0.2, file: "glitch-electric-small.mp3", volume: 0.28, duration: 0.7}]} />
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      alignItems: "center",
      maxWidth: 1640,
      fontFamily: '"SF Mono", "Cascadia Mono", "Microsoft YaHei", monospace',
      fontSize,
      lineHeight: 1.15,
      letterSpacing: "0.08em",
      textShadow: "none",
    }}>
      {chars.map((char, index) => {
        if (char === " ") {
          return <span key={`${index}-space`} style={{display: "inline-block", width: "0.45em"}}>{"\u00a0"}</span>;
        }

        const ordinal = activeIndex++;
        const lockAt = 0.25 + (ordinal / Math.max(1, activeCount - 1)) * 0.6 + random01(ordinal * 7) * 0.06;
        let content = char;
        let color = "#3d4560";
        let textShadow = "none";
        if (normalized < 0.06) {
          content = " ";
        } else if (normalized < lockAt) {
          content = POOL[Math.floor(random01(ordinal * 131 + Math.floor(designFrame / 2)) * POOL.length)];
        } else {
          const flash = 1 - clamp01((normalized - lockAt) / 0.1);
          color = flash > 0.4 ? "#dff3ff" : "#e8eaf0";
          textShadow = `0 0 ${flash * 18}px rgba(120, 200, 255, ${flash})`;
        }

        return <span
          key={`${index}-${char}`}
          style={{
            display: "inline-flex",
            minWidth: "0.72em",
            justifyContent: "center",
            color,
            textShadow,
            whiteSpace: "pre",
          }}
        >{content === " " ? "\u00a0" : content}</span>;
      })}
    </div>
  </TitleLayout>;
};
