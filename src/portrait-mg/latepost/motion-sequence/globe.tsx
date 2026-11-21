import {OffthreadVideo} from "remotion";
import {asset, type PortraitDemo} from "../../common";
import {Layer, phase, song, useSeconds} from "./shared";
import {globeContract, type GlobeSpec} from "./globe-contract";
import tracking from "./globe-tracking.json";

const angles = [32, -34, 33];
const plate = "portrait-mg/latepost/motion-sequence/globe-plate.mp4";

function GlobeConvergence({spec}: {spec: GlobeSpec}) {
  const time = useSeconds();
  const cue = spec.strategy.at;
  const index = Math.min(tracking.length - 1, Math.round(time * 30));
  const pose = tracking[index];
  const dim = phase(time, cue, .36);
  const red = phase(time, cue, .25);
  const white = phase(time, cue + .14, .36);

  return <Layer style={{background: "#151411"}}>
    <OffthreadVideo src={asset(plate)} muted
      style={{position: "absolute", width: "100%", height: "100%"}} />
    {[spec.names.upperLeft, spec.names.lowerLeft, spec.names.lowerRight].map((name, index) => {
      const [x, y, opacity] = pose[index];
      return <div key={index} style={{position: "absolute", left: x, top: y, opacity,
        transform: `translate(-50%,-50%) rotate(${angles[index]}deg)`,
        font: '700 20px/1 Arial, "Microsoft YaHei", sans-serif', color: "#090909", whiteSpace: "nowrap"}}>
        {name}
      </div>;
    })}
    <Layer style={{background: "black", opacity: dim * .29}} />
    <div style={{position: "absolute", left: 51, top: 252, color: "#c41632", textShadow: "1px 1px 3px #47000b",
      font: `900 48px/1 ${song}`, transform: `scaleX(.63) translateY(${(1-red)*9}px)`,
      transformOrigin: "left center", opacity: red, clipPath: `inset(0 0 0 ${(1-red)*63}%)`, whiteSpace: "nowrap"}}>
      {spec.strategy.heading}
    </div>
    <div style={{position: "absolute", left: 53, top: 279, color: "#fff", textShadow: "1px 2px 2px black",
      font: `900 32px/.94 ${song}`, transform: `scaleX(.62) translateY(${(1-white)*10}px)`,
      transformOrigin: "left center", clipPath: `inset(0 0 0 ${(1-white)*92}%)`, opacity: white, whiteSpace: "nowrap"}}>
      <div>{spec.strategy.firstLine}</div>
      <div>{spec.strategy.secondLine}</div>
    </div>
  </Layer>;
}

const spec: GlobeSpec = {
  names: {upperLeft: "eBay", lowerLeft: "Etsy", lowerRight: "速卖通"},
  strategy: {at: .9, heading: "暗线3", firstLine: "eBay在海外对垒", secondLine: "Etsy和速卖通"},
};

const demo: PortraitDemo = {spec, durationInFrames: 96, fps: 30, reference: "BV1fdmvBmEqh", referenceStart: 140};
export const globeConvergence = {...globeContract, Component: GlobeConvergence, demo} as const;
