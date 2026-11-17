import {useId, type CSSProperties} from "react";
import {Img, useCurrentFrame, useVideoConfig} from "remotion";
import {PortraitMedia, asset, clamp} from "./common";
import type {Profile} from "./reference-profiles";

type Value = {at?: number; text?: string; source?: string; sourceStart?: number | null};
type Spec = Record<string, Value | null | undefined>;
type Box = readonly [left: number, top: number, width: number, height: number];

const full: CSSProperties = {position: "absolute", inset: 0};
const fixedRoot = "portrait-mg/restored-titles/";
const brushPath = fixedRoot + "pangmen-brush.ttf";
const sansFamily = "PortraitTitleSans, Microsoft YaHei, sans-serif";
const boardFamily = "PortraitBoardNumerals, " + sansFamily;

function boxStyle([left, top, width, height]: Box): CSSProperties {
  return {position: "absolute", left, top, width, height};
}

function sample(values: readonly number[], frame: number) {
  const index = clamp(frame, 0, values.length - 1);
  const first = Math.floor(index);
  return values[first] + (values[Math.min(first + 1, values.length - 1)] - values[first]) * (index - first);
}

function FixedImage({name, box, style}: {name: string; box: Box; style?: CSSProperties}) {
  return <Img src={asset(fixedRoot + name)} style={{...boxStyle(box), ...style}}/>;
}

function Footage({value, style, mediaStyle}: {value?: Value | null; style?: CSSProperties; mediaStyle?: CSSProperties}) {
  if (!value?.source) return null;
  return <div style={{...full, overflow: "hidden", ...style}}>
    <PortraitMedia media={{source: value.source, sourceStart: value.sourceStart ?? null}} style={mediaStyle}/>
  </div>;
}

function SourceDecoration({kind, frame, frameCount}: {kind: "scans" | "network"; frame: number; frameCount: number}) {
  const index = Math.round(clamp(frame, 0, frameCount - 1));
  const tile = index % 12;
  const sheet = String(Math.floor(index / 12)).padStart(2, "0");
  return <div style={{...full, overflow: "hidden", pointerEvents: "none"}}>
    <FixedImage name={kind + "-" + sheet + ".webp"} box={[-(tile % 3) * 360, -Math.floor(tile / 3) * 640, 1080, 2560]}/>
  </div>;
}

const windowX = [195, 169, 153, 143, 138, 134, 126, 124, 123, 82, 66, 66];
const windowY = [161, 161, 161, 161, 161, 161, 161, 161, 161, 134, 140, 140];
const windowW = [183, 183, 185, 185, 185, 185, 184, 185, 185, 226, 241, 241];
const windowH = [268, 268, 268, 268, 268, 268, 268, 268, 268, 300, 286, 286];
const flashStrength = [0, 1, .92, .13, 0];
const frontQuestionX = [208, 177, 161, 148, 143, 140, 132, 129, 128, 126, 125];
const ghostX = [-124, -105, -93, -85, -79, -72, -69, -66, -63, -63, -63, -63, -63];
const ghostQuestionX = [-64, -21, 8, 17, 25, 30, 35, 37, 40, 42, 42, 42, 42];
const ghostOpacity = [.72, .92, .96, .95, .95, .94, .92, .90, .87, .79, .49, .12, 0];

const questionBox: Box = [125, 207, 117, 141];
const answerBox: Box = [70, 234, 241, 73];

function AnswerText({text, style}: {text: string; style?: CSSProperties}) {
  return <div style={{
    ...boxStyle(answerBox), display: "grid", placeItems: "center", whiteSpace: "pre",
    fontFamily: sansFamily, fontSize: 56, fontWeight: 900, lineHeight: 1,
    letterSpacing: "-1.1px", color: "#fcffff", paintOrder: "stroke fill",
    WebkitTextStroke: "6px #143d55", textShadow: "0 2px 1px #1e4d68",
    transform: "scaleY(1.08)", ...style,
  }}>{text}</div>;
}

