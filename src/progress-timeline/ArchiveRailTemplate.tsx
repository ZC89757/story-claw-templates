import type {ReactNode} from "react";
import {Easing,interpolate,useCurrentFrame,useVideoConfig} from "remotion";
import {DOC,DocumentaryCanvas,clamp01,enter} from "../documentary-design";
import {TIMELINE_WINDOW_LAYOUT} from "./content-window";
import {useChildMediaWindows,type ChildMediaWindow} from "../composition-media-context";
import type {ProgressTimelineSpec} from "./types";

// Adapted from video-shotcraft / timeline-travel: accelerate, brake, then 1.28x settle.
export const archiveTravel=(t:number)=>interpolate(clamp01((t-.12)/.95),[0,.15,.88,1],[0,.055,.9,1],{easing:Easing.inOut(Easing.quad)});
export const archiveVideoAmount=(t:number,w:ChildMediaWindow)=>enter(t,w.start,.5)*(1-enter(t,w.end-.32,.32));
export const ArchiveRailTemplate=({spec,media,mediaWindow}:{spec:ProgressTimelineSpec;media?:ReactNode;mediaWindow?:ChildMediaWindow})=>{
 const frame=useCurrentFrame(),{fps,durationInFrames}=useVideoConfig(),t=frame/fps,context=useChildMediaWindows(),windows=mediaWindow?[mediaWindow]:context;
 const activeIndex=Math.max(0,spec.nodes.reduce((v,n,i)=>frame>=Math.round(n.at*fps)?i:v,0)),active=spec.nodes[activeIndex];
 const activeAt=Math.round(active.at*fps)/fps;
 const travel=archiveTravel(t-activeAt),zoom=1+.28*enter(t,activeAt+1.07,.33);
 const layout=Math.max(0,...windows.map(w=>enter(t,w.start-.65,.65)*(1-enter(t,w.end,.5))));
 const videoAmount=Math.max(0,...windows.map(w=>archiveVideoAmount(t,w)));
 const cx=960-700*layout+450*(1-travel),w=900-500*layout,b=TIMELINE_WINDOW_LAYOUT.bounds;
 const year=active.eyebrow.replace(/\s*年$/,"");
 // A split multi-event instance resumes its journey at the preceding milestone.
 // Standalone previews retain the previously approved single-event fill.
 const journey=spec.nodes.length>1?(activeIndex+travel)/spec.nodes.length:clamp01(frame/Math.max(1,durationInFrames-1));
 const radius=350-153*layout,cy=478+16*layout,railX=140+1640*journey;
 return <DocumentaryCanvas>
  <svg width={1920} height={1080} style={{position:"absolute",inset:0,opacity:enter(t,activeAt,.5)}}>
   <defs><radialGradient id="dial-surface"><stop stopColor="#f8fbfc"/><stop offset=".8" stopColor="#e2ebef"/><stop offset="1" stopColor="#bbcdd8"/></radialGradient><linearGradient id="dial-edge" x2=".7" y2="1"><stop stopColor="#fff"/><stop offset=".55" stopColor="#9ab1c0"/><stop offset="1" stopColor="#e7f0f5"/></linearGradient></defs>
   <ellipse cx={cx+8} cy={cy+28} rx={radius} ry={radius*.96} fill="#7694a6" opacity={.14}/>
   <circle cx={cx} cy={cy} r={radius} fill="url(#dial-surface)" stroke="url(#dial-edge)" strokeWidth={9}/>
   <circle cx={cx} cy={cy} r={radius-16} fill="none" stroke="#92aebe" strokeOpacity={.55} strokeWidth={1.5}/>
   {Array.from({length:49},(_,i)=>{const a=(-215+i*5.2)*Math.PI/180,r1=radius-25,r2=radius-(i%4===0?42:33);return <line key={i} x1={cx+Math.cos(a)*r1} y1={cy+Math.sin(a)*r1} x2={cx+Math.cos(a)*r2} y2={cy+Math.sin(a)*r2} stroke={DOC.teal} strokeOpacity={i%4===0?.58:.27} strokeWidth={i%4===0?3:2}/>})}
   <circle cx={cx} cy={cy} r={radius-8} fill="none" stroke={DOC.orange} strokeWidth={5} pathLength={1} strokeDasharray=".055 .945" strokeDashoffset={.74-.16*travel} transform={`rotate(-90 ${cx} ${cy})`}/>
  </svg>
  <div style={{position:"absolute",left:cx-w/2,top:280+105*layout,width:w,textAlign:"center",opacity:enter(t,activeAt,.18),transform:`scale(${(zoom/1.28)*(1-layout)+layout})`,transformOrigin:"50% 70%"}}>
   <div style={{fontFamily:'Bahnschrift,"Arial",sans-serif',fontSize:310-136*layout,fontWeight:700,letterSpacing:-12+7*layout,lineHeight:1,textShadow:"0 2px 0 #fff9"}}>{year}</div>
   <div style={{fontSize:51-15*layout,fontWeight:600,marginTop:25+14*layout,letterSpacing:1}}>{active.title.replace("正式","")}</div>
  </div>
  <div style={{position:"absolute",left:b.x*1920,top:b.y*1080,width:b.width*1920,height:b.height*1080,overflow:"hidden",borderRadius:14,background:"#d0dce3",boxShadow:"0 28px 58px #24435435,0 0 0 9px #f7f9fa",opacity:videoAmount,clipPath:`inset(0 0 0 ${(1-videoAmount)*100}% round 14px)`}}>{media}</div>
  <svg width={1920} height={1080} style={{position:"absolute",inset:0,pointerEvents:"none"}}>
   <defs><linearGradient id="rail-metal" x2="0" y2="1"><stop stopColor="#8fa7b5"/><stop offset=".42" stopColor="#d0dde4"/><stop offset="1" stopColor="#eff5f8"/></linearGradient><clipPath id="tick-clip"><rect x={140} y={880} width={1640} height={62}/></clipPath></defs>
   <rect x={140} y={930} width={1640} height={24} rx={12} fill="url(#rail-metal)" stroke="#a6bac5"/>
   <rect x={140} y={930} width={railX-140} height={24} rx={12} fill={DOC.orange}/>
   <g clipPath="url(#tick-clip)" transform={`translate(${500*(1-travel)} 0)`}>{Array.from({length:49},(_,i)=><line key={i} x1={i*52-260} x2={i*52-260} y1={i%5===0?893:906} y2={922} stroke={DOC.ink} strokeOpacity={i%5===0?.5:.23} strokeWidth={i%5===0?3:2}/>)}</g>
   <path d={`M${railX-12} 883L${railX+12} 883L${railX} 899Z`} fill={DOC.orange}/>
  </svg>
 </DocumentaryCanvas>;
};

