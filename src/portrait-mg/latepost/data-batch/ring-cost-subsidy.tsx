import {useCurrentFrame, useVideoConfig} from "remotion";
import {ease, type PortraitDemo} from "../../common";
import {ringCostSubsidyContract, type RingCostSubsidySpec} from "./ring-cost-subsidy-contract";

const sans = "'Microsoft YaHei',sans-serif";
const song = "SimSun,serif";
const digits = "'Times New Roman',serif";
const colors = ["#e3e3e5","#d6d6d8","#cacace","#b1b1b2","#9d9d9e"];
const center = {x:179,y:331};
const inner = 61.5;
const outer = 108.2;
const base = -114;
const sweepFrom = -47;
const labelPositions = [
  {x:140,y:203,reveal:2.85},
  {x:220,y:203,reveal:2.49},
  {x:308,y:296,reveal:3.75},
  {x:118,y:445,reveal:3.45},
  {x:65,y:254,reveal:3.19},
];
const counters = [[0,0],[.75,.011],[1.5,.078],[1.8,.156],[2.4,.795],[3,.944],[4.2,1]];
const point = (radius: number, degrees: number) => {
  const angle = degrees * Math.PI / 180;
  return [center.x+radius*Math.cos(angle), center.y+radius*Math.sin(angle)];
};
const amountInTenThousands = (value: number) => Math.round(value / 1000) / 10;

function segment(start: number, end: number, inside: number, outside: number) {
  const large = end-start > 180 ? 1 : 0;
  return `M ${point(outside,start).join(" ")} A ${outside} ${outside} 0 ${large} 1 ${point(outside,end).join(" ")} L ${point(inside,end).join(" ")} A ${inside} ${inside} 0 ${large} 0 ${point(inside,start).join(" ")} Z`;
}

function counter(time: number) {
  for (let index=1;index<counters.length;index++) {
    if (time<=counters[index][0]) {
      const [fromT,fromV] = counters[index-1];
      const [toT,toV] = counters[index];
      return fromV+(toV-fromV)*ease((time-fromT)/(toT-fromT));
    }
  }
  return 1;
}

