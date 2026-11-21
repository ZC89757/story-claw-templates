import {Img,useCurrentFrame,useVideoConfig} from "remotion";
import {asset,clamp,ease,type PortraitDemo} from "../../common";
import {assetReturnWindowContract,type AssetReturnWindowSpec} from "./asset-return-window-contract";

const sans="'Microsoft YaHei',sans-serif";
const song="SimSun,serif";
const serif="'Times New Roman',serif";
const x0=77,x1=282,y0=437;
const normal=(value:number,dp=1)=>Number(value.toFixed(dp));
function AssetReturnWindow({spec}:{spec:AssetReturnWindowSpec}){
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const time=frame/fps;
  const last=spec.values.length-1;
  const assetValue=spec.values[last];
  const xAt=(t:number)=>x0+(x1-x0)*t/last;
  const topValue=Math.max(...spec.values);
  const yAt=(v:number)=>y0-v/topValue*229;
  const baseYear=spec.firstYear%20===0?spec.firstYear:Math.floor(spec.firstYear/20)*20;
  const lastYear=spec.firstYear+last;
  const tickAmount=10**Math.floor(Math.log10(topValue/3))*2;
  const finished=clamp((time-.27)/.86);
  const restart=ease((time-spec.newRate.at)/1.08);
  const currentStart=(spec.startWindowYear-spec.firstYear)*restart;
  const movingEnd=finished*last;
  const draw=(index:number)=> {
    const base=Math.floor(index),q=index-base;
    return spec.values[base]+(spec.values[Math.min(base+1,last)]-spec.values[base])*q;
  };
  const path=[
    [xAt(currentStart),yAt(draw(currentStart))],
    ...spec.values.slice(Math.ceil(currentStart),Math.floor(movingEnd)+1).map((value,index)=>[xAt(index+Math.ceil(currentStart)),yAt(value)]),
    [xAt(movingEnd),yAt(draw(movingEnd))],
  ].map(point=>point.join(",")).join(" ");
  const quantityIn=ease((time-1.37)/1.20);
  const quantityOpacity=ease((time-1.22)/.22)*(1-ease((time-spec.multipleBeat.at+.16)/.20));
  const convertIn=ease((time-2.05)/.47);
  const multipleIn=ease((time-spec.multipleBeat.at)/.31)*(1-ease((time-spec.initialRate.at+.13)/.18));
  const rateIn=ease((time-spec.initialRate.at)/.66);
  const rate=(spec.initialRate.value+(spec.newRate.value-spec.initialRate.value)*restart)*rateIn;
  return <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 79% 26% at 49% 105%,#fbe3e0 0%,transparent 100%),linear-gradient(#fbf8f4,#fff9f2)"}}>
    <Img src={asset(spec.portraitImage)} style={{position:"absolute",left:33,top:184,width:294,height:285,objectFit:"contain",filter:"grayscale(1)",opacity:.20}}/>
    <svg width={360} height={640} viewBox="0 0 360 640" style={{position:"absolute",inset:0}}>
      <text x={27} y={148} fontFamily={sans} fontWeight={800} fontSize={17.8} fill="#2a2826">{spec.title}</text>
      <text x={26} y={167} fill="#a9a19d" fontFamily={song} fontSize={10.4}>{spec.note}</text>
      <text x={28} y={189} fill="#958b84" fontFamily={song} fontStyle="italic" fontSize={11}>{spec.sourceLine}</text>
      <line x1="70" x2="293" y1={y0+1} y2={y0+1} stroke="#a8a09a" strokeWidth=".6" opacity=".49"/>
      {[0,1,2,3].map(i=><text key={i} x={56} y={yAt(i*tickAmount)+6} textAnchor="middle" fill="#292420" fontFamily={serif} fontStyle="italic" fontSize={13}>{normal(i*tickAmount)}</text>)}
      {Array.from({length:7},(_,i)=>baseYear+i*20).filter(year=>year<=lastYear).map(year=><text key={year} x={xAt(year-spec.firstYear)} y={456} textAnchor="middle" fill="#30231c" fontFamily={serif} fontStyle="italic" fontSize={9.7}>{year}</text>)}
      <polyline points={path} fill="none" stroke="#c51418" strokeWidth={1.18} strokeLinejoin="round"/>
      <circle cx={xAt(currentStart)} cy={yAt(draw(currentStart))} r={7} fill="#ed110b" stroke="#fff" strokeWidth={2.8}/>
      <circle cx={xAt(movingEnd)} cy={yAt(draw(movingEnd))} r={7} fill="#ed110b" stroke="#fff" strokeWidth={2.8}/>
      <text x={xAt(currentStart)-20} y={yAt(draw(currentStart))-20} fontFamily={serif} fontWeight={800} fontSize={23} fill="#aaa29c">
        {Math.round(spec.firstYear+currentStart)}<tspan fontFamily={song} fontSize={13}>年</tspan>
      </text>
      <text x={x1-14} y={yAt(assetValue)+2} textAnchor="end" opacity={ease((time-1.18)/.28)} fontFamily={serif} fontWeight={800} fontSize={23} fill="#afa8a0">
        {lastYear}<tspan fontFamily={song} fontSize={13}>年</tspan>
      </text>
      <g opacity={quantityOpacity} textAnchor="middle">
        <text x={183} y={241} fontFamily={serif} fontWeight={800} fontSize={42} fill="#d10d0b">
          {normal(assetValue*quantityIn)}<tspan fontFamily={song} fontSize={21} fill="#231d19"> {spec.currency}</tspan>
        </text>
        <text x={182} y={277} fontFamily={serif} fontWeight={800} fontSize={29} fill="#dc2527" opacity={convertIn}>
          ≈ {normal(spec.converted.value*convertIn)}<tspan fontFamily={song} fontSize={17} fill="#39322d"> {spec.converted.currency}</tspan>
        </text>
        <text x={181} y={293} fontFamily={song} fontSize={9} fill="#8e847a" opacity={convertIn}>{spec.converted.note}</text>
      </g>
      <text x={174} y={287} textAnchor="middle" fontFamily={song} fontWeight={800} fontSize={24} fill="#25211d" opacity={multipleIn}>
        资产翻了 <tspan fontFamily={serif} fontSize={37} fill="#d51112">{spec.multiple}</tspan><tspan fontSize={18} fill="#b41616"> 倍</tspan>
      </text>
      <text x={163} y={285} textAnchor="middle" fontFamily={song} fontWeight={800} fontSize={22} fill="#292521" opacity={rateIn}>
        年化收益为 <tspan fontFamily={serif} fontSize={36} fill="#d51112">{rate.toFixed(2)}</tspan><tspan fill="#b41616" fontSize={20}>%</tspan>
      </text>
    </svg>
  </div>;
}

