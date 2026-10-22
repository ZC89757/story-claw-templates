import {AbsoluteFill,Img,staticFile,useVideoConfig} from "remotion";
import type {ImagePlateSpec} from "./schema";
export const ImagePlateTemplate=({spec,viewport}:{spec:ImagePlateSpec;viewport?:{width:number;height:number}})=>{
  const config=useVideoConfig(),{width,height}=viewport??config;
  const src=/^(https?:|data:|blob:)/.test(spec.image)?spec.image:staticFile(spec.image.replace(/^public[\\/]/,"").replace(/^\/+/,""));
  return <AbsoluteFill style={{width,height,background:"#162126",overflow:"hidden"}}>
    <Img src={src} style={{width:"100%",height:"100%",objectFit:"cover",filter:"brightness(.65) saturate(.75)"}}/>
    <AbsoluteFill style={{background:"linear-gradient(180deg,rgba(5,12,16,.08),rgba(5,12,16,.3) 45%,rgba(5,12,16,.88))"}}/>
    {spec.caption?<div style={{position:"absolute",top:"8%",left:"8%",right:"8%",fontFamily:"Microsoft YaHei, sans-serif",color:"#fff",fontSize:width*(height>width?.038:.026),letterSpacing:".08em",fontWeight:600}}>{spec.caption}</div>:null}
  </AbsoluteFill>;
};
