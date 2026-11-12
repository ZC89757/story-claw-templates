import React,{useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {Img,OffthreadVideo,Video,continueRender,delayRender,useCurrentFrame,useVideoConfig} from 'remotion';
import {asset,type PortraitMediaRef} from '../common';

export type PixelProcess=(source:HTMLCanvasElement,target:HTMLCanvasElement)=>void;
export const PixelMedia=({media,width,height,process,style}:{media:PortraitMediaRef;width:number;height:number;process:PixelProcess;style?:React.CSSProperties})=>{
 const {fps}=useVideoConfig();const frame=useCurrentFrame();const output=useRef<HTMLCanvasElement>(null),input=useRef<HTMLCanvasElement|null>(null),processor=useRef(process);
 processor.current=process;
 const paint=useCallback((image:CanvasImageSource)=>{
  if(!output.current)return;
  const source=input.current??(input.current=document.createElement('canvas'));source.width=width;source.height=height;
  const ctx=source.getContext('2d',{willReadFrequently:true})!;
  const im=image as any,iw=im.videoWidth||im.naturalWidth||im.width,ih=im.videoHeight||im.naturalHeight||im.height;
  if(!iw||!ih)return;const scale=Math.max(width/iw,height/ih),sw=width/scale,sh=height/scale;
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,(iw-sw)/2,(ih-sh)/2,sw,sh,0,0,width,height);
  processor.current(source,output.current);
 },[height,width]);
 useLayoutEffect(()=>{if(input.current&&output.current)processor.current(input.current,output.current)},[process,frame]);
 const hidden:React.CSSProperties={position:'absolute',width:1,height:1,opacity:0,pointerEvents:'none'};
 const VideoComponent=media.source.startsWith('data:video/')?Video:OffthreadVideo;
 return <><canvas ref={output} width={width} height={height} style={{width:'100%',height:'100%',...style}}/>{media.sourceStart===null?<Img src={asset(media.source)} style={hidden} onLoad={e=>paint(e.currentTarget)}/>:<VideoComponent src={asset(media.source)} startFrom={Math.round(media.sourceStart*fps)} muted style={hidden} onVideoFrame={paint}/>}</>;
};

