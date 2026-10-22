import type {ReactNode} from "react";
import {AbsoluteFill} from "remotion";
export const DOC={ink:"#192c38",paper:"#edf2f5",muted:"#5c7484",line:"#a5b8c4",orange:"#c42839",teal:"#376e91"};
export const clamp01=(v:number)=>Math.max(0,Math.min(1,v));
export const ease=(v:number)=>{const p=clamp01(v);return p*p*(3-2*p)};
export const enter=(t:number,at:number,d=.55)=>ease((t-at)/d);
export const outCubic=(v:number)=>1-Math.pow(1-clamp01(v),3);
export const DocumentaryCanvas=({children}:{children:ReactNode})=><AbsoluteFill style={{width:1920,height:1080,background:"#e5ebee",color:DOC.ink,fontFamily:'"Microsoft YaHei",sans-serif',overflow:"hidden"}}>
 <AbsoluteFill style={{background:"radial-gradient(ellipse at 46% 5%,#fff 0%,#e5ebee 45%,#c4d0d6 100%)"}}/>
 <div style={{position:"absolute",left:110,right:110,bottom:114,height:1,background:"linear-gradient(90deg,transparent,#92a8b455,transparent)"}}/>
 {children}
</AbsoluteFill>;

