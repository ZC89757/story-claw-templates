import {Img, useCurrentFrame, useVideoConfig} from "remotion";
import {asset, clamp, ease, type PortraitDemo} from "../../common";
import {pairedQuoteLetterSeconds, type CommentStackSpec, type PairedQuoteSpec} from "./contracts";

export const demoRoot = "portrait-mg/latepost/characters/";
export const serif = "SimSun, 'Songti SC', 'Noto Serif CJK SC', serif";
export const ink = "#100b0b";
export const red = "#c90015";
export const tick = (t: number, start: number, length: number) => ease((t - start) / length);
export const shown = (text: string, seconds: number, step: number) =>
  Array.from(text).slice(0, Math.max(0, Math.floor(seconds / step) + 1)).join("");

const bubbles = [
  {x: 90, y: 110, w: 200}, {x: 125, y: 159, w: 127},
  {x: 115, y: 209, w: 150}, {x: 81, y: 259, w: 215},
  {x: 99, y: 309, w: 182}, {x: 115, y: 358, w: 146},
  {x: 98, y: 406, w: 184},
];

export function CommentStack({spec}: {spec: CommentStackSpec}) {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const time = frame / fps;
  const end = spec._duration ?? durationInFrames / fps;
  return <div style={{position: "absolute", inset: 0, background: "#8f6952"}}>
    <Img src={asset(spec.photo)} style={{
      width: 360, height: 640, objectFit: "cover", transform: `scale(${1 + .105 * clamp(time / end)})`,
      transformOrigin: "49% 39%",
    }}/>
    {spec.comments.map(({text, at}, index) => {
      const {x, y, w} = bubbles[index];
      const p = tick(time, at, .21);
      const right = index % 2 === 1;
      if (p === 0) return null;
      return <div key={index} style={{
        position: "absolute", left: x, top: y, width: w, height: 46,
        background: "#fffdfc", borderRadius: 24,
        transform: `translateY(${14 * (1 - p)}px) scale(${.12 + .88 * p}, ${.17 + .83 * p})`,
        boxShadow: "0 0 9px #fff6",
      }}>
        <div style={{
          position: "absolute", bottom: -3, [right ? "right" : "left"]: 0,
          width: 21, height: 21, background: "#fffdfc",
          clipPath: right ? "polygon(0 0, 100% 100%, 2% 68%)" : "polygon(100% 0, 0 100%, 100% 62%)",
        }}/>
        <div style={{
          position: "absolute", inset: 0, overflow: "hidden",
          clipPath: `inset(${100 * (1 - tick(time, at + .105, .16))}% 0 0)`,
        }}>
          <span style={{
            position: "absolute", left: "50%", top: "50%", whiteSpace: "nowrap",
            fontFamily: serif, fontWeight: 900, fontSize: 25, color: ink,
            transform: "translate(-50%, -50%) scaleX(.785)", WebkitTextStroke: ".55px currentColor",
          }}>
            <span style={{color: red}}>“</span>{text}<span style={{color: red}}>”</span>
          </span>
        </div>
      </div>;
    })}
  </div>;
}

const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

