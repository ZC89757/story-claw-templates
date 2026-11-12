import React from 'react';
import {CanvasStage,clamp,offscreen,path,raster,sample,track,type Painter} from './canvas';
import {geometry} from './geometry';
const G:any=geometry;
const rgb=(v:number,a=.72,b=.82)=>`rgb(${Math.round(v*a)},${Math.round(v*b)},${Math.round(v)})`;
function mesh(g:CanvasRenderingContext2D,m:any,t:number,dx:number,dy:number,gain:number){
 const pts=m.points.map((p:number[],i:number)=>[p[0]+m.motion[i]*4.2*Math.sin(m.phase[i]+t*.86)+dx,p[1]+m.motion[i]*5.2*Math.cos(m.phase[i]+t*.91)+dy]);
 for(const [indices,tone] of m.faces){const v=m.face_gain*tone*(.77+.23*Math.sin(t*1.3+tone*12))*gain;path(g,indices.map((i:number)=>pts[i]),rgb(v,.81,.92));}
 for(const [a,b,tone] of m.edges)path(g,[pts[a],pts[b]],undefined,rgb(m.edge_gain*tone*gain),.5);
}
async function shards(g:CanvasRenderingContext2D,f:number){
 const s=G.shards,t=(f-21)/30,[glow,wash]=await Promise.all([raster('portrait-mg/V12_001/glow.png'),raster('portrait-mg/V12_001/upper-wash.png')]);
 g.drawImage(glow.image,0,0,360,640);g.save();g.globalCompositeOperation='lighter';if(f<65){g.globalAlpha=(65-f)/44;g.drawImage(wash.image,0,0,360,640);g.globalAlpha=1;}
 const temp=offscreen(),ct=temp.getContext('2d')!;ct.scale(2,2);
 const flush=()=>{g.drawImage(temp,0,0,360,640);ct.clearRect(0,0,360,640);};
 for(const [name,dx,dy,gain] of [['haze',t*6,t*6.5,.70],['strands',-t*7,t*3,.83],['upper',t*7,t*3,.92-.025*t],['lower',-t*14,-t*3,1],['left_web',t*8.5,4*Math.sin(t),.65+t*.14],['right_web',-t*5,t*8,.87]] as [string,number,number,number][]){mesh(ct,s[name],t,dx,dy,gain);flush();}
 for(const cluster of s.clusters){const [x,y,stretch,angle,lum]=track(cluster.poses,f);if(lum<=0)continue;const co=Math.cos(angle),si=Math.sin(angle),proj=(v:number[][])=>v.map(([px,py])=>[(px*co-py*si)*stretch+x,(px*si+py*co)*(.94+.08*stretch)+y]);for(const [vertices,intensity] of cluster.facets){const v=lum*intensity;path(ct,proj(vertices),rgb(v,.87,.92),rgb(v*.54,.87,.92),.5);}for(const [vertices,intensity] of cluster.paths)path(ct,proj(vertices),undefined,rgb(lum*intensity,.82,.91),.62);}
 flush();mesh(ct,s.top_detail,t,t*8,t*3,.49);
 for(const fil of s.filaments){const pts=fil.strands.map((strand:number[][],i:number)=>strand.map((p:number[],j:number)=>[p[0]+fil.speed[0]*t+4.8*Math.sin(fil.phase[i][j][0]+t*.95),p[1]+fil.speed[1]*t+4.8*Math.sin(fil.phase[i][j][1]+t*.95)]));pts.forEach((p:number[][],i:number)=>path(ct,p,undefined,rgb(fil.strength*.84*(.31+i*.105),.76,.86),.5));for(let i=0;i<6;i++)path(ct,[pts[0][i],pts[4][i+1]],undefined,rgb(fil.strength*.84*(.43+.15*Math.sin(t+i)),.77,.88),.5);}
 flush();const wave=Math.sin(t*.89);path(ct,[[-8,288],[22,344+12*wave],[66,353+15*wave],[16,352+12*wave]],'#485567');path(ct,[[-8,290],[19,345+12*wave],[64,354+15*wave],[19,350+12*wave]],'#647386');path(ct,[[22,348+11*wave],[67,313+12*wave],[40,401+9*wave]],'#0d1117','#2b3746',.5);flush();g.restore();
}
// Monotone piecewise cubic interpolation matches scipy PchipInterpolator used by the source.
function pchip(xs:number[],ys:number[],x:number){
 const n=xs.length,h=xs.slice(1).map((v,i)=>v-xs[i]),d=h.map((v,i)=>(ys[i+1]-ys[i])/v),m=new Array(n).fill(0);
 for(let k=1;k<n-1;k++){if(d[k-1]*d[k]<=0)m[k]=0;else{const w1=2*h[k]+h[k-1],w2=h[k]+2*h[k-1];m[k]=(w1+w2)/(w1/d[k-1]+w2/d[k]);}}
 const end=(a:number,b:number,c:number,e:number)=>{let v=((2*a+b)*c-a*e)/(a+b);if(Math.sign(v)!==Math.sign(c))v=0;else if(Math.sign(c)!==Math.sign(e)&&Math.abs(v)>3*Math.abs(c))v=3*c;return v;};
 m[0]=end(h[0],h[1],d[0],d[1]);m[n-1]=end(h[n-2],h[n-3],d[n-2],d[n-3]);
 x=clamp(x);let k=0;while(k<n-2&&x>xs[k+1])k++;const u=(x-xs[k])/h[k];return (2*u**3-3*u*u+1)*ys[k]+(u**3-2*u*u+u)*h[k]*m[k]+(-2*u**3+3*u*u)*ys[k+1]+(u**3-u*u)*h[k]*m[k+1];
}
const documentPaint:Painter=async(g,local,spec)=>{
 const f=Math.min(local+21,178);
 if(spec.body&&local>=spec.body.at*30){const body=await raster(spec.body.image);g.fillStyle='#020102';g.fillRect(0,0,360,640);g.drawImage(body.image,0,70,360,399);g.fillStyle='#dabe6a';g.fillRect(0,69,360,1);g.fillRect(0,469,360,1);return;}
 const cover=await raster(spec.coverImage);await shards(g,f);
 const [left,width,top,bottom,skewTop,skewBottom0,tip]=track(G.poses,f),fold=track(G.fold,f),skewBottom=skewBottom0-61*(1-fold[6])**1.5;
 const turn=G.turnover[Math.floor(f)];if(turn)path(g,turn,'#fafaf9');
 const profile=Array.from({length:513},(_,i)=>pchip(G.foldY,fold,i/512));
 const c=offscreen(),ct=c.getContext('2d')!,out=ct.createImageData(720,1280);
 for(let py=Math.max(0,Math.floor((top+Math.min(tip,0)-2)*2));py<Math.min(1280,Math.ceil((bottom+Math.max(skewBottom,0)+2)*2));py++)for(let px=Math.max(0,Math.floor(left*2)-2);px<Math.min(720,Math.ceil((left+width+2)*2));px++){
 const x=(px+.5)/2,y=(py+.5)/2,u=(x-left)/width,den=bottom-top+(skewBottom-skewTop)*u;let v=(y-top-skewTop*u)/den;if(tip)v-=tip*clamp(u)**4*Math.exp(-8*Math.max(v,0))/den;
 const z=clamp(v)*512,zi=Math.floor(z);let edge=profile[zi]+(profile[Math.min(512,zi+1)]-profile[zi])*(z-zi);
 const roughY=.13*Math.sin(v*143)+.06*Math.sin(v*357+1.4),roughX=.12*Math.sin(u*97)+.05*Math.sin(u*226+.4);edge+=roughY/width;
 const coverage=clamp(Math.min(Math.min(v-roughX/den,1+roughX/den-v)*den,Math.min(u-roughY/width*.61,edge-u)*width)*2+.5);if(!coverage)continue;
 const near=clamp((u/Math.max(edge,.08)-.55)/.45),folded=(1-edge)*near*near;let tu=u+folded*.28;
 if(f<=24){const compressed=u+.10*Math.sin(Math.PI*clamp(u));tu=tu*((f-21)/4)+compressed*(1-(f-21)/4);}
 const tv=v+folded*.065*Math.sin(Math.PI*clamp(v)),shade=Math.round(clamp(folded*10,0,9)),idx=(py*720+px)*4;
 for(let ch=0;ch<3;ch++)out.data[idx+ch]=sample(cover,tu*(cover.width-1),tv*(cover.height-1),ch)-shade;out.data[idx+3]=coverage*255;
 }
 ct.putImageData(out,0,0);g.drawImage(c,0,0,360,640);
};
export const RotatingDocument:React.FC<{spec:any}>=p=><CanvasStage {...p} paint={documentPaint}/>;
