import {Audio, Sequence, staticFile, useVideoConfig} from "remotion";

export type TitleSfxCue = {
  /** Offset from the title's own `at` in seconds. */
  at: number;
  file: string;
  volume: number;
  /** Optional playback window; the source is otherwise allowed to finish. */
  duration?: number;
};

type Props = {baseAt: number; cues: readonly TitleSfxCue[]};

/**
 * Fixed, style-owned sound design. `baseAt` is normally the title spec's local
 * timestamp (zero in a resolved MG call), but keeping it here also makes the
 * component previewable as a standalone composition.
 */
export const TitleSfx = ({baseAt, cues}: Props) => {
  const {fps} = useVideoConfig();
  const baseFrame = Math.round(baseAt * fps);
  return <>
    {cues.map((cue, index) => {
      const from = baseFrame + Math.max(0, Math.round(cue.at * fps));
      const durationInFrames = cue.duration === undefined
        ? undefined
        : Math.max(1, Math.ceil(cue.duration * fps));
      return <Sequence
        key={`${cue.file}-${index}-${from}`}
        from={from}
        {...(durationInFrames === undefined ? {} : {durationInFrames})}
        layout="none"
      >
        <Audio src={staticFile(`audio/${cue.file}`)} volume={cue.volume} />
      </Sequence>;
    })}
  </>;
};
