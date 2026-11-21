import type {CSSProperties} from "react";
import {Sequence, useVideoConfig} from "remotion";
import {clamp, PortraitMedia, type PortraitDemo} from "../../common";
import {assetRoot, teacherSceneFrames, teacherTransferContract, type TeacherTransferSpec} from "./contracts";
import {progress, sans, song, Still, time30, useTime} from "./shared";

const sceneFill = "linear-gradient(#000 0%,#020202 22%,#252525 51%,#646464 100%)";
const colors = ["#ee050d", "#4b6dc4", "#ff8b16", "#860dc5"];
const columns = [[-18, 12], [-41, -17, 6, 30, 54], [-29, -6, 17, 40], [-16, 7, 30], [-5, 18]];
const studentColumns = [[-10, 8], [-18, 0, 18], [-10, 8]];
type Node = {x: number; y: number};

function Network({small, time, at}: {small?: boolean; time: number; at: number}) {
  const offsets = small ? studentColumns : columns;
  const points = offsets.map((ys, col) => ys.map(y => ({x: col * (small ? 19 : 18.5) + 7, y: y * (small ? 1.04 : .72) + (small ? 25 : 34)})));
  return <svg width={small ? 53 : 88} height={small ? 49 : 82} style={{position: "absolute", inset: 0, overflow: "visible"}}>
    {points.map((nodes, col) => {
      const reveal = progress(time, at + (small ? 2 : 4) * col / 30, .13);
      const fill = colors[small ? [0, 2, 3][col] : Math.max(0, col - 1)];
      const linked = (node: Node, next: Node) => Math.abs(node.y - next.y) < (small ? 25 : 29);
      return <g key={col} opacity={reveal}>
        {nodes.flatMap((node, i) => (points[col - 1] ?? []).filter(previous => linked(node, previous))
          .map((previous, j) => <line key={i + "-" + j} x1={previous.x} y1={previous.y} x2={node.x} y2={node.y}
            stroke="#bfc2ca" strokeWidth=".35" opacity=".65" />))}
        {nodes.map(node => <circle key={node.y} cx={node.x} cy={node.y} r={6.4} fill={fill} />)}
      </g>;
    })}
  </svg>;
}
function Models({spec, time, pulse}: {spec: TeacherTransferSpec; time: number; pulse: number}) {
  const teacherY = 99 + 107 * pulse;
  const studentY = 403 - 98 * pulse;
  const teacherLabel = progress(time, time30(5), .26);
  const studentLabel = progress(time, time30(154), .26);
  const text: CSSProperties = {position: "absolute", whiteSpace: "nowrap",
    font: `800 29px/32px ${song}`, color: "#f5f5f5", transform: "scaleX(.48)", transformOrigin: "left center"};
  return <>
    <div style={{position: "absolute", left: 123, top: teacherY}}><Network time={time} at={time30(5)} /></div>
    <div style={{...text, left: 39, top: teacherY + 20, opacity: teacherLabel}}>{spec.teacher}</div>
    <div style={{position: "absolute", left: 203, top: studentY}}><Network small time={time} at={time30(151)} /></div>
    <div style={{...text, left: 261, top: studentY + 9, opacity: studentLabel, transform: "scaleX(.41)"}}>{spec.student}</div>
  </>;
}
function Link({from, to, amount}: {from: [number, number]; to: [number, number]; amount: number}) {
  if (amount <= 0) return null;
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const x = from[0] + dx * amount;
  const y = from[1] + dy * amount;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  return <g fill="#fa0b17">
    <line x1={from[0]} x2={x} y1={from[1]} y2={y} stroke="#e21424" strokeWidth=".9" />
    <path d="M0 0l-8 -2.8l2 2.8l-2 2.8Z" transform={`translate(${x} ${y}) rotate(${angle})`} />
  </g>;
}
function RedScan({text, amount, width}: {text: string; amount: number; width: number}) {
  const colorWidth = Math.min(1, amount * 1.32);
  const left = clamp((amount - .40) * 1.67);
  const style: CSSProperties = {position: "absolute", left: 0, top: 0, display: "block", width,
    whiteSpace: "nowrap", transform: "scaleX(.86)", transformOrigin: "left center"};
  return <span style={{position: "relative", display: "block", width}}>
    <span style={style}>{text}</span>
    <span aria-hidden style={{...style, color: "#f00015", textShadow: "0 0 2px #9b0009",
      clipPath: `inset(-2px ${(1 - colorWidth) * 100}% -2px ${left * 100}%)`}}>{text}</span>
  </span>;
}
function Table({spec, time}: {spec: TeacherTransferSpec; time: number}) {
  const shown = progress(time, time30(25), .29);
  const values = [spec.question, spec.reasoning, spec.answer];
  const slots = [
    {left: 2, width: 72, name: "题目", start: 78, duration: .72},
    {left: 93, width: 177, name: "推理过程", start: 104, duration: 1.51},
    {left: 270, width: 42, name: "答案", start: 136, duration: .61},
  ];
  return <div style={{position: "absolute", left: 30, top: 235, width: 301, height: 98,
    clipPath: `inset(0 ${(1 - shown) * 100}% 0 0)`, background: "#1414148c", color: "#fafafa",
    font: `700 12.5px/14px ${sans}`}}>
    <div style={{position: "absolute", top: 21, width: 300, borderTop: "1px solid #ffffff35"}} />
    {[79, 255].map(x => <div key={x} style={{position: "absolute", top: 0, bottom: 2, left: x, borderLeft: "1px solid #ffffff35"}} />)}
    {slots.map((slot, i) => <div key={slot.name} style={{position: "absolute", left: slot.left, top: 0}}>
      <div style={{position: "absolute", left: i === 1 ? 34 : i === 2 ? 5 : 0, top: 0,
        fontWeight: 400, whiteSpace: "nowrap"}}>{slot.name}</div>
      <div style={{position: "absolute", left: 0, top: 26}}>
        <RedScan text={values[i]} amount={clamp((time - time30(slot.start)) / slot.duration)} width={slot.width} />
      </div>
    </div>)}
    <Still source={spec.example} style={{left: 2, top: 44, width: 51, height: 50, objectFit: "cover"}} />
  </div>;
}

