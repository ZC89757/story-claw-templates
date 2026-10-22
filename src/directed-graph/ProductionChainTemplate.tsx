import {Easing,Img,interpolate,staticFile,useCurrentFrame,useVideoConfig} from "remotion";
import {DOC,DocumentaryCanvas,enter,clamp01} from "../documentary-design";
import {dampedSettle} from "../documentary-motion";
import type {DirectedGraphSpec} from "./types";

const easeFrame=(f:number,a:number,b:number,easing:(v:number)=>number)=>interpolate(f,[a,b],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing});
// video-shotcraft ExplodedView: 18/-12-degree stage, 14f out-back, 12f reverse assembly.
const Assembly=({t,at}:{t:number;at:number})=>{
 const f=(t-at)*30,out=easeFrame(f,0,14,Easing.out(Easing.back(1.7))),back=easeFrame(f,30,42,Easing.in(Easing.cubic)),p=out*(1-back);
 const settle=f>42?dampedSettle(f-42,.12,.32)*3:0;
 return <div style={{position:"absolute",left:0,top:0,width:620,height:450,perspective:1600}}>
  <div style={{position:"absolute",inset:0,transform:"rotateX(18deg) rotateY(-12deg)",transformStyle:"preserve-3d"}}>
   <div style={{position:"absolute",left:70,top:280+p*22,width:500,height:75,borderRadius:"50%",background:"#263f4e",filter:`blur(${12+20*clamp01(p)}px)`,opacity:.15}}/>
   <Img src={staticFile("documentary-design-v3/battery-pack.svg")} style={{position:"absolute",left:50,top:260-145*p+settle,width:540,transform:`translateZ(${-30+190*p}px)`,filter:`brightness(${.8+.2*clamp01(p)})`,opacity:(.65+.35*clamp01(p))*(1-back)}}/>
   <Img src={staticFile("documentary-design-v3/fastback.svg")} style={{position:"absolute",left:0,top:178+settle,width:620,transform:"translateZ(12px)",opacity:enter(t,at+.12,.45)}}/>
  </div>
 </div>;
};
export const ProductionChainTemplate=({spec}:{spec:DirectedGraphSpec})=>{
 const t=useCurrentFrame()/useVideoConfig().fps,count=spec.nodes.length,visible=spec.nodes.filter(n=>n.at<=t).length,active=Math.max(0,visible-1);
 const viewport=count>3?Math.min(Math.max(0,active-1),count-3)*610:0,x=(i:number)=>350+i*610-viewport;
 const owners=Array.from(new Set(spec.nodes.map(n=>n.label.match(/^(特斯拉|松下)/)?.[1]).filter((s):s is string=>Boolean(s))));
 const ownerColor=(owner:string)=>owner==="松下"?DOC.teal:DOC.orange;
 const firstAt=spec.nodes[0]?.at??0,hasPrelude=firstAt>1.2,preludeMove=hasPrelude?enter(t,firstAt-.6,.6):1;
 return <DocumentaryCanvas>
  <div style={{position:"absolute",left:150,top:125,fontSize:58,fontWeight:600}}>{spec.title?.split(/[·×]/)[0].trim()||"协作生产链"}分工</div>
  <div style={{position:"absolute",left:150,top:228,display:"flex",gap:48}}>{owners.map(owner=><div key={owner} style={{fontSize:33,fontWeight:700,color:ownerColor(owner),opacity:enter(t,spec.nodes.find(n=>n.label.startsWith(owner))?.at??0)}}><span style={{display:"inline-block",width:12,height:12,background:ownerColor(owner),borderRadius:2,marginRight:13,verticalAlign:"middle"}}/>{owner}</div>)}</div>
  <svg width={1920} height={1080} style={{position:"absolute",inset:0}}>
   {spec.edges.map((e,i)=>{const a=spec.nodes.findIndex(n=>n.id===e.from),b=spec.nodes.findIndex(n=>n.id===e.to),p=enter(t,e.at,.85);if(a<0||b<0)return null;const sx=x(a)+260,ex=x(b)-260,yy=700,mid=(sx+ex)/2;return <g key={i} opacity={p}>
    <path d={`M${sx} ${yy}Q${mid} ${yy-90} ${ex} ${yy}`} stroke="#8ea5b5" strokeWidth={12} fill="none" strokeOpacity={.25}/>
    <path d={`M${sx} ${yy}Q${mid} ${yy-90} ${ex} ${yy}`} stroke={DOC.teal} strokeWidth={3} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1-p}/>
    <path d={`M${ex-12} ${yy-18}L${ex} ${yy}L${ex-19} ${yy-3}`} fill="none" stroke={DOC.teal} strokeWidth={3}/>
    {p<1?<g transform={`translate(${sx+(ex-sx)*p} ${yy-180*p*(1-p)}) rotate(${-12+24*p})`}><rect x={-17} y={-12} width={34} height={24} rx={3} fill={DOC.orange}/><path d="M-9 -5H9M-9 2H9" stroke="#fff" strokeWidth={2}/></g>:null}
   </g>})}
  </svg>
  {spec.nodes.map((n,i)=>{const p=enter(t,n.at,.6),intro=i===0&&hasPrelude,displayP=intro?enter(t,0,.6):p,color=ownerColor(n.label.match(/^(特斯拉|松下)/)?.[1]??""),label=n.label.replace(/^(特斯拉提供并管理|松下投资|特斯拉最后做)/,"").replace("厂房、土地和基础设施","厂房、土地与基础设施").replace("设备、制造电芯","设备投入、电芯制造").replace(/^组装$/,"最终组装");
   return <div key={n.id} style={{position:"absolute",left:x(i)-310+(intro?(1-preludeMove)*610:0),top:340,width:620,height:560,opacity:displayP,transform:`translateY(${(1-displayP)*55}px) scale(${intro?1+(1-preludeMove)*.35:1})`,transformOrigin:"50% 35%"}}>
    {i%3===2?<Assembly t={t} at={n.at}/>:<Img src={staticFile("documentary-design-v3/"+(i%3===0?"factory.svg":"cells.svg"))} style={{position:"absolute",left:0,top:0,width:620,filter:"drop-shadow(0 14px 18px #29465412)"}}/>}
    <div style={{position:"absolute",left:75,right:75,top:450,height:4,background:color,transform:`scaleX(${p})`,transformOrigin:"0 50%"}}/>
    <div style={{position:"absolute",left:10,right:10,top:483,textAlign:"center",fontSize:34,fontWeight:600,lineHeight:1.6,opacity:p}}>{label}</div>
   </div>;
  })}
 </DocumentaryCanvas>;
};

