import {useId} from "react";
import {useCurrentFrame, useVideoConfig} from "remotion";
import {clamp, PortraitMedia, type PortraitDemo} from "../../common";
import type {
  CrewAppealsSpec, InterviewContrastSpec, OfficeMonologueSpec, OverheadQuestionSpec,
} from "./contracts";
import {demoRoot, red, serif, shown, tick} from "./quotes";

function useSeconds() {
  const frame = useCurrentFrame();
  return frame / useVideoConfig().fps;
}

function tallText(top: number, widthScale: number) {
  return {
    position: "absolute", left: 0, top, width: 360, color: "#fffefa", textAlign: "center",
    fontFamily: serif, fontSize: 46, fontWeight: 500, lineHeight: "56px",
    whiteSpace: "nowrap", WebkitTextStroke: ".22px currentColor",
    transformOrigin: "center top", transform: `scale(${widthScale}, 1.85)`,
  } as const;
}

export function OverheadQuestion({spec}: {spec: OverheadQuestionSpec}) {
  const time = useSeconds();
  const mask = `overhead-${useId().replace(/[^A-Za-z0-9-]/g, "")}`;
  const reveal = tick(time, spec.question.at, .58);
  return <div style={{position: "absolute", inset: 0, background: "#fb0904"}}>
    <PortraitMedia media={spec.background}/>
    {spec.question.lines.map((text, i) => <div key={i} style={{
      ...tallText(i === 0 ? 104 : 274, 1), opacity: reveal, fontSize: 51,
      left: i === 0 ? -3 : 3,
      transform: `scale(${i === 0 ? 1.27 : 1.078}, 2.83)`, WebkitTextStroke: ".65px currentColor",
    }}>{text}</div>)}
    {reveal > 0 && <>
      <svg aria-hidden width={0} height={0} style={{position: "absolute"}}>
        <defs>
          <filter id={mask} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -7 7 0 0 1"/>
          </filter>
        </defs>
      </svg>
      <PortraitMedia media={spec.background} style={{position: "absolute", inset: 0, filter: `url(#${mask})`}}/>
    </>}
  </div>;
}

export function OfficeMonologue({spec}: {spec: OfficeMonologueSpec}) {
  const time = useSeconds();
  const firstLineAt = spec.quote[0].at;
  const pop = tick(time, firstLineAt - .48, .46);
  const caption = tick(time, .16, .29);
  return <div style={{position: "absolute", inset: 0, background: "#212120"}}>
    <PortraitMedia media={spec.background}/>
    <div style={{
      position: "absolute", left: 34, top: 109, color: "#fffefa",
      fontFamily: serif, fontSize: 17, lineHeight: "22px", whiteSpace: "nowrap",
      transformOrigin: "left center", transform: `translateY(${7 * (1 - caption)}px) scale(.82,1.23)`,
      opacity: caption, textShadow: "1px 1px 3px #141414",
    }}>—{spec.speaker}</div>
    {pop > 0 && <div style={{
      position: "absolute", left: 32, top: 136, width: 305, height: 130, background: "#ee0803",
      clipPath: "polygon(0 6%, 99% 0, 100% 74%, 79% 78%, 69% 100%, 69% 79%, 0 84%)",
      transformOrigin: "92% 97%", transform: `scale(${.035 + .965 * pop})`,
    }}>
      <div style={{
        position: "absolute", left: 11, top: 14, whiteSpace: "nowrap", color: "#fffcec",
        fontFamily: serif, fontSize: 17, fontWeight: 500, lineHeight: "22px",
        transform: "scaleX(.65)", transformOrigin: "left top",
        textShadow: "0 0 .35px #fff4e1",
      }}>
        {spec.quote.map(({text, at}, i) => <div key={i} style={{height: 22}}>
          {time >= at && shown(text, time - at, .065)}
        </div>)}
      </div>
    </div>}
  </div>;
}

export function InterviewContrast({spec}: {spec: InterviewContrastSpec}) {
  const time = useSeconds();
  const {fps, durationInFrames} = useVideoConfig();
  const end = spec._duration ?? durationInFrames / fps;
  const videoPush = .27 + .13 * clamp(time / end);
  const terms = [spec.upper, spec.lower];
  const versus = tick(time, spec.lower.at - .15, .16);
  return <div style={{position: "absolute", inset: 0,
    background: "linear-gradient(#000 20%, #272727 63%, #727272 100%)"}}>
    <div style={{position: "absolute", left: 0, top: 133, width: 360, height: 315, overflow: "hidden"}}>
      <PortraitMedia media={spec.interview} style={{
        transform: `scale(${1 + videoPush})`, transformOrigin: "84% 24%",
      }}/>
    </div>
    {terms.map(({at, text}, i) => {
      const p = tick(time, at, .19);
      return <div key={i} style={{
        ...tallText(i === 0 ? 136 : 298, .84),
        opacity: clamp(p * 1.3), textShadow: "3px 4px 6px #191a1977",
        filter: `blur(${(1 - p) * 2.2}px)`,
        transform: `translateY(${12 * (1 - p)}px) scale(.86,2.15)`,
        WebkitTextStroke: ".55px currentColor",
      }}>{text}</div>;
    })}
    <div style={{
      position: "absolute", left: 107, top: 209, width: 130, textAlign: "center",
      color: "#e20708", fontFamily: "'Times New Roman', serif", fontSize: 64, lineHeight: "66px",
      opacity: versus, textShadow: "1px 2px 7px #6d0005",
      transformOrigin: "center top", transform: `translateY(${12 * (1 - versus)}px) scale(.99,2.16)`,
    }}>VS</div>
  </div>;
}