const questionBands = [[212, 27, -5], [239, 24, 7], [263, 30, -8], [293, 49, 4]] as const;
// Per-strip displacement of the white core, tracked against the settled title.
const answerBands = [
  [233, 244, [0, 0, 0, 0], -1],
  [244, 250, [0, 0, 0, 0], -.45],
  [250, 255, [3, 3, 3, 1], -1.45],
  [255, 260, [4, 2, 1, 0], .65],
  [260, 266, [4, 3, 2, 1], -.12],
  [266, 272, [3, 3, 2, 1], .85],
  [272, 279, [4, 3, 2, 1], -1.1],
  [279, 284, [5, 4, 2, 1], .55],
  [284, 290, [4, 3, 2, 1], -.54],
  [290, 296, [2, 2, 1, 0], 1.2],
  [296, 306, [0, 0, 0, 0], -.62],
] as const;
const answerSpread = [1, .94, .85, .72, .43, 0];
// Extra narrow bands appear over the moving glyphs on different rows in each exposure.
// Each pair records the source row and the horizontal shift of the fine scan.
const answerTears = [
  [[246, 2, 9], [252, 2, -9], [263, 1.5, 12], [269, 2, -13], [274, 1.5, 8], [283, 2, -13], [290, 2.5, 11], [297, 1, -7]],
  [[245, 1.5, 10], [253, 2, -12], [259, 1.5, 9], [268, 2, 12], [272, 1, -11], [281, 2, -12], [289, 2, 11], [294, 1.5, -7]],
  [[246, 1, 9], [251, 2.5, -13], [257, 1.5, 10], [264, 2, -11], [269, 1.5, 13], [277, 1.5, -12], [282, 2, 10], [286, 1, -9], [291, 2, 11], [297, 1, -8]],
  [[246, 1.5, 7], [252, 2, -10], [257, 1, 9], [264, 1.5, -9], [270, 2, 11], [276, 1, -9], [282, 1.5, 9], [286, 1.5, -8], [292, 1, 7]],
  [[255, 1, 4], [271, 1.5, -5], [283, 1, 4], [290, 1, -4]],
] as const;
const answerTearStrength = [.83, .89, .87, .62, .23];
const answerTearSpans = [[48, 248], [83, 316], [61, 170], [106, 308], [51, 244], [82, 265], [166, 307], [50, 188], [113, 289], [201, 312]] as const;

const questionCyan = [.09, .28, .52, .88, 1];
const questionYellow = [.01, .07, .30, .73, 1];

function QuestionFringes({age}: {age: number}) {
  const cyan = sample(questionCyan, age);
  const yellow = sample(questionYellow, age);
  const maskImage = "url(" + asset(fixedRoot + "question.png") + ")";
  return <>
    <div style={{
      ...boxStyle(questionBox), maskImage, maskSize: "100% 100%",
      background: "#51f7ff", opacity: cyan * .96,
      transform: "translateX(" + (-5 - cyan * 7) + "px) scale(1.055)",
      filter: "blur(" + (1.7 + cyan * 2.5) + "px)",
    }}/>
    <div style={{
      ...boxStyle(questionBox), maskImage, maskSize: "100% 100%",
      background: "#fbf25d", opacity: yellow,
      transform: "translateX(" + (4 + yellow * 7) + "px) scale(1.025)",
      filter: "blur(" + (1.5 + yellow * 2.35) + "px)",
    }}/>
    <div style={{...full, opacity: cyan * .24, filter: "blur(1.75px)"}}>
      {questionBands.map(([top, height, direction]) => <div key={top} style={{
        ...full, clipPath: "inset(" + top + "px 0 " + (640 - top - height) + "px)",
        transform: "translateX(" + direction * cyan + "px)",
      }}>
        <div style={{...boxStyle(questionBox), maskImage, maskSize: "100% 100%", background: "#7ffeff"}}/>
      </div>)}
    </div>
  </>;
}

function AnswerSlices({text, age, offset, shear, style}: {
  text: string; age: number; offset: number; shear: number; style?: CSSProperties;
}) {
  return <>{answerBands.map(([top, bottom, position, chroma]) => {
    const shift = (age < position.length ? sample(position, age) : 0) + offset + chroma * shear;
    return <div key={top} style={{
      ...full, clipPath: "inset(" + top + "px 0 " + (640 - bottom) + "px)",
    }}>
      <AnswerText text={text} style={{...style, transform: "translateX(" + shift + "px) scaleY(1.08)"}}/>
    </div>;
  })}</>;
}