function RingCostSubsidy({spec}: {spec: RingCostSubsidySpec}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame/fps;
  const progress = counter(time);
  const total = spec.stages.reduce((sum,stage)=>sum+stage.cost,0);
  const share = spec.subsidy.amount/total;
  const wedge = ease((time-spec.subsidy.at)/.38);
  const wedgeOut = inner+(126-inner)*ease((time-spec.subsidy.at+.03)/.21);
  const amountIn = ease((time-spec.subsidy.at-.94)/.23);
  const ratioIn = ease((time-spec.ratio.at)/.26);
  const [radialInnerX,radialInnerY] = point(inner,sweepFrom);
  const [radialOuterX,radialOuterY] = point(wedgeOut,sweepFrom);
  let cursor = base;
  return (
    <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 82% 27% at 48% 105%,#fce4e2 0%,transparent 100%),linear-gradient(#fbf8f3,#fff8f1)"}}>
      <svg width={360} height={640} viewBox="0 0 360 640" style={{position:"absolute",inset:0}}>
        <defs><clipPath id="latepost-ring-cost-reveal"><path d={segment(sweepFrom-Math.min(359.999,progress*360),sweepFrom,.01,112)}/></clipPath></defs>
        <text x={33} y={132} fontFamily={sans} fill="#282624" fontWeight={800} fontSize={17.8}>{spec.title}</text>
        <text x={33} y={151} fontFamily={sans} fill="#97918c" fontStyle="italic" fontSize={10.5}>{spec.sourceLine}</text>
        <text x={33} y={164} fontFamily={sans} fill="#97918c" fontStyle="italic" fontSize={10.5}>{spec.reportLine}</text>
        <circle cx={center.x} cy={center.y} r={126} fill="none" stroke="#827e79" strokeWidth={.46} opacity={.43*ease((time-2.4)/1.6)}/>
        {spec.stages.map((stage,index)=>{
          const start=cursor;
          const portion=stage.cost/total;
          const end=start+portion*360;
          cursor=end;
          const [x,y]=point(86,(start+end)/2);
          const [ax,ay]=point(outer,start);
          const [bx,by]=point(126,start);
          return <g key={index}>
            <line x1={ax} x2={bx} y1={ay} y2={by} stroke="#85817b" strokeWidth={.44} opacity={.48*ease((time-2.6)/1.2)}/>
            <g clipPath={progress===1 ? undefined : "url(#latepost-ring-cost-reveal)"}>
              <path d={segment(start,end,inner,outer)} fill={colors[index]}/>
            </g>
            <text x={x} y={y+4} textAnchor="middle" fill="#737275" fontFamily={digits} fontStyle="italic" fontSize={11.3}
              opacity={.28*ease((time-1.08-index*.08)/.48)}>{(portion*100).toFixed(1)}%</text>
          </g>;
        })}
        {spec.stages.map((stage,index)=>{
          const {x,y,reveal}=labelPositions[index];
          const appearing=ease((time-reveal)/.29);
          return <g key={index} opacity={appearing} transform={`translate(0 ${3*(1-appearing)})`} textAnchor="middle">
            <text x={x} y={y} fontFamily={sans} fontSize={9.3} fill="#3b3834">{stage.label}</text>
            <text x={x} y={y+14} fontFamily={digits} fontSize={13} fontWeight={700} fill="#100f0d">{amountInTenThousands(stage.cost)}<tspan fontFamily={song} fontSize={11}>万</tspan></text>
          </g>;
        })}
        <text x={179} y={313} textAnchor="middle" fontFamily={sans} fontSize={10.5} fill="#2c2927">{spec.centerSubject}</text>
        <text x={179} y={325} textAnchor="middle" fontFamily={sans} fontSize={10.5} fill="#2c2927">{spec.centerMetric}</text>
        <text x={179} y={352} textAnchor="middle" fill="#b50e12" fontFamily={digits} fontSize={23} fontWeight={750}>
          {amountInTenThousands(total*progress).toFixed(1)}<tspan fontFamily={song} fontSize={14}>万</tspan>
        </text>
        {time>=spec.subsidy.at && <g>
          <line x1={radialInnerX} y1={radialInnerY} x2={radialOuterX} y2={radialOuterY} stroke="#b90f13" strokeWidth={.72} opacity={1-wedge}/>
          <path d={segment(sweepFrom-share*180*wedge,sweepFrom+share*180*wedge,inner,wedgeOut)} fill="#ec120d" opacity={wedge}/>
        </g>}
        <g textAnchor="middle" opacity={amountIn} transform={`translate(0 ${5*(1-amountIn)})`}>
          <text x={288} y={174} fontFamily={digits} fontSize={19.5} fontWeight={800} fill="#c51916">{spec.subsidy.amount}<tspan fill="#25221f" fontFamily={song} fontWeight={500} fontSize={14}>元</tspan></text>
          <text x={289} y={191} fontFamily={sans} fontSize={14} fill="#2d2926">{spec.subsidy.label}</text>
        </g>
        <text x={288} y={219} textAnchor="middle" fontFamily={digits} fontSize={31} fontWeight={800} fill="#ca1420" opacity={ratioIn}
          transform={`translate(0 ${6*(1-ratioIn)})`}>{Math.round(share*100)}%</text>
      </svg>
    </div>
  );
}

// Costs visually transcribed and reconciled to the pictured total after rounding, for preview only.
const demo: PortraitDemo = {
  fps:30,durationInFrames:397,reference:"晚点LatePost · BV1rvhHzoEfL · 40.9667–54.2（分项取画面圆整值作演示）",
  spec:{
    title:"全国家庭孩子 0-17 岁平均养育成本",
    sourceLine:"数据来源：育娲人口研究智库，",
    reportLine:"《中国生育成本报告 2024 版》",
    centerSubject:"每个孩子",
    centerMetric:"平均养育总成本",
    stages:[
      {label:"怀孕 分娩 坐月子",cost:24700},{label:"0-2岁婴儿",cost:73500},{label:"3-5岁幼儿",cost:109500},
      {label:"6-14岁孩子",cost:243000},{label:"15-17岁孩子",cost:87300},
    ],
    subsidy:{label:"育儿补贴",amount:10800,at:7.67},
    ratio:{at:10.04},
  } satisfies RingCostSubsidySpec,
};

export const ringCostSubsidy = {...ringCostSubsidyContract,Component:RingCostSubsidy,demo} as const;
