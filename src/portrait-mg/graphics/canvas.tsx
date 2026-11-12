import React, {useLayoutEffect, useRef} from 'react';
import {cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

export const W=360,H=640,S=2;
export const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const smooth=(a:number,b:number,v:number)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
export const track=(rows:number[][], f:number):number[]=>{
 if(f<=rows[0][0])return rows[0].slice(1);
 for(let i=1;i<rows.length;i++)if(f<=rows[i][0]){const a=rows[i-1],b=rows[i],t=(f-a[0])/(b[0]-a[0]);return a.slice(1).map((v,j)=>v+(b[j+1]-v)*t);}
 return rows[rows.length-1].slice(1);
};
export const key=(f:number,rows:number[][])=>track(rows,f)[0];
export const url=(src:string)=>/^(data:|https?:|blob:)/.test(src)?src:staticFile(src);
export type Raster={image:HTMLImageElement;data:Uint8ClampedArray;width:number;height:number};
const imageCache=new Map<string,Promise<Raster>>();
export function raster(source:string):Promise<Raster>{
 const path=url(source);const old=imageCache.get(path);if(old)return old;
 const p=new Promise<Raster>((resolve,reject)=>{const image=new Image();image.crossOrigin='anonymous';image.onload=()=>{const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const g=c.getContext('2d')!;g.drawImage(image,0,0);resolve({image,data:g.getImageData(0,0,c.width,c.height).data,width:c.width,height:c.height});};image.onerror=()=>reject(new Error(`Portrait MG asset failed: ${source}`));image.src=path;});imageCache.set(path,p);return p;
}
const fontCache=new Map<string,Promise<void>>();
export const loadFont=(family:string,source:string)=>{let p=fontCache.get(family);if(!p){p=new FontFace(family,`url("${url(source)}")`).load().then(f=>{document.fonts.add(f);});fontCache.set(family,p);}return p;};
export function sample(r:Raster,x:number,y:number,c:number){
 x=clamp(x,0,r.width-1);y=clamp(y,0,r.height-1);const a=Math.floor(x),b=Math.floor(y),u=x-a,v=y-b;
 const i=(b*r.width+a)*4+c,j=(b*r.width+Math.min(a+1,r.width-1))*4+c,k=(Math.min(b+1,r.height-1)*r.width+a)*4+c,l=(Math.min(b+1,r.height-1)*r.width+Math.min(a+1,r.width-1))*4+c;
 return (r.data[i]*(1-u)+r.data[j]*u)*(1-v)+(r.data[k]*(1-u)+r.data[l]*u)*v;
}
export const offscreen=(w=720,h=1280)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const tileCache=new Map<string,HTMLCanvasElement>();
export function textTile(text:string,family:string,width:number,height:number,color='#fff',slant=false,stroke=0){
 const cacheKey=JSON.stringify([text,family,width,height,color,slant,stroke]),cached=tileCache.get(cacheKey);if(cached)return cached;
 const probe=offscreen(),pg=probe.getContext('2d')!;pg.font=`240px ${family}`;const m=pg.measureText(text);
 const raw=offscreen(Math.ceil(m.width+160),420),g=raw.getContext('2d')!;g.font=`240px ${family}`;g.fillStyle=color;g.textBaseline='alphabetic';g.translate(80,300);if(slant)g.transform(1,0,-.09,1,0,0);if(stroke){g.strokeStyle=color;g.lineWidth=stroke*2;g.strokeText(text,0,0);}g.fillText(text,0,0);
 const pixels=g.getImageData(0,0,raw.width,raw.height).data;let left=raw.width,top=raw.height,right=0,bottom=0;
 for(let y=0;y<raw.height;y++)for(let x=0;x<raw.width;x++)if(pixels[(y*raw.width+x)*4+3]>0){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 const c=offscreen(Math.ceil(width*3),Math.ceil(height*3));if(right>=left)c.getContext('2d')!.drawImage(raw,left,top,right-left+1,bottom-top+1,0,0,c.width,c.height);tileCache.set(cacheKey,c);return c;
}export const path=(g:CanvasRenderingContext2D,points:number[][],fill?:string,stroke?:string,lw=.5)=>{g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));if(fill){g.closePath();g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke();}};
export type Painter=(g:CanvasRenderingContext2D,frame:number,spec:any)=>Promise<void>|void;
export const CanvasStage:React.FC<{spec:any;paint:Painter}>=({spec,paint})=>{
 const ref=useRef<HTMLCanvasElement>(null);const frame=useCurrentFrame(),{fps}=useVideoConfig();
 useLayoutEffect(()=>{const handle=delayRender('Drawing portrait MG geometry');let live=true;
 Promise.resolve().then(async()=>{const scratch=offscreen();const g=scratch.getContext('2d')!;g.scale(S,S);await paint(g,frame*30/fps,spec);if(live){const dest=ref.current?.getContext('2d');dest?.clearRect(0,0,720,1280);dest?.drawImage(scratch,0,0);}}).then(()=>continueRender(handle),e=>{continueRender(handle);cancelRender(e);});
 return()=>{live=false;};},[frame,fps,spec,paint]);
 return <canvas ref={ref} width={720} height={1280} style={{width:360,height:640,display:'block'}}/>;
};
export type CaptureRect={x:number;y:number;width:number;height:number};
export type PreparedPortraitCapture={source:string;width:number;height:number;focusRect?:CaptureRect;excerptRect?:CaptureRect;highlightRects?:Array<{text:string;rects:CaptureRect[]}>;fixture?:boolean};
export function captureOf(spec:any):PreparedPortraitCapture{const cap=spec.capture;if(!cap?.source||!cap.width||!cap.height)throw new Error('Portrait web effect requires prepared capture; call prepareRuntimeAssets first.');return cap;}
