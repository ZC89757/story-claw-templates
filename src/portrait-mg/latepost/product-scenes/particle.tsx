import {OffthreadVideo, Sequence, useVideoConfig} from "remotion";
import {asset, type PortraitDemo} from "../../common";
import {particleContract, type ParticleSpec} from "./particle-contract";
import {assetRoot, Layer, phase, song, useSeconds} from "./shared";

const sourceBoundaries = [0, 3.15, 7.1, 9];
const plate = assetRoot + "particles-alpha.webm";

function ParticleCompression({spec}: {spec: ParticleSpec & {_duration?: number}}) {
  const {fps, durationInFrames} = useVideoConfig();
  const time = useSeconds();
  const segments = [0, spec.zoom.at, spec.compression.at, spec._duration ?? durationInFrames / fps].map(value => Math.round(value * fps));
  const questionOpacity = 1 - phase(time, spec.zoom.at - .29, .29);
  const answerProgress = phase(time, spec.compression.at, .31);
  const questionStart = spec.zoom.at * .21;
  return <Layer style={{background: "black"}}>
    {sourceBoundaries.slice(0, -1).map((start, index) => {
      const duration = Math.max(1, segments[index + 1] - segments[index]);
      return <Sequence key={start} from={segments[index]} durationInFrames={duration} layout="none">
        <OffthreadVideo src={asset(plate)} trimBefore={Math.round(start * fps)} transparent muted
          playbackRate={(sourceBoundaries[index + 1] - start) * fps / duration}
          style={{position: "absolute", left: 0, top: 0, width: "100%", height: "100%"}} />
      </Sequence>;
    })}
    <div style={{position: "absolute", top: 155, right: 24, opacity: questionOpacity, textAlign: "right",
      font: "italic 49px/1 'Times New Roman', serif", color: "#ed0010", transform: "scaleX(.74)", transformOrigin: "right center"}}>
      Part.{spec.part}
    </div>
    <div style={{position: "absolute", top: 209, left: 135, opacity: questionOpacity, whiteSpace: "nowrap",
      font: `900 57px/1 ${song}`, color: "white", transform: "scaleX(.45)", transformOrigin: "left top"}}>
      {[...spec.question].map((char, index) => {
        const progress = phase(time, questionStart + index * spec.zoom.at * .047, .17);
        return <span key={index} style={{display: "inline-block", opacity: progress,
          transform: `translateY(${(1 - progress) * 12}px)`}}>{char}</span>;
      })}
    </div>
    <div style={{position: "absolute", top: 139, left: 180, color: "white", font: `900 121px/1 ${song}`, whiteSpace: "nowrap",
      opacity: answerProgress, transform: `translate(-50%,${(1 - answerProgress) * 28}px) scale(.50,1.14)`}}>
      {spec.compression.text}
    </div>
  </Layer>;
}

const spec: ParticleSpec = {part: 1, question: "蒸馏到底是什么?", zoom: {at: 3.15}, compression: {text: "压缩", at: 7.1}};
const demo: PortraitDemo = {spec, durationInFrames: 270, fps: 30, reference: "BV1jchK6REaB · 53.433–62.433"};
export const particleCompression = {...particleContract, Component: ParticleCompression, demo} as const;
