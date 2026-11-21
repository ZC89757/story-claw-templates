import {Sequence, useCurrentFrame, useVideoConfig} from "remotion";
import {PortraitMedia, clamp, ease, type PortraitDemo} from "../../common";
import {taskTileOffset, type TaskMatrixSpec} from "./task-matrix-contract";

const root = "portrait-mg/latepost/document-batch/";
const mono = "'Cascadia Mono',Consolas,'Microsoft YaHei',monospace";
const red = "#a82a1d";
const teal = "#acd8d0";
const black = "#100d0b";
const full={position:"absolute" as const,inset:0};
const box=(x:number,y:number,width:number,height:number)=>({position:"absolute" as const,left:x,top:y,width,height});

function PriceTag({total,value,index,intensity,estimate}: {total:string;value:string;index:number;intensity:number;estimate:boolean}) {
  const turn=estimate ? 0 : -.055 + (index%4)*.028;
  return <div style={{...box(90,42,83,50),boxSizing:"border-box",padding:"4px 4px",opacity:intensity,
    background:estimate?"#080d0c":"#f1ede2",border:estimate?"1px solid #7faea7":"1px solid #d1c7b8",color:estimate?teal:black,
    fontFamily:mono,transform:`translateY(${10*(1-intensity)}px) rotate(${turn}rad)`,whiteSpace:"nowrap",overflow:"hidden"}}>
    <div style={{fontSize:5,letterSpacing:.38}}>{estimate ? "智能价值 INTELLIGENCE" : "人工 LABOR"}</div>
    <div style={{fontSize:18,lineHeight:"23px",fontWeight:900,color:estimate?teal:red}}>
      ¥{estimate?value:total}{!estimate&&<b style={{fontSize:6,color:black}}> /分钟</b>}
    </div>
    <div style={{fontSize:5,letterSpacing:.3,opacity:.85}}>{estimate?"CALCULATING…":`━━━━━━ #${String(index+1).padStart(4,"0")}`}</div>
  </div>;
}