const anchors=[
  [1901,.32],[1971,.53],[1975,1.69],[1979,3.7],[1982,5],[1986,12],[1988,17],[1989,15],[1992,26],[1994,24],
  [1997,34],[1999,41],[2000,38],[2002,29],[2004,31],[2006,37],[2008,28],[2010,35],[2012,30],[2014,40],
  [2016,45],[2018,43],[2020,52],[2021,64],[2022,56],[2023,65],[2024,68],
];
const sampleYears=Array.from({length:124},(_,index)=>{
  const year=1901+index;
  const next=anchors.findIndex(([anchor])=>anchor>=year);
  if(next<=0) return anchors[0][1];
  const [a,from]=anchors[next-1],[b,to]=anchors[next];
  return normal(from+(to-from)*(year-a)/(b-a),3);
});
const demo:PortraitDemo={
  fps:30,durationInFrames:298,reference:"晚点LatePost · BV1rmWqzEEVU · 28.06675–38.0（年度路径为视觉量取）",
  spec:{
    title:"1901年以来诺奖基金会投资资产变化",
    note:"（注：诺贝尔基金会公布了1901年当年及1975年以后的投资资产金额）",
    sourceLine:"资料来源：诺贝尔基金会",portraitImage:"portrait-mg/latepost/data-batch/treemap-watermark.png",
    firstYear:1901,startWindowYear:1975,values:sampleYears,currency:"亿瑞典克朗",
    converted:{value:51.2,currency:"亿人民币",note:"（注：按1瑞典克朗兑约0.75人民币估算）"},
    multiple:215,multipleBeat:{at:3.83},initialRate:{value:4.46,at:5.45},newRate:{value:7.82,at:7.74},
  } satisfies AssetReturnWindowSpec,
};
export const assetReturnWindow={...assetReturnWindowContract,Component:AssetReturnWindow,demo} as const;