function AnswerFringes({text, age}: {text: string; age: number}) {
  const spread = sample(answerSpread, age);
  const channels = [
    {color: "#19f8ff", offset: -14.5, shear: 6.8, opacity: .99, stroke: 8, smear: 1.5},
    {color: "#ffec4e", offset: 9.4, shear: -3.7, opacity: .91, stroke: 5, smear: 1.4},
    {color: "#fd69b3", offset: 4.7, shear: 2.8, opacity: .66, stroke: 4, smear: 1.1},
  ];
  return <>{channels.map(({color, offset, shear, opacity, stroke, smear}) =>
    <div key={color} style={{
      ...full, opacity: opacity * spread,
      filter: "blur(" + (.8 + spread * smear) + "px)",
    }}>
      <AnswerSlices text={text} age={age} offset={offset * spread} shear={shear * spread} style={{
        color, WebkitTextStroke: stroke + "px " + color,
        textShadow: "3px 0 2px " + color + ", -3px 0 2px " + color,
      }}/>
    </div>)}</>;
}

function AnswerTears({text, age}: {text: string; age: number}) {
  const strips = answerTears[Math.floor(age)];
  if (!strips) return null;
  const strength = sample(answerTearStrength, age);
  return <div style={{...full, opacity: strength, pointerEvents: "none"}}>
    {strips.map(([top, height, offset], index) => {
      const side = offset < 0 ? -1 : 1;
      const color = side < 0 ? "#21eaff" : index % 3 ? "#fff380" : "#f991c7";
      const [left, right] = answerTearSpans[(index + Math.floor(age) * 3) % answerTearSpans.length];
      return <div key={top} style={{
        ...full, clipPath: "inset(" + top + "px " + (360 - right) + "px " + (640 - top - height) + "px " + left + "px)",
      }}>
        <AnswerText text={text} style={{
          transform: "translateX(" + offset + "px) scaleY(1.08)",
          color, opacity: .94, WebkitTextStroke: "5px " + color,
          textShadow: "0 0 2px " + color,
          filter: "blur(.75px)",
        }}/>
        <AnswerText text={text} style={{
          transform: "translateX(" + (offset - side * 4) + "px) scaleY(1.08)",
          color: "#f7fffc", opacity: index % 3 === 0 ? .52 : .7,
          WebkitTextStroke: "2px #4d8298", textShadow: "none",
          filter: "blur(.38px)",
        }}/>
      </div>;
    })}
  </div>;
}

function RevealingAnswer({text, age, blurId}: {text: string; age: number; blurId: string}) {
  const style: CSSProperties = {
    opacity: sample([.79, .83, .88, .94, .99, 1], age),
    filter: "blur(" + sample([2.25, 2.05, 1.75, 1.45, .34, 0], age) + "px) " +
      "brightness(" + sample([1.35, 1.27, 1.2, 1.13, 1.04, 1], age) + ")",
    WebkitTextStrokeColor: age < 4 ? "#4b7182" : "#143d55",
  };
  return age < 4
    ? <div style={{...full, filter: "url(#" + blurId + ") brightness(" + sample([1.35, 1.27, 1.2, 1.13], age) + ")"}}>
      <AnswerSlices text={text} age={age} offset={0} shear={0} style={{...style, filter: undefined}}/>
    </div>
    : <AnswerText text={text} style={style}/>;
}

