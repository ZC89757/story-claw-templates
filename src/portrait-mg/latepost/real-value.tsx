import {Img, useCurrentFrame, useVideoConfig} from "remotion";
import {asset, clamp, ease, type PortraitDemo} from "../common";
import type {RealValueSpec} from "./real-value-contract";

const sans = "'Microsoft YaHei',sans-serif";
const serif = "STSong,SimSun,serif";
const latin = "'Times New Roman',serif";
const toY = (value: number) => 424 - .624 * value;

export function RealValue({spec}: {spec: RealValueSpec}) {
  const time = useCurrentFrame() / useVideoConfig().fps;
  const toX = (year: number) => 77 + (year - spec.axisStartYear) * (241 / 130);
  const first = spec.values[0];
  const last = spec.values.at(-1)!;
  const low = spec.values.reduce((a, b) => a.percent < b.percent ? a : b);
  const firstX = toX(first.year);
  const lastX = toX(last.year);
  const redEnd = toY(last.percent);
  const referenceY = toY(100);
  const compare = ease((time - spec.compare.at) / .32);
  const arrow = ease((time - spec.compare.at - .21) / .57);
  const result = ease((time - spec.compare.at - .67) / .44);
  const progress = clamp((time - .08) / (spec.compare.at - .13));
  const currentX = firstX + (lastX - firstX) * progress;
  const after = spec.values.findIndex((point) => toX(point.year) >= currentX);
  const segmentEnd = after < 0 ? spec.values.length - 1 : Math.max(1, after);
  const right = spec.values[segmentEnd];
  const left = spec.values[segmentEnd - 1];
  const interpolate = clamp((currentX - toX(left.year)) / (toX(right.year) - toX(left.year)));
  const currentY = toY(left.percent + (right.percent - left.percent) * interpolate);
  const line = spec.values.map(point => `${toX(point.year)},${toY(point.percent)}`).join(" ");
  const arrowX = firstX + 26;
  const amount = Number((last.percent / 100).toFixed(1));
  return (
    <div style={{position:"absolute", inset:0, background:"radial-gradient(ellipse 100% 31% at 50% 104%,#fce3df,transparent),linear-gradient(#faf6f2,#fcf6ee 64%,#fef6ef)"}}>
      <Img src={asset(spec.portrait)} style={{position:"absolute", top:200, left:0, width:360, height:271, opacity:.25, objectFit:"contain"}} />
      <svg width={360} height={640} viewBox="0 0 360 640" style={{position:"absolute",inset:0}}>
        <defs><clipPath id="latepost-value-drawing"><rect x={56} y={199} width={Math.max(0,currentX-55)} height={232}/></clipPath></defs>
        <g fontFamily={sans} fill="#141114">
          <text x={29} y={130} fontSize={19} fontWeight={750}>{spec.headline[0]}</text>
          <text x={29} y={155} fontSize={19} fontWeight={750}>{spec.headline[1]}</text>
          <text x={28} y={179} fontSize={14}>{spec.subtitle}</text>
          <text x={28} y={200} fontSize={10} fontFamily={serif} fill="#b4a9a0">{spec.note}</text>
          <text x={29} y={226} fontSize={11} fill="#494445">{spec.axisLabel}</text>
        </g>
        <line x1={59} y1={424} x2={340} y2={424} stroke="#555055" strokeWidth=".7"/>
        {[0,20,40,60,80,100,120].map(offset => (
          <text key={offset} x={toX(spec.axisStartYear + offset)} y={442} textAnchor="middle" fontFamily={latin} fontStyle="italic" letterSpacing={.6} fontSize={12}>{spec.axisStartYear + offset}</text>
        ))}
        {[100,200,300].map((value) => (
          <text key={value} x={29} y={toY(value)+5} fontFamily={latin} fill={value===200?"#a59b91":"#a61121"} opacity={value===200?1:.15+.85*compare} fontStyle="italic" fontSize={12} letterSpacing={1.4}>{value}%</text>
        ))}
        <polyline points={line} clipPath="url(#latepost-value-drawing)" fill="none" stroke="#c1b6aa" strokeWidth={1.4}/>
        <polyline points={line} clipPath="url(#latepost-value-drawing)" fill="none" stroke="#ca142c" strokeWidth={1.65} opacity={1-compare} />
        <circle cx={currentX} cy={currentY} r={4.8} fill="#d40016" stroke="#fffaf2" strokeWidth={1.75} opacity={1-compare}/>
        <g opacity={compare}>
          <circle cx={toX(low.year)} cy={toY(low.percent)} r={3.2} fill="#f9f5f1" stroke="#8f8982" strokeWidth={1.2} />
          <text x={toX(low.year)+7} y={toY(low.percent)+5} fontFamily={latin} fontWeight={700} fill="#a99f97" fontSize={13}>{Math.round(low.percent)}%</text>
          {[referenceY,redEnd].map(y=><line key={y} x1={firstX} x2={lastX} y1={y} y2={y} stroke="#b34151" strokeOpacity=".55" strokeDasharray="4 3" strokeWidth=".6"/>)}
          <circle cx={firstX} cy={referenceY} r={7} fill="#e50012" stroke="#fffaf5" strokeWidth={3}/>
          <circle cx={lastX} cy={redEnd} r={7} fill="#e50012" stroke="#fffaf5" strokeWidth={3}/>
        </g>
        <g opacity={arrow} stroke="#c71931" fill="none" strokeWidth=".8">
          <path d={`M${arrowX-3},${redEnd+7} L${arrowX},${redEnd+1} L${arrowX+3},${redEnd+7} M${arrowX},${redEnd+2} V${redEnd+(referenceY-redEnd)*arrow} M${arrowX-3},${referenceY-7} L${arrowX},${referenceY-1} L${arrowX+3},${referenceY-7}`} strokeDasharray="5 2"/>
        </g>
        <text x={arrowX+12} y={(redEnd+referenceY)/2+6} opacity={result} fontSize={18} fontWeight={800} fontFamily={serif} fill="#171114">
          {spec.resultLead}<tspan dx={3} fontFamily={latin} fontSize={44} fontWeight={900} fill="#d5000d">{amount}</tspan><tspan fontSize={16} fill="#d5000d">倍</tspan>
        </text>
      </svg>
    </div>
  );
}

// Demo data is traced from the source graphic to compare placement and animation.
const trace = [
  [1900,100],[1979,42],[1985,89],[1987,132],[1990,124],[1992,153],[1995,138],
  [1998,213],[2000,177],[2002,222],[2004,280],[2006,154],[2009,232],[2011,221],
  [2013,168],[2015,190],[2017,250],[2019,245],[2021,279],[2023,267],[2025,300],
];
export const realValueDemo: PortraitDemo = {
  fps:30,
  durationInFrames:149,
  reference:"晚点LatePost · BV1rmWqzEEVU · 123.400563–128.367312",
  spec:{
    headline:["诺奖基金涨了 215 倍，实际价值只是","成立时的 3 倍"],
    subtitle:"(以今日货币购买力)",
    note:"（注：仅公布1901年和1975年后的投资资产金额）",
    portrait:"portrait-mg/latepost/nobel-watermark.png",
    axisLabel:"比例",
    axisStartYear:1900,
    values:trace.map(([year,percent])=>({year,percent})),
    resultLead:"成立时的",
    compare:{at:2.22},
  } satisfies RealValueSpec,
};
