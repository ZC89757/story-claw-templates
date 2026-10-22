import {AbsoluteFill,useCurrentFrame,useVideoConfig} from "remotion";
import type {MetricSpec} from "./types";
const ease=(n:number)=>{const p=Math.max(0,Math.min(1,n));return p*p*(3-2*p);};
/** Reveal independent quantities at their own times, without implying a shared scale. */
export const EditorialMetricTemplate=({spec}:{spec:MetricSpec})=>{
 const t=useCurrentFrame()/useVideoConfig().fps;
 const count=spec.points.length;const step=count<=3?210:Math.min(190,780/count);const top=count===2?255:180;
 return <AbsoluteFill style={{background:"#10272b",color:"#f5f2df",fontFamily:'"Microsoft YaHei",sans-serif',overflow:"hidden"}}>
  <AbsoluteFill style={{backgroundImage:"radial-gradient(#8fb7b922 1px,transparent 1px)",backgroundSize:"10px 10px"}}/>
  <div style={{position:"absolute",left:95,top:65,fontSize:27,letterSpacing:2,borderLeft:"5px solid #e2e56d",paddingLeft:20}}>{spec.title}</div>
  {spec.points.map((point,i)=>{
   const p=ease((t-point.at)/.55);const h=Math.min(170,step-22);
   return <div key={point.id} style={{position:"absolute",left:145,right:145,top:top+i*step,height:h,borderBottom:"1px solid #7b9e9966",display:"flex",alignItems:"center",padding:"0 30px",boxSizing:"border-box",background:"#20404455"}}>
    <div style={{width:8,height:h-42,background:i%2?"#80c7c5":"#e2e56d",transform:`scaleY(${p})`,transformOrigin:"bottom"}}/>
    <div style={{marginLeft:28,fontSize:count>5?24:34,color:"#c3d6cd",maxWidth:650,lineHeight:1.4}}>{point.label}</div>
    <div style={{marginLeft:"auto",fontSize:count>5?42:point.value.length>9?66:82,fontWeight:700,color:i%2?"#9ed9d5":"#e2e56d",opacity:p,transform:`translateY(${(1-p)*24}px)`,whiteSpace:"nowrap",fontVariantNumeric:"tabular-nums"}}>{point.value}</div>
   </div>;
  })}
 </AbsoluteFill>;
};