function InsetWindow({value, stage, showQuestion, colorAge}: {
  value?: Value | null; stage: number; showQuestion: boolean; colorAge: number;
}) {
  const rect: Box = [sample(windowX, stage), sample(windowY, stage), sample(windowW, stage), sample(windowH, stage)];
  const [left, top, width, height] = rect;
  const flash = sample(flashStrength, stage - 8);
  const mask: CSSProperties = {
    ...boxStyle(rect), inset: "auto", left, top, width, height, borderRadius: stage < 9 ? 2 : 13,
    boxShadow: "0 0 15px #5498c56c",
    filter: "blur(" + sample([1.7, .55, 0], stage) + "px) brightness(" + (1 + flash * 1.6) + ") saturate(" + (1 + flash * .65) + ")",
  };
  const [, qy, qw, qh] = questionBox;
  const qLeft = sample(frontQuestionX, stage);
  return <>
    <Footage value={value} style={mask} mediaStyle={{objectPosition: "50% 53%", filter: "saturate(1.14) contrast(1.065)"}}/>
    {colorAge >= 0 && colorAge < 5 && <QuestionFringes age={colorAge}/>}
    {showQuestion && <FixedImage name="question.png" box={[qLeft, qy, qw, qh]} style={{
      filter: "blur(" + Math.max(sample([1.8, .6, 0], stage), colorAge >= 0 && colorAge < 5 ? .5 + colorAge * .25 : 0) + "px) drop-shadow(0 0 5px #31d6f8db)",
      opacity: colorAge >= 0 && colorAge < 5 ? sample([.98, .97, .94, .93, .94], colorAge) : 1,
    }}/>}
  </>;
}

function Question({spec, frame}: {spec: Spec; frame: number}) {
  const stage = frame - 4;
  const instanceId = useId().replace(/[^a-z0-9_-]/gi, "");
  const dragId = "question-drag-" + instanceId;
  const answerBlurId = "question-answer-blur-" + instanceId;
  const hit = Math.round((spec.answer?.at ?? 0) * 30);
  const answerAge = frame - hit;
  const ghost = stage >= 0 && stage < 12 ? sample(ghostOpacity, stage) : 0;
  const ghostLeft = sample(ghostX, stage);
  const windowLeft = sample(windowX, stage);
  const showQuestion = answerAge < -1;
  const blueFlash = sample(flashStrength, stage - 8);
  const text = spec.answer?.text ?? "";
  return <>
    <svg style={{position: "absolute", width: 0, height: 0}} aria-hidden="true">
      <defs><filter id={dragId} x="-45%" y="-15%" width="190%" height="130%">
        <feGaussianBlur stdDeviation="12.2 1.6"/>
      </filter><filter id={answerBlurId} x="-8%" y="-15%" width="116%" height="130%">
        <feGaussianBlur stdDeviation={sample([3.45, 2.8, 1.9, 1.25], answerAge) + " " + sample([1.26, .92, .64, .4], answerAge)}/>
      </filter></defs>
    </svg>
    <Footage value={spec.background} style={{filter: "saturate(1.06) contrast(.96)", transform: "scale(1.09)"}}/>
    <div style={{...full, backdropFilter: "blur(7px)", maskImage: "linear-gradient(#000c 0%, #000b 27%, #0001 49%, #0001 65%, #000c 89%, #000f 100%)"}}/>
    <div style={{...full, background: "linear-gradient(120deg,#316f9425,#7dc8f413 46%,#164a752c)", mixBlendMode: "color"}}/>
    {ghost > 0 && <div style={{
      ...full, filter: (stage < 1 ? "url(#" + dragId + ") " : "") +
        "grayscale(1) blur(" + sample([1.65, .82, .55], stage) + "px) brightness(" + (1 + blueFlash * 2.4) + ")",
      opacity: ghost, clipPath: "inset(0 " + (357 - windowLeft) + "px 0 0)",
    }}>
      <Footage value={spec.clip} style={{
        ...boxStyle([ghostLeft, 100, 277, 342]), inset: "auto", left: ghostLeft, top: 100,
      }} mediaStyle={{objectPosition: "50% 53%", filter: "contrast(.88) brightness(.97)"}}/>
      {showQuestion && <FixedImage name="question.png" box={[sample(ghostQuestionX, stage), sample([171,183], stage), 129, 163]} style={{
        filter: "brightness(" + sample([1.43, .84], stage) + ") drop-shadow(1px 1px 1.6px #32363998)",
      }}/>}
      <div style={{
        ...boxStyle([0, 100, windowLeft + 2, 342]),
        opacity: sample([.35, .92, 1], stage),
        background: "linear-gradient(90deg, transparent 54%, #10182326 75%, #111720a8 94%, #111720ee), linear-gradient(0deg, #141a205c, transparent 31%, transparent 82%, #151a232c)",
      }}/>
    </div>}
    {stage >= 0 && <div style={{...full, filter: stage < 1 ? "url(#" + dragId + ")" : undefined}}>
      <InsetWindow value={spec.clip} stage={stage} showQuestion={showQuestion} colorAge={answerAge + 6}/>
    </div>}
    {stage >= 0 && blueFlash > 0 && <div style={{
      ...boxStyle([0, 86, 324, 383]), opacity: blueFlash * .8, mixBlendMode: "screen",
      background: "radial-gradient(ellipse at 15% 32%, #f6ffff 0%, #c9faffc4 21%, transparent 67%), radial-gradient(ellipse at 61% 32%, #e6ffff 0%, #4ec9ed9c 28%, transparent 74%)",
    }}/>}
    {frame >= 15 && <SourceDecoration kind="scans" frame={frame} frameCount={114}/>}
    {answerAge >= 0 && <>
      {answerAge < 6 && <AnswerFringes age={answerAge} text={text}/>}
      <RevealingAnswer text={text} age={answerAge} blurId={answerBlurId}/>
      <AnswerTears age={answerAge} text={text}/>
    </>}
  </>;
}

