import {useCurrentFrame,useVideoConfig} from "remotion";
import {clamp,ease,type PortraitDemo} from "../../common";
import {historyThresholdContract,type HistoryThresholdSpec} from "./history-threshold-contract";

const chart={x0:58,x1:310,y0:429,y1:173};
const sans="'Microsoft YaHei',sans-serif";
const serif="'Times New Roman',serif";
const yAt=(value:number)=>chart.y0-(value-1)*(chart.y0-chart.y1)/7;
const xAt=(ratio:number)=>chart.x0+(chart.x1-chart.x0)*ratio;
const format=(value:number)=>Number(value.toFixed(2));

// The pale texture of historical paths is part of the fixed plot treatment.
const guides=Array.from({length:90},(_,index)=>{
  const seed=(i:number)=>((i*73.137+Math.cos(i*7.111)*932.391)%1+1)%1;
  const start=3.4+seed(index+11)*4.4;
  const end=1.15+seed(index+80)*3.2;
  return Array.from({length:13},(_,point)=>{
    const t=point/12;
    const y=start+(end-start)*t+.3*Math.sin(index*.83+point*.6)*(1-.5*t)+.15*Math.cos(index*4.3-point*3.1);
    return `${xAt(t)},${yAt(y)}`;
  }).join(" ");
});

function trace(values:number[],progress:number){
  const length=values.length-1;
  const samples=clamp(progress)*length;
  const complete=Math.floor(samples);
  const last=complete===length?values[complete]:values[complete]+(values[complete+1]-values[complete])*(samples-complete);
  const path=values.slice(0,complete+1).map((value,index)=>`${xAt(index/length)},${yAt(value)}`).join(" ");
  return {path:`${path} ${xAt(progress)},${yAt(last)}`,x:xAt(progress),y:yAt(last)};
}

function HistoryThreshold({spec}:{spec:HistoryThresholdSpec}){
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const time=frame/fps;
  const labelsIn=ease((time-.03)/.46);
  const start=1.76;
  const pace=clamp((time-start)/(spec.result.at-start-.12));
  const compareProgress=clamp((time-start-.06)/(spec.result.at-start-.06));
  const red=trace(spec.focus.values,pace);
  const blue=trace(spec.comparison.values,compareProgress);
  const blueOut=1-ease((time-spec.result.at+.04)/.36);
  const finalIn=ease((time-spec.result.at)/.30);
  const refIn=ease((time-spec.threshold.at)/.54);
  const dateTicks=[0,20,40,60].filter(offset=>offset<spec.focus.values.length);
  const endYear=spec.firstYear+spec.focus.values.length-1;
  const faintFill=ease((time-.68)/.61);
  return <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 84% 27% at 49% 105%,#fbe4e2 0%,transparent 100%),linear-gradient(#fbf8f5,#fff8f0)"}}>
    <svg width={360} height={640} viewBox="0 0 360 640" style={{position:"absolute",inset:0}}>
      <defs><clipPath id="latepost-history-field"><rect x={57} y={180} width={254*faintFill} height={251}/></clipPath></defs>
      <g opacity={labelsIn}>
        <text x={33} y={124} fontFamily={sans} fontSize={16} fontWeight={800} fill="#171514">{spec.title}</text>
        <text x={33} y={146} fontFamily={sans} fontSize={11.4} fontStyle="italic" fill="#938c85">{spec.sourceLine}</text>
        <text x={53} y={178} fontFamily={sans} fontSize={10.6} fill="#b6aba4">{spec.metric}</text>
        {Array.from({length:8},(_,i)=><text key={i} x={37} y={yAt(i+1)+4} textAnchor="middle" fontFamily={serif} fontStyle="italic" fontSize={13.5} fill="#8e8681" opacity={(i===1?1-refIn:1)*(.78-.48*refIn)}>{i+1}</text>)}
        {dateTicks.map(offset=><text key={offset} x={xAt(offset/(spec.focus.values.length-1))} y={458} textAnchor="middle" fontFamily={serif} fontSize={16} fill="#38332d">{spec.firstYear+offset}</text>)}
      </g>
      <g clipPath="url(#latepost-history-field)" opacity={faintFill}>
        <rect x={58} y={184} width={252} height={240} fill="#f7dfd2" opacity={.17}/>
        {guides.map((points,i)=><polyline key={i} points={points} fill="none" stroke={i%4?"#ab9a92":"#d6a28d"} opacity={i%4?.104:.153} strokeWidth=".32"/>)}
      </g>
      {pace>0&&<g>
        <polyline points={red.path} fill="none" stroke="#bd181b" strokeWidth={1.2} strokeLinejoin="round"/>
        <text x={Math.min(red.x+8,304)} y={red.y-6} opacity={ease((time-start-.17)/.2)} fill="#b91714" fontFamily={sans} fontWeight={800} fontSize={14}>{spec.focus.label}</text>
      </g>}
      {compareProgress>0&&<g opacity={blueOut}>
        <polyline points={blue.path} fill="none" stroke="#7773c1" strokeWidth={1.13} strokeLinejoin="round"/>
        <text x={Math.min(blue.x+8,304)} y={blue.y-7} fill="#7e76d2" fontFamily={sans} fontSize={13.5} fontWeight={800}>{spec.comparison.label}</text>
      </g>}
      <g opacity={finalIn} textAnchor="middle" transform={`translate(0 ${5*(1-finalIn)})`}>
        <text x={283} y={346} fontFamily={sans} fontSize={12.5} fill="#221f1b">{spec.metric}({endYear})</text>
        <text x={278} y={377} fontFamily={serif} fontWeight={800} fontSize={39} fill="#d00c0b">{format(spec.focus.values.at(-1)!)}</text>
      </g>
      <g opacity={refIn}>
        <text x={32} y={yAt(spec.threshold.value)+8} fontFamily={serif} fontStyle="italic" fontWeight={800} fontSize={25} fill="#4c403a">{format(spec.threshold.value)}</text>
        <line x1={72} x2={72+(327-72)*refIn} y1={yAt(spec.threshold.value)} y2={yAt(spec.threshold.value)} stroke="#61564f" strokeWidth={1} strokeDasharray="2.5 3.2"/>
      </g>
    </svg>
  </div>;
}

