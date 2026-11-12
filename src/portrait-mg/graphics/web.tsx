import React from 'react';
import {CanvasStage,captureOf,clamp,key,offscreen,raster,sample,smooth,track,type Painter} from './canvas';
import {geometry} from './geometry';
const G:any=geometry;
const pagePaint:Painter=async(g,frame,spec)=>{
 const cap=captureOf(spec),[page,bg,facets]=await Promise.all([raster(cap.source),raster('portrait-mg/V04_002/stage.png'),raster('portrait-mg/V04_002/facets.png')]);
 const f=Math.min(frame,103),dx=key(f,[[0,0],[8,-8],[20,-25],[32,-32],[44,-28],[56,-19],[68,-12],[80,30],[92,92],[104,130]]),dy=key(f,[[0,0],[8,1],[20,4],[32,11],[44,20],[56,29],[68,42],[80,51],[92,62],[104,72]]);
 g.drawImage(bg.image,0,0,360,640);g.drawImage(facets.image,dx,dy,360,640);
 let x=-112+1.065*f,y=103-.292*f;
 // Optional focus changes only the target crop, preserving source geometry and temporal curve.
 if(cap.focusRect){const r=cap.focusRect,scale=550/cap.width,p=smooth(0,103,f);const targetX=180-(r.x+r.width/2)*scale,targetY=320-(r.y+r.height/2)*scale;y+=(targetY-(103-.292*103))*p;x+=(targetX-(-112+1.065*103))*p;}
 g.save();g.transform(1,-.103,-.008,1,x,y);g.drawImage(page.image,0,0,550,550*cap.height/cap.width);g.restore();
};
export const PagePerspective:React.FC<{spec:any}>=p=><CanvasStage {...p} paint={pagePaint}/>;

const highlightPaint:Painter=async(g,frame,spec)=>{
 const cap=captureOf(spec),paper=await raster(cap.source);if(!cap.excerptRect)throw new Error('Document highlight excerpt could not be located in capture');
 // Local f0 maps to original f38; the preceding unrelated footage is intentionally excluded.
 const f=frame+38;
 if(f<52){
 const [left,top,width,height,taper,lift,rise,wave]=track(G.curl,f);
 const canvas=offscreen(),ctx=canvas.getContext('2d')!,out=ctx.createImageData(720,1280);
 for(let py=670;py<1020;py++)for(let px=0;px<720;px++){
  const x=(px+.5)/2,y=(py+.5)/2;let lo=0,hi=1,u=0,v=0;
  for(let k=0;k<13;k++){u=(lo+hi)/2;v=(y-top+rise*u**3)/(height-lift*u**4);const wx=left+width*(u-taper*clamp(v)*u**1.28)+wave*Math.sin(v*Math.PI*2)*(1-.45*u);if(x>wx)lo=u;else hi=u;}
  const xl=left+wave*Math.sin((y-top)*Math.PI*2/height),xr=left+width*(1-taper*clamp((y-top+rise)/(height-lift)))+.55*wave*Math.sin((y-top+rise)*Math.PI*2/(height-lift));
  const alpha=clamp(Math.min(x-xl,xr-x,Math.min(v,1-v)*height)*2+.5);if(!alpha)continue;
  const diagonal=u-(.60+.15*v),interior=Math.sin(Math.PI*clamp(v)),bulge=Math.exp(-(((diagonal+.045)/.145)**2))*interior;
  const sx=(u-.14*taper*bulge)*(paper.width-1),sy=(v-.46*taper*taper*bulge)*(paper.height-1),shade=1-Math.exp(-((diagonal/.083)**2))*interior*Math.min(.145,taper*.23),idx=(py*720+px)*4;
  for(let c=0;c<3;c++)out.data[idx+c]=sample(paper,sx,sy,c)*shade;out.data[idx+3]=alpha*255;
 }
 ctx.putImageData(out,0,0);g.save();g.shadowColor='rgba(37,32,30,.4)';g.shadowBlur=4;g.shadowOffsetX=(9+21*taper);g.shadowOffsetY=(4+11*taper);g.drawImage(canvas,0,0,360,640);g.restore();
 }else{g.drawImage(paper.image,0,350,360,128);}
 if(frame<14)return;
 const sx=360/cap.width,sy=128/cap.height;
 // Multiply preserves the captured black letterforms and only colors the paper beneath them.
 g.save();g.globalCompositeOperation='multiply';g.fillStyle='#ffd527';
 for(const h of spec.highlights??[]){if(frame/30<h.at)continue;const found=cap.highlightRects?.find(x=>x.text===h.text);if(!found?.rects?.length)throw new Error(`Highlight text not located: ${h.text}`);for(const r of found.rects)g.fillRect(r.x*sx,350+r.y*sy,r.width*sx,r.height*sy);}
 g.restore();
 const age=frame-spec.excerpt.at*30,progress=smooth(0,10,age)*(1-smooth(35,40,age));
 if(progress>0){const r=cap.excerptRect,ox=r.x*sx,oy=350+r.y*sy,ow=r.width*sx,oh=r.height*sy;
  const tw=Math.min(314,Math.max(222,ow*2.44)),textHeight=Math.min(180,oh*((tw-5)/Math.max(1,ow))*(11/(5.7*217/91))),th=Math.max(52,textHeight+26),x=ox+(174-tw/2-ox)*progress,y=oy+(331-(th-52)/2-oy)*progress,w=ow+(tw-ow)*progress,h=oh+(th-oh)*progress;
  g.save();g.shadowColor=`rgba(46,41,40,${.27*progress})`;g.shadowBlur=6.8;g.shadowOffsetY=2;g.fillStyle='#fefdfE';g.fillRect(x,y,w,h);g.restore();
  // Exact screenshot crop is enlarged, never retyped or invented.
  const pad=13*progress,availH=oh+(textHeight-oh)*progress;g.drawImage(paper.image,r.x,r.y,r.width,r.height,x+progress,y+pad,Math.max(1,w-5*progress),Math.max(1,availH));
 }
};
export const DocumentHighlight:React.FC<{spec:any}>=p=><CanvasStage {...p} paint={highlightPaint}/>;