function Diagram({spec, time, pulse}: {spec: TeacherTransferSpec; time: number; pulse: number}) {
  const ghosts = [{text: "教师模型", x: 23, y: 104, at: 7},
    {text: "训练过程", x: 121, y: 194, at: 81}, {text: "学生模型", x: 241, y: 274, at: 150}];
  return <div style={{position: "absolute", inset: 0}}>
    {ghosts.map(({text, x, y, at}) => <div key={text} aria-hidden style={{position: "absolute", left: x, top: y,
      opacity: .23 * progress(time, time30(at), .29), writingMode: "vertical-rl", color: "#c6c6c6",
      font: `900 78px/.92 ${song}`, letterSpacing: -10, transform: "scale(1.2,.73)", transformOrigin: "top left",
      maskImage: "linear-gradient(170deg, #0007, black 46%, transparent 95%)"}}>{text}</div>)}
    <svg width="360" height="640" style={{position: "absolute", inset: 0}}>
      <Link from={[84, 155]} to={[167, 229]} amount={progress(time, time30(12), .57)} />
      <Link from={[192, 337]} to={[275, 407]} amount={progress(time, time30(151), .44)} />
    </svg>
    <Table spec={spec} time={time} />
    <Models spec={spec} time={time} pulse={pulse} />
  </div>;
}

function TeacherTransfer({spec}: {spec: TeacherTransferSpec}) {
  const time = useTime();
  const flash = progress(time, time30(245), .19) * (1 - progress(time, time30(256), .30));
  const {fps} = useVideoConfig();
  const transferFrom = Math.ceil(251 * fps / 30);
  const transferUntil = Math.ceil(teacherSceneFrames * fps / 30);
  const diagram = time < time30(265);
  const shift = progress(time, time30(250), .5);
  return <div style={{position: "absolute", inset: 0, background: sceneFill}}>
    {diagram && <div style={{position: "absolute", left: 41, top: 145, width: 278, height: 272, borderRadius: "50%",
      background: "linear-gradient(#1110 2%,#6a6a6a 95%)", filter: "blur(1.3px)"}} />}
    <Sequence from={transferFrom} durationInFrames={transferUntil - transferFrom} layout="none">
      <PortraitMedia media={{source: assetRoot + "transfer-pulse.mp4", sourceStart: 0}}
        style={{position: "absolute", left: 0, top: 0, width: 360, height: 640, objectFit: "fill",
          maskImage: diagram ? "linear-gradient(90deg,#000 0 7%,#0000 10% 86%,#000 94%)" : undefined}} />
    </Sequence>
    {diagram ? <div style={{position: "absolute", inset: 0, transform: `translateX(${Math.sin(time * 250) * 8 * flash}px)`,
      filter: flash > 0 ? `drop-shadow(${5 * flash}px 0 #09f) drop-shadow(${-6 * flash}px 0 #ec001a)` : undefined,
      opacity: 1 - .28 * flash}}><Diagram spec={spec} time={time} pulse={shift} /></div>
      : <Models spec={spec} time={time} pulse={1} />}
    {flash > 0 && <div style={{position: "absolute", inset: 0, opacity: flash * .6, mixBlendMode: "screen",
      background: "linear-gradient(93deg,#8d005e 0%,transparent 8%,transparent 90%,#097d80 100%)",
      maskImage: "repeating-linear-gradient(0deg,#0001 0 1px,#0009 2px 3px,#000 5px 7px)"}} />}
  </div>;
}
const spec: TeacherTransferSpec = {teacher:"DeepSeek-R1",student:"学生模型", question:"图像是什么？",
  reasoning:"0.7 是猫, 0.2 是狐狸, 0.1 是狗", answer:"是猫。", example:assetRoot+"example-cat.png"};
const demo: PortraitDemo = {spec,durationInFrames:teacherSceneFrames,fps:30,reference:"BV1jchK6REaB · 62.433–73.633"};
export const teacherTransfer = {...teacherTransferContract,Component:TeacherTransfer,demo} as const;


