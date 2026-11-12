import {inkLettering} from './lettering';
import React from 'react';
import {CanvasStage,clamp,key,loadFont,offscreen,raster,sample,smooth,textTile,track,type Painter,type Raster} from './canvas';
import {geometry} from './geometry';
const G:any=geometry;
const names=['n0','n1','n2','n3','n4','warp_x','warp_y','warp_fine','ridges'];
let noisePromise:Promise<Float32Array[]>|undefined;
const fields=()=>noisePromise??=(Promise.all(names.map(n=>raster(`portrait-mg/V10_004/${n}.png`))).then(rs=>rs.map(r=>{const a=new Float32Array(360*640);for(let j=0;j<a.length;j++)a[j]=(r.data[j*4]*256+r.data[j*4+1])/4095.9375-8;return a;})));
function ns(a:Float32Array,x:number,y:number){x=Math.abs(x);y=Math.abs(y);if(x>359)x=718-x%718;if(x<0)x=-x;if(y>639)y=1278-y%1278;if(y<0)y=-y;x=clamp(x,0,359);y=clamp(y,0,639);const xx=x|0,yy=y|0,u=x-xx,v=y-yy;return (a[yy*360+xx]*(1-u)+a[yy*360+Math.min(359,xx+1)]*u)*(1-v)+(a[Math.min(639,yy+1)*360+xx]*(1-u)+a[Math.min(639,yy+1)*360+Math.min(359,xx+1)]*u)*v;}
const gauss=(x:number,y:number,cx:number,cy:number,rx:number,ry:number)=>Math.exp(-.5*(((x-cx)/rx)**2+((y-cy)/ry)**2));
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const inkPaint:Painter=async(g,localFrame,spec)=>{
 const [noise,back]=await Promise.all([fields(),raster('portrait-mg/V10_004/substrate.png'),loadFont('PortraitInk','portrait-mg/V10_004/brush.ttf'),loadFont('PortraitInkFallback','portrait-mg/V10_004/fallback.ttf')]);
 const [n0,n1,n2,n3,n4,warpX,warpY,warpFine,ridges]=noise;
 const frame=localFrame+20,t=Math.min(frame,72)+Math.max(0,frame-72)*.23,age=Math.max(0,t-22),plumes=G.plumes.filter((p:number[][])=>t>=p[0][0]).map((p:number[][])=>track(p,t));
 const gain=key(t,[[21,.25],[27,.65],[35,1],[72,1]]),activation=key(t,[[21,0],[22,.27],[23,.64],[24,1],[72,1]]),fogLevel=key(t,[[24,0],[28,.24],[42,.37],[72,.39]]);
 const sideOpening=key(t,[[27,0],[29,1],[32,.65],[35,0]]);
 const surge=key(t,[[26,0],[28,1],[31,.79],[36,0]]),tongueX=key(t,[[27,18],[29,40],[32,86]]),ridgeX=key(t,[[26,224],[28,272],[30,320],[38,333]]);
 const settle=key(frame,[[70,0],[72,.1],[74,.19],[82,.5],[88,.84],[94,.98],[97,1]]),reach=key(frame,[[25,0],[28,115],[30,164],[32,185],[34,248],[36,280],[40,301],[45,370]]),offset=key(frame,[[25,-183],[26,-135],[27,-88],[28,-55],[29,-31],[30,-14],[31,-4],[32,0],[109,0]]);
 const titleHeight=Math.min(125,244/Math.max(1,[...spec.text].length)*1.025),title=await inkLettering(spec.text,244,titleHeight),tc=offscreen(360,640),tg=tc.getContext('2d')!;tg.drawImage(title,57+offset,305-titleHeight/2,244,titleHeight);const mask=tg.getImageData(0,0,360,640).data;
 const c=offscreen(360,640),ctx=c.getContext('2d')!,out=ctx.createImageData(360,640);
 for(let y=0;y<640;y++)for(let x=0;x<360;x++){
 const idx=y*360+x,wx=warpX[idx]*(9+Math.min(age,50)*.17),wy=warpY[idx]*(7+Math.min(age,50)*.12),dx=-Math.min(age,49)*.30+warpX[idx]*(4+age*.065),dy=warpY[idx]*(3+age*.045);
 const big=ns(n0,x+dx,y+dy),middle=ns(n1,x+dx+warpFine[idx]*4,y+dy+warpFine[idx]*2),small=ns(n2,x+dx+warpFine[idx]*5,y+dy+warpX[idx]*3),speckle=ns(n3,x+dx,y+dy);
 let distance=-300;for(const [cx,cy,rx,ry] of plumes)distance=Math.max(distance,(1-Math.sqrt(((x+wx-cx)/rx)**2+((y+wy-cy)/ry)**2))*Math.min(rx,ry));
 distance-=gauss(x,y,-7,127,68,23)*38*sideOpening;
 let rough=distance+gain*(big*23+middle*14+small*8.9+speckle*3.9);
 const tongue=gauss(x,y,tongueX+13,297,47,54)*surge,ribbon=gauss(x,y,ridgeX,397,57,20)*smooth(26,29,t)*(1-smooth(39,60,t));rough+=tongue*44+ribbon*12;
 const roll=ns(ridges,x+dx+warpFine[idx]*8,y+dy+warpX[idx]*9),edge=Math.exp(-.5*((rough-4)/22)**2),vein=smooth(.69,1.02,roll)*edge*(.35+.65*smooth(-.6,1.35,middle)),pits=smooth(.32,1.57,middle+.54*small+.19*speckle)*edge;
 const footer=smooth(469,557,y)*smooth(26,41,t),breakup=smooth(-.92,.88,middle*.84+small*.67+speckle*.16);
 rough-=gain*((vein*25+pits*19)*(1-.68*clamp(tongue+ribbon))+footer*(17+54*breakup));
 let mist=smooth(-39,11,distance+gain*(big*20+middle*8+small*6));mist=clamp(mist+.12*footer*smooth(-32,13,distance)*(1-breakup))*(.54+.28*clamp(.5+middle*.20+small*.13));
 const core=smooth(-2.2,9.2,rough)*activation,fog=gauss(x,y,5,-14,125,121)*fogLevel*clamp(.92+.12*big),grayT=smooth(-1.1,1.55,middle+small*.32);
 let wash=clamp(mist*activation+smooth(-15,4,rough)*.28*activation);wash=clamp(wash+gauss(x,y,338,422,85,52)*smooth(25,35,t)*.31*smooth(-1.3,.85,big+.42*middle));wash=clamp(wash+gauss(x,y,100,511,120,55)*smooth(29,39,t)*.17*smooth(-.9,.98,big+small*.53));
 let scatter=smooth(.89,1.46,small+.42*speckle+.23*n4[idx])*smooth(-43,-17,distance)*(1-smooth(-11,4,distance))*clamp(.6*gauss(x,y,66,558,115,120)+.45*gauss(x,y,90,65,105,77));
 const sprayField=middle*.6+small+.72*speckle,footerSpray=clamp(footer*smooth(-61,-18,distance)*smooth(.80,1.54,sprayField)+gauss(x,y,4,567,52,128)*smooth(26,32,t)*smooth(.57,1.48,sprayField));
 const pocketArea=gauss(x,y,86,424,67,30)+.45*gauss(x,y,74,570,115,57),pockets=smooth(.45,1.36,big*.76+middle*.59+small*.27+pocketArea*.74)*clamp(pocketArea)*core*smooth(29,39,t)*.70,sediment=footer*core*smooth(.37,1.67,big*.23+middle*.54+small*.65);
 const rgb=[];for(let ch=0;ch<3;ch++){
  const bg=back.data[idx*4+ch],gray=mix([85,90,104][ch],[213,214,222][ch],grayT),paper=mix([251,248,251][ch],[180,193,197][ch],fog);
  let val=mix(paper,gray,wash);val=mix(val,[44,47,57][ch],vein*.26*activation);val=mix(val,mix([4,1,8][ch],bg,smooth(-7,21,rough)*.84),core);val=mix(val,bg*[.90,1.10,1.09][ch],ribbon*smooth(-13,14,rough)*.47);val=mix(val,[7,6,15][ch],clamp(scatter+footerSpray)*gain*activation);val=mix(val,gray,clamp(pockets+sediment*.67));rgb.push(mix(val,bg,settle));
 }
 if(frame<22){rgb[0]=251;rgb[1]=248;rgb[2]=251;}
 const luminance=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722,local=1-smooth(128,247,luminance),arrival=1-smooth(reach-31,reach+5,x),reveal=Math.max(Math.max(smooth(.1,.72,core),local*.97)*arrival,smooth(39,46,frame)*arrival*.99,settle),alpha=frame>=25?mask[idx*4+3]/255*reveal:0;
 for(let ch=0;ch<3;ch++)out.data[idx*4+ch]=mix(rgb[ch],[255,254,255][ch],alpha);out.data[idx*4+3]=255;
 }
 ctx.putImageData(out,0,0);g.drawImage(c,0,0,360,640);
};
export const InkTitle:React.FC<{spec:any}>=p=><CanvasStage {...p} paint={inkPaint}/>;
