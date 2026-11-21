import {Img,useCurrentFrame,useVideoConfig} from "remotion";
import {asset,clamp,ease,type PortraitDemo} from "../../common";
import {priceTierPieContract,type PriceTierPieSpec} from "./price-tier-pie-contract";

const sans="'Microsoft YaHei',sans-serif";
const song="SimSun,serif";
const serif="'Times New Roman',serif";
const positions=[108.5,167.5,225.5,284.5];
const center={x:178.5,y:357.6};
const xAxis=49;
const baseline=452;
const top=236;
const red="#f10e08";
const points=(angle:number)=>[center.x+75*Math.cos(angle),center.y+75*Math.sin(angle)];
function sector(begin:number,end:number) {
  const big=end-begin>Math.PI?1:0;
  return `M ${center.x} ${center.y} L ${points(begin).join(" ")} A 75 75 0 ${big} 1 ${points(end).join(" ")} Z`;
}

function PriceTierPie({spec}:{spec:PriceTierPieSpec}) {
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const time=frame/fps;
  const switchAt=spec.shares.at;
  const pie=ease((time-switchAt)/.56);
  const words=ease((time-switchAt-.18)/.30);
  const chart=ease((time+.03)/.44);
  const high=spec.tiers[2].upper;
  const yAt=(value:number)=>baseline-value/high*(baseline-top);
  const redStart=.34+(2*Math.PI)*(1-spec.shares.leaderShare);
  const redEnd=.34+2*Math.PI;
  const footY=448;
  const dim=1-.82*pie;
  const activeIndex=clamp((time-.82)/(switchAt-.82),0,.999999)*4;
  return <div style={{position:"absolute",inset:0,background:"linear-gradient(#020003 22%,#17131a 37%,#3e3a40 68%,#5d5a5f 90%,#6e6b70 100%)"}}>
    <svg width={360} height={640} viewBox="0 0 360 640" style={{position:"absolute",inset:0}}>
      <defs>
        <filter id="latepost-tier-pie-glow"><feGaussianBlur stdDeviation={5}/></filter>
        <radialGradient id="latepost-tier-pie-white"><stop stopColor="#fffafa"/><stop offset="1" stopColor="#dbd7d8"/></radialGradient>
      </defs>
      <g opacity={chart}>
        <text x={28} y={137} fontFamily={sans} fontSize={23} fontWeight={800} fill="#fafafa">{spec.period}</text>
        <text x={28} y={170} transform="translate(28 0) scale(.92 1) translate(-28 0)" fontFamily={sans} fontSize={23} fontWeight={800} fill="#fafafa">{spec.title}</text>
        <text x={29} y={194} fontFamily={sans} fontSize={13} fontStyle="italic" fill="#918d91">{spec.sourceLine}</text>
        <g opacity={dim}>
          {[0,2,4].map((index)=><rect key={index} x={xAxis} y={baseline-(index+1)*43} width={265} height={43} fill="#ded5e0" opacity={.05}/>)}
          {[0,1,2,3,4,5].map(index=><text key={index} x={52} y={baseline-43.2*index+5} textAnchor="middle" fill="#f8f3f5" fontFamily={serif} fontStyle="italic" fontSize={14.7}>
            {Math.round(high*index/5)}{index===5?"+":""}
          </text>)}
        </g>
        {spec.tiers.map((tier,index)=>{
          const from=index>0?spec.tiers[index-1].upper:0;
          const y=yAt(tier.upper);
          const bottom=yAt(from);
          const reveal=ease((time-index*.11+.015)/.33);
          const labelOpacity=Math.floor(activeIndex)===index?1:.86;
          const label=index===0?`${tier.upper}-0`:index===3?`${tier.upper}+`:`${from}-${tier.upper}`;
          return <g key={index} opacity={reveal*(index===3?1:dim)}>
            <rect x={positions[index]-9.6} y={bottom-(bottom-y)*reveal-(index===3?10:0)} width={19.2} height={index===3?20:Math.max(0,bottom-y)*reveal} rx={9.6} fill={red}/>
            <text x={positions[index]} y={y-(index===3?14:3)} textAnchor="middle" fill="#df130b" fontFamily={digitsForTier} fontSize={12} fontWeight={800}>{label}</text>
            <text x={positions[index]} y={bottom+(index===3?25:16)} textAnchor="middle" fill="#fff" opacity={labelOpacity} fontFamily={sans} fontSize={11.5} fontWeight={700}>{tier.label}</text>
          </g>;
        })}
      </g>
      {pie>0 && <g opacity={pie}>
        <path d="M 171 247 L 274 230 M 290 246 L 290 366" fill="none" stroke="#a5a1a4" strokeWidth={.8} opacity={.56}/>
        <circle cx={center.x} cy={center.y} r={112} fill="#c0b9c1" opacity={.16}/>
        <g transform={`translate(${center.x} ${center.y}) scale(${.82+pie*.18}) translate(${-center.x} ${-center.y}) rotate(${-31*(1-pie)} ${center.x} ${center.y})`}>
          <path d={sector(redStart,redEnd)} fill="#ff1607" opacity={.5} filter="url(#latepost-tier-pie-glow)"/>
          <path d={sector(redStart,redEnd)} fill="#f20d08"/>
          <path d={sector(.34,redStart)} fill="url(#latepost-tier-pie-white)"/>
        </g>
        <text x={62} y={324} fontFamily={song} fontSize={34} fontWeight={800} fill="#fff" opacity={words}>
          {Array.from(spec.shares.leader).map((char,i)=><tspan key={i} x={62} dy={i?24:0}>{char}</tspan>)}
        </text>
        <text x={218} y={footY-7} transform="translate(218 0) scale(.77 1) translate(-218 0)" fontFamily={song} fontSize={22} fontWeight={800} fill="#fff" opacity={words}>{spec.shares.remainder}</text>
      </g>}
    </svg>
    {spec.tiers.map((tier,index)=>{
      const iconY=yAt(tier.upper)-(index===3?55:45);
      const inAt=ease((time-index*.11)/.31);
      return <Img key={index} src={asset(tier.leaderIcon)} style={{position:"absolute",left:positions[index]-14.5,top:iconY+7*(1-inAt),width:29,height:29,objectFit:"contain",opacity:inAt*(index===3?1:(1-pie)*dim)}}/>;
    })}
    <Img src={asset(spec.tiers[3].leaderIcon)} style={{position:"absolute",left:68,top:248+10*(1-words),width:47,height:47,objectFit:"contain",opacity:words}}/>
  </div>;
}

const digitsForTier="'Arial Narrow','Microsoft YaHei',sans-serif";
const icons="portrait-mg/latepost/data-batch/tier";
const demo:PortraitDemo={
  fps:30,durationInFrames:485,reference:"晚点LatePost · BV1Dquj6sEhJ · 50.767125–66.93375",
  spec:{
    period:"2025 年上半年",
    title:"各平台分档酒店销量排名",
    sourceLine:"数据来源：访谈整理所得",
    tiers:[
      {label:"经济型酒店",upper:200,leaderIcon:`${icons}-yellow.png`},
      {label:"中档酒店",upper:500,leaderIcon:`${icons}-blue.png`},
      {label:"高档酒店",upper:1000,leaderIcon:`${icons}-blue.png`},
      {label:"豪华酒店",upper:1000,leaderIcon:`${icons}-blue.png`},
    ],
    shares:{leader:"携程",remainder:"美团飞猪抖音",leaderShare:5/6,at:10},
  } satisfies PriceTierPieSpec,
};

export const priceTierPie={...priceTierPieContract,Component:PriceTierPie,demo} as const;
