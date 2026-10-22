import {AbsoluteFill,Img,staticFile,useCurrentFrame,useVideoConfig} from "remotion";
import type {SpeakerQuoteSpec} from "./schema";

/** 16:9: speaker on the right, narration-synchronized quote in the upper left. */
export const SpeakerQuoteLandscapeTemplate=({spec,viewport}:{spec:SpeakerQuoteSpec;viewport?:{width:number;height:number}})=>{
  const config=useVideoConfig(),{width,height}=viewport??config,time=useCurrentFrame()/config.fps;
  const src=/^(https?:|data:|blob:)/.test(spec.portrait)?spec.portrait:staticFile(spec.portrait.replace(/^public[\\/]/,"").replace(/^\/+/,""));
  return <AbsoluteFill style={{width,height,background:"#111c24",color:"#f5f4ed",overflow:"hidden",fontFamily:"Microsoft YaHei, sans-serif"}}>
    <Img src={src} style={{position:"absolute",left:width*.60,top:0,width:width*.40,height,objectFit:"cover",objectPosition:"center top"}}/>
    <AbsoluteFill style={{background:"linear-gradient(90deg,#111c24 52%,rgba(17,28,36,.12) 80%)"}}/>
    <div style={{position:"absolute",left:width*.065,top:height*.12,fontSize:width*.021,letterSpacing:".08em",color:"#a9bec8"}}>{spec.speaker}<span style={{display:"block",marginTop:8,fontSize:".65em",letterSpacing:".1em",color:"#7f969f"}}>{spec.quotation==="direct"?"引语":"观点转述"}</span></div>
    <div style={{position:"absolute",left:width*.065,top:height*.29,width:width*.52,fontSize:width*.044,fontWeight:650,lineHeight:1.65,letterSpacing:".015em",whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>
      {spec.quotation==="direct"?<span>“</span>:null}
      {spec.characters.map((c,i)=><span key={i} style={{opacity:time>=c.at?1:0}}>{c.text}</span>)}
      {spec.quotation==="direct"?<span style={{opacity:time>=(spec.characters.at(-1)?.at??Infinity)?1:0}}>”</span>:null}
    </div>
  </AbsoluteFill>;
};