export type PixelAsset={width:number;height:number;data:Uint8ClampedArray};
export const usePixelAssets=(paths:readonly string[])=>{
 const [assets,setAssets]=useState<PixelAsset[]|null>(null);const [handle]=useState(()=>delayRender('Loading procedural portrait textures'));
 const joined=paths.join('|');
 useEffect(()=>{let live=true;Promise.all(paths.map(p=>new Promise<PixelAsset>((resolve,reject)=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d',{willReadFrequently:true})!;x.drawImage(im,0,0);resolve({width:im.width,height:im.height,data:x.getImageData(0,0,im.width,im.height).data})};im.onerror=()=>reject(new Error('Cannot load '+p));im.src=asset(p)}))).then(a=>{if(live)setAssets(a);continueRender(handle)}).catch(e=>{continueRender(handle);throw e});return()=>{live=false}},[joined,handle]);
 return assets;
};
const clamp=(x:number,a=0,b=1)=>Math.max(a,Math.min(b,x));

/** Replicated-edge Gaussian blur: CSS transparent filter edges are not part of the artwork. */
const edgeBlur=(source:HTMLCanvasElement,radius:number)=>{
 const w=source.width,h=source.height,p=Math.ceil(radius*4),c=document.createElement('canvas');c.width=w+2*p;c.height=h+2*p;const x=c.getContext('2d')!;
 x.drawImage(source,p,p);x.drawImage(source,0,0,w,1,p,0,w,p);x.drawImage(source,0,h-1,w,1,p,p+h,w,p);x.drawImage(source,0,0,1,h,0,p,p,h);x.drawImage(source,w-1,0,1,h,p+w,p,p,h);
 for(const [sx,sy,dx,dy] of [[0,0,0,0],[w-1,0,p+w,0],[0,h-1,0,p+h],[w-1,h-1,p+w,p+h]])x.drawImage(source,sx,sy,1,1,dx,dy,p,p);
 const out=document.createElement('canvas');out.width=w;out.height=h;const o=out.getContext('2d')!;o.filter=`blur(${radius}px)`;o.drawImage(c,-p,-p);return out;
};

export const archiveBackdrop:PixelProcess=(source,target)=>{
 const w=source.width,h=source.height,x=source.getContext('2d',{willReadFrequently:true})!,pixels=x.getImageData(0,0,w,h),p=pixels.data;
 for(let y=0;y<h;y++)for(let xx=0;xx<w;xx++){
  const i=(y*w+xx)*4;let r=p[i],g=p[i+1],b=p[i+2];const warm=clamp((r-g-17)/37)*clamp((y-168)/75),l=r*.19+g*.68+b*.13,lower=clamp((y-284)/250);
  r=(r*(1-warm)+(l*.35+4)*warm)*(1-.4*lower)-lower*12;g=(g*(1-warm)+(l*.37+6)*warm)*(1-.4*lower)-lower*10;b=(b*(1-warm)+(l*.43+9)*warm)*(1-.4*lower)-lower*14;
  const dist=((xx-180)/275)**2+((y-295)/434)**2,upper=clamp(1-(y-60)/310),v=1-.22*dist;
  p[i]=r*.65*v+16+upper*6;p[i+1]=g*.65*v+19+upper*22;p[i+2]=b*.78*v+33+upper*7;
 }
 const grade=document.createElement('canvas');grade.width=w;grade.height=h;grade.getContext('2d')!.putImageData(pixels,0,0);target.getContext('2d')!.drawImage(edgeBlur(grade,3.1),0,0);
};

export const insetBackdrop=(amount:number):PixelProcess=>(source,target)=>{
 const blurred=edgeBlur(source,13.5),p=blurred.getContext('2d',{willReadFrequently:true})!.getImageData(0,0,source.width,source.height);for(let i=0;i<p.data.length;i+=4){p.data[i]=(p.data[i]*.78+7)*amount;p.data[i+1]=(p.data[i+1]*.78+5.3)*amount;p.data[i+2]=(p.data[i+2]*.78+6.3)*amount}target.getContext('2d')!.putImageData(p,0,0);
};

/** Dynamic pan underneath a stationary 30-degree halftone screen. */
export const screenedBackdrop=(progress:number):PixelProcess=>(source,target)=>{
 const w=360,h=640,zoom=1+.47*progress,cw=w/zoom,ch=h/zoom;
 const work=document.createElement('canvas');work.width=w;work.height=h;
 const x=work.getContext('2d',{willReadFrequently:true})!;x.filter='blur(.85px)';x.drawImage(source,(w-cw)*.99,(h-ch)*.84,cw,ch,0,0,w,h);x.filter='none';
 const pixels=x.getImageData(0,0,w,h),p=pixels.data;
 for(let y=0;y<h;y++)for(let xx=0;xx<w;xx++){
  const i=(y*w+xx)*4,r=p[i],g=p[i+1],b=p[i+2],light=(r*.24+g*.65+b*.11)/255;
  const a=.8660254*xx+.5*y,bb=-.5*xx+.8660254*y,da=((a+2.5)%5+5)%5-2.5,db=((bb+2.5)%5+5)%5-2.5,distance=Math.hypot(da,db);
  const radius=3.18*Math.sqrt(clamp(light*1.01))+.1,coverage=clamp((radius-distance)/1.05+.5);
  const rr=(r*.28+4)*(1-coverage)+clamp((r-15)*1.08+12,0,250)*coverage,gg=(g*.28+4)*(1-coverage)+clamp((g-15)*1.08+12,0,250)*coverage,bb2=(b*.28+6)*(1-coverage)+clamp((b-15)*1.08+12,0,250)*coverage;
  const gray=.299*rr+.587*gg+.114*bb2;p[i]=gray*.12+rr*.88;p[i+1]=gray*.12+gg*.88;p[i+2]=gray*.12+bb2*.88;
 }
 target.getContext('2d')!.putImageData(pixels,0,0);
};

function bilinear(data:Uint8ClampedArray,w:number,h:number,x:number,y:number,c:number,repeatY=false){
 x=clamp(x,0,w-1);y=repeatY?((y%h)+h)%h:clamp(y,0,h-1);const x0=Math.floor(x),y0=Math.floor(y),x1=Math.min(w-1,x0+1),y1=repeatY?(y0+1)%h:Math.min(h-1,y0+1),u=x-x0,v=y-y0;
 return (data[(y0*w+x0)*4+c]*(1-u)+data[(y0*w+x1)*4+c]*u)*(1-v)+(data[(y1*w+x0)*4+c]*(1-u)+data[(y1*w+x1)*4+c]*u)*v;
}
const rgb=(p:Uint8ClampedArray,w:number,h:number,x:number,y:number)=>[0,1,2].map(c=>bilinear(p,w,h,x,y,c));

/** The same material mask, 321 px pitch, roll tables and selective vertical box blur as Python. */
export const filmProcess=(assets:PixelAsset[],offset:number,printOffset:number,frame:number,index:number,speed:number,residual:number):PixelProcess=>(source,target)=>{
 const [base,opening,holes,print]=assets,w=360,h=640;
 const small=document.createElement('canvas'),restored=document.createElement('canvas');
 small.width=[148,111,192][Math.min(2,index)];small.height=Math.round(small.width*292/276);let c=small.getContext('2d')!;c.imageSmoothingQuality='high';c.drawImage(source,0,0,small.width,small.height);
 restored.width=276;restored.height=292;c=restored.getContext('2d')!;c.imageSmoothingQuality='high';c.drawImage(small,0,0,276,292);
 const media=c.getImageData(0,0,276,292).data,gain=index===0?.76:index===1?.79:.98;
 for(let i=0;i<media.length;i+=4){const r=media[i],g=media[i+1],b=media[i+2],l=.299*r+.587*g+.114*b;const y=index===0?l-Math.max(l-70,0)*.42:index===1?l+Math.max(l-105,0)*.15:l;media[i]=y+(r-l)*gain;media[i+1]=y+(g-l)*gain;media[i+2]=y+(b-l)*gain}
 const visible=new Float32Array(w*h*3),through=new Float32Array(w*h*3);
 for(let y=0;y<h;y++){const sy=((y-offset)%321+321)%321;for(let x=0;x<w;x++){
  const pos=(y*w+x)*3,col=rgb(media,276,292,x-42,Math.min(sy,291)),hole=rgb(media,276,292,(x-19)/321*275,Math.min((sy+8)%321,291)),lum=hole[0]*.2126+hole[1]*.7152+hole[2]*.0722;
  for(let k=0;k<3;k++){visible[pos+k]=col[k];through[pos+k]=clamp(hole[k]*.72+lum*.31+7,0,255)}
 }}
 const blur=Math.min(30,Math.max(Math.round(speed*.26),Math.round(18*residual))),dragged=new Float32Array(visible.length);
 if(frame<33&&blur>1){
  for(let x=0;x<w;x++)for(let k=0;k<3;k++){
   let total=0;for(let yy=-blur;yy<=blur;yy++)total+=visible[(clamp(yy,0,h-1)*w+x)*3+k];
   for(let y=0;y<h;y++){dragged[(y*w+x)*3+k]=total/(blur*2+1);total+=visible[(Math.min(h-1,y+blur+1)*w+x)*3+k]-visible[(Math.max(0,y-blur)*w+x)*3+k]}
  }
 }
 const out=target.getContext('2d')!.createImageData(w,h),p=out.data;
 for(let y=0;y<h;y++){
  const sy=((y-offset)%321+321)%321,py=((y-printOffset)%334+334)%334;
  let weight=frame<33&&blur>1?clamp((Math.abs(y-310)-65)/150)*residual*(y<310?1:.81):0;
  for(let x=0;x<w;x++){
   const j=(y*w+x)*3,i=(y*w+x)*4,a=bilinear(opening.data,w,321,x,sy,3,true)/255,b=bilinear(holes.data,w,321,x,sy,3,true)/255,pa=bilinear(print.data,w,334,x,py,3,true)/255;
   for(let k=0;k<3;k++){let value=bilinear(base.data,w,321,x,sy,k,true)*(1-b)+through[j+k]*b;const footage=visible[j+k]*(1-weight)+dragged[j+k]*weight;value=value*(1-a)+footage*a;p[i+k]=value*(1-pa)+bilinear(print.data,w,334,x,py,k,true)*pa}p[i+3]=255;
  }
 }
 target.getContext('2d')!.putImageData(out,0,0);
};