export function PairedQuote({spec}: {spec: PairedQuoteSpec}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  const arrange = tick(time, spec.card.at, .52);
  const card = tick(time, spec.card.at + .38, .83);
  const mark = tick(time, spec.card.at + .71, .18);
  const highlight = tick(time, spec.highlight.at, .39);
  const last = spec.lines[2].text;
  const highlightIndex = last.lastIndexOf(spec.emphasis);
  return <div style={{position: "absolute", inset: 0,
    background: "radial-gradient(ellipse at 54% 113%,#ffe4e3 0%,#fbf4ef 34%,#faf6f1 68%,#fcf8f4 100%)"}}>
    <div style={{
      position: "absolute", left: 42, top: 180, width: 277, height: 262,
      background: "#fff", boxShadow: "3px 5px 6px #bb93872c",
      opacity: clamp(card * 1.65), transform: `rotate(${lerp(-1.7, -1, card)}deg) scale(${.65 + .35 * card})`,
      transformOrigin: "13% 6%",
    }}/>
    {spec.speakers.map((speaker, i) => {
      const intro = i * .4;
      const start = tick(time, intro, .31);
      const settle = tick(time, intro + .28, .2);
      const pop = start * (1.12 - .12 * settle);
      const label = tick(time, .77 + i * .37, .16);
      return <div key={i} style={{
        position: "absolute", width: 94, height: 114,
        left: lerp(i === 0 ? 63 : 209, i === 0 ? 44 : 117, arrange),
        top: lerp(272, 131, arrange), textAlign: "center", color: ink, fontFamily: serif,
        transform: `scale(${pop})`, transformOrigin: "50% 41%",
      }}>
        <Img src={asset(speaker.photo)} style={{
          width: 94, height: 94, display: "block", objectFit: "cover", borderRadius: "50%",
        }}/>
        <div style={{position: "absolute", top: 77, left: -13, width: 120, opacity: label,
          transform: `translateY(${8 * (1 - label)}px)`, textShadow: "1px 0 white, -1px 0 white, 0 1px white, 0 -1px white"}}>
          <div style={{fontWeight: 900, fontSize: 17, lineHeight: "22px", WebkitTextStroke: ".3px currentColor"}}>
            {speaker.name}
          </div>
          <div style={{color: "#55504b", fontSize: 9, lineHeight: "11px", whiteSpace: "nowrap"}}>
            {speaker.role}
          </div>
        </div>
      </div>;
    })}
    <div aria-hidden style={{position: "absolute", left: 268, top: 161, fontFamily: "Arial, sans-serif",
      color: red, fontSize: 79, fontWeight: 900, opacity: mark, transform: `scale(${.76 + .24 * mark})`}}>”</div>
    <div style={{
      position: "absolute", top: 271, left: 56, width: 290, whiteSpace: "nowrap",
      fontFamily: serif, fontSize: 32, lineHeight: "41px", fontWeight: 900, color: ink,
      transform: "scaleX(.81)", transformOrigin: "left center", WebkitTextStroke: ".52px currentColor",
    }}>
      {spec.lines.map(({text, at}, index) => <div key={index} style={{height: 41}}>
        {time >= at && (index === 0 ?
          shown(text, spec.lines[1].at - at > 1.15 && time < spec.lines[1].at - .12
            ? Math.min(time - at, Math.max(0, Array.from(text).length - 3) * pairedQuoteLetterSeconds)
            : time - at, pairedQuoteLetterSeconds)
        : index === 2 && highlight > 0 ?
          <>{last.slice(0, highlightIndex)}<span style={{position: "relative"}}>
            {spec.emphasis}
            <span style={{
              position: "absolute", whiteSpace: "nowrap", inset: "2px 0 0", color: "white",
              background: red, clipPath: `inset(0 ${(1 - highlight) * 100}% 0 0)`, lineHeight: "34px",
            }}>{spec.emphasis}</span>
          </span>{last.slice(highlightIndex + spec.emphasis.length)}</> : shown(text, time - at, pairedQuoteLetterSeconds))}
      </div>)}
    </div>
  </div>;
}

export const commentStackDemo: PortraitDemo = {
  fps: 30, durationInFrames: 185, reference: "BV1rvhHzoEfL · 4.467–10.667",
  spec: {
    photo: demoRoot + "newborn.jpg",
    comments: [
      {text: "给再多钱也不敢生", at: 0}, {text: "杯水车薪", at: .58},
      {text: "不够买奶粉", at: 1.08}, {text: "每月3600才考虑生", at: 1.55},
      {text: "应该补到18岁", at: 1.94}, {text: "总比没有强", at: 2.60},
      {text: "有补贴就是好事", at: 3.26},
    ],
  } satisfies CommentStackSpec,
};

export const pairedQuoteDemo: PortraitDemo = {
  fps: 30, durationInFrames: 437, reference: "BV1y6nEz8EBm · 76.133–90.700",
  spec: {
    speakers: [
      {photo: demoRoot + "liudifan.jpg", name: "刘迪凡", role: "赤兔资本创始人"},
      {photo: demoRoot + "zhangbo.jpg", name: "张博", role: "松树街资本创始人"},
    ],
    card: {at: 3.55},
    lines: [
      {text: "AI算力投资不是", at: 5.03}, {text: "简单的ROI问题，", at: 8.32},
      {text: "而是企业的生死问题。", at: 12.18},
    ],
    emphasis: "生死问题", highlight: {at: 13.31},
  } satisfies PairedQuoteSpec,
};
