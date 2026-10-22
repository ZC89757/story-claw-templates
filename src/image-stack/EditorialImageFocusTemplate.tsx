import {AbsoluteFill,Img,staticFile,useCurrentFrame,useVideoConfig} from "remotion";
import type {ImageStackSpec} from "../image-media/types";
const ease=(n:number)=>{const p=Math.max(0,Math.min(1,n));return p*p*(3-2*p);};
export const EditorialImageFocusTemplate=({spec}:{spec:ImageStackSpec})=>{
 const t=useCurrentFrame()/useVideoConfig().fps;
 const active=Math.max(0,spec.images.reduce((n,p,i)=>p.at<=t?i:n,0));
 const item=spec.images[active];const p=ease((t-item.at)/.55);
 const src=/^(https?:|data:)/.test(item.image)?item.image:staticFile(item.image.replace(/^public[\\/]/,""));
 return <AbsoluteFill style={{background:"#101b20",fontFamily:'"Microsoft YaHei",sans-serif',color:"#fff",overflow:"hidden"}}>
  <Img src={src} style={{position:"absolute",inset:-40,width:2000,height:1160,objectFit:"cover",filter:"blur(35px) brightness(.3)",opacity:.55}}/>
  <div style={{position:"absolute",left:95,top:65,fontSize:27,borderLeft:"5px solid #e2e56d",paddingLeft:20,letterSpacing:2}}>{spec.title}</div>
  <div style={{position:"absolute",left:190,top:160,width:1540,height:760,transform:`perspective(1600px) rotateY(${(1-p)*-6}deg) scale(${.96+p*.04}) translateY(${(1-p)*25}px)`,boxShadow:"0 30px 70px #0008",border:"7px solid #eeeadf",background:"#eeeadf",boxSizing:"border-box",opacity:p,overflow:"hidden"}}>
   <Img src={src} style={{width:"100%",height:"100%",objectFit:"cover",transform:`scale(${1+Math.min(.035,Math.max(0,t-item.at)*.0025)})`}}/>
   {item.label?<div style={{position:"absolute",left:30,bottom:30,background:"#10272be8",borderLeft:"4px solid #e2e56d",fontSize:30,padding:"14px 24px",maxWidth:1300}}>{item.label}</div>:null}
  </div>
 </AbsoluteFill>;
};
