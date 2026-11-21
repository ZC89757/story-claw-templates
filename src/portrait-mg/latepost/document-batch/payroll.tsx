import {useId} from "react";
import {Img, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {asset, clamp, ease, PortraitMedia, type PortraitDemo} from "../../common";
import type {PayrollSpec} from "./contracts";

const root = "portrait-mg/latepost/document-batch/";
const table = {left: 19, right: 285, top: 70, headerEnd: 104, total: 374, end: 427};
const sans = "'Microsoft YaHei',sans-serif";
const serif = "'Times New Roman',serif";
const columns = [19, 103, 142, 175, 210, 244, 285];
const rowTops = [104, 137, 171, 205, 239, 273, 307, 341, 374];
const perspective = "matrix3d(.819363,-.138258,0,.000065696,.117958,.548217,0,-.000536027,0,0,1,0,3,172,0,1)";
const headings = ["项目", "天数", "每天小时", "合计小时", "时薪", "金额(元)"];
const regularLabels = ["标准正常工时", "平日延时加班", "周末加班"];
const extraLabels = ["夜班补贴", "全勤奖", "绩效", "五险一金"];

function rowText(values: string[], index: number, color: string) {
  const y = rowTops[index] + 21;
  if (index < 3) return values.map((value, column) => (
    <text key={column} x={column===0 ? columns[0]+5 : (columns[column]+columns[column+1])/2} y={y}
      textAnchor={column===0 ? "start" : "middle"} fill={color} fontFamily={sans} fontSize={12}>{value}</text>
  ));
  return (
    <g fill={color} fontFamily={sans} fontSize={13}>
      <text x={columns[0]+5} y={y}>{values[0]}</text>
      {index===3 && <text x={171} y={y} textAnchor="middle">{values[2]}</text>}
      <text x={columns[6]-5} y={y} textAnchor="end">{values[1]}</text>
    </g>
  );
}

export function Payroll({spec}: {spec: PayrollSpec}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const identifier = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const phase = ease(t / 1.46);
  const x = interpolate(phase, [0,.32,.72,1], [-258,-125,-29,0]);
  const y = interpolate(phase, [0,.48,1], [76,33,0]);
  const angle = interpolate(phase, [0,.32,.67,1], [31,24,8,0]);
  const rows = [
    ...[spec.base,spec.weekday,spec.weekend].map((entry,i) =>
      [regularLabels[i],entry.days,entry.perDay,entry.hours,entry.rate,entry.amount]),
    ...extraLabels.map((label,i) => [label,spec.extra.values[i],i===0 ? spec.extra.nightDetail : ""]),
  ];
  const cues = [spec.base.at,spec.weekday.at,spec.weekend.at,spec.extra.at,spec.total.at];
  const spotlight = ease((t-spec.total.at)/.36);
  const number = ease((t-spec.total.at-.08)/.39);

  return (
    <div style={{position:"absolute", inset:0, background:"#070707", overflow:"hidden"}}>
      <PortraitMedia media={spec.background} style={{position:"absolute",inset:0,filter:"grayscale(1)"}}/>
      <div style={{position:"absolute",inset:0,transformOrigin:"62px 116px",transform:`translate(${x}px,${y}px) rotate(${angle}deg)`}}>
        <svg width={300} height={460} viewBox="0 0 300 460" style={{position:"absolute",left:0,top:0,transformOrigin:"0 0",transform:perspective}}>
          <defs>
            <linearGradient id={identifier+"paper"} x1="0" x2="0" y1="0" y2="1">
              <stop stopColor="#f6f6f6"/><stop offset="1" stopColor="#d7d7d7"/>
            </linearGradient>
          </defs>
          <rect width={300} height={460} fill={`url(#${identifier}paper)`}/>
          <text x={25} y={52} fontFamily={sans} fontSize={40} fontWeight={900} fill="#111">工资单</text>
          <rect x={table.left} y={table.top} width={table.right-table.left} height={table.headerEnd-table.top} fill="#a8a8a8" opacity={.8}/>
          <rect x={table.left} y={table.total} width={table.right-table.left} height={table.end-table.total} fill="#aaa"/>
          <g stroke="#a2a2a2" strokeWidth={.9}>
            {columns.map((column,i) => (
              <line key={column} x1={column} x2={column} y1={table.top} y2={i===0||i===6 ? table.end : i===1||i===5 ? table.total : rowTops[3]}/>
            ))}
            {[table.top,...rowTops,table.end].map(yLine=><line key={yLine} x1={table.left} x2={table.right} y1={yLine} y2={yLine}/>)}
          </g>
          {headings.map((heading,i)=><text key={heading} x={(columns[i]+columns[i+1])/2} y={91} textAnchor="middle" fontFamily={sans} fontSize={11.5} fontWeight={700}>{heading}</text>)}
          {rows.map((row,i)=><g key={i}>{rowText(row,i,"#151515")}</g>)}
          <text x={32} y={410} fontFamily={sans} fontSize={29} fontWeight={900}>到手</text>
          <text x={277} y={410} textAnchor="end" fontFamily={sans} fontSize={32} fontWeight={900}>{spec.total.value}元</text>
          {cues.slice(0,4).map((onset,i)=>{
            const width = ease((t-onset)/.38)*(table.right-table.left);
            const fade = clamp((cues[i+1]-[1.14,.20,.55,.22][i]-t)/.38);
            if (width<=0||fade<=0) return null;
            const bottom = i<3 ? rowTops[i+1] : rowTops[8];
            const id = identifier+"row"+i;
            const indices = i<3 ? [i] : [3,4,5,6];
            return (
              <g key={i} opacity={fade}>
                <clipPath id={id}><rect x={table.left} y={rowTops[i]} width={width} height={bottom-rowTops[i]}/></clipPath>
                <g clipPath={`url(#${id})`}>
                  <rect x={table.left} y={rowTops[i]} width={table.right-table.left} height={bottom-rowTops[i]} fill="#ff1510"/>
                  {indices.map(index=><g key={index}>
                    <line x1={table.left} x2={table.right} y1={rowTops[index]} y2={rowTops[index]} stroke="#fff" strokeOpacity={.15} />
                    {rowText(rows[index],index,"#fff")}
                  </g>)}
                </g>
              </g>
            );
          })}
        </svg>
        <Img src={asset(root+"payroll-hand.png")} style={{position:"absolute",left:0,top:0,width:158,height:170}}/>
      </div>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 135px 135px at 302px 443px,transparent 74%,rgba(0,0,0,.61) 100%)",opacity:spotlight}}/>
      <div style={{position:"absolute",left:221,top:415,transformOrigin:"left center",transform:`rotate(-12deg) scale(${.59+.41*number})`,
        fontFamily:serif,fontSize:68,fontStyle:"italic",lineHeight:"69px",color:"#ed090b",background:"#fff",opacity:number,
        whiteSpace:"nowrap"}}>
        {spec.total.value}<span style={{fontFamily:sans,color:"#161616",fontSize:38,fontStyle:"normal"}}>元</span>
      </div>
    </div>
  );
}

export const payrollDemo: PortraitDemo = {
  fps: 30,
  durationInFrames: 900,
  reference: "晚点LatePost · BV1WAJy6mE4y · 69.23350–99.267125",
  spec: {
    background: {source:root+"factory-demo.mp4",sourceStart:0},
    base: {at:4.48,days:"21.75天",perDay:"8h",hours:"174h",rate:"18.4",amount:"3200元"},
    weekday: {at:11.82,days:"22天",perDay:"3h",hours:"66h",rate:"27.6",amount:"1821元"},
    weekend: {at:17.48,days:"4天",perDay:"11h",hours:"44h",rate:"36.8",amount:"1619元"},
    extra: {at:22.98,nightDetail:"12班，每班20元",values:["240元","150元","400元","-592元"]},
    total: {at:28.3,value:"6838"},
  } satisfies PayrollSpec,
};