const cardStyles = {
  main: {
    box: [57, 94, 239, 146],
    fade: [.10, .155, .263, .357, .451, .536, .624, .699, .770, .829, .895, .95, 1],
    width: [.67, .67, .73, .82, .88, .95, 1],
    height: [.46, .46, .55, .66, .77, .9, 1],
    primary: [1, 31, 239, 69],
    glyphScale: [1.024, .974],
    inkTilt: -10.8, inkRotation: 1.7, inkShift: [.4, 0],
    english: [0, 100, 239, 19],
    size: 60, small: 14, englishGap: 1.22, radius: 9,
  },
  left: {
    box: [2, 286, 153, 93],
    fade: [.10, .177, .268, .357, .454, .544, .638, .708, .794, .829, .896, .95, 1],
    width: [.64, .64, .73, .84, .90, .95, 1],
    height: [.45, .48, .58, .71, .81, .90, 1],
    primary: [2, 19, 153, 45],
    glyphScale: [.998, 1.015],
    inkTilt: -11.4, inkRotation: -2.1, inkShift: [-2, .75],
    english: [0, 57, 153, 14],
    size: 39, small: 10, englishGap: .88, radius: 5,
  },
  right: {
    box: [205, 286, 153, 94],
    fade: [.16, .33, .43, .53, .64, .70, .77, .83, .88, .92, .97, 1],
    width: [.67, .77, .84, .90, .96, 1],
    height: [.55, .62, .72, .79, .9, 1],
    primary: [1, 21, 153, 45],
    glyphScale: [.943, .94],
    inkTilt: -12.1, inkRotation: 0, inkShift: [.45, 0],
    english: [0, 64, 153, 14],
    size: 38, small: 10, englishGap: .75, radius: 5,
  },
} as const;

function Card({value, subtitle, frame, name}: {
  value?: Value | null; subtitle?: Value | null; frame: number; name: keyof typeof cardStyles;
}) {
  const age = frame - Math.round((value?.at ?? 0) * 30);
  if (age < 0) return null;
  const {box, fade, width, height, primary, english, size, small, englishGap, radius, glyphScale, inkTilt, inkRotation, inkShift} = cardStyles[name];
  const opacity = sample(fade, age);
  const scale = sample(width, age);
  const squash = sample(height, age);
  return <div style={boxStyle(box)}>
    <FixedImage name={"card-" + name + ".png"} box={[0, 0, box[2], box[3]]} style={{
      opacity, boxShadow: "0 2px 8px #b0bec83d", borderRadius: radius,
    }}/>
    <div style={{
      ...boxStyle(primary), display: "grid", placeItems: "center", whiteSpace: "pre",
      fontFamily: "PortraitCardsBrush, KaiTi, serif", fontSize: size,
      lineHeight: 1, color: "#fff", WebkitTextStroke: "1.22px white", letterSpacing: "2.5px",
      paintOrder: "stroke fill", textShadow: "1px 2px 1px #574169, 3px 4px 3px #332145c8",
      transform: "translate(" + inkShift[0] + "px," + inkShift[1] + "px) rotate(" + inkRotation +
        "deg) skewX(" + inkTilt + "deg) scale(" + scale * glyphScale[0] + "," + squash * glyphScale[1] + ")",
      opacity: sample([.80, .87, .91, .96, .99, 1], age),
    }}>{value?.text}</div>
    {subtitle?.text && <div style={{
      ...boxStyle(english), display: "grid", placeItems: "center", whiteSpace: "pre",
      color: "#f4edf7", lineHeight: 1, fontSize: small, letterSpacing: englishGap,
      fontFamily: "Times New Roman, serif", fontStyle: "italic",
      opacity: sample([.15, .24, .36, .51, .67, .83, 1], age),
      transform: "scale(" + scale + "," + squash + ")", textShadow: "1px 1px 2px #3e284a",
    }}>{subtitle.text}</div>}
  </div>;
}

