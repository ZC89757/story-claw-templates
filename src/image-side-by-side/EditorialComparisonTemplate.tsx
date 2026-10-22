import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import type {ImageComparisonSpec} from "./schema";
const ease=(n:number)=>{const p=Math.max(0,Math.min(1,n));return p*p*(3-2*p);};
export const EditorialComparisonTemplate=({spec}:{spec:ImageComparisonSpec})=>{
 const t=useCurrentFrame()/useVideoConfig().fps;
 const focus=[...spec.highlights].reverse().find(h=>h.at<=t);
 return <AbsoluteFill style={{background:"#e8e5dc",color:"#172c2e",fontFamily:'"Microsoft YaHei",sans-serif',overflow:"hidden"}}>
  <AbsoluteFill style={{opacity:.18,backgroundImage:"radial-gradient(#827f6c88 1px,transparent 1px)",backgroundSize:"7px 7px"}}/>
  <div style={{position:"absolute",left:95,top:65,fontSize:27,letterSpacing:2,borderLeft:"5px solid #bd4737",paddingLeft:20}}>{spec.title}</div>
  {(["left","right"] as const).map((side,i)=>{
   const data=spec[side];const items=spec.items.filter(p=>p.side===side);const p=ease((t-items[0].at)/.5);const accent=i?"#bd4737":"#357c79";
   return <div key={side} style={{position:"absolute",left:115+i*880,top:170,width:810,height:720,background:"#faf8f0",border:"1px solid #b4b5a6",boxShadow:"10px 16px 0 #2c3e3520",opacity:p*(focus&&focus.side!==side?.55:1),transform:`rotate(${(i?1:-1)*(.7+(1-p)*6)}deg) translateY(${(1-p)*50}px)`}}>
    <div style={{position:"absolute",left:40,top:35,fontSize:36,fontWeight:700,color:accent}}>{data.label}</div>
    {data.image?<Img src={staticFile(data.image.replace(/^public[\\/]/,""))} style={{position:"absolute",left:180,top:120,width:450,height:270,objectFit:"contain"}}/>:null}
    <div style={{position:"absolute",left:50,right:50,top:425}}>{items.map((item,j)=>{
     const q=ease((t-item.at)/.45);
     return <div key={j} style={{fontSize:item.text.length>23?29:34,fontWeight:500,lineHeight:1.45,marginBottom:23,paddingLeft:20,borderLeft:`4px solid ${accent}`,opacity:q,transform:`translateX(${(1-q)*-35}px)`}}>{item.text}</div>;
    })}</div>
   </div>;
  })}
 </AbsoluteFill>;
};
