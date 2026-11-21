import type {ReactNode} from "react";
import {Sequence, useVideoConfig} from "remotion";
import {clamp, ease, PortraitMedia, type PortraitDemo} from "../../common";
import {charcoal, cover, demoAsset, reference, roman, song, travel, useSeconds} from "./shared";
import {hoursConversionContract, payrollCasesContract, type HoursConversionSpec, type PayrollCasesSpec} from "./work-hours-contract";

function Clock({seconds, exit}: {seconds: number; exit: number}) {
  const fade = 1 - ease((seconds - exit + .27) / .27);
  return <div style={{position: "absolute", left: 54, width: 245, height: 245, top: 110, border: "2px solid #380504", borderRadius: "50%",
    background: "radial-gradient(ellipse at 74% 75%,#ef5c68,#f30008 51%,#e30008 100%)", boxShadow: "0 0 2px 2px #91110a,0 0 15px 6px #a80019",
    transform: `scale(${.88 + .12 * travel(seconds / .26)})`, opacity: fade}}>
    {[[112, -4, "12"], [207, 92, "3"], [112, 158, "6"], [17, 92, "9"]].map(([x, y, label]) =>
      <div key={label} style={{position: "absolute", left: x, top: y, font: `italic 55px/1 ${roman}`, color: "#190300", transform: "scaleX(.75)"}}>{label}</div>)}
    {[72, 106].map((height, index) =>
      <div key={height} style={{position: "absolute", left: 121, bottom: 122, width: index ? 2 : 3, height, background: "#ffece3",
        transformOrigin: "50% bottom", transform: `rotate(${index === 0 ? 240 + seconds * 167 : seconds * 465}deg)`}} />)}
    <div style={{position: "absolute", left: 117, top: 117, width: 10, height: 10, borderRadius: "50%", background: "#360600"}}/>
  </div>;
}

function WhiteStrip({x, y, width, time, children}: {x: number; y: number; width: number; time: number; children: ReactNode}) {
  return <div style={{position: "absolute", left: x, top: y, width, height: 57, background: "#fcfcfa",
    clipPath: `inset(0 ${100 * (1 - travel(time / .55))}% 0 0)`, overflow: "hidden"}}>
    <div style={{display: "flex", justifyContent: "center", alignItems: "center", height: "100%", whiteSpace: "nowrap", font: `bold 39px/1 ${song}`,
      transform: `scale(${width === 100 ? .62 : .70},1.39)`, color: "#090909"}}>
      {children}
    </div>
  </div>;
}

function HoursConversion({spec}: {spec: HoursConversionSpec}) {
  const seconds = useSeconds();
  return <div style={{...cover, background: "linear-gradient(#040203 20%,#2e2c2d 72%)"}}>
    <Clock seconds={seconds} exit={spec.wage.at}/>
    <div style={{position: "absolute", top: 246, left: 0, width: 360, height: 394,
      maskImage: "linear-gradient(169deg,transparent 1%,#0002 8%,black 26%)"}}>
      <PortraitMedia media={spec.background} style={{filter: "grayscale(1) contrast(1.23)", objectPosition: "45% 52%"}}/>
    </div>
    <WhiteStrip x={130} y={109} width={100} time={seconds - spec.wage.at}>{spec.wage.label}</WhiteStrip>
    <WhiteStrip x={96} y={178} width={168} time={seconds - spec.monthly.at}>
      <span style={{font: `italic 50px/1 ${roman}`, color: "#c40520"}}>{spec.monthly.amount}</span>工时
    </WhiteStrip>
    <WhiteStrip x={96} y={247} width={168} time={seconds - spec.daily.at}>
      日均<span style={{font: `italic 50px/1 ${roman}`, color: "#c40520"}}>{spec.daily.amount}</span>小时
    </WhiteStrip>
  </div>;
}

