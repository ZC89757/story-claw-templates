import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import type {WebNewsFocusRect, WebNewsFocusSpec} from "./types";

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => {const x = clamp(v); return x*x*(3-2*x);};
const lerp = (a: number,b: number,t: number) => a+(b-a)*t;
// Measured screen-space path landmarks; Hermite interpolation preserves velocity.
const pathTimes=[0,1,1.2,1.4,1.6,1.8,2,2.4];
const pathValue=(values:number[],time:number)=>{
  if(time<=0)return values[0];if(time>=2.4)return values[7];
  let i=0;while(pathTimes[i+1]<time)i++;
  const dt=pathTimes[i+1]-pathTimes[i],u=(time-pathTimes[i])/dt;
  const before=Math.max(0,i-1),after=Math.min(7,i+2);
  const m0=i===0?0:(values[i+1]-values[before])/(pathTimes[i+1]-pathTimes[before]);
  const m1=i===6?0:(values[after]-values[i])/(pathTimes[after]-pathTimes[i]);
  return (2*u*u*u-3*u*u+1)*values[i]+(u*u*u-2*u*u+u)*dt*m0+(-2*u*u*u+3*u*u)*values[i+1]+(u*u*u-u*u)*dt*m1;
};
// Projective sheet, not a flat skew: far and near edges have distinct slopes.
const sheetMatrix=(w:number,h:number,t:number,roll:number)=>{
  const x1=w,y1=roll,x2=w-240*t,y2=h+200*t,x3=-360*t,y3=h;
  const dx1=x1-x2,dx2=x3-x2,dx3=-x1+x2-x3;
  const dy1=y1-y2,dy2=y3-y2,dy3=-y1+y2-y3;
  const den=dx1*dy2-dx2*dy1,g=(dx3*dy2-dx2*dy3)/den,k=(dx1*dy3-dx3*dy1)/den;
  return `matrix3d(${(x1+g*x1)/w},${(y1+g*y1)/w},0,${g/w},${(x3+k*x3)/h},${(y3+k*y3)/h},0,${k/h},0,0,1,0,0,0,0,1)`;
};
const union = (rs: WebNewsFocusRect[]): WebNewsFocusRect => {
  const x=Math.min(...rs.map(r=>r.x)),y=Math.min(...rs.map(r=>r.y));
  return {x,y,width:Math.max(...rs.map(r=>r.x+r.width))-x,height:Math.max(...rs.map(r=>r.y+r.height))-y};
};
const mergePanels=(rects:WebNewsFocusRect[])=>{
  const merged:WebNewsFocusRect[]=[];
  for(const r of [...rects].sort((a,b)=>a.y-b.y||a.x-b.x)){const prev=merged[merged.length-1];
    if(prev && Math.abs(prev.x-r.x)<.01 && Math.abs(prev.width-r.width)<.01 && Math.abs(prev.y+prev.height-r.y)<.01) prev.height+=r.height;
    else merged.push({...r});
  }
  return merged;
};

/** A single horizontal block wipe, shared across rows and inline/link fragments. */
export const paperRevealRects = (rects: WebNewsFocusRect[], progress: number) => {
  const rows: WebNewsFocusRect[][]=[];
  for(const r of [...rects].sort((a,b)=>a.y-b.y||a.x-b.x)) {
    const row=rows.find(rs=>Math.abs(rs[0].y-r.y)<Math.max(3,r.height*.4));
    if(row) row.push(r); else rows.push([r]);
  }
  const block=union(rects),edge=block.x+clamp(progress)*block.width;
  const visible=rows.flatMap((rs)=>{
    return rs.map(r=>({...r,width:Math.max(0,Math.min(r.width,edge-r.x))})).filter(r=>r.width>0);
  });
  return mergePanels(visible);
};