function Cards({spec, frame}: {spec: Spec; frame: number}) {
  return <>
    <style>{"@font-face{font-family:PortraitCardsBrush;src:url('" + asset(brushPath) + "') format('truetype');font-display:block}"}</style>
    <Footage value={spec.background} style={{
      filter: "blur(7px) brightness(.51) saturate(.55) contrast(1.22)", transform: "scale(1.06)",
    }}/>
    <div style={{...full, background: "#315a713c", mixBlendMode: "color"}}/>
    <Card value={spec.title} subtitle={spec.titleSubtitle} frame={frame} name="main"/>
    <Card value={spec.left} subtitle={spec.leftSubtitle} frame={frame} name="left"/>
    <Card value={spec.right} subtitle={spec.rightSubtitle} frame={frame} name="right"/>
  </>;
}

const panelY = [530, 502, 478, 440, 408, 376, 344, 318, 294, 270, 253, 240, 230, 224, 220, 219];
const titleY = [71, 76, 85, 97, 105, 113, 123, 130, 133, 137, 142, 147, 149, 150];
const titleOpacity = [0, .2, .37, .49, .56, .65, .72, .8, .87, .92, .96, .99, 1];
// The curves are sampled from the original left edge, inner letters, and
// two right-edge characters. Replacement text samples across the same track.
const firstLetterSpread = [1, .95, .80, .59, .36, .22, .12, .07, .03, .01, 0];
const secondLetterSpread = [1, .98, .89, .75, .57, .38, .25, .15, .09, .045, .021, .01, 0];
const firstReveal = [
  [.02, .08, .44, .63, .72, .92, .98, 1],
  [.02, .20, .49, .70, .88, .97, 1],
  [.13, .41, .82, .96, 1],
  [.15, .47, .85, .99, 1],
  [.05, .18, .47, .70, .90, .98, 1],
  [.02, .11, .20, .40, .68, .83, .93, 1],
  [0, .05, .12, .27, .51, .73, .83, .95, 1],
] as const;
const secondReveal = [
  [0, 0, .08, .45, .66, .85, .99, 1],
  [0, .05, .18, .46, .76, .95, 1],
  [.02, .08, .50, .78, .95, 1],
  [.08, .31, .79, .92, .98, 1],
  [.02, .16, .29, .60, .92, .98, 1],
  [0, .02, .15, .23, .49, .69, .79, .93, 1],
  [0, 0, .08, .13, .35, .49, .75, .92, .99, 1],
] as const;
const letterOffset = [-43, -20, -7, 4, 18, 36, 62];

function BoardTitle({value, age}: {value?: Value | null; age: number}) {
  if (age < 0) return null;
  return <div style={{
    ...boxStyle([21, sample(titleY, age) - 7, 314, 49]), display: "grid", placeItems: "center",
    whiteSpace: "pre", fontFamily: sansFamily, fontSize: 37, fontWeight: 900,
    letterSpacing: "-.7px", lineHeight: 1, color: "#f2eeeb", WebkitTextStroke: "1px #eee9e4",
    textShadow: "1px 2px 0 #857c76, 1px 3px 0 #625c55",
    opacity: sample(titleOpacity, age),
  }}>{value?.text}</div>;
}

