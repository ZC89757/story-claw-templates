// Compatibility renderer for archived automotive calls only. New projects use documentary-generic.
import {Img,staticFile,useCurrentFrame,useVideoConfig} from "remotion";
import {DOC,DocumentaryCanvas,enter,outCubic,clamp01} from "../documentary-design";
import type {SideBySideComparisonSpec} from "../weighted-comparison/types";

/** Supplied values only; a multiplier never becomes a fabricated exact dollar price. */
export const comparisonHeadline=(text:string)=>{
 const match=text.match(/(?:[<>≤≥约]?\s*)?(?:\d[\d,]*(?:\.\d+)?)(?:\s*[%％倍万亿])?/);
 if(!match||match.index===undefined)return {number:"",before:"",after:text};
 return {number:match[0].trim(),before:text.slice(0,match.index),after:text.slice(match.index+match[0].length)};
};
export const comparisonDisplay=(text:string)=>{
 const h=comparisonHeadline(text);let value=h.number.replace(/\s+/g,""),caption=(h.before+h.after).trim();
 if(!value)return {value:text,caption:"",unit:""};
 if(/以内|不超过/.test(text))value="≤"+value;
 else if(/超过/.test(text))value=">"+value;
 else if(/约/.test(text)&&!value.startsWith("约"))value="约"+value;
 if(/配置组合/.test(text))return {value,caption:"",unit:""};
 if(/美元/.test(text))return {value,caption:h.before.replace(/[：:]\s*$/,"").trim(),unit:"美元"};
 if(/倍/.test(value))caption=/抵免前/.test(text)?"最低规划版本 · 抵免前":"相对左侧的倍数";
 return {value,caption,unit:""};
};
const numeric=(text:string)=>Number(comparisonHeadline(text).number.replace(/[^\d.]/g,""))||1;
// Adapted from video-shotcraft HatchDepth: hatch and solid share EXACTLY one grow curve.
const MaterialBar=({width,t,at,color}:{width:number;t:number;at:number;color:string})=>{
 const grow=outCubic((t-at)/.9),morph=enter(t,at+.75,.5);
 return <div style={{position:"relative",width:620,height:31,borderRadius:5,background:"#9aafbd30",boxShadow:"inset 0 2px 3px #24435420,0 1px 0 #fff9"}}>
  <div style={{position:"absolute",width:width*grow,height:31,borderRadius:5,background:`repeating-linear-gradient(45deg,${color} 0 4px,transparent 4px 11px)`,opacity:1-morph,border:`1px solid ${color}`,boxSizing:"border-box"}}/>
  <div style={{position:"absolute",width:width*grow,height:31,borderRadius:5,background:color,opacity:morph,boxShadow:"0 6px 9px #25455720,inset 0 2px 0 #ffffff45"}}/>
 </div>;
};
export const EditorialScaleTemplate=({spec}:{spec:SideBySideComparisonSpec})=>{
 const t=useCurrentFrame()/useVideoConfig().fps,points=spec.events.filter(e=>e.action==="add"),isConfig=points.some(e=>/配置组合/.test(e.text??""));
 const firstLeft=points.find(e=>e.side==="left"),firstRight=points.find(e=>e.side==="right"),split=enter(t,(firstRight?.at??0)-.7,.7);
 const multiplier=/倍/.test(firstRight?.text??"")?numeric(firstRight?.text??""):1;
 return <DocumentaryCanvas>
  <div style={{position:"absolute",left:150,top:125,fontSize:58,fontWeight:600,opacity:enter(t,0,.4)}}>{isConfig?"配置组合":spec.title}</div>
  {(["left","right"] as const).map((side,si)=>{
   const data=points.filter(e=>e.side===side),first=data[0],at=first?.at??0,p=first?enter(t,at,.55):0;
   const display=comparisonDisplay(first?.text??""),color=si===0?DOC.teal:DOC.orange,x=si===0?585-435*split:1035;
   const bodyReveal=si===0?enter(t,0,.5):p;
   const n=numeric(first?.text??""),count=Math.min(150,Math.ceil(n/10));
   return <div key={side} style={{position:"absolute",left:x,top:0,width:750,opacity:bodyReveal}}>
    <div style={{position:"absolute",top:278,left:22,fontSize:36,fontWeight:600,color:DOC.ink}}>{si===0?spec.leftLabel:spec.rightLabel}</div>
    {isConfig?<div style={{position:"absolute",left:26,top:570,width:650,height:230,perspective:1500}}>
      <div style={{position:"absolute",inset:0,transform:"rotateX(20deg)",transformOrigin:"50% 0",display:"grid",gridTemplateColumns:"repeat(15,35px)",gridAutoRows:16,gap:7,alignContent:"start"}}>
       {Array.from({length:count},(_,i)=>{const grow=outCubic((t-at-i*.004)/.55),morph=enter(t,at+.55+i*.003,.3);return <div key={i} style={{height:16,borderRadius:2,background:color,opacity:grow,transform:`translateY(${-(1-grow)*(22+i%5*5)}px)`,boxShadow:"0 5px 0 #233d4f66,0 8px 10px #233d4f25,inset 0 1px 0 #ffffff80",backgroundImage:morph<1?"repeating-linear-gradient(45deg,#ffffff70 0 3px,transparent 3px 7px)":undefined}}/>})}
      </div>
     </div>:<>
      <div style={{position:"absolute",top:525,left:-15,width:765,height:92,borderRadius:"50%",background:"#a9bac4",boxShadow:"0 25px 45px #233e4c20,0 -2px 0 #fff"}}/>
      <Img src={staticFile("documentary-design-v3/"+(si===0?"sedan.svg":"fastback.svg"))} style={{position:"absolute",left:-10,top:340,width:770,transform:`translateX(${(1-bodyReveal)*100}px)`}}/>
     </>}
    <div style={{position:"absolute",left:26,top:isConfig?363:647,fontFamily:'Bahnschrift,"Microsoft YaHei",sans-serif',fontWeight:700,fontSize:isConfig?143:110,letterSpacing:-5,lineHeight:1.15,color,opacity:p,transform:`translateY(${(1-p)*30}px)`}}>{display.value}<span style={{fontSize:36,letterSpacing:0,marginLeft:10}}>{display.unit}</span></div>
    {display.caption?<div style={{position:"absolute",left:30,top:784,fontSize:36,color:DOC.ink,opacity:p}}>{display.caption}</div>:null}
    {!isConfig?<div style={{position:"absolute",left:30,top:859}}><MaterialBar width={si===0?610/Math.max(1,multiplier):610} t={t} at={at} color={color}/></div>:null}
    {data.slice(1).map((item,i)=><div key={i} style={{position:"absolute",left:30,top:845+i*48,fontSize:36,color:DOC.ink,opacity:enter(t,item.at),transform:`translateY(${(1-enter(t,item.at))*20}px)`}}>{item.text}</div>)}
   </div>;
  })}
  {isConfig?<div style={{position:"absolute",left:600,right:600,bottom:130,textAlign:"center",fontSize:36,color:DOC.ink,opacity:enter(t,.5)}}>每格 10 种，按数量边界示意</div>:null}
 </DocumentaryCanvas>;
};