export function TaskMatrix({spec}: {spec:TaskMatrixSpec & {_duration?:number}}) {
  const frame=useCurrentFrame();
  const {fps,durationInFrames}=useVideoConfig();
  const time=frame/fps;
  const duration=spec._duration??durationInFrames/fps;
  const matrixAt=spec.matrix.at;
  const isolateAt=spec.isolate.at;
  const priceAt=spec.switchPrice.at;
  const introSpan=matrixAt/3;
  const matrixFrame=Math.floor(matrixAt*fps);
  const isolateFrame=Math.floor(isolateAt*fps);
  const matrixAge=time-matrixAt;
  const fade=ease((time-isolateAt+.78)/.78);
  const finalIn=ease((time-isolateAt)/.37);
  const finalX=165*(1-finalIn);
  const finalY=497-278*finalIn;
  const finalWidth=192+168*finalIn;
  const finalHeight=109+93*finalIn;
  const finalUI=ease((time-isolateAt-.95)/.27);
  const finalOut=1-ease((time-duration+.37)/.37);
  return (
    <div style={{...full,overflow:"hidden",background:black,fontFamily:mono}}>
      {time<matrixAt&&<>
        <div style={{...box(24,30,312,10),display:"flex",justifyContent:"space-between",fontSize:6,color:"#ccc2b5",opacity:.63,letterSpacing:.58}}>
          <span>ARCHIVE · EARLY HUMAN FOOTAGE</span><span>000{Math.min(3,Math.floor(time/introSpan)+1)} / 0020</span>
        </div>
        <div style={{...box(32,52,296,539),overflow:"hidden",background:"#1c1711"}}>
          {spec.intro.map((media,index)=>{
            const from=Math.round(index*introSpan*fps);
            const end=index===2 ? matrixFrame : Math.round((index+1)*introSpan*fps);
            const pull=1-ease((time-index*introSpan)/.21);
            return <Sequence key={index} from={from} durationInFrames={Math.max(1,end-from)} layout="none">
              <div style={{position:"absolute",inset:0,transform:`translateY(${pull*(index?-43:45)}px)`}}>
                {[0,1,2].map(row=><div key={row} style={{...box(0,5+row*175,296,168),overflow:"hidden",border:"1px solid #7a7363",
                  opacity:row===1?1:.32}}>
                  <PortraitMedia media={media} />
                  {row===1&&<div style={{...box(0,0,151,12),background:teal,color:black,fontSize:7,fontWeight:800,padding:"1px 2px",
                    overflow:"hidden",whiteSpace:"nowrap"}}>{spec.introLabels[index]}</div>}
                </div>)}
              </div>
            </Sequence>;
          })}
        </div>
        <div style={{...full,pointerEvents:"none",background:"linear-gradient(#100d0b9e,transparent 28%,transparent 71%,#100d0bd9)"}}/>
      </>}
      {time>=matrixAt && time<isolateAt&&<Sequence from={matrixFrame} durationInFrames={Math.max(1,isolateFrame-matrixFrame)} layout="none">
        {spec.tiles.map(({video,value},index)=>{
          const col=index%2,row=Math.floor(index/2);
          const offset=taskTileOffset(index);
          const show=ease((matrixAge-offset)/.16);
          const labor=ease((matrixAge-.24-offset*2)/.28)*(1-ease((time-priceAt-offset)/.18));
          const estimate=ease((time-priceAt-offset)/.27);
          const vanish=ease((fade-offset/.037*.062)/.27);
          return <Sequence key={index} from={Math.ceil(offset*fps)} layout="none"><div style={{...box(3+col*179,14+row*102,175,99),overflow:"hidden",opacity:show*(1-vanish)}}>
            <PortraitMedia media={video}/>
            <PriceTag total={spec.laborRate} value={value} index={index} intensity={labor} estimate={false}/>
            <PriceTag total={spec.laborRate} value={value} index={index} intensity={estimate} estimate/>
          </div></Sequence>;
        })}
      </Sequence>}
      {time>=isolateAt&&<div style={{...full,opacity:finalOut}}>
        <Sequence from={isolateFrame} layout="none">
          <div style={{...box(finalX,finalY,finalWidth,finalHeight),overflow:"hidden"}}>
            <PortraitMedia media={spec.detail} style={{filter:"grayscale(.8)"}}/>
            <div style={{...full,pointerEvents:"none",background:"#fff",opacity:1-ease((time-isolateAt)/.27)}}/>
          </div>
        </Sequence>
        <div style={{...box(23,101,315,76),whiteSpace:"nowrap",opacity:finalUI}}>
          <div style={{borderBottom:"1px solid #6b686367",fontSize:6,color:"#9b9791",letterSpacing:1,paddingBottom:8}}>{spec.sample}</div>
          <div style={{fontSize:15,color:"#e2dfdb",lineHeight:"29px",fontWeight:700}}>人工 ¥{spec.laborRate} / 分钟
            <span style={{float:"right",color:"#98958f",fontSize:8}}>已结算✓</span></div>
          <div style={{fontSize:15,color:teal,lineHeight:"22px",fontWeight:700}}>智能 ¥{spec.detailValue}
            <span style={{float:"right",fontSize:8}}>待兑现</span></div>
        </div>
        <div style={{...box(23,461,314,18),color:teal,opacity:finalUI}}>
          <div style={{height:11,fontSize:7}}>兑现智能价值<span style={{float:"right"}}>{Math.round(clamp((time-isolateAt-.96)/1.26)*91)}%</span></div>
          <div style={{height:1,background:"#accac048"}}><div style={{height:1,width:`${clamp((time-isolateAt-.96)/1.26)*92}%`,background:teal}}/></div>
        </div>
      </div>}
    </div>
  );
}

const video=(file:string)=>({source:root+file,sourceStart:0});
export const taskMatrixDemo: PortraitDemo = {
  fps:30,durationInFrames:290,
  reference:"晚点LatePost · BV1V9J46SEd9 · 275.76669–285.43331",
  spec:{
    intro:[video("task-intro-01.mp4"),video("task-intro-02.mp4"),video("task-intro-03.mp4")],
    introLabels:["刷墙 PAINT_WALL","切板 CUT_BOARD","剪蘑菇 TRIM_MUSHROOM"],
    tiles:["8.27","0.78","0.24","3.53","1.06","8.55","8.01","6.27","4.30","3.68","2.51","5.88"].map((value,index)=>
      ({video:video(`task-tile-${String(index+1).padStart(2,"0")}.mp4`),value})),
    detail:video("task-cup-demo.mp4"),sample:"SAMPLE No.0019 · 取杯子 REACH_CUP",
    laborRate:"0.33",detailValue:"?.??",
    matrix:{at:2.28},switchPrice:{at:3.88},isolate:{at:5.35},
  } satisfies TaskMatrixSpec,
};
