import {useMemo} from "react";
import {useCurrentFrame,useVideoConfig} from "remotion";
import {DOC,clamp01,ease,enter} from "../documentary-design";
import {LAND_PATHS} from "./land-paths";
import type {RouteMapSpec} from "./schema";
export const projectMapPoint=(p:{longitude:number;latitude:number})=>({x:(p.longitude+180)/360*1920,y:(90-p.latitude)/180*960+60});
type Point={x:number;y:number};
const along=(points:Point[],progress:number)=>{
 const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y)),total=lengths.reduce((a,b)=>a+b,0);let d=total*clamp01(progress);
 for(let i=0;i<lengths.length;i++){if(d<=lengths[i]||i===lengths.length-1){const p=lengths[i]?d/lengths[i]:1;return {x:points[i].x+(points[i+1].x-points[i].x)*p,y:points[i].y+(points[i+1].y-points[i].y)*p}}d-=lengths[i]}
 return points[0];
};
const smoothRoute=(points:Point[]):Point[]=>{
 if(points.length<3)return points;const out:Point[]=[points[0]];
 for(let i=0;i<points.length-1;i++){const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];
  for(let j=1;j<=18;j++){const t=j/18,t2=t*t,t3=t2*t,calc=(k:"x"|"y")=>.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3);out.push({x:calc("x"),y:calc("y")})}
 }return out;
};
export const RouteMapTemplate=({spec}:{spec:RouteMapSpec})=>{
 const {fps,durationInFrames}=useVideoConfig(),t=useCurrentFrame()/fps,total=durationInFrames/fps;
 const stops=useMemo(()=>new Map(spec.stops.map(s=>[s.id,s])),[spec]),paths=useMemo(()=>spec.routes.map(r=>smoothRoute([stops.get(r.from)!,...r.waypoints,stops.get(r.to)!].map(projectMapPoint))),[spec,stops]);
 const index=spec.routes.reduce((v,r,i)=>t>=r.at?i:v,-1),routeIndex=Math.max(0,index),route=spec.routes[routeIndex];
 const dur=(i:number)=>Math.min(2.4,Math.max(.9,(spec.routes[i+1]?.at??spec.routes[i].at+3)-spec.routes[i].at-.2));
 const p=index<0?0:ease((t-route.at)/dur(routeIndex)),point=index<0?projectMapPoint(spec.stops[0]):along(paths[routeIndex],p);
 const prev=index>0?paths[index-1].at(-1)!:point,blend=index>0?enter(t,route.at,.45):1,follow={x:prev.x+(point.x-prev.x)*blend,y:prev.y+(point.y-prev.y)*blend};
 const focus=enter(t,Math.max(0,spec.stops[0].at-1.1),1.1),overview=enter(t,Math.max(spec.routes.at(-1)!.at+3,total-3.4),1.5);
 const zoom=1.03+(2.25-1.03)*focus*(1-overview),cx=960+(follow.x-960)*focus*(1-overview),cy=540+(follow.y-540)*focus*(1-overview),tx=960-cx*zoom,ty=530-cy*zoom;
 const active=spec.stops.filter(s=>s.at<=t).sort((a,b)=>a.at-b.at).at(-1)??spec.stops[0],rects:Array<{x:number;y:number;width:number;height:number}>=[];
 const labels=spec.stops.filter(s=>s.at<=t).sort((a,b)=>Number(b.id===active.id)-Number(a.id===active.id)).flatMap(s=>{
  const q=projectMapPoint(s),x=q.x*zoom+tx,y=q.y*zoom+ty,isActive=s.id===active.id,detail=isActive&&overview<.5?s.detail:"",font=isActive&&overview<.5?43:34;
  const w=Math.max(122,s.label.length*font+36,(detail?.length??0)*36+36),h=detail?116:63;let lx=x+27,ly=y-68;
  if(x<118||x>1800||y<140||y>910)return [];
  if(lx+w>1800)lx=x-w-27;if(ly<145)ly=y+27;
  for(let tries=0;tries<7&&rects.some(r=>lx<r.x+r.width+15&&lx+w>r.x&&ly<r.y+r.height+12&&ly+h>r.y);tries++)ly+=h+12;
  if(lx<110||ly+h>930)return [];
  rects.push({x:lx,y:ly,width:w,height:h});return [{s,x,y,lx,ly,w,h,detail,font,isActive}];
 });
 return <div style={{position:"absolute",width:1920,height:1080,inset:0,overflow:"hidden",background:"#dce6ec",color:DOC.ink,fontFamily:'"Microsoft YaHei",sans-serif'}}>
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
   <defs><radialGradient id="ocean"><stop stopColor="#f4f8fa"/><stop offset="1" stopColor="#c5d6df"/></radialGradient><linearGradient id="land" x2=".6" y2="1"><stop stopColor="#eaf0f1"/><stop offset="1" stopColor="#a9bec9"/></linearGradient></defs>
   <rect width={1920} height={1080} fill="url(#ocean)"/>
   <g transform={`translate(${tx} ${ty}) scale(${zoom})`}>
    {Array.from({length:25},(_,i)=><line key={"v"+i} x1={i*80} x2={i*80} y1={0} y2={1080} stroke="#688ba0" strokeOpacity={.1} strokeWidth={.6}/>)}
    {Array.from({length:14},(_,i)=><line key={"h"+i} y1={i*80} y2={i*80} x1={0} x2={1920} stroke="#688ba0" strokeOpacity={.1} strokeWidth={.6}/>)}
    <g transform="translate(2 5)">{LAND_PATHS.map((d,i)=><path key={i} d={d} fill="#7393a5" opacity={.48}/>)}</g>
    {LAND_PATHS.map((d,i)=><path key={i} d={d} fill="url(#land)" stroke="#91aab8" strokeWidth={.7}/>)}
    {spec.routes.map((r,i)=>{const q=enter(t,r.at,dur(i)),d=paths[i].map((v,j)=>(j?"L":"M")+v.x+","+v.y).join(" "),color=i===index?DOC.orange:DOC.teal;return <g key={i} opacity={t>=r.at?1:0}>
     <path d={d} fill="none" stroke="#fff" strokeWidth={9/zoom} strokeOpacity={.7} pathLength={1} strokeDasharray={1} strokeDashoffset={1-q}/>
     <path d={d} fill="none" stroke={color} strokeWidth={5/zoom} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1-q}/>
     {q>.02&&q<.985?<path d={d} fill="none" stroke={DOC.orange} strokeWidth={9/zoom} pathLength={1} strokeDasharray=".045 .955" strokeDashoffset={.045-q} strokeLinecap="round"/>:null}
    </g>})}
   </g>
   {labels.map(({s,x,y,lx,ly,w,h,detail,font,isActive})=><g key={s.id} opacity={isActive?1:.86}>
    <circle cx={x+2} cy={y+4} r={10} fill="#34556d" opacity={.16}/><circle cx={x} cy={y} r={isActive?12:7} fill="#f8fbfd" stroke={isActive?DOC.orange:DOC.teal} strokeWidth={3}/>
    <circle cx={x} cy={y} r={isActive?4:2.5} fill={isActive?DOC.orange:DOC.teal}/>
    <path d={`M${x} ${y}L${lx+8} ${ly+31}`} fill="none" stroke="#7e98a8" strokeWidth={1.5}/>
    <rect x={lx+2} y={ly+5} width={w} height={h} rx={7} fill="#28485a" opacity={.1}/>
    <rect x={lx} y={ly} width={w} height={h} rx={7} fill="#f8fbfbee" stroke="#a5bbc7"/>
    <text x={lx+18} y={ly+(font===43?47:42)} fontSize={font} fontWeight={isActive?700:500} fill={DOC.ink}>{s.label}</text>
    {detail?<text x={lx+18} y={ly+94} fontSize={36} fill={DOC.ink}>{detail}</text>:null}
   </g>)}
   {index>=0&&p<.99?<g transform={`translate(${point.x*zoom+tx} ${point.y*zoom+ty})`}>
    <circle r={26} fill="#fff" opacity={.9} stroke="#b7c9d2"/>
    {["uk","atlantic","panama"].includes(route.from)&&["atlantic","panama","us"].includes(route.to)?<><path d="M-18 5H18L10 17H-9Z" fill={DOC.orange}/><path d="M-10 -8H10V5H-10ZM-3 -15H3V-8H-3Z" fill={DOC.teal}/><path d="M-23 20Q-15 14-7 20T9 20T25 20" stroke={DOC.teal} strokeWidth={2} fill="none"/></>:<><rect x={-13} y={-12} width={26} height={25} rx={3} fill={DOC.orange}/><path d="M-6 -5H6M-6 2H6" stroke="#fff" strokeWidth={2}/></>}
   </g>:null}
  </svg>
  <div style={{position:"absolute",left:450,right:450,top:405,textAlign:"center",fontSize:79,fontWeight:700,opacity:enter(t,0,.6)*(1-enter(t,Math.max(1,spec.stops[0].at-1.4),.6)),transform:`translateY(${(1-enter(t,0,.6))*28}px)`,textShadow:"0 2px 0 #fff"}}>跨国供应链</div>
 </div>;
};

