import {Img, useCurrentFrame, useVideoConfig} from "remotion";
import {asset, ease, PortraitMedia, type PortraitDemo} from "../../common";
import type {ReportEvidenceSpec} from "./report-evidence-contract";

const root = "portrait-mg/latepost/document-batch/";
const phase = (time:number,start:number,span:number)=>ease((time-start)/span);

export function ReportEvidence({spec}: {spec: ReportEvidenceSpec & {_duration?:number}}) {
  const frame=useCurrentFrame();
  const {fps,durationInFrames}=useVideoConfig();
  const time=frame/fps;
  const first=spec.first.at;
  const second=spec.second.at;
  const pageAt=spec.pageReveal.at;
  const coverUp=phase(time,-.03,.59);
  const reveal=phase(time,pageAt-.09,.29);
  const expand=phase(time,pageAt+.36,.53);
  const leave=phase(time,(spec._duration ?? durationInFrames/fps)-.64,.61);
  const paperX=50-44*expand;
  const paperY=111+39*reveal+34*expand+569*leave;
  const paperWidth=250+105*expand;
  const dropY=(1-coverUp)*430+paperY;
  const intoDark=phase(time,first-.11,.47)*(1-leave);

  return (
    <div style={{position:"absolute",inset:0,background:"#080808",overflow:"hidden"}}>
      <PortraitMedia media={spec.background} style={{position:"absolute",inset:0,filter:"grayscale(1) brightness(.69)"}}/>
      <div style={{position:"absolute",inset:0,opacity:.64,background:"linear-gradient(transparent 32%,#777 100%)"}}/>
      <div style={{position:"absolute",left:paperX,top:dropY,width:paperWidth,height:paperWidth*1.385}}>
        {reveal<1&&<>
          <Img src={asset(spec.page)} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",
            transform:`translate(${21*(1-reveal)}px,${20-55*reveal}px)`,boxShadow:"0 1px 9px #0008"}}/>
          <Img src={asset(spec.cover)} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"fill",
            transform:`translateY(${reveal*57}px)`,opacity:1-reveal,boxShadow:"0 3px 11px #0009"}}/>
        </>}
        {reveal>0&&<Img src={asset(spec.page)} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"fill",
          opacity:reveal,filter:`brightness(${1-.36*intoDark})`,boxShadow:"0 3px 11px #0008"}}/>}
      </div>
      {[spec.first,spec.second].map(({at,text},index)=>{
        const amount=phase(time,at,.34);
        return <div key={index} style={{position:"absolute",left:64,top:dropY+35+index*56,background:"#e60000",
          color:"#fff",fontFamily:"SimSun,serif",fontSize:43,fontWeight:900,lineHeight:"54px",height:54,padding:"0 9px",
          transform:"scaleX(.80)",transformOrigin:"left center",whiteSpace:"nowrap",opacity:amount>0?1:0,
          clipPath:`inset(0 ${(1-amount)*100}% 0 0)`}}>{text}</div>;
      })}
    </div>
  );
}

export const reportEvidenceDemo: PortraitDemo = {
  fps:30,durationInFrames:177,
  reference:"晚点LatePost · BV1V9J46SEd9 · 24.4–30.3",
  spec:{
    background:{source:root+"robot-factory-demo.mp4",sourceStart:0},
    cover:root+"robot-report-cover.jpg",
    page:root+"robot-report-page.jpg",
    pageReveal:{at:1.63},
    first:{at:2.73,text:"建成启用超70家"},
    second:{at:3.52,text:"规划在建46家"},
  } satisfies ReportEvidenceSpec,
};
