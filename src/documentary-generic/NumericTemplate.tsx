import {Img, useCurrentFrame, useVideoConfig} from "remotion";
import {DOC, DocumentaryCanvas, enter, outCubic} from "../documentary-design";
import {assetUrl} from "./ProductionTemplate";
import {comparisonFractions, numericLabel, type NumericSpec} from "./schema";

export const GenericNumericTemplate = ({spec}: {spec: NumericSpec}) => {
  const t = useCurrentFrame() / useVideoConfig().fps, split = enter(t, spec.right.at, .75);
  const counts = spec.unitsPerMark !== null, fractions = comparisonFractions(spec);
  return <DocumentaryCanvas>
    <div style={{position: "absolute", left: 150, top: 118, fontSize: 58, fontWeight: 600}}>{spec.title}</div>
    {[spec.left,spec.right].map((side,i) => {
      const p = enter(t,side.at,.55), color = i===0?DOC.teal:DOC.orange, label = numericLabel(side), x = i===0?585-435*split:1035;
      const unit = spec.mode==="relative"&&i===1?"倍":spec.unit, tiles = counts?side.value/spec.unitsPerMark!:0;
      return <div key={i} style={{position:"absolute",left:x,top:0,width:735,opacity:p,transform:`translateY(${(1-p)*25}px)`}}>
        <div style={{position:"absolute",top:278,left:22,fontSize:36,fontWeight:600}}>{side.label}</div>
        {counts?<div style={{position:"absolute",left:26,top:570,width:650,height:240,perspective:1500}}><div style={{transform:"rotateX(20deg)",transformOrigin:"50% 0",display:"grid",gridTemplateColumns:"repeat(15,35px)",gridAutoRows:16,gap:7}}>
          {Array.from({length:Math.ceil(tiles)},(_,j)=><div key={j} style={{height:16,width:35*Math.min(1,tiles-j),borderRadius:2,background:color,opacity:outCubic((t-side.at-j*.004)/.55),boxShadow:"0 5px 0 #233d4f66,0 8px 10px #233d4f25,inset 0 1px 0 #ffffff80",transform:`translateY(${-22*(1-outCubic((t-side.at-j*.004)/.55))}px)`}}/>)}</div></div>:<>
          <div style={{position:"absolute",top:555,left:5,width:710,height:73,borderRadius:"50%",background:"#a9bac4",boxShadow:"0 25px 45px #233e4c20,0 -2px 0 #fff"}}/>
          <Img src={assetUrl(side.image!)} style={{position:"absolute",left:-5,top:330,width:730,height:295,objectFit:"contain",filter:"drop-shadow(0 14px 12px #29465420)"}}/>
        </>}
        <div style={{position:"absolute",left:26,top:counts?365:655,fontFamily:'Bahnschrift,"Microsoft YaHei",sans-serif',fontWeight:700,fontSize:Math.min(counts?143:110,680/(label.length*.58+unit.length*.3)),letterSpacing:-3,lineHeight:1.15,color}}>{label}<span style={{fontSize:32,letterSpacing:0,marginLeft:10}}>{unit}</span></div>
        {side.caption?<div style={{position:"absolute",left:30,right:20,top:counts?470:790,fontSize:30,lineHeight:1.4}}>{side.caption}</div>:null}
        {!counts&&fractions?<div style={{position:"absolute",left:30,top:885,width:620,height:28,borderRadius:5,background:"#9aafbd30",boxShadow:"inset 0 2px 3px #24435420,0 1px 0 #fff9"}}>
          <div style={{width:620*fractions[i]*outCubic((t-side.at)/.9),height:28,borderRadius:5,background:color,backgroundImage:t-side.at<1.2?"repeating-linear-gradient(45deg,#ffffff85 0 3px,transparent 3px 9px)":undefined,boxShadow:"0 6px 9px #25455720,inset 0 2px 0 #ffffff45"}}/>
        </div>:null}
      </div>;
    })}
    {counts?<div style={{position:"absolute",left:300,right:300,bottom:112,fontSize:29,textAlign:"center",color:DOC.muted}}>每格 {spec.unitsPerMark} {spec.unit}{fractions===null?" · 数量边界示意":""}</div>:null}
  </DocumentaryCanvas>;
};
