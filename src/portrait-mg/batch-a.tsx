import {OriginalWordmark} from './original-wordmark';
import React from 'react';
import {Sequence,useCurrentFrame,useVideoConfig} from 'remotion';
import {PortraitMedia,type PortraitDemo} from './common';
import {mediaRenderers,mediaDemos} from './groups/media';
import {graphicsRenderers,graphicsDemos} from './groups/graphics';
const full:React.CSSProperties={position:'absolute',inset:0,overflow:'hidden'};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
// Measured original F42: five alternating slides; no vertical unroll or stagger.
const Strips=({spec}:{spec:any})=>{const f=useCurrentFrame(),{fps}=useVideoConfig(),t=f/fps;
 const start=spec.upper.at??1.4;
 if(t<start)return <div style={{...full,background:'#030203'}}><svg width="360" height="68" style={full}><defs><linearGradient id="a-wave"><stop stopColor="#17130a"/><stop offset=".5" stopColor="#55482b"/><stop offset="1" stopColor="#100e09"/></linearGradient></defs>{[0,1,2].map(i=><path key={i} d={`M -20 ${55+i*4} Q 80 -20 180 18 T 380 48`} stroke="url(#a-wave)" strokeWidth={i?1:2} fill="none"/>)}</svg><div style={{position:'absolute',top:69,width:360,height:401,borderTop:'1px solid #b59b55',borderBottom:'1px solid #b59b55'}}><PortraitMedia media={spec.lead}/></div>{spec.signature === undefined
  ? <div style={{position:'absolute',top:542,width:360,textAlign:'center',color:'#4f4b40',font:'italic 25px cursive'}}>Edward’s Talk</div>
  : <OriginalWordmark content={spec.signature} box={[0,542,360,30]} style={{color:'#4f4b40',font:'italic 25px cursive',letterSpacing:'normal',textShadow:'none'}}/>}</div>;
 const simultaneous=!!(spec.fourth&&spec.fifth);
 const slots=[spec.upper,spec.middle,spec.lower,spec.fourth??spec.upper,spec.fifth??spec.lower];
 const words=[spec.upperText,spec.middleText,spec.lowerText,spec.fourthText,spec.fifthText];
 const ys=[0,136,268,420,548],hs=[148,144,164,140,92];
 const slide=[325,287,250,212,176,141,110,82,58,38,23,12,5,1,0];
 return <div style={{...full,background:'#000'}}>{slots.map((v:any,i:number)=>{const age=(t-(simultaneous?start:(v.at??start)))*30;if(age<0)return null;const idx=Math.min(14,Math.max(0,age)),n=Math.floor(idx),distance=slide[n]+((slide[n+1]??0)-slide[n])*(idx-n),dx=(i%2?1:-1)*distance;return <div key={i} style={{position:'absolute',left:dx,top:ys[i],width:360,height:hs[i],overflow:'hidden',maskImage:i?'linear-gradient(to bottom,transparent,#000 10px,#000)':undefined}}><Sequence from={Math.round((simultaneous?start:(v.at??start))*fps)} layout="none"><PortraitMedia media={v}/></Sequence></div>})}{words.map((v:any,i:number)=><div key={i} style={{position:'absolute',left:6+32*(1-clamp((t-start)*30/14)),top:[108,230,392,514,616][i],transform:`scale(${.33+.67*clamp((t-start)*30/14)})`,transformOrigin:'left center',fontFamily:'SimSun,serif',fontSize:20,lineHeight:'22px',color:'#fff',textShadow:'1px 1px 2px #000',whiteSpace:'pre'}}>{v?.text}</div>)}</div>;
};
export const batchARenderers:Record<string,React.ComponentType<{spec:any}>>={...mediaRenderers,...graphicsRenderers,V10_008:Strips};
const reference=(id:string)=>'D:/MG_Reference_Library/creators/eshuocaijing/effects/'+id+'/reference.mp4';
export const batchADemos:Record<string,PortraitDemo>=Object.fromEntries(Object.entries({...mediaDemos,...graphicsDemos}).map(([id,d])=>[id,{...d,reference:reference(id),referenceStart:d.referenceStart??0}]));
batchADemos.V11_002={...batchADemos.V11_002,referenceStart:5/30};
batchADemos.V12_001={...batchADemos.V12_001,durationInFrames:159};
batchADemos.V07_003={...batchADemos.V07_003,previewBackground:'portrait-mg/restored-layouts/office-demo-background.mp4'};
const vid=(source:string,at?:number)=>({source,sourceStart:0,...(at===undefined?{}:{at})});
batchADemos.V10_008={spec:{lead:vid('portrait-mg/restored-layouts/office-demo-background.mp4'),upper:vid('portrait-mg/restored-layouts/office-demo-background.mp4',1.4),middle:vid('portrait-mg/restored-layouts/documents-demo-background.mp4',1.4),lower:vid('portrait-mg/restored-titles/city-demo.mp4',1.4),fourth:vid('portrait-mg/restored-layouts/office-demo-background.mp4',1.4),fifth:vid('portrait-mg/restored-layouts/documents-demo-background.mp4',1.4),upperText:{text:'邀约'},middleText:{text:'项目包装'},lowerText:{text:'律师咨询'},fourthText:{text:'机场接待'},fifthText:{text:'更改路线'},_duration:7},durationInFrames:210,fps:30,reference:reference('V10_008'),referenceStart:0};

// Public five-slot example: only upper owns the common entry time.
{const s=batchADemos.V10_008.spec;s.lead.sourceEnd=1.4;for(const key of ['upper','middle','lower','fourth','fifth']){s[key].sourceEnd=5.6;if(key!=='upper')delete s[key].at;}}

batchADemos.V01_002={...batchADemos.V01_002,spec:{...batchADemos.V01_002.spec,background:{source:'portrait-mg/restored-layouts/documents-demo-background.mp4',sourceStart:0}}};

for(const id of ['V04_002','V07_003']){const s={...batchADemos[id].spec,snapshotPath:'portrait-mg/batch-a/'+id+'-default.html'};delete s.url;batchADemos[id]={...batchADemos[id],spec:s};}
