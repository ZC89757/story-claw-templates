import {useCurrentFrame, useVideoConfig} from "remotion";
import {clamp, ease, PortraitMedia, type PortraitDemo} from "../../common";
import type {PeakEndSpec} from "./contracts";

const serif = "SimSun, 'Songti SC', serif";
const roman = "'Times New Roman', serif";
// The drawing stays in a 360 px camera space. The outer loop zooms around the peak,
// then travels right along the same path. Marker text uses screen-space coordinates.
const trace = "M0 144 C9 148 17 155 25 154 C35 151 43 139 60 139 C72 139 76 147 84 167 C91 183 96 190 103 176 C112 160 117 144 129 145 C147 144 173 164 185 172 C194 176 201 157 210 139 C217 127 225 136 236 142 C248 149 256 139 267 143 C279 146 284 151 293 148 C304 146 307 134 315 151 C322 164 329 189 336 187 C343 183 351 172 356 160 C359 154 359 142 359 126";
const box = {position: "absolute", whiteSpace: "nowrap"} as const;
const red = "#d9000b";
const reference = "D:/MG_Reference_Library/creators/latepost/effects/V05_003/reference.mp4";

export function PeakEndCurve({spec}: {spec: PeakEndSpec}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  const nameIn = ease((time - .87) / .89);
  const titleIn = ease((time - spec.principle.at) / .55);
  const draw = clamp((time - spec.curve.at) / 1.13);
  const peakAge = time - spec.peak.at;
  const endAge = time - spec.endpoint.at;
  const zoom = ease(peakAge / .52);
  const pan = ease((endAge - .06) / .68);
  const drift = clamp((endAge - .74) / 4);
  const xScale = 1 + .75 * zoom + .26 * pan;
  const yScale = 1 + .48 * zoom + .55 * pan;
  const shiftX = -201 * zoom - 200 * pan - 14 * drift;
  const shiftY = -60 * zoom - 70 * pan;
  const imageScale = 1 - .09 * clamp(time / 12.2);
  const markers = [
    {x: 218, y: 133, elapsed: peakAge, label: spec.peak.label, color: "#f00000", dx: 4, dy: -13},
    {x: 359, y: 126, elapsed: endAge, label: spec.endpoint.label, color: "#ff0600", dx: 13, dy: 5},
  ];

  return <div style={{position: "absolute", inset: 0, overflow: "hidden", background:
    "linear-gradient(180deg,#433e3b 0px,#433e3b 33px,#382f2f 76px,#282627 111px,#100f11 182px,#010101 230px,#020202 254px,#070707 300px,#0b0b0b 472px,#626262 474px,#777 530px,#7e7e7e 566px,#7e7e7e 640px)"}}>
    <div style={{position: "absolute", left: 0, top: 271, width: 360, height: 202, overflow: "hidden",
      background: "linear-gradient(#060606,#252525 37%,#151515 77%,#0b0b0b)"}}>
      <PortraitMedia media={{source: spec.portrait, sourceStart: null}} style={{
        display: "block", filter: "grayscale(1)", transformOrigin: "50% 2%",
        transform: `scale(${imageScale})`,
        maskImage: "linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent), linear-gradient(#000 77%,transparent)", maskComposite: "intersect",
      }} />
      <div style={{position: "absolute", inset: 0, background: "linear-gradient(transparent 75%,#0a0a0a)"}} />
    </div>
    <svg width="360" height="264" viewBox="0 0 360 264" style={{position: "absolute", left: 0, top: 0}}>
      {markers.map(({x, y, elapsed, label, color, dx, dy}, index) => {
        const flash = ease(elapsed / .16);
        const settle = ease((elapsed - .12) / .32);
        const cx = x * xScale + shiftX;
        const cy = y * yScale + shiftY;
        return <g key={index} opacity={flash}>
          <circle cx={cx} cy={cy} r={20 + 27 * flash * (1 - settle)} fill={color}
            style={{filter: `blur(${3 * (1 - settle)}px)`}} />
          <text x={cx + dx} y={cy + dy} fill="#f7ece9" fontFamily={serif} fontSize={16}
            opacity={ease((elapsed - .03) / .23)}>{label}</text>
        </g>;
      })}
      {draw > 0 && <path d={trace} pathLength="1" fill="none" stroke="#f1efed"
        strokeWidth={1.3 + .55 * zoom} vectorEffect="non-scaling-stroke" strokeLinecap="round"
        transform={`translate(${shiftX} ${shiftY}) scale(${xScale} ${yScale})`}
        strokeDasharray={draw < 1 ? `${draw} 1` : undefined}/>}
      <text x="28" y="209" fill="#383838" fontFamily={serif} fontSize="16"
        opacity={ease((time - spec.curve.at) / .77)}>体验均值</text>
    </svg>
    <div style={{...box, left: 46, top: 261, opacity: titleIn, font: `italic bold 30px/36px ${roman}`,
      color: "#bd0010", transform: "scaleX(.85)", transformOrigin: "left top", textShadow: "1px 1px 2px #100306"}}>{spec.principle.english}</div>
    <div style={{...box, left: 45, top: 296, opacity: titleIn, font: `700 44px/53px ${serif}`,
      color: "#fcfaf4", transform: "scaleX(.68) scaleY(1.23)", transformOrigin: "left top",
      textShadow: "1px 1px 2px #000a"}}>{spec.principle.name}</div>
    <div style={{...box, right: 25, top: 415, textAlign: "right", opacity: nameIn, transform: "scaleX(.67)", transformOrigin: "right top",
      clipPath: `inset(0 ${(1 - nameIn) * 100}% 0 0)`, textShadow: "1px 1px 2px #070707"}}>
      <div style={{color: red, font: `italic 13px/15px ${roman}`}}>{spec.person.english}</div>
      <div style={{color: "#f9f7ed", font: `700 18px/25px ${serif}`, transform: "scaleY(1.12)"}}>{spec.person.name}</div>
      <div style={{color: "#b7b7b7", font: `11px/13px ${serif}`}}>{spec.person.role}</div>
    </div>
  </div>;
}

export const peakEndDemo: PortraitDemo = {
  fps: 30,
  durationInFrames: 366,
  reference,
  spec: {
    portrait: "portrait-mg/latepost/footage-charts/kahneman.png",
    person: {name: "丹尼尔·卡尼曼", english: "Daniel Kahneman", role: "诺贝尔奖获得者、心理学家"},
    principle: {name: "峰终定律", english: "Peak-End Rule", at: 2.9},
    curve: {at: 3.92},
    peak: {label: "峰值", at: 6.57},
    endpoint: {label: "终点", at: 7.7},
  } satisfies PeakEndSpec,
};


