import React from 'react';
import {Img, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {PortraitMedia, asset} from '../common';
import {tornGeometry} from '../media/geometry';
import {PixelMedia,insetBackdrop,screenedBackdrop,usePixelAssets,filmProcess} from '../media/pixels';

type Media={source:string;sourceStart:number|null};
type TimedMedia={media:Media;at:number};
type Props={spec:any};
const box:React.CSSProperties={position:'absolute',inset:0,overflow:'hidden'};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const ease=(x:number)=>{x=clamp(x);return x*x*(3-2*x)};
const sample=(a:readonly number[],f:number)=>{const i=Math.max(0,Math.min(a.length-1,Math.floor(f)));return a[i]+((a[Math.min(i+1,a.length-1)]??a[i])-a[i])*Math.max(0,f-i)};
const imagePath=(id:string,name:string)=>`portrait-mg/${id}/${name}`;
const ClipSequence:React.FC<{clips:TimedMedia[];style?:React.CSSProperties}>=({clips,style})=>{
 const {fps,durationInFrames}=useVideoConfig();
 return <>{clips.map((c,i)=><Sequence key={i} from={Math.round(c.at*fps)} durationInFrames={Math.max(1,(i+1<clips.length?Math.round(clips[i+1].at*fps):durationInFrames)-Math.round(c.at*fps))} layout="none"><PortraitMedia media={c.media} style={style}/></Sequence>)}</>;
};
const flash=(clips:TimedMedia[],time:number)=>Math.max(0,...clips.slice(1).map((c,i)=>{const x=Math.round((time-c.at)*30*10000)/10000,values=i%2?[.33,.66,1,.67,.33]:[.17,.50,.83,.84,.50,.16],start=i%2?-2:-3;return x>=start&&x<=2?sample(values,x-start):0}));

const TornSplit:React.FC<Props>=({spec})=>{
 const frame=useCurrentFrame(),{fps,durationInFrames}=useVideoConfig(),f=frame/fps*30;
 const reveal=sample([0,34,73,111,148,184,217,249,278,303,322,337,348,355,359,360],f);
 const unfold=sample([0,0,.03,.16,.32,.45,.58,.68,.75,.81,.85,.90,.94,.97,.985,1],f);
 const seam=tornGeometry.seam.map((y,x)=>264.5+unfold*(y-264.5)-(f>=2&&f<=7?(1-Math.abs(f-4)/4)*9*(x/359)**3:0));
 const points=seam.map((y,x)=>`${x},${y}`).join(' ');
 const upperPath=`M0 0H360V${seam[359]} ${seam.map((y,x)=>`L${359-x} ${seam[359-x]}`).join(' ')} Z`;
 const lowerPath=`M0 640H360V${seam[359]} ${seam.map((y,x)=>`L${359-x} ${seam[359-x]}`).join(' ')} Z`;
 const paperPath=`M0 ${seam[0]} ${seam.map((y,x)=>`L${x} ${y}`).join(' ')} ${seam.map((y,x)=>`L${359-x} ${seam[359-x]-tornGeometry.paperWidth[359-x]}`).join(' ')} Z`;
 const zoom=1+.75*Math.pow(1-ease(f/14),1.1),blur=f<16?Math.max(.22,11*Math.pow(1-f/16,1.45)):0;
 const t=f<=10?sample([0,.10,.20,.30,.43,.56,.72,.89,1],f-2):1,scale=.58+.42*t,dx=-144*(1-t);
 const firstY=f<=10?sample([230,196,161,131,107,80,60,54,52],f-2):52;
 const titleDy=firstY-(52*scale+320*(1-scale));
 const endF=durationInFrames/fps*30,exitF=f-(endF-4),exiting=exitF>=0;
 const exitDx=sample([27,47],exitF),exitDy=sample([-22,-44],exitF),exitScale=sample([1.04,1.09],exitF);
 const amount=exiting?sample([.95,.88],exitF):f<=10?sample([.16,.34,.42,.62,.70,.79,.87,.94,1],f-2):1;
 const title=typeof spec.title==='string'?spec.title.replace(/\s/g,''):'';
 const spacing=title.length<=8?74:560/title.length;
 return <div style={{...box,background:'#050305'}}>
  <div style={{...box,clipPath:`path('${upperPath}')`}}><div style={{position:'absolute',left:reveal-360,top:0,width:360,height:374}}><ClipSequence clips={spec.upper}/><div style={{...box,background:'white',opacity:flash(spec.upper,frame/fps)}}/></div></div>
  <div style={{...box,clipPath:`path('${lowerPath}')`}}><div style={{position:'absolute',left:0,top:260,width:360,height:380,transform:`scale(${zoom})`,transformOrigin:'217px 283px',filter:blur?`blur(${blur}px)`:undefined}}><PortraitMedia media={spec.lower}/></div></div>
  {f>=2&&<svg width="360" height="640" style={{position:'absolute',inset:0,opacity:Math.min(1,f/6),filter:f<13?`blur(${.28+2.9*Math.pow(1-f/13,1.35)}px)`:undefined}}><defs><pattern id="portrait-torn-paper" width="360" height="640" patternUnits="userSpaceOnUse"><image href={asset(imagePath('V01_001','paper-texture.png'))} width="360" height="640"/></pattern><clipPath id="portrait-torn-reach"><rect width={Math.min(360,Math.max(0,(f-1)*77))} height="640"/></clipPath></defs><g clipPath="url(#portrait-torn-reach)"><polyline points={points} fill="none" stroke="#17131b" strokeOpacity=".26" strokeWidth="6" transform="translate(0 3)"/><path d={paperPath} fill="url(#portrait-torn-paper)"/></g></svg>}
  {title&&f>1&&exitF<2&&<div style={{...box,overflow:'visible',transform:`translate(${exiting?exitDx:dx}px,${exiting?exitDy:titleDy}px) scale(${exiting?exitScale:scale})`,transformOrigin:'324px 320px',opacity:amount,filter:f<10||exiting?`blur(${Math.max(.6,3.6*(1-Math.min(1,amount))+.65)}px)`:undefined}}>{[...title].map((c,i)=><div key={i} style={{position:'absolute',left:292,top:52+i*spacing-29,width:64,height:58,textAlign:'center',fontFamily:'STXingkai, STXingka, KaiTi, serif',fontSize:Math.min(58,spacing*.83),lineHeight:'58px',color:'#ffe298',textShadow:'-13px 9px 3px rgba(176,149,87,.69),1.5px 1.3px 2px #32220e'}}>{c}</div>)}</div>}
 </div>;
};

const PictureInPicture:React.FC<Props>=({spec})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig();
 const level=Math.max(0,...(spec.clips as TimedMedia[]).slice(1).map((c,i)=>{let x=Math.round((frame/fps-c.at)*30*10000)/10000;const values=i===1?[.33,.67,1,.67,.33]:[.17,.50,.83,.84,.50,.17];return x>=-3&&x<=values.length-4?sample(values,x+3):0}));
 return <div style={{...box,background:'#050305'}}>
  <div style={box}><PixelMedia media={spec.background} width={360} height={640} process={insetBackdrop(frame/fps<11/30?.887:1)}/></div>
  <Img src={asset(imagePath('V01_002','inset-border.png'))} style={{position:'absolute',left:29,top:120,width:303,height:400,opacity:.79}}/>
  <div style={{position:'absolute',left:32,top:123,width:297,height:394,overflow:'hidden'}}><ClipSequence clips={spec.clips}/><div style={{...box,background:'white',opacity:level}}/><Img src={asset(imagePath('V01_002','inset-vignette.png'))} style={{...box,width:297,height:394}}/></div>
 </div>;
};
const ROLL=[-89,57,195,329,444,551,642,723,795,850,904,950,993,1027,1060,1084,1107,1122,1136,1142,1147,1145,1144,1142,1141,1140,1139,1138,1138,1137,1137,1138,1138,1140,1140.5,1141,1141.5,1141.8,1142];
const PRINT=[-1264,-1122,-985,-851,-735,-604,-516,-434,-370,-288,-235,-188,-146,-112,-80,-55,-32,-18,-4,2,6,5,4,2,1,0,-1,-2,-3,-3,-3,-2,-2,-2,-1,0,0,0,0];
const Filmstrip:React.FC<Props>=({spec})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),f=frame/fps*30,time=frame/fps;
 const clips=spec.clips as TimedMedia[];let index=0;clips.forEach((c,i)=>{if(time>=c.at)index=i});const current=clips[index];
 const offset=((sample(ROLL,f)%321)+321)%321,printOffset=((sample(PRINT,f)%334)+334)%334;
 const speed=Math.abs(sample(ROLL,f+1)-sample(ROLL,f));
 const residual=f<18?1:f<23?1-(f-18)*.17/5:f<28?.83-(f-23)*.28/5:f<32?.55*(32-f)/4:0;
 const blur=Math.min(30,Math.max(speed*.26,18*residual));
 const assets=usePixelAssets(['film-base.png','window-mask.png','holes-mask.png','film-print.png'].map(name=>imagePath('V05_002',name)));
 if(!assets)return <div style={{...box,background:'#161614'}}/>;
 return <div style={box}><Sequence from={Math.round(current.at*fps)} layout="none"><PixelMedia media={current.media} width={276} height={292} style={{position:'absolute',inset:0,width:360,height:640}} process={(input,target)=>{target.width=360;target.height=640;filmProcess(assets,offset,printOffset,f,index,speed,residual)(input,target)}}/></Sequence></div>;
};

