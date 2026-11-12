import {clamp,offscreen,raster,sample,smooth,type Raster} from './canvas';
const cache=new Map<string,HTMLCanvasElement>();
const pixels=(c:HTMLCanvasElement)=>({data:c.getContext('2d')!.getImageData(0,0,c.width,c.height).data,width:c.width,height:c.height} as Raster);
function bounds(r:Raster){let l=r.width,t=r.height,rr=0,b=0;for(let y=0;y<r.height;y++)for(let x=0;x<r.width;x++)if(r.data[(y*r.width+x)*4+3]>0){l=Math.min(l,x);rr=Math.max(rr,x);t=Math.min(t,y);b=Math.max(b,y);}return {x:l,y:t,w:Math.max(1,rr-l+1),h:Math.max(1,b-t+1)};}
export async function inkLettering(text:string,width:number,height:number){
 const key=`${text}/${width}/${height}`,old=cache.get(key);if(old)return old;
 const p=offscreen(),pg=p.getContext('2d')!;pg.font='240px PortraitInk, PortraitInkFallback';
 const c=offscreen(Math.ceil(pg.measureText(text).width+40),400),ctx=c.getContext('2d')!;ctx.font=pg.font;ctx.textBaseline='alphabetic';ctx.fillStyle=ctx.strokeStyle='white';ctx.lineWidth=2;ctx.strokeText(text,12,280);ctx.fillText(text,12,280);
 const b=bounds(pixels(c)),base=offscreen(b.w+12,b.h+12);base.getContext('2d')!.drawImage(c,b.x,b.y,b.w,b.h,6,6,b.w,b.h);const source=pixels(base);
 const warped=offscreen(base.width,base.height+90),wc=warped.getContext('2d')!,wi=wc.createImageData(warped.width,warped.height),advance=base.width/Math.max(1,[...text].length);
 for(let y=0;y<warped.height;y++)for(let x=0;x<warped.width;x++){const sx=x+.09*(y-warped.height/2),sy=y-45+((x%advance)-advance/2)*.10,j=(y*warped.width+x)*4;wi.data[j]=wi.data[j+1]=wi.data[j+2]=255;wi.data[j+3]=sx<0||sy<0||sx>=source.width||sy>=source.height?0:sample(source,sx,sy,3);}
 wc.putImageData(wi,0,0);const bb=bounds(pixels(warped)),small=offscreen(Math.round(width),Math.round(height)),sc=small.getContext('2d')!;sc.drawImage(warped,bb.x,bb.y,bb.w,bb.h,0,0,small.width,small.height);const src=pixels(small),rough=await raster('portrait-mg/V10_004/lettering-rough.png'),a=new Float32Array(small.width*small.height),n=new Float32Array(a.length);
 const noise=(x:number,y:number)=>{const xx=x/(small.width-1)*(rough.width-1),yy=y/(small.height-1)*(rough.height-1);return (sample(rough,xx,yy,0)*256+sample(rough,xx,yy,1))/4095.9375-8;};
 for(let y=0;y<small.height;y++)for(let x=0;x<small.width;x++){const j=y*small.width+x,r=noise(x,y);n[j]=r;a[j]=sample(src,x+.95*r,y+.64*noise((x-6+small.width)%small.width,y),3)/255;}
 const out=sc.createImageData(small.width,small.height);
 for(let y=0;y<small.height;y++)for(let x=0;x<small.width;x++){const j=y*small.width+x;let lo=1,hi=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const v=a[clamp(y+dy,0,small.height-1)*small.width+clamp(x+dx,0,small.width-1)];lo=Math.min(lo,v);hi=Math.max(hi,v);}out.data[j*4]=out.data[j*4+1]=out.data[j*4+2]=255;out.data[j*4+3]=255*a[j]*(1-.47*(hi-lo)*smooth(.45,1.5,n[j]));}
 sc.putImageData(out,0,0);cache.set(key,small);return small;
}
export async function wornTile(tile:HTMLCanvasElement,name:string,width:number,height:number){
 const key=`wear/${name}/${tile.width}/${tile.height}`; // glyph identity is cached on its source canvas via WeakMap below.
 let variants=wearCache.get(tile);if(!variants){variants=new Map();wearCache.set(tile,variants);}const found=variants.get(key);if(found)return found;
 const mask=await raster(`portrait-mg/V10_005/wear-${name}.png`),c=offscreen(Math.round(width*2),Math.round(height*2)),g=c.getContext('2d')!;g.drawImage(tile,0,0,c.width,c.height);const im=g.getImageData(0,0,c.width,c.height);
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)im.data[(y*c.width+x)*4+3]*=sample(mask,x/(c.width-1)*(mask.width-1),y/(c.height-1)*(mask.height-1),0)/255;
 g.putImageData(im,0,0);variants.set(key,c);return c;
}
const wearCache=new WeakMap<HTMLCanvasElement,Map<string,HTMLCanvasElement>>();
