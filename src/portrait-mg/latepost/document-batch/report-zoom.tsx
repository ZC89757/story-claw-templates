import {Img, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {asset, ease, type PortraitDemo} from "../../common";
import type {ReportZoomSpec} from "./report-zoom-contract";

const root = "portrait-mg/latepost/document-batch/";
const sans = "Arial, 'Microsoft YaHei', sans-serif";
const serif = "'Times New Roman', SimSun, serif";
const box = (x:number,y:number,width:number,height:number) => ({position:"absolute" as const,left:x,top:y,width,height});
const reveal = (t:number,from:number,span:number) => ease((t-from)/span);
const edges = {extrapolateLeft:"clamp",extrapolateRight:"clamp"} as const;

function TaggedFinding({finding,time,index,opacity}: {finding:ReportZoomSpec["first"];time:number;index:number;opacity:number}) {
  const {original,percentage,label,focus,summary} = finding;
  const x = 47;
  const y = index===0 ? 229 : 251;
  const rows = original.flatMap(line=>line===null ? [] : [line]);
  const age = time - focus.at;
  const visible = reveal(time,focus.at,.65);
  const statementWidth = 222;
  const barWidth = index===0 ? 224 : 266;
  const bar = ease((time-summary.at)/.42);
  const percentageText = percentage.toString()+"%";
  return <div style={{position:"absolute",inset:0,opacity}}>
    {rows.map((line,rowIndex)=>{
      const lineWidth = Math.min(statementWidth,Math.ceil(Array.from(line).length*5.03)+4);
      const progress = ease((age-rowIndex*.23)/.39);
      return (
        <div key={rowIndex} style={{...box(x,y+rowIndex*16,lineWidth,16),overflow:"hidden",
          clipPath:`inset(0 ${(1-progress)*100}% 0 0)`,opacity:visible,color:"#fff",background:"#e4110a",
          fontFamily:sans,fontSize:10.5,lineHeight:"16px",whiteSpace:"nowrap",paddingLeft:3}}>{line}</div>
      );
    })}
    <div style={{...box(x,y+(index===0 ? 37 : 32),barWidth,52),display:"flex",alignItems:"baseline",justifyContent:"flex-start",
      gap:10,padding:"0 8px",background:"#e00000",color:"#fdf9f3",transformOrigin:"left center",
      clipPath:`inset(0 ${(1-bar)*100}% 0 0)`,lineHeight:1,whiteSpace:"nowrap"}}>
      <span style={{fontFamily:serif,fontSize:62,fontStyle:"italic",fontWeight:900,lineHeight:.89}}>{percentageText}</span>
      <span style={{fontFamily:"SimSun,serif",fontSize:27,lineHeight:1.3}}>{label}</span>
    </div>
  </div>;
}

export function ReportZoom({spec}: {spec:ReportZoomSpec}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame/fps;
  const turn = spec.turn.at;
  const first = spec.first.focus.at;
  const second = spec.second.focus.at;
  const coverSlide = reveal(time,turn-.22,.42);
  const reverseIn = reveal(time,turn-.08,.2);
  const reverseOut = reveal(time,turn+.2,.26);
  const pageIn = reveal(time,turn+.26,.31);
  const pageZoom = reveal(time,first-1.88,.83);
  const later = reveal(time,second-.73,.55);
  const nudge = reveal(time,first-1.17,.44);
  const paperScale = 1+1.64*pageZoom+.17*nudge;
  const paperX = interpolate(pageZoom,[0,1],[137,78],edges)-65*nudge+21*later;
  const paperY = interpolate(pageZoom,[0,1],[139,10],edges)-58*nudge+46*later;
  const coverEntry = reveal(time,-.21,.61);
  const bgYearOpacity = .08*(1-.76*pageZoom);
  const move = ease((time-second+.19)/.34);

  return (
    <div style={{position:"absolute",inset:0,overflow:"hidden",background:"radial-gradient(ellipse 110% 32% at center bottom,#ffebe8,transparent),#fbf7f2"}}>
      <div style={{...box(59,85,275,175),fontFamily:serif,fontSize:177,fontWeight:900,fontStyle:"italic",color:"#d4706e",
        letterSpacing:-11,transform:"translateX(-19px)",opacity:bgYearOpacity}}>{spec.year}</div>
      {coverSlide<1 && <div style={{...box(51,-4+134*coverEntry,246,322),
        opacity:coverEntry,transform:`translateX(${230*coverSlide}px)`}}>
        <div style={{...box(11,15,245,315),background:"#fffdf9",boxShadow:"0 2px 5px #ab8d8537"}}/>
        <div style={{...box(6,7,245,315),background:"#fefefa",boxShadow:"0 1px 3px #ab8d852a"}}/>
        <Img src={asset(spec.cover)} style={{...box(0,0,246,322),objectFit:"fill",boxShadow:"1px 2px 4px #ab8d8544"}}/>
      </div>}
      {reverseIn>0 && reverseOut<1 && <Img src={asset(spec.reverse)} style={{...box(45,135,246,318),
        objectFit:"fill",boxShadow:"7px 6px 2px #fff9f5,7px 8px 3px #9e898837",
        opacity:reverseIn*(1-reverseOut),transform:`translateX(${37*(1-reverseIn)-96*reverseOut}px)`}}/>}
      {pageIn>0 && <Img src={asset(spec.document)} style={{...box(paperX-76,paperY,244,315),
        objectFit:"fill",transformOrigin:"13% 26%",transform:`scale(${paperScale})`,opacity:pageIn*(1-.43*nudge),
        boxShadow:pageZoom<.5 ? "4px 5px 5px #b99c8638" : undefined}}/>}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,#fbf7f2 0%,transparent 28%,transparent 54%,#fbf7f2 75%,#fbf7f2 100%)",opacity:.86*pageZoom}}/>
      <div style={{position:"absolute",inset:0,transform:`translateX(${-279*move}px)`}}>
        <TaggedFinding finding={spec.first} time={time} index={0} opacity={1-move}/>
      </div>
      <div style={{position:"absolute",inset:0,transform:`translateX(${196*(1-move)}px)`}}>
        <TaggedFinding finding={spec.second} time={time} index={1} opacity={move}/>
      </div>
    </div>
  );
}

export const reportZoomDemo: PortraitDemo = {
  fps:30,
  durationInFrames:462,
  reference:"晚点LatePost · BV1y6nEz8EBm · 50.3–65.7",
  spec:{
    cover:root+"genai-cover.jpg",
    reverse:root+"genai-notes.jpg",
    document:root+"genai-summary.jpg",
    year:"2025",
    turn:{at:2.94},
    first:{original:["Just 5% of integrated AI pilots are extracting","millions in value"],percentage:5,label:"企业获得价值",focus:{at:6.55},summary:{at:8.45}},
    second:{original:["95% of organizations are getting zero return.",null],percentage:95,label:"企业零回报",focus:{at:12.17},summary:{at:13.18}},
  } satisfies ReportZoomSpec,
};