function interpolateAnchors(anchors:number[]):number[]{
  return Array.from({length:64},(_,year)=>{
    const position=year/63*(anchors.length-1);
    const i=Math.floor(position);
    return Number((anchors[i]+(anchors[Math.min(i+1,anchors.length-1)]-anchors[i])*(position-i)).toFixed(2));
  });
}
const demo:PortraitDemo={
  fps:30,durationInFrames:366,reference:"晚点LatePost · BV1rvhHzoEfL · 10.6667–22.8667（轨迹为视觉量取）",
  spec:{
    title:"全球各国总和生育率变化（1960-2023）",sourceLine:"数据来源：世界银行",metric:"总和生育率",firstYear:1960,
    focus:{label:"中国",values:interpolateAnchors([4.45,3.86,7.55,6.63,6.5,5.78,6.49,6.03,5.95,5.24,4.7,4,3.5,2.83,2.73,2.76,2.83,2.72,2.93,2.78,2.62,2.69,2.75,2.67,2.49,2.52,1.83,1.66,1.60,1.56,1.51,1.52,1.56,1.55,1.61,1.61,1.64,1.68,1.70,1.65,1.76,1.68,1.79,1.69,1.80,1.63,1.52,1.39,1.13,.99])},
    comparison:{label:"全球",values:interpolateAnchors([4.67,4.55,5.28,5.11,4.97,5.02,4.83,4.76,4.58,4.45,4.3,4.03,3.95,3.77,3.75,3.72,3.64,3.59,3.44,3.38,3.29,3.14,3.01,2.93,2.86,2.82,2.76,2.71,2.68,2.66,2.61,2.62,2.6,2.56,2.54,2.48,2.45,2.36,2.31,2.22])},
    result:{at:3.75},threshold:{value:2.1,at:7.45},
  } satisfies HistoryThresholdSpec,
};
export const historyThreshold={...historyThresholdContract,Component:HistoryThreshold,demo} as const;
