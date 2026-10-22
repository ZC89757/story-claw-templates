import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {cutoutCueMode, type CutoutCueSpec} from "./schema";

export const CUTOUT_POP_HOLD=1.75;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const media=(source:string)=>/^(https?:|data:|blob:)/.test(source)?source:staticFile(source.replace(/^public[\\/]/,"").replace(/^\/+/,""));
export const evaluateCutoutCue=(time:number,at:number,group:string,nextAt=Infinity)=>{
  const t=time-at;
  if(t<0)return {opacity:0,scale:.72,offset:56};
  const enter=1-Math.pow(1-clamp(t/.36),3);
  if(cutoutCueMode(group)==="duo")return {opacity:enter,scale:1,offset:(1-enter)*56};
  const lifetime=Math.min(CUTOUT_POP_HOLD,nextAt-at);
  const exit=clamp((lifetime-t)/.22);
  const scale=t<.16?.72+.36*clamp(t/.16):1+.08*(1-clamp((t-.16)/.18));
  return {opacity:Math.min(enter,exit),scale,offset:0};
};
export const CutoutCueTemplate=({spec,group,viewport,landscapeLayout=false}:{spec:CutoutCueSpec;group:string;viewport?:{width:number;height:number};landscapeLayout?:boolean})=>{
  const config=useVideoConfig(),frame=useCurrentFrame(),{width,height}=viewport??config;
  const portrait=height>width;
  return <AbsoluteFill style={{width,height,background:"transparent",overflow:"hidden",pointerEvents:"none"}}>
    {spec.items.map((item,index)=>{
      const state=evaluateCutoutCue(frame/config.fps,item.at,group,spec.items[index+1]?.at);
      const duo=cutoutCueMode(group)==="duo";
      const x=landscapeLayout?(duo?(index===0?.09:.65):.35):(duo?(index===0?.045:.515):.29);
      const y=landscapeLayout?(duo?.18:.25):(duo?(portrait?.39:.17):.32);
      const w=landscapeLayout?(duo?.26:.30):(duo?.44:.42),h=landscapeLayout?(duo?.68:.40):(duo?(portrait?.47:.65):.32);
      return <div key={index} style={{position:"absolute",left:width*x,top:height*y,width:width*w,height:height*h,opacity:state.opacity,transform:`translateY(${state.offset}px) scale(${state.scale})`,transformOrigin:"center bottom"}}>
        <Sequence from={Math.round(item.at*config.fps)} durationInFrames={Math.ceil(config.fps*.45)} layout="none"><Audio src={staticFile("audio/pop.mp3")} volume={duo?.09:.16}/></Sequence>
        {item.image?<Img src={media(item.image)} style={{width:"100%",height:"100%",objectFit:"contain",objectPosition:"center bottom",filter:duo?"drop-shadow(0 8px 14px rgba(0,0,0,.24))":"drop-shadow(0 8px 12px rgba(0,0,0,.30))"}}/>:null}
        {item.label?<div style={{position:"absolute",top:"calc(100% + 14px)",left:"-5%",width:"110%",textAlign:"center",color:"#fff",fontFamily:"Microsoft YaHei, sans-serif",fontWeight:650,fontSize:width*(portrait?.034:.023),lineHeight:1.5,textShadow:"0 2px 8px #000"}}>{item.label}</div>:null}
      </div>;
    })}
  </AbsoluteFill>;
};
