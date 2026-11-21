import {useCurrentFrame,useVideoConfig} from "remotion";
import {ease,type PortraitDemo} from "../../common";
import {firstLastColumnsContract,type FirstLastColumnsSpec} from "./first-last-columns-contract";

const sans="'Microsoft YaHei',sans-serif";
const serif="'Times New Roman',serif";
const chart={firstX:87.5,lastX:310.5,top:170,bottom:440,bar:13.8};
const readable=(value:number)=>Number(value.toFixed(2)).toString();

function FirstLastColumns({spec}:{spec:FirstLastColumnsSpec}){
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const time=frame/fps;
  const target=spec.values[0]/5.37;
  const units=10**Math.floor(Math.log10(target));
  const tick=[1,2,2.5,5,10].find(value=>value*units>=target-1e-9)!*units;
  const yAt=(value:number)=>chart.bottom-(value/(tick*8))*(chart.bottom-chart.top);
  const firstResult=ease((time-spec.first.at)/.22);
  const fadeMid=ease((time-spec.last.at+.42)/.49);
  const lastResult=ease((time-spec.last.at)/.22);
  return <div style={{position:"absolute",inset:0,background:"linear-gradient(#000 22%,#131313 35%,#3e3e3e 64%,#555557 80%,#686869 100%)"}}>
    <svg width={360} height={640} viewBox="0 0 360 640" style={{position:"absolute",inset:0}}>
      <text x={28} y={131} fontFamily={sans} fill="#fbfaf8" fontSize={16.5} fontWeight={800}>{spec.title}</text>
      <text x={28} y={150} fontFamily={sans} fontStyle="italic" fill="#999596" fontSize={12}>{spec.sourceLine}</text>
      {Array.from({length:9},(_,index)=>{
        const value=index*tick;
        const y=yAt(value);
        return <g key={index}>
          <line x1={59} x2={333} y1={y} y2={y} stroke="#d1caca" strokeWidth={.8} opacity={.075}/>
          <text x={34} y={y+5} fontFamily={serif} fill="#dedcda" fontStyle="italic" fontSize={15.5} letterSpacing=".65">{readable(value)}</text>
        </g>;
      })}
      {spec.values.map((datum,index)=>{
        const begin=.16+index*.20;
        const progress=ease((time-begin)/.27);
        const x=chart.firstX+(chart.lastX-chart.firstX)*index/8;
        const barY=yAt(datum*progress);
        return <g key={index}>
          <text x={x} y={456} textAnchor="middle" fill="#ebebeb" fontFamily={sans} fontSize={9.3}>{spec.firstYear+index}</text>
          <rect x={x-chart.bar/2} y={barY} width={chart.bar} height={chart.bottom-barY} fill="#ec0610" opacity={index===0||index===8?1:1-.86*fadeMid}/>
        </g>;
      })}
      <text x={68} y={yAt(spec.values[0])-9+4*(1-firstResult)} opacity={firstResult} fill="#ec0b08" fontFamily={serif} fontWeight={800} fontSize={34}>{readable(spec.values[0])}</text>
      <text x={325} y={yAt(spec.values[8])-12+5*(1-lastResult)} textAnchor="end" opacity={lastResult} fill="#ec0b08" fontFamily={serif} fontWeight={800} fontSize={33}>{readable(spec.values[8])}</text>
    </svg>
  </div>;
}

const demo:PortraitDemo={
  fps:30,durationInFrames:217,reference:"晚点LatePost · BV1qmgZ6QEC6 · 208.1667–215.4（中间柱值为参考画面量取）",
  spec:{
    title:"全球 NOR FLASH 市场下滑(亿美元)",
    sourceLine:"数据来源: 前瞻产业研究院",
    firstYear:2008,values:[53.74,44.1,43.8,42.9,34.1,28.1,26.2,20.4,18.57],
    first:{at:3.15},last:{at:5.15},
  } satisfies FirstLastColumnsSpec,
};
export const firstLastColumns={...firstLastColumnsContract,Component:FirstLastColumns,demo} as const;
