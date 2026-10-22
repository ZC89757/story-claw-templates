import {AbsoluteFill,Img,staticFile,useCurrentFrame,useVideoConfig} from "remotion";
import type {SpeakerQuoteSpec} from "./schema";
export const SpeakerQuoteTemplate=({spec,viewport}:{spec:SpeakerQuoteSpec;viewport?:{width:number;height:number}})=>{
  const config=useVideoConfig(),frame=useCurrentFrame(),{width,height}=viewport??config,portrait=height>width;
  const src=/^(https?:|data:|blob:)/.test(spec.portrait)?spec.portrait:staticFile(spec.portrait.replace(/^public[\\/]/,"").replace(/^\/+/,""));
  const time=frame/config.fps;
  return <AbsoluteFill style={{width,height,background:"#111c24",color:"#f5f4ed",overflow:"hidden",fontFamily:"Microsoft YaHei, sans-serif"}}>
    <Img src={src} style={{position:"absolute",left:portrait?0:width*.56,top:portrait?height*.4:0,width:portrait?width:width*.44,height:portrait?height*.66:height,objectFit:"cover",objectPosition:"center top"}}/>
    <AbsoluteFill style={{background:portrait?"linear-gradient(180deg,#111c24 34%,rgba(17,28,36,.13) 58%,rgba(17,28,36,.20) 86%,#111c24)":"linear-gradient(90deg,#111c24 48%,rgba(17,28,36,.12) 78%)"}}/>
    <div style={{position:"absolute",left:width*.075,top:height*(portrait?.075:.16),fontSize:width*(portrait?.036:.018),letterSpacing:".08em",color:"#a9bec8"}}>{spec.speaker}<span style={{display:"block",marginTop:8,fontSize:".65em",letterSpacing:".1em",color:"#7f969f"}}>{spec.quotation==="direct"?"引语":"观点转述"}</span></div>
    <div style={{position:"absolute",left:width*.075,top:height*(portrait?.175:.34),width:width*(portrait?.85:.5),fontSize:width*(portrait?.066:.044),fontWeight:650,lineHeight:1.65,letterSpacing:".015em",whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>
      {spec.quotation==="direct"?<span>“</span>:null}
      {spec.characters.map((c,i)=><span key={i} style={{opacity:time>=c.at?1:0}}>{c.text}</span>)}
      {spec.quotation==="direct"?<span style={{opacity:time>=(spec.characters.at(-1)?.at??Infinity)?1:0}}>”</span>:null}
    </div>
  </AbsoluteFill>;
};
