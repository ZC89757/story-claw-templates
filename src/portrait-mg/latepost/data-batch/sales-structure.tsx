import {Img, useCurrentFrame, useVideoConfig} from "remotion";
import {asset, clamp, ease, type PortraitDemo} from "../../common";
import {salesStructureContract, type SalesStructureSpec} from "./sales-structure-contract";

const sans = "'Microsoft YaHei',sans-serif";
const song = "SimSun,'Times New Roman',serif";
const mix = (a: number, b: number, progress: number) => a + (b - a) * progress;
const amountString = (amount: number) => Number(amount.toFixed(1));
const changeText = (change: number) => `${change}%`;

function MutableText({text, x, y, size, fill, progress, squeeze = 1, family = song, bold = true}:{
  text:string; x:number; y:number; size:number; fill:string; progress:number; squeeze?:number; family?:string; bold?:boolean;
}) {
  const characters = Array.from(text);
  return <text x={x} y={y} fontSize={size} fill={fill} fontFamily={family} fontWeight={bold ? 750 : 300}
    transform={`translate(${x} 0) scale(${squeeze} 1) translate(${-x} 0)`}>
    {characters.map((character,index) => <tspan key={index} opacity={clamp(progress * (characters.length + 1) - index)}>{character}</tspan>)}
  </text>;
}

function Badge({x,y,width,height,change,progress,expanded}:{
  x:number; y:number; width:number; height:number; change:number; progress:number; expanded:number;
}) {
  return <g>
    <rect x={x} y={y} width={width} height={height * (.29 + .71 * progress)} fill="#040303"/>
    <MutableText text="同比变动" x={x+width*.16} y={y+mix(15,22,expanded)} size={mix(15,22,expanded)} fill="#c6c1bf"
      progress={clamp(progress * 1.5)} squeeze={.91} family={sans} bold={false}/>
    <MutableText text={changeText(change)} x={x+width*.04} y={y+mix(46,70,expanded)} size={mix(33,50,expanded)}
      fill={change < 0 ? "#ef100a" : "#fff"} progress={clamp((progress-.16)/.84)} squeeze={.88}/>
  </g>;
}

function SalesStructure({spec}: {spec: SalesStructureSpec}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  const split = ease((time - spec.split.at) / .47);
  const intro = ease((time + .08) / .31);
  const textIn = clamp((time + .015) / .30);
  const foreignIn = ease((time - spec.split.at - .055) / .40);
  const totalIn = clamp((time - spec.split.at - .15) / .34);
  const chartBottom = mix(443,459,split);
  const finalDomHeight = (459-159) * spec.domestic.amount / spec.total.amount;
  const height = mix(mix(80,267,intro), finalDomHeight,split);
  const y = chartBottom-height;
  const x = mix(50,141,split);
  const width = mix(251,159,split);
  const foreignBottom = mix(289,y,split);
  const foreignTop = mix(foreignBottom,159,foreignIn);
  const titleX = mix(47,27,ease(time/.2));
  return (
    <div style={{position:"absolute",inset:0,background:"linear-gradient(#000 17%,#070607 30%,#2b292a 51%,#565556 78%,#686868 100%)"}}>
      <Img src={asset(spec.companyMark)} style={{position:"absolute",left:29,top:145,width:302,height:53,objectFit:"contain",filter:"grayscale(1)",opacity:.21*ease((time + .005)/.27)}}/>
      <svg width={360} height={640} viewBox="0 0 360 640" style={{position:"absolute",inset:0}}>
        <defs>
          <linearGradient id="latepost-sales-dom" x1="0" y1="0" x2="1" y2=".72"><stop stopColor="#e50503"/><stop offset=".43" stopColor="#c20000"/><stop offset="1" stopColor="#772426"/></linearGradient>
          <linearGradient id="latepost-sales-overseas" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#d70402"/><stop offset="1" stopColor="#940000"/></linearGradient>
        </defs>
        <MutableText text={spec.title} x={titleX} y={125} size={20.4} fill="#faf8f5" progress={clamp((time+.05)/.24)} squeeze={.94} family={sans}/>
        <MutableText text={spec.sourceLine} x={titleX+1} y={143} size={11} fill="#a8a3a2" progress={clamp((time+.02)/.29)} family={sans} bold={false}/>
        {foreignIn > 0 && <g>
          <rect x={141} y={foreignTop} width={159} height={Math.max(0,foreignBottom-foreignTop)} fill="url(#latepost-sales-overseas)" opacity={foreignIn}/>
          <MutableText text={spec.foreign.label} x={149} y={foreignTop+36} size={24} fill="#fffaf0" progress={foreignIn} squeeze={.73}/>
          <Badge x={242} y={foreignBottom-62} width={75} height={49} change={spec.foreign.change} progress={foreignIn} expanded={0}/>
        </g>}
        <rect x={x} y={y} width={width} height={height} fill="url(#latepost-sales-dom)" opacity={.94}/>
        <path d={`M ${x+1} ${chartBottom-1} V ${y+2} H ${x+width-2}`} fill="none" stroke="#f81f17" strokeOpacity={.34} strokeWidth={1.6}/>
        <MutableText text={spec.domestic.label} x={x+mix(13,7,split)} y={y+mix(67,41,split)} size={mix(36,25,split)}
          fill="#fff9ef" progress={textIn} squeeze={.74}/>
        <MutableText text={`约${amountString(spec.domestic.amount)}${spec.unit}`} x={x+mix(13,8,split)} y={y+mix(108,68,split)}
          size={mix(30,21,split)} fill="#3b0504" progress={clamp((time-.06)/.24)} squeeze={.84}/>
        <Badge x={x+width-mix(92,58,split)} y={chartBottom-mix(95,62,split)} width={mix(114,75,split)} height={mix(75,49,split)}
          change={spec.domestic.change} progress={clamp((time-.045)/.25)} expanded={1-split}/>
        <g opacity={ease(totalIn)}>
          <path d="M70 159 H89 M81 159 V460 M68 460 H88" fill="none" stroke="#a62023" strokeOpacity={.32}/>
          <MutableText text={spec.total.label} x={48} y={265} size={24} fill="#fff7f0" progress={totalIn} squeeze={.73}/>
          <MutableText text={`约${amountString(spec.total.amount)} ${spec.unit}`} x={41} y={291} size={20} fill="#bd1716" progress={totalIn} squeeze={.68}/>
          <MutableText text="同比变动" x={52} y={349} size={16} fill="#b1aeac" progress={totalIn} family={sans} bold={false}/>
          <MutableText text={changeText(spec.total.change)} x={49} y={391} size={45} fill="#e31212" progress={totalIn} squeeze={.70}/>
        </g>
      </svg>
    </div>
  );
}

const demo: PortraitDemo = {
  fps: 30, durationInFrames: 145, reference: "晚点LatePost · BV1WaHN6GEuN · 57.6–62.4333125",
  spec: {
    title: "2026年前三季度比亚迪的销量结构",
    sourceLine: "数据来源：比亚迪产销快报及相关券商点评",
    companyMark: "portrait-mg/latepost/data-batch/sales-subject-mark.png",
    unit: "万辆",
    domestic: {label:"国内销量",amount:178.9,change:-30},
    foreign: {label:"海外/出口销量",change:90},
    total: {label:"整体销量",amount:313.2,change:-4},
    split: {at:2.44},
  } satisfies SalesStructureSpec,
};

export const salesStructure = {...salesStructureContract, Component: SalesStructure, demo} as const;