const appealPositions = [
  {x: -10, y: 276, opacity: .43}, {x: 48, y: 322, opacity: .68},
  {x: 153, y: 365, opacity: .52}, {x: -9, y: 394, opacity: .38},
  {x: 228, y: 438, opacity: .26}, {x: -7, y: 451, opacity: .32},
  {x: 132, y: 478, opacity: .32}, {x: 51, y: 524, opacity: .24},
  {x: 197, y: 552, opacity: .22},
];

export function CrewAppeals({spec}: {spec: CrewAppealsSpec}) {
  const time = useSeconds();
  const gather = tick(time, spec.quote.at - .55, .59);
  const main = tick(time, spec.quote.at, .61);
  return <div style={{position: "absolute", inset: 0, background: "#201c15"}}>
    <PortraitMedia media={spec.background}/>
    {spec.appeals.map(({at, text}, i) => {
      const {x, y, opacity} = appealPositions[i];
      const appear = tick(time, at, .29);
      return <div key={i} style={{
        position: "absolute", left: x, top: y, fontFamily: serif, fontSize: 18,
        lineHeight: "24px", color: "#e2dcd1", whiteSpace: "nowrap",
        opacity: opacity * appear * (1 - gather),
        filter: `blur(${(1 - appear) * 5 + 5 * gather}px)`,
        transformOrigin: "left center", transform: "scale(.92, 1.24)",
      }}>“{text}”</div>;
    })}
    <div style={{
      position: "absolute", top: 375, left: 0, width: 360, textAlign: "center",
      color: "#e0dace", opacity: main, fontFamily: serif, fontSize: 25,
      lineHeight: "35px", whiteSpace: "nowrap", transform: "scale(.85,1.36)", transformOrigin: "center top",
      filter: `blur(${(1 - main) * 6}px)`,
    }}>
      <div>“{spec.quote.lines[0]}</div>
      <div>{spec.quote.lines[1]}”</div>
    </div>
  </div>;
}

export const overheadQuestionDemo: PortraitDemo = {
  fps: 30, durationInFrames: 130, reference: "BV17TWg6QE2G · 48.200–52.567",
  spec: {
    background: {source: demoRoot + "overhead.mp4", sourceStart: 0},
    question: {at: 2.83, lines: ["AI天才", "不需要管理？"]},
  } satisfies OverheadQuestionSpec,
};

export const officeMonologueDemo: PortraitDemo = {
  fps: 30, durationInFrames: 429, reference: "BV17TWg6QE2G · 114.467–128.767",
  spec: {
    background: {source: demoRoot + "office.mp4", sourceStart: 0},
    speaker: "一位智谱人士",
    quote: [
      {at: 1.94, text: "“我们当时把 OpenAI 和 Anthropic 的路线分别比作"},
      {at: 4.41, text: "‘科学家’和‘工程师’。业内在跟进 OpenAI"},
      {at: 7.93, text: "路线时，主张 Coding 的研究员认为智谱应把更多力量"},
      {at: 10.88, text: "投向后者。”"},
    ],
  } satisfies OfficeMonologueSpec,
};

export const interviewContrastDemo: PortraitDemo = {
  fps: 30, durationInFrames: 104, reference: "BV17TWg6QE2G · 251.033–254.533",
  spec: {
    interview: {source: demoRoot + "interview.mp4", sourceStart: 0},
    upper: {at: .10, text: "技术人才自主权"},
    lower: {at: 1.48, text: "大公司组织需求"},
  } satisfies InterviewContrastSpec,
};

export const crewAppealsDemo: PortraitDemo = {
  fps: 30, durationInFrames: 525, reference: "BV1CqxF6MEcu · 295.534–313.050",
  spec: {
    background: {source: demoRoot + "crew.mp4", sourceStart: 0},
    appeals: [
      {at: .62, text: "希望休息时能真正休息"}, {at: 1.15, text: "遇到冲突时有人撑腰"},
      {at: 1.58, text: "降低工作量，提高待遇"}, {at: 2.48, text: "尊重员工"},
      {at: 2.96, text: "改善排班"}, {at: 3.36, text: "减少重复考核"},
      {at: 3.78, text: "辛苦工作应得到回报"}, {at: 4.08, text: "改进投诉考核"},
      {at: 4.34, text: "能被公平对待"},
    ],
    quote: {at: 11.65, lines: ["我们为乘客提供安全感，", "也希望工作能给自己安全感。"]},
  } satisfies CrewAppealsSpec,
};
