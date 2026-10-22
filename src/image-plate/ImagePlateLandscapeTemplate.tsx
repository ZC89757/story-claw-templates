import {AbsoluteFill,Img,staticFile,useVideoConfig} from "remotion";
import type {ImagePlateSpec} from "./schema";

/** Static 16:9 company plate; the central facade stays clear between people. */
export const ImagePlateLandscapeTemplate=({spec,viewport}:{spec:ImagePlateSpec;viewport?:{width:number;height:number}})=>{
  const config=useVideoConfig(),{width,height}=viewport??config;
  const src=/^(https?:|data:|blob:)/.test(spec.image)?spec.image:staticFile(spec.image.replace(/^public[\\/]/,"").replace(/^\/+/,""));
  return <AbsoluteFill style={{width,height,background:"#162126",overflow:"hidden"}}>
    <Img src={src} style={{width:"100%",height:"100%",objectFit:"cover",filter:"brightness(.65) saturate(.75)"}}/>
    <AbsoluteFill style={{background:"linear-gradient(180deg,rgba(5,12,16,.1),rgba(5,12,16,.18) 42%,rgba(5,12,16,.88))"}}/>
    {spec.caption?<div style={{position:"absolute",top:height*.065,left:width*.065,right:width*.065,color:"#fff",fontFamily:"Microsoft YaHei, sans-serif",fontSize:width*.024,letterSpacing:".08em",fontWeight:600}}>{spec.caption}</div>:null}
  </AbsoluteFill>;
};
