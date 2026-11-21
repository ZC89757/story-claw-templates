import {useCurrentFrame, useVideoConfig} from "remotion";
import {clamp, ease, type PortraitDemo} from "../../common";
import {pairedChanges, pairedPriceTracesContract, type PairedPriceTracesSpec} from "./paired-price-traces-contract";

const plot = {left:36, right:275, top:220, bottom:433, baseline:394};
const sans = "'Microsoft YaHei',sans-serif";
const song = "SimSun,'Times New Roman',serif";
const digits = "'Times New Roman',serif";
const red = "#d01e18";
const blue = "#8271dd";
const mix = (a:number,b:number,p:number) => a+(b-a)*p;

function prepare(values: number[], ceiling: number) {
  const points=values.map((value,index)=>[
    mix(plot.left,plot.right,index/(values.length-1)),
    plot.baseline-value/ceiling*167,
  ]);
  const poly=points.map(label=>label.join(",")).join(" ");
  const atProgress=(progress:number)=>{
    const step=clamp(progress)*(points.length-1);
    const pos=Math.floor(step);
    const first=points[pos];
    const last=points[Math.min(pos+1,points.length-1)];
    return [mix(first[0],last[0],step-pos),mix(first[1],last[1],step-pos)];
  };
  return {poly,atProgress};
}