/** Same source/DOM anchors as focus; only the presentation belongs to this group. */
export const PaperFocusTemplate = ({spec}: {spec:WebNewsFocusSpec}) => {
  const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;
  const c=spec.capture;
  if(!c || c.highlights.length!==spec.highlights.length) throw new Error("paper-focus requires matching Provider capture");
  const w=c.viewport.width,h=c.viewport.height;
  const first=spec.highlights[0].at;
  // Adjacent simultaneous targets form one evidence block (title plus abstract).
  let active=0;
  spec.highlights.forEach((a,i)=>{if(t>=a.at-.15) active=i;});
  const nearby=c.highlights.filter((_,i)=>i<=active && spec.highlights[active].at-spec.highlights[i].at<1.6);
  let target=union(nearby.map(a=>a.unionRect));
  if(active>0 && spec.highlights[active].at-first>=1.6){
    const previous=union(c.highlights.filter((_,i)=>i<active && spec.highlights[active-1].at-spec.highlights[i].at<1.6).map(a=>a.unionRect));
    const follow=ease((t-spec.highlights[active].at+.15)/.65);
    target={x:lerp(previous.x,target.x,follow),y:lerp(previous.y,target.y,follow),width:lerp(previous.width,target.width,follow),height:lerp(previous.height,target.height,follow)};
  }
  const initial=Math.min(880/w,1110/h);
  const final=Math.min(2.7,1600/Math.max(target.width,500),650/Math.max(target.height,160));
  const phase=t-first+1;
  const hold=Math.min(6.23,Math.max(0,t-first-1.4));
  const scale=pathValue([initial,initial*1.014,initial*1.053,initial*1.246,initial*1.674,lerp(initial,final,.90),lerp(initial,final,.96),final],phase)*(1+.002*hold);
  const focusX=211-target.x*final+target.y*final*.176,focusY=target.y<400?129:160-target.y*final;
  const x=pathValue([195,204,252,354,348,255,186,focusX],phase),y=pathValue([40,48,99,240,309,237,171,focusY],phase)-hold*23;
  const tilt=pathValue([0,0,.1,.55,.8,1,1,1],phase);
  const roll=pathValue([0,0,14,46,56,31,7,-5],phase);
  const opacity=spec.entrance==="fade"?clamp(t/.32):1;
  const entrance=spec.entrance==="slide-right"?(1-ease(t/.55))*1920:0;
  const year=c.title.match(/\b20\d{2}\b/)?.[0]??"NEWS";
  const visiblePanels=mergePanels(c.highlights.flatMap((a,i)=>paperRevealRects(a.rects,ease((t-spec.highlights[i].at)/(i===0?.28:.43)))));
  return <AbsoluteFill style={{background:"#05080d",overflow:"hidden"}}>
    <Img src={staticFile("web-news/paper-focus/dark-ripples.png")} style={{position:"absolute",inset:0,width:1920,height:1080,objectFit:"cover",opacity:.82}}/>
    <svg width="1920" height="1080" style={{position:"absolute",inset:0}}>
      {[0,1,2].map(i=><text key={i} x="120" y={410+i*550} fill="none" stroke="#8c9799" strokeWidth="3" opacity=".70" fontFamily="Arial,sans-serif" fontSize="820" fontWeight="300" letterSpacing="-22">{year}</text>)}
    </svg>
    <div style={{position:"absolute",inset:0,clipPath:"inset(0 36px 0 0)"}}><div style={{position:"absolute",left:x+entrance,top:y,width:w,height:h,opacity,transform:`scale(${scale}) ${sheetMatrix(w,h,tilt,roll)}`,transformOrigin:"0 0",background:"white",boxShadow:"12px 9px 1px #a3a3a3, 20px 20px 12px rgba(0,0,0,.45)"}}>
      <Img src={staticFile(c.baseImage)} style={{position:"absolute",width:w,height:h}}/>
      {visiblePanels.map((r,j)=><Img key={j} src={staticFile(c.highlightedImage)} style={{position:"absolute",width:w,height:h,clipPath:`inset(${Math.max(0,r.y-.75)}px ${Math.max(0,w-r.x-r.width)}px ${Math.max(0,h-r.y-r.height-.75)}px ${r.x}px)`}}/>)}
      <div style={{position:"absolute",right:0,top:0,width:38,height:38,background:"linear-gradient(45deg,#aaa,#eee 48%,#061016 51%)"}}/>
    </div></div>
    <div style={{position:"absolute",inset:0,background:"linear-gradient(transparent 82%,rgba(0,0,0,.45))",pointerEvents:"none"}}/>
  </AbsoluteFill>;
};