export const mediaRenderers:Record<string,React.FC<Props>>={V01_001:TornSplit,V01_002:PictureInPicture,V05_002:Filmstrip};
const media=(id:string,file:string,sourceStart:number|null=0):Media=>({source:imagePath(id,file),sourceStart});
export const mediaDemos:Record<string,{spec:any;durationInFrames:number;fps:30;reference:string;referenceStart?:number}>={
 V01_001:{spec:{upper:['upper-01.mp4','upper-02.mp4','upper-03.mp4'].map((file,i)=>({media:media('V01_001',file),at:[0,32/30,65/30][i]})),lower:media('V01_001','lower-beam.mp4'),title:'舞台上下两个世界'},durationInFrames:90,fps:30,reference:'D:/MG_Work/V01_001/delivery/V01_001.mp4'},
 V01_002:{spec:{background:media('V01_002','backdrop.jpg',null),clips:[1,2,3,4,5].map((n,i)=>({media:media('V01_002',`inset-0${n}.mp4`),at:[0,23/30,59/30,91/30,123/30][i]}))},durationInFrames:135,fps:30,reference:'D:/MG_Work/V01_002/delivery/V01_002.mp4',referenceStart:0},
 V05_002:{spec:{clips:['01-entrance.mp4','02-close.mp4','03-table.mp4'].map((file,i)=>({media:media('V05_002',file),at:[0,33/30,130/30][i]}))},durationInFrames:173,fps:30,reference:'D:/MG_Work/V05_002/delivery/V05_002.mp4',referenceStart:0},
};