function PairedPriceTraces({spec}:{spec:PairedPriceTracesSpec}) {
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const time=frame/fps;
  const redChanges=pairedChanges(spec.rise.trace);
  const blueChanges=pairedChanges(spec.comparison.trace);
  const positive=Math.max(.001,...redChanges,...blueChanges);
  const negative=Math.max(positive*.04,...redChanges.map(value=>-value),...blueChanges.map(value=>-value));
  const ceiling=Math.max(positive,negative*167/22);
  const first=prepare(redChanges,ceiling);
  const second=prepare(blueChanges,ceiling);
  const chartStart=.31;
  const length=spec.record.at-chartStart;
  const lineIn=clamp((time-chartStart) / (length+.67));
  const axisEnd=ease((time-spec.record.at+.10)/.28);
  const resultIn=ease((time-spec.record.at)/.36);
  const blueDim=1-.66*ease((time-spec.emphasis.at)/.30);
  const chartIn=ease((time-.08)/.38);
  const exit=clamp((time-spec.exit.at)/.7);
  const bodyOpacity=chartIn*(1-.7*ease(exit));
  const [rx,ry]=first.atProgress(lineIn);
  const [bx,by]=second.atProgress(lineIn*.965+.035*axisEnd);
  const traceRight=plot.left+(plot.right-plot.left)*lineIn;
  const year=spec.periodLine.match(/(?:19|20)\d{2}/)?.[0] ?? "";
  return (
    <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 82% 31% at 48% 105%,#fbe3e0 0%,transparent 100%),linear-gradient(#fbf8f4,#fff8f3)"}}>
      <svg width={360} height={640} viewBox="0 0 360 640" style={{position:"absolute",inset:0}}>
        <defs>
          <clipPath id="latepost-pair-trace-red"><rect x={34} y={200} width={Math.max(0,traceRight-34)} height={235}/></clipPath>
          <clipPath id="latepost-pair-trace-blue"><rect x={34} y={200} width={Math.max(0,bx-34)} height={235}/></clipPath>
          <linearGradient id="latepost-pair-light" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#f6c8bc" stopOpacity={.13}/><stop offset="1" stopColor="#f5c8bd" stopOpacity={.24}/>
          </linearGradient>
        </defs>
        <g opacity={bodyOpacity}>
          {year && <text x={25} y={200} fontFamily={digits} fontSize={145} fontWeight={850} fill="#edc9c5" opacity={.26}>{year}</text>}
          <text x={29} y={139} transform="translate(29 0) scale(.95 1) translate(-29 0)" fontFamily={sans} fontWeight={800} fontSize={24} fill="#13100f">{spec.title}</text>
          <text x={28} y={164} fontFamily={sans} fontSize={13} fontStyle="italic" fill="#807974">{spec.sourceLine}</text>
          <text x={28} y={182} fontFamily={sans} fontSize={13} fontStyle="italic" fill="#807974">{spec.periodLine}</text>
          <text x={330} y={164} textAnchor="end" fontFamily={sans} fontSize={14} fill="#3b3836">不构成投资建议</text>
          <rect x={plot.left} y={plot.top} width={Math.max(0,traceRight-plot.left)} height={plot.bottom-plot.top} fill="url(#latepost-pair-light)"/>
          <line x1={plot.left} x2={plot.left} y1={mix(419,plot.top,ease((time-.25)/.44))} y2={plot.bottom} stroke="#81736e" strokeWidth={.8} opacity={.64}/>
          <text x={34} y={456} fontFamily={digits} fontSize={17} fontWeight={700} fill="#171312">{spec.firstTick}</text>
          <g opacity={axisEnd}>
            <line x1={plot.right} x2={plot.right} y1={plot.top} y2={plot.bottom} stroke="#81736e" strokeWidth={.8} opacity={.68}/>
            <text x={279} y={454} textAnchor="end" fontFamily={digits} fontSize={18} fontWeight={700} fill="#171312">{spec.lastTick}</text>
          </g>
          <polyline points={first.poly} fill="none" stroke={red} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" clipPath="url(#latepost-pair-trace-red)"/>
          <text x={rx+9} y={ry+2} fill={red} fontFamily={song} fontSize={17} fontWeight={850} stroke={red} strokeWidth={.20}>{spec.rise.name}</text>
          <g opacity={blueDim}>
            <polyline points={second.poly} fill="none" stroke={blue} strokeWidth={2.45} strokeLinecap="round" strokeLinejoin="round" clipPath="url(#latepost-pair-trace-blue)"/>
            <text x={bx+12} y={by+1} fill={blue} fontFamily={song} fontSize={17} fontWeight={850} stroke={blue} strokeWidth={.20}>{spec.comparison.name}</text>
            <text x={241} y={418+6*(1-resultIn)} fill={blue} opacity={resultIn} fontSize={26} fontFamily={digits} fontWeight={800}>
              {spec.comparison.value}<tspan fontFamily={song} fontSize={14}>元</tspan>
            </text>
          </g>
          <text x={154} y={236+6*(1-resultIn)} fill={red} opacity={resultIn} fontSize={40} fontFamily={digits} fontWeight={800}>
            {spec.rise.value}<tspan fontFamily={song} fontSize={20}> 元</tspan>
          </text>
        </g>
        <circle cx={184} cy={288} r={248*ease(exit+.22)} opacity={.10*ease(exit+.12)} fill="#f0b9b6"/>
      </svg>
    </div>
  );
}

// The sample traces below were digitized from the on-screen paths. Runtime accepts caller data.
const referenceTrace = (shape: number[]) => shape.map(value => (value - shape[0]) / 100 + 1);
const demo: PortraitDemo = {
  fps:30,durationInFrames:218,reference:"晚点LatePost · BV1y6nEz8EBm · 8.067–15.333（路径仅为视觉量取）",
  spec:{
    title:"寒武纪 VS 贵州茅台股价对比",
    sourceLine:"数据来源: TradingView",
    periodLine:"对比周期：2025年7月28日到8月28日",
    firstTick:"7.28",lastTick:"8.28",
    rise:{name:"寒武纪",value:1587,trace:referenceTrace([
      18.7,19.2,19.9,20.3,19.9,18.9,18.2,18.9,20.1,20.8,20.6,19.4,18,18,18.7,18.7,18.7,18.7,18.9,18.9,18.9,18.9,18.7,18.7,19.4,21.3,21.3,20.3,19.6,19.2,18.9,18.9,19.9,20.1,21,24.5,31.1,32.9,32.9,32.7,32.9,36.7,41.6,42,42.4,40.9,39.7,39.7,40.8,44.9,44.1,43.7,43.3,42.6,42,43.8,44.4,46.3,47,50,52,51.2,53,63.1,66,70,72.2,74.1,76.9,79.7,77.3,75,76.9,82.7,86.4,86.2,83.2,88.6,89.5,95.8,
    ])},
    comparison:{name:"茅台",value:1446,trace:referenceTrace([
      17.8,17.8,18,17.5,18.2,17.8,21.7,22.9,22.9,22.2,13.8,11.2,10.7,10.3,8.9,8.6,9.1,9.1,8.6,9.6,11.4,12.4,13.3,13.3,12.1,11.4,11.7,12.4,12.9,12.4,11,10.7,10.7,10.7,16.6,16.6,20.8,22,24.3,22.2,16.6,12.4,11.4,11,12.9,14,13.3,13.3,12.9,12.6,11.7,13.8,14.7,14.5,14.7,18,18.5,18,19.6,21.7,22.2,22.7,21.3,21.5,22,23.6,23.8,26.6,31.1,36.4,38.6,39.1,39.5,38.4,37.4,28.5,27.7,24.8,22.7,22.1,
    ])},
    record:{at:3.18},emphasis:{at:4.93},exit:{at:6.44},
  } satisfies PairedPriceTracesSpec,
};

export const pairedPriceTraces = {...pairedPriceTracesContract,Component:PairedPriceTraces,demo} as const;