function BoardLine({value, frame, y, second}: {value?: Value | null; frame: number; y: number; second?: boolean}) {
  const age = frame - Math.round((value?.at ?? 0) * 30);
  if (age < 0) return null;
  const chars = Array.from(value?.text ?? "");
  const reveal = second ? secondReveal : firstReveal;
  const spread = sample(second ? secondLetterSpread : firstLetterSpread, age);
  const proportion = second ? .872 : .846;
  return <div style={{
    ...boxStyle([second ? 28 : 27, y - 2, 310, 52]), display: "grid", placeItems: "center", whiteSpace: "pre",
    fontFamily: boardFamily, fontSize: 40, fontWeight: 665, lineHeight: 1,
    letterSpacing: ".05px",
  }}><div style={{transform: "scaleX(" + proportion + ")"}}>{chars.map((char, i) => {
    const position = chars.length > 1 ? i * (reveal.length - 1) / (chars.length - 1) : 3;
    const left = Math.floor(position);
    const right = Math.min(left + 1, reveal.length - 1);
    const opacity = sample([sample(reveal[left], age), sample(reveal[right], age)], position - left);
    const move = sample(letterOffset, position) * spread / proportion;
    return <span key={i} style={{
      display: "inline-block", opacity, transform: "translateX(" + move + "px)",
      background: "linear-gradient(#ffffff 18%,#f8fcfd 53%,#b5ccd9 84%,#8ca8b8 100%)",
      backgroundClip: "text", color: "transparent", filter: "drop-shadow(0px 2px 0px #638498)",
    }}>{char}</span>;
  })}</div></div>;
}

function Lines({spec, frame}: {spec: Spec; frame: number}) {
  const age = frame - Math.round((spec.title?.at ?? 0) * 30);
  const top = sample(panelY, age);
  return <>
    <style>{"@font-face{font-family:PortraitBoardNumerals;src:url('" + asset(fixedRoot + "board-numerals.woff2") + "') format('woff2');font-weight:665;font-display:block;unicode-range:U+0021-007E}"}</style>
    <Footage value={spec.background} style={{filter: "brightness(.39) saturate(.49) contrast(1.03)"}}/>
    <div style={{...full, background: "linear-gradient(134deg,#29251754,#12131641 57%,#211b1761)"}}/>
    {age >= 1 && <div style={{
      ...boxStyle([28, top, 312, 183]),
      background: "linear-gradient(125deg,#18698d88,#20557580 52%,#3a8cb470)",
      boxShadow: "inset 0 0 12px #3e9fc56e, 0 0 14px 3px #267ec950",
      opacity: sample([0, .28, .61, .89, 1], age),
    }}/>}
    <SourceDecoration kind="network" frame={frame} frameCount={180}/>
    <BoardTitle value={spec.title} age={age}/>
    {age >= 1 && <>
      <FixedImage name="panel-edge.png" box={[0, top - 25, 360, 237]} style={{
        opacity: sample([0, .32, .66, .92, 1], age),
        filter: "brightness(1.23) drop-shadow(0 0 4px #3ba5de8b)",
      }}/>
      <FixedImage name="panel-registration.png" box={[0, top - 67, 360, 276]} style={{
        opacity: sample([0, .14, .42, .72, 1], age),
      }}/>
      <BoardLine value={spec.firstLine} frame={frame} y={top + 31}/>
      <BoardLine value={spec.secondLine} frame={frame} y={top + 99} second/>
    </>}
  </>;
}

export const restoredTitleTags = new Set([
  "mg-v-question-reveal", "mg-v-one-large-two-small", "mg-v-assembled-two-lines",
]);

export function RestoredTitles({profile, spec}: {profile: Profile; spec: Spec}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const referenceFrame = frame * 30 / fps;
  return <div style={{...full, background: "#08090a"}}>
    <style>{"@font-face{font-family:PortraitTitleSans;src:url('" + asset(fixedRoot + "noto-sans-sc.woff2") + "')" +
      " format('woff2');font-weight:100 900;font-display:block}"}</style>
    {profile.tag === "mg-v-question-reveal" ? <Question spec={spec} frame={referenceFrame}/> :
      profile.tag === "mg-v-one-large-two-small" ? <Cards spec={spec} frame={referenceFrame}/> :
        <Lines spec={spec} frame={referenceFrame}/>}
  </div>;
}
