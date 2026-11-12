import {wornTile} from './lettering';
import React from 'react';
import {CanvasStage,clamp,key,loadFont,offscreen,path,raster,sample,textTile,type Painter} from './canvas';
const processPaint:Painter=async(g,local,spec)=>{
 const f=Math.min(local+20,119),[bg,hood,panel,subject,a,b]=await Promise.all([raster('portrait-mg/V10_005/backdrop.png'),raster('portrait-mg/V10_005/hood.png'),raster('portrait-mg/V10_005/panel.png'),raster(spec.subject.image),raster('portrait-mg/V10_005/stroke-0.png'),raster('portrait-mg/V10_005/stroke-1.png'),loadFont('PortraitProcess','portrait-mg/V10_004/fallback.ttf')]);
 g.drawImage(bg.image,-(5+Math.min(f,74)*.21),-(6+Math.min(f,74)*.03),400,670);
 const sway=key(f,[[0,-11],[18,-6],[36,-11],[48,-5],[74,11],[91,12],[119,8]]),bend=key(f,[[0,1],[20,0],[35,54],[53,48],[74,96],[99,96],[109,76],[119,87]]),dy=-6+.052*f;
 // Independent hood texture is bent by scanlines in its own source coordinate space.
 for(let y=0;y<690;y+=.5){const shift=bend*clamp((y-12-428)/218)**1.08;g.drawImage(hood.image,0,y*2,840,1,sway-32-shift,y+dy-12,420,.65);}
 const rejected=spec.rejected.at*30,replacement=spec.replacement.at*30;
 if(local>=replacement){for(const x of [143,208])for(let row=0;row<5;row++)for(let band=0;band<4;band++){
 const y=234+row*27.5+band*4,starts=[-4,-1,4,7],ends=[11,15,19,23],phase=(local-replacement-starts[band])%31,lit=phase>=0&&phase<ends[band]-starts[band];path(g,[[x-15.2,y],[x,y+10],[x+15.2,y]],undefined,lit?'rgba(6,169,252,.965)':'rgba(30,81,122,.624)',1.4);
 }}else if(local>=rejected+6){const c=offscreen(),ct=c.getContext('2d')!,pixels=ct.createImageData(720,1280);
 for(let n=0;n<2;n++){const start=rejected+(n===0?6:17),duration=n===0?3.7:3,progress=Math.min(1.07,(local-start+.52)/duration);if(progress<=0)continue;
 const [x0,y0,x1,y1]=n===0?[201,280,138,341]:[152,274,225,332],dx=x1-x0,dy=y1-y0,len=Math.hypot(dx,dy),mask=n===0?a:b;
 for(let y=535;y<700;y++)for(let x=260;x<470;x++){const phase=((x/2-x0)*dx+(y/2-y0)*dy)/(len*len),idx=(y*720+x)*4,alpha=sample(mask,x,y,0)*clamp((progress-phase)*95);pixels.data[idx]=255;pixels.data[idx+1]=38;pixels.data[idx+2]=5;pixels.data[idx+3]=Math.max(pixels.data[idx+3],alpha);}}
 ct.putImageData(pixels,0,0);g.drawImage(c,0,0,360,640);
 }
 const cy=Math.max(134.2,283.8-local*2.115);g.save();g.beginPath();g.arc(173,cy,96,0,Math.PI*2);g.clip();const ss=Math.max(192/subject.width,192/subject.height),sw=subject.width*ss,sh=subject.height*ss;g.drawImage(subject.image,173-sw/2,cy-sh/2,sw,sh);g.restore();g.beginPath();g.arc(173,cy,95.3,0,Math.PI*2);g.strokeStyle='#e2ddcf';g.lineWidth=1.5;g.stroke();
 const label=await wornTile(textTile(spec.subject.label,'PortraitProcess',164,32,'#fff',false,2*240/280),'subject',164,32);g.drawImage(label,91,cy-16,164,32);
 if(local>=rejected){const tint=g.getImageData(134,742,460,200);for(let j=0;j<tint.data.length;j+=4){tint.data[j]=tint.data[j]*.79+10;tint.data[j+1]=tint.data[j+1]*.79+46;tint.data[j+2]=tint.data[j+2]*.79+68;}g.putImageData(tint,134,742);g.drawImage(panel.image,0,0,360,640);const text=local>=replacement?spec.replacement.text:spec.rejected.text;const width=local>=replacement?203:165,tile=await wornTile(textTile(text,'PortraitProcess',width,35,'#ccb351',false,5*240/280),local>=replacement?'replacement':'rejected',width,35);g.drawImage(tile,180-width/2,404.5,width,35);}
};
export const ProcessCorrection:React.FC<{spec:any}>=p=><CanvasStage {...p} paint={processPaint}/>;