function RedStrip({left, width, label, time}: {left: number; width: number; label: string; time: number}) {
  return <div style={{position: "absolute", left, top: 192, width, height: 62, background: "#d90002", textAlign: "center",
    clipPath: `inset(0 ${100 * (1 - travel(time / .32))}% 0 0)`, overflow: "hidden"}}>
    <div style={{font: `bold 39px/62px ${song}`, transform: "scale(.62,1.37)", whiteSpace: "nowrap", color: "#fff"}}>{label}</div>
  </div>;
}

function PayrollCases({spec}: {spec: PayrollCasesSpec}) {
  const seconds = useSeconds();
  const {fps} = useVideoConfig();
  const current = seconds < spec.second.at ? spec.first : spec.second;
  const progress = travel((seconds - current.takeHome.at) / .39);
  const frameAt = (time: number) => Math.round(time * fps);
  const clips = [
    {media: spec.first.exterior, from: 0, end: spec.first.production.at},
    {media: spec.first.production, from: spec.first.production.at, end: spec.second.at},
    {media: spec.second.exterior, from: spec.second.at, end: spec.second.production.at},
    {media: spec.second.production, from: spec.second.production.at, end: undefined},
  ];
  return <div style={{...cover, background: charcoal}}>
    <div style={{position: "absolute", left: 0, top: 149, width: 360, height: 281, overflow: "hidden"}}>
      {clips.map(({media, from, end}) => <Sequence key={from} from={frameAt(from)} durationInFrames={end === undefined ? undefined : frameAt(end) - frameAt(from)} layout="none">
        <PortraitMedia media={media} />
      </Sequence>)}
    </div>
    <RedStrip left={43} width={120} label={current.hours.label} time={seconds - current.hours.at}/>
    <RedStrip left={188} width={136} label={current.shift.label} time={seconds - current.shift.at}/>
    <div style={{position: "absolute", left: -50, top: 293, width: 460, height: 82, display: "flex", alignItems: "center", justifyContent: "center",
      font: `bold 64px/1 ${song}`, whiteSpace: "nowrap", color: "#fff", opacity: clamp(progress * 2),
      transform: `translateY(${(1 - progress) * 66}px) scale(.69,1.37)`, textShadow: "1px 2px 1px #0005"}}>
      到手<span style={{color: "#da0008", font: `74px/1 ${roman}`, letterSpacing: "-1px", margin: "0 6px"}}>{current.takeHome.amount}</span>元
    </div>
  </div>;
}

const hoursDemo: PortraitDemo = {
  spec: {
    background: {source: demoAsset("hours-conveyor.mp4"), sourceStart: 0},
    wage: {label: "工资上万", at: 3.43}, monthly: {amount: "400+", at: 4.85}, daily: {amount: "13+", at: 9.15},
  },
  durationInFrames: 344, fps: 30, reference: reference("V04_003"),
};

const payrollDemo: PortraitDemo = {
  spec: {
    first: {
      exterior: {source: demoAsset("work-exterior.mp4"), sourceStart: 0},
      production: {source: demoAsset("hours-conveyor.mp4"), sourceStart: 2.3, at: 3.12},
      hours: {label: "12小时", at: 1.2}, shift: {label: "上六休一", at: 2.28}, takeHome: {amount: "14000", at: 3.42},
    },
    second: {
      at: 8.42,
      exterior: {source: demoAsset("work-aerial.mp4"), sourceStart: 0},
      production: {source: demoAsset("work-production.mp4"), sourceStart: 0, at: 15.4},
      hours: {label: "四班三倒", at: 11.62}, shift: {label: "8小时夜班", at: 12.84}, takeHome: {amount: "18000", at: 14.43},
    },
  },
  durationInFrames: 482, fps: 30, reference: reference("V04_005"),
};

export const hoursConversion = {...hoursConversionContract, Component: HoursConversion, demo: hoursDemo} as const;
export const payrollCases = {...payrollCasesContract, Component: PayrollCases, demo: payrollDemo} as const;
