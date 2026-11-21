import {interpolate} from "remotion";
import {PortraitMedia, type PortraitDemo} from "../../common";
import {Layer, phase, song, useSeconds} from "./shared";
import {workHoursContract, type WorkHoursSpec} from "./work-hours-contract";

const track = {left: 28, top: 126, width: 304, height: 20, borderRadius: 12, overflow: "hidden"} as const;
const bright = "#ff0800";
const segments = [80, 141, 203, 264] as const;
const plate = "portrait-mg/latepost/motion-sequence/work-hours-plate.mp4";

function HoursNumber({hours, opacity, offset}: {hours: number; opacity: number; offset: number}) {
  const twoDigits = hours >= 10;
  return <div style={{position: "absolute", top: 204 + offset, left: "50%", opacity,
    transform: "translateX(-50%)", width: twoDigits ? 151 : 114, height: 145, whiteSpace: "nowrap"}}>
    <div style={{position: "absolute", left: twoDigits ? 0 : 4, top: 0, transform: twoDigits ? "scaleX(.59)" : "scaleX(.68)",
      transformOrigin: "left center", color: "#f40011", font: 'italic 163px/.99 "Times New Roman", serif',
      letterSpacing: -16, textShadow: "1px 1px 3px #92000b"}}>
      {hours}
    </div>
    <div style={{position: "absolute", left: twoDigits ? 87 : 62, top: 41, color: "white", whiteSpace: "nowrap",
      font: `900 71px/1 ${song}`, textShadow: "1px 2px 3px #111", transform: "scaleX(.46) scaleY(1.05)",
      transformOrigin: "left center"}}>
      小时
    </div>
  </div>;
}

function WorkHoursContrast({spec}: {spec: WorkHoursSpec}) {
  const time = useSeconds();
  const {total, paid} = spec;
  const paidReveal = phase(time, paid.at - .012, .116);
  const totalExit = phase(time, paid.at - .035, .105);
  const totalReveal = phase(time, total.at, .31);
  const dim = phase(time, total.at + .32, .73);
  const barTime = time / (total.at / (222 / 30));
  const progress = interpolate(barTime,
    [0, .50, 1, 2.25, 3.33, 4.90, 6.6, 7.67],
    [41, 42, 50, 92, 130, 181, 240, 278],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const solidAlpha = 1 - phase(time, total.at + .39, .48);
  const segmentAt = paid.at - .49;

  const {start, briefing, boarding, end} = spec.ticks;
  return <Layer style={{background: "#080708"}}>
    <Layer style={{filter: `brightness(${1 - .42 * dim}) blur(${4.5 * dim}px)`, transform: `scale(${1 + .024 * dim})`}}>
      <PortraitMedia media={spec.background} />
    </Layer>
    <Layer style={{background: "linear-gradient(#030305 0%, #030305a9 11%, #03030500 27%)"}} />
    <div style={{position: "absolute", ...track, background: "#e0000096"}}>
      <div style={{position: "absolute", left: 0, top: 0, bottom: 0, width: progress, background: bright,
        borderRadius: 12, opacity: solidAlpha, boxShadow: "2px 0 3px #ff140abf"}} />
      {segments.map((left,index) => {
        const alpha = phase(time, segmentAt + index * .10, .34);
        return <div key={left} style={{position: "absolute", left, top: 0, bottom: 0, width: 40, opacity: alpha,
          background: bright, borderRadius: 12, boxShadow: "0 0 4px 1px #ff140a80"}} />;
      })}
    </div>
    {[start, briefing, boarding, end].map((label, index) =>
      <div key={index} style={{position: "absolute", top: 157, left: [28,57,93,302][index], color: "#fff",
        font: '12px/1 "Arial Narrow", Arial, sans-serif', letterSpacing: -.4,
        textShadow: "0 1px 2px #444", whiteSpace: "nowrap"}}>
        {label}
      </div>
    )}
    <HoursNumber hours={total.hours} opacity={totalReveal * (1 - totalExit)} offset={(1 - totalReveal) * 30 - paidReveal * 21} />
    <HoursNumber hours={paid.hours} opacity={paidReveal} offset={(1 - paidReveal) * 26} />
  </Layer>;
}

const spec: WorkHoursSpec = {
  background: {source: plate, sourceStart: 0},
  ticks: {start: "4:30", briefing: "5:30", boarding: "7:30", end: "18:30"},
  total: {hours: 14, at: 222 / 30},
  paid: {hours: 6, at: 278 / 30},
};

const demo: PortraitDemo = {spec, durationInFrames: 328, fps: 30, reference: "BV1CqxF6MEcu", referenceStart: 101.3338};
export const workHoursContrast = {...workHoursContract, Component: WorkHoursContrast, demo} as const;
