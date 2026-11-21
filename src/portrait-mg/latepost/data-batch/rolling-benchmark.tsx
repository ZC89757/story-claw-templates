import {Img,useCurrentFrame,useVideoConfig} from "remotion";
import {asset,clamp,ease,type PortraitDemo} from "../../common";
import {rollingBenchmarkContract,type RollingBenchmarkSpec} from "./rolling-benchmark-contract";

const sans="'Microsoft YaHei',sans-serif";
const song="SimSun,serif";
const digits="'Times New Roman',serif";
const plot={left:58,right:333,top:224,bottom:427,year:6.28};
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;

function RollingBenchmark({spec}:{spec:RollingBenchmarkSpec}){
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const time=frame/fps;
  const end=spec.subject.values.length-1;
  const earlyFirst=Math.floor(spec.firstYear/10)*10;
  const lateFirst=spec.recent.year-10;
  const lateShift=(lateFirst-earlyFirst)*plot.year-75;
  const pan=ease((time-spec.recent.at+.22)/.95);
  const xAt=(year:number)=>71+(year-earlyFirst)*plot.year-pan*lateShift;
  const maximum=Math.max(...spec.subject.values,...spec.benchmark.values);
  const unitScale=10**Math.floor(Math.log10(maximum/3));
  const unit=[1,2,2.5,5,10].find(value=>value*unitScale>=maximum/3)!*unitScale;
  const yAt=(value:number)=>plot.bottom-(value-1)/(3*unit-1)*(plot.bottom-plot.top);
  const before=spec.recent.year-spec.firstYear;
  const earlier=clamp((time-.55)/(spec.recent.at-.69));
  const after=clamp((time-spec.recent.at-.25)/(spec.finish.at-spec.recent.at-.25));
  const visiblePoint=before*earlier+(end-before)*after;
  const rightEdge=Math.max(plot.left,Math.min(plot.right,xAt(spec.firstYear+visiblePoint)));
  const startBg=Math.max(plot.left,Math.min(plot.right,xAt(spec.recent.year)));
  const intro=ease((time-.01)/.49);
  const path=(values:number[])=>values.map((value,index)=>`${xAt(spec.firstYear+index)},${yAt(value)}`).join(" ");
  const ticks=Array.from({length:Math.floor((spec.firstYear+end-earlyFirst)/10)+1},(_,index)=>earlyFirst+index*10);
  return <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 80% 26% at 50% 105%,#fbe4df 0%,transparent 100%),linear-gradient(#fbf8f5,#fdf7ef)"}}>
    <Img src={asset(spec.portraitImage)} style={{position:"absolute",left:33,top:184,width:294,height:285,opacity:.2,filter:"grayscale(1)",objectFit:"contain"}}/>
    <svg width={360} height={640} viewBox="0 0 360 640" style={{position:"absolute",inset:0}}>
      <defs>
        <clipPath id="latepost-benchmark-calendar"><rect x={plot.left-7} y={plot.top-4} width={plot.right-plot.left+10} height={239}/></clipPath>
        <clipPath id="latepost-benchmark-traces"><rect x={plot.left} y={plot.top-6} width={Math.max(0,rightEdge-plot.left)} height={211}/></clipPath>
      </defs>
      <text x={28} y={140} fontFamily={sans} fontSize={23} fontWeight={800} fill="#171210"
        transform="translate(28 0) scale(.94 1) translate(-28 0)">
        {spec.titleLead}{spec.titleEmphasis}
      </text>
      <line x1={200} x2={332} y1={152} y2={152} stroke="#b0110d" strokeWidth={2.1}/>
      <text x={27} y={171} fontFamily={song} fill="#a29991" fontSize={10} opacity=".68">{spec.note}</text>
      <text x={28} y={189} fontFamily={song} fill="#857b75" fontSize={11} fontStyle="italic">{spec.sourceLine}</text>
      <g opacity={intro}>
        <text x={29} y={211} fontFamily={song} fontSize={11.5} fill="#4f463e">{spec.axisLabel}</text>
        <rect x={186} y={188} width={10.5} height={10.5} fill="#e51108"/>
        <text x={202} y={197} fontFamily={song} fontWeight={800} fontSize={13} fill="#8c211e">{spec.subject.label}</text>
        <rect x={186} y={213} width={10.5} height={10.5} fill="#126170"/>
        <text x={202} y={222} fontFamily={song} fontWeight={800} fontSize={13} fill="#19515b">{spec.benchmark.label}</text>
        <rect x={startBg} y={plot.top} width={plot.right-startBg-10>0?plot.right-startBg-10:0} height={plot.bottom-plot.top} fill="#e69892" opacity={.105*pan}/>
        {[1,unit,unit*2,unit*3].map((value,index)=><g key={index}>
          <line x1={71} x2={323} y1={yAt(value)} y2={yAt(value)} stroke="#998f87" strokeWidth=".5" opacity=".14"/>
          <text x={38} y={yAt(value)+4} textAnchor="middle" fontFamily={digits} fontStyle="italic" fontSize={14.5} fill="#92877e">{Number(value.toFixed(1))}</text>
        </g>)}
        <g clipPath="url(#latepost-benchmark-calendar)">
          {ticks.map(year=><g key={year} opacity={ease((xAt(year)-plot.left+17)/33)*(year===lateFirst?1-pan:1)}>
            <line x1={xAt(year)} x2={xAt(year)} y1={plot.top} y2={plot.bottom} stroke="#9a968e" strokeWidth=".58" opacity=".16"/>
            <text x={xAt(year)} y={453} textAnchor="middle" fontFamily={digits} fontStyle="italic" letterSpacing=".6" fontSize={17} fontWeight={700}
              fill={year>=spec.recent.year&&time>spec.recent.at-.4?"#b01c14":"#231c18"}>{year}</text>
          </g>)}
        </g>
        <line x1={plot.left} x2={plot.right} y1={plot.bottom} y2={plot.bottom} stroke="#756e68" strokeWidth=".9"/>
        <g clipPath="url(#latepost-benchmark-traces)">
          <polyline points={path(spec.subject.values)} fill="none" stroke="#8d271d" strokeWidth="1.42" strokeLinejoin="round"/>
          <polyline points={path(spec.benchmark.values)} fill="none" stroke="#204657" strokeWidth="1.42" strokeLinejoin="round"/>
        </g>
      </g>
    </svg>
  </div>;
}

