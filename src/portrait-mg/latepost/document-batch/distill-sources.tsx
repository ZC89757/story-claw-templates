import {Img, OffthreadVideo, Sequence, useCurrentFrame, useVideoConfig} from "remotion";
import {asset, clamp, ease, type PortraitDemo} from "../../common";
import type {DistillSourcesSpec} from "./distill-sources-contract";

const root = "portrait-mg/latepost/document-batch/";
const serif = "SimSun, 'Times New Roman', serif";
const easeAt=(t:number,at:number,len:number)=>ease((t-at)/len);
const rect=(x:number,y:number,width:number,height:number)=>({position:"absolute" as const,left:x,top:y,width,height});

function ExtractedSource({source, time, variant}: {source:DistillSourcesSpec["first"];time:number;variant:0|1}) {
  const timing=source.focus.at;
  const selectors = variant===0
    ? [[23,264,158,12],[151,293,120,12],[247,281,92,12]]
    : [[27,265,28,11],[27,310,38,11],[124,303,95,12],[276,302,59,12]];
  const left = variant===0 ? [152,310,104,41] as const : [124,259,129,46] as const;
  const right = variant===0 ? [181,365,138,45] as const : [236,315,96,41] as const;
  const company:readonly [number,number,number,number]=variant===0 ? [23,195,315,42] : [40,180,143,42];
  const number = (main:string,unit:string,at:number,slot:readonly [number,number,number,number])=>{
    const draw = easeAt(time,at,.25);
    return <div style={{...rect(...slot),boxSizing:"border-box",background:"#060505",border:"1px solid #710608",
      color:"#fff",fontFamily:serif,fontSize:25,fontWeight:900,whiteSpace:"nowrap",display:"flex",alignItems:"center",
      paddingLeft:7,opacity:draw,clipPath:`inset(0 ${100*(1-draw)}% 0 0)`}}>
      <span style={{transform:"scaleX(.75)",transformOrigin:"left center"}}>
        <span style={{color:"#e00303"}}>{main}{unit.startsWith("万") ? "万" : ""}</span>{unit.startsWith("万") ? unit.slice(1) : unit}
      </span>
    </div>;
  };
  return <>
    {selectors.map(([x,y,w,h],i)=>{
      const progress=easeAt(time,timing-.16+i*.055,.18);
      return <div key={i} style={{...rect(x,y,w*progress,h),background:"#f41414",mixBlendMode:"screen",opacity:progress*.85}}/>;
    })}
    {[
      <div key="company" style={{...rect(...company),boxSizing:"border-box",background:"#050404",border:"1px solid #710608",
        color:"#fff",fontFamily:serif,fontWeight:900,fontSize:25,whiteSpace:"nowrap",lineHeight:"41px",paddingLeft:6,
        opacity:easeAt(time,timing-.06,.2),clipPath:`inset(0 ${100*(1-easeAt(time,timing-.06,.25))}% 0 0)`}}>
        <span style={{display:"inline-block",transform:"scaleX(.91)",transformOrigin:"left center"}}>{source.party}</span>
      </div>,
      <div key="left">{number(source.leftNumber,source.leftUnit,timing+.14,left)}</div>,
      <div key="right">{number(source.rightNumber,source.rightUnit,timing+.25,right)}</div>,
    ]}
  </>;
}

export function DistillSources({spec}: {spec:DistillSourcesSpec & {_duration?:number}}) {
  const frame=useCurrentFrame();
  const {fps,durationInFrames}=useVideoConfig();
  const time=frame/fps;
  const a=spec.first.focus.at,b=spec.second.focus.at;
  const duration=spec._duration??durationInFrames/fps;
  const up=easeAt(time,-.15,.56);
  const push=easeAt(time,a-.62,.46);
  const mark=easeAt(time,-.05,.55)*(1-easeAt(time,a-.54,.36));
  const pageTurn=easeAt(time,b-.66,.35);
  const pageTwo=easeAt(time,b-.29,.2);
  const ambienceAt=Math.max(b+.62,duration-4.06);
  const ambience=easeAt(time,ambienceAt,.71);
  const bodyShade=easeAt(time,a-.36,.33);
  return <div style={{position:"absolute",inset:0,overflow:"hidden",background:"linear-gradient(#000 19%,#343434 65%,#676568 100%)"}}>
    <div style={{position:"absolute",inset:0,opacity:1-pageTurn,transform:`translateX(${-380*pageTurn}px)`}}>
      {push<1&&<Img src={asset(spec.second.image)} style={{...rect(19,142+(1-up)*240,270,387),transform:"rotate(-6.5deg)",border:"1px solid #666",opacity:.63*up,objectFit:"fill"}}/>}
      <Img src={asset(spec.first.image)} style={{...rect(62-77*push,188-185*push+(1-up)*255,281+94*push,391+188*push),
        objectFit:"fill",border:"1px solid #777",opacity:up*(1-.47*bodyShade)}}/>
      {mark>0&&<div style={{...rect(-10,336,380,61),color:"#fd0905",fontFamily:"Arial,sans-serif",fontSize:47,
        lineHeight:1,letterSpacing:2,fontWeight:650,whiteSpace:"nowrap",opacity:mark,transform:`translateX(${25*(1-up)}px)`}}>{spec.authority}</div>}
      <ExtractedSource source={spec.first} time={time} variant={0}/>
    </div>
    {pageTwo>0 && <div style={{position:"absolute",inset:0,opacity:pageTwo,transform:`translateX(${70*(1-pageTwo)}px)`}}>
      <Img src={asset(spec.second.image)} style={{...rect(17,144,332,390),objectFit:"fill",opacity:.68-.44*ambience}}/>
      <ExtractedSource source={spec.second} time={time} variant={1}/>
    </div>}
    <div style={{position:"absolute",inset:0,background:"linear-gradient(transparent 36%,#040405 93%)",opacity:ambience*.78,pointerEvents:"none"}}/>
    <Sequence from={Math.ceil(ambienceAt*fps)} layout="none">
      <OffthreadVideo src={asset(root+"distill-light-layer.mp4")} muted style={{position:"absolute",inset:0,width:"100%",height:"100%",
        objectFit:"cover",opacity:.92*ambience,mixBlendMode:"screen"}}/>
    </Sequence>
    {ambience>0&&<div style={{position:"absolute",inset:0,opacity:ambience}}>
      <ExtractedSource source={spec.second} time={time} variant={1}/>
    </div>}
  </div>;
}

export const distillSourcesDemo: PortraitDemo = {
  fps:30,durationInFrames:371,
  reference:"晚点LatePost · BV1jchK6REaB · 10.9667–23.3333",
  spec:{
    authority:"ANTHROPIC",
    first:{image:root+"distill-report-a.png",party:"DeepSeek、Kimi、MiniMax",
      leftNumber:"2.4",leftUnit:"万账户",rightNumber:"1600",rightUnit:"万次交互",focus:{at:2.81}},
    second:{image:root+"distill-report-b.png",party:"阿里千问 Qwen",
      leftNumber:"2880",leftUnit:"万次交互",rightNumber:"2.5",rightUnit:"万账户",focus:{at:5.25}},
  } satisfies DistillSourcesSpec,
};