const years=Array.from({length:50},(_,index)=>1975+index);
const anchors=[
  [1975,1,1],[1980,1.2,1.1],[1984,4,1.8],[1986,5,2.6],[1988,9,3.3],[1989,8,3.7],
  [1990,10,4],[1992,10.2,4.4],[1993,10.5,5],[1995,14.3,7],[1996,14,8.1],[1998,17.2,11],
  [1999,22.6,16],[2000,23.4,15.3],[2001,21.4,14],[2002,17,12.9],[2003,17.5,10.7],
  [2004,19.8,12.3],[2005,20.4,13],[2006,21.2,14.7],[2007,21.2,15.6],[2008,16.9,10],
  [2009,17.9,12.6],[2010,18.8,13.9],[2011,17.5,13.6],[2012,19.1,14],[2013,19.8,16.8],
  [2014,21.2,19.2],[2015,22,22],[2016,24.7,23.3],[2017,25,26.1],[2018,25.3,28],
  [2019,28.3,29.3],[2020,25.9,35.6],[2021,31.7,43.6],[2022,34.5,52.7],[2023,32.5,44.5],[2024,39.9,60],
];
const sampled=(series:number)=>years.map(year=>{
  const i=anchors.findIndex(([at])=>at>=year);
  if(i<=0)return anchors[0][series];
  const previous=anchors[i-1],next=anchors[i];
  return Number(mix(previous[series],next[series],(year-previous[0])/(next[0]-previous[0])).toFixed(2));
});
const demo:PortraitDemo={
  fps:30,durationInFrames:425,reference:"晚点LatePost · BV1rmWqzEEVU · 77.3001875–91.4670625（路径仅为视觉量取）",
  spec:{
    titleLead:"投资回报率曾长期",titleEmphasis:"超过标普 500",
    note:"（注：基金会公布了1901年及1975年后的投资资产金额）",sourceLine:"资料来源：诺贝尔基金会",axisLabel:"倍数（期末值/期初值）",
    portraitImage:"portrait-mg/latepost/data-batch/treemap-watermark.png",
    firstYear:1975,subject:{label:"诺贝尔基金会投资资产",values:sampled(1)},benchmark:{label:"标普 500 指数",values:sampled(2)},
    recent:{year:2010,at:10.38},finish:{at:12.7},
  } satisfies RollingBenchmarkSpec,
};
export const rollingBenchmark={...rollingBenchmarkContract,Component:RollingBenchmark,demo} as const;
