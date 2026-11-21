import {Img, useCurrentFrame, useVideoConfig} from "remotion";
import {asset, ease, type PortraitDemo} from "../../common";
import type {ResearchPaperSpec} from "./research-paper-contract";

const root="portrait-mg/latepost/document-batch/";
const serif="SimSun, 'Times New Roman', serif";
const full={position:"absolute" as const,inset:0};
const box=(x:number,y:number,width:number,height:number)=>({position:"absolute" as const,left:x,top:y,width,height});
const reveal=(t:number,at:number,len:number)=>ease((t-at)/len);

const sheets=[
  {x:-127,y:45,w:183,r:-28,s:22,brightness:.60,back:false},
  {x:63,y:-157,w:173,r:33,s:84,brightness:.67,back:true},
  {x:225,y:-74,w:144,r:-37,s:42,brightness:.57,back:false},
  {x:326,y:-31,w:192,r:-21,s:56,brightness:.73,back:true},
  {x:-71,y:387,w:143,r:-28,s:102,brightness:.49,back:true},
  {x:267,y:391,w:168,r:33,s:68,brightness:.62,back:true},
  {x:12,y:491,w:191,r:-56,s:71,brightness:.68,back:false},
  {x:219,y:530,w:172,r:34,s:29,brightness:.66,back:true},
] as const;

export function ResearchPaper({spec}: {spec:ResearchPaperSpec}) {
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const t=frame/fps;
  const chapter=reveal(t,spec.chapterReveal.at,.45);
  const paper=reveal(t,spec.paperReveal.at,.32);
  const paperRises=reveal(t,spec.paperReveal.at-.04,.64);
  const term=reveal(t,spec.termReveal.at,.46);
  const explain=reveal(t,spec.explanationReveal.at,.58);
  const conclusion=reveal(t,spec.conclusionReveal.at,.64);
  const termFade=1-.55*explain;
  const docX=64+249*term;
  const amount=1-paper;

  return <div style={{...full,overflow:"hidden",background:"linear-gradient(#000 21%,#151314 48%,#676568 100%)"}}>
    {amount>0 && <div style={{...full,overflow:"hidden",opacity:amount,background:"#060606",transform:`perspective(480px) translateY(${27*chapter}px) scale(${1+.16*chapter})`}}>
      {sheets.map((item,index)=>{
        const motion=(t/Math.max(1,spec.paperReveal.at));
        const move=Math.sin(motion*1.5+index*.6);
        const turn=item.r+11*move;
        const diagonal=item.s/4*move;
        return <Img key={index} src={asset(item.back?spec.insidePage:spec.frontPage)}
          style={{...box(item.x+diagonal,item.y-35*motion,item.w,item.w*1.35),objectFit:"cover",
            transform:`perspective(460px) rotateZ(${turn}deg) rotateY(${32+14*move}deg) rotateX(${12+22*move}deg)`,
            filter:`grayscale(1) brightness(${item.brightness})`,boxShadow:"0 6px 17px #000b"}}/>;
      })}
      <div style={{...box(36-23*chapter,156+52*chapter,274+55*chapter,344+65*chapter),
        transform:`perspective(480px) rotateZ(${-12+5*chapter}deg) rotateY(${-9+4*chapter}deg) rotateX(${12*chapter}deg)`,
        filter:"grayscale(1) brightness(.77)",boxShadow:"0 14px 38px #000b"}}>
        <Img src={asset(spec.frontPage)} style={{...full,width:"100%",height:"100%",objectFit:"fill"}}/>
        <div style={{...full,background:"linear-gradient(142deg,#3e41445e,transparent 35%,transparent 72%,#dedbdb8c)",
          clipPath:"polygon(0 0,100% 0,84% 38%,94% 63%,79% 100%,0 100%)"}}/>
      </div>
    </div>}
    {chapter>0&&paper<1&&<div style={{...box(18,105,324,111),textAlign:"center",fontFamily:serif,whiteSpace:"nowrap",opacity:1-paper}}>
      <div style={{fontSize:24,fontStyle:"italic",fontWeight:750,color:"#d71413",opacity:chapter}}>Part 3</div>
      <div style={{fontSize:53,fontWeight:900,letterSpacing:1,color:"#fff",transform:"scaleX(.78)",lineHeight:1.05,
        clipPath:`inset(0 ${100*(1-chapter)}% 0 0)`}}>{spec.chapter}</div>
    </div>}
    {paperRises>0&&term<1&&<div style={{...full,opacity:paper*(1-.55*term),transform:`translate(${docX-64}px,${447*(1-paperRises)}px)`}}>
      <Img src={asset(spec.insidePage)} style={{...box(32,109,251,370),objectFit:"fill",filter:"grayscale(1)",boxShadow:"0 11px 23px #000a"}}/>
      <Img src={asset(spec.frontPage)} style={{...box(64,113,258,368),objectFit:"fill",filter:"grayscale(1)",boxShadow:"0 8px 18px #0008"}}/>
      <div style={{...box(64,113,258,368),background:"linear-gradient(transparent 70%,#39383756 100%)"}}/>
      <div style={{...box(177,253,156,112),background:"#ff150c",opacity:reveal(t,spec.paperReveal.at+.32,.24),
        transform:`translateX(${21*(1-paperRises)}px)`,fontFamily:serif,whiteSpace:"nowrap",overflow:"hidden",display:"grid",
        justifyItems:"start",alignContent:"center",paddingLeft:9}}>
        <div style={{fontSize:21,fontWeight:800,color:"#090402",transform:"scaleX(.9)",transformOrigin:"left center"}}>{spec.author}</div>
        <div style={{fontSize:16,fontWeight:800,color:"#fef6f0",transform:"scaleX(.83)",transformOrigin:"left center"}}>《{spec.paperTitle}》</div>
        <div style={{fontSize:10,color:"#ffbbb1",transform:"scaleX(.78)",transformOrigin:"left center"}}>{spec.paperOriginalTitle}</div>
      </div>
    </div>}
    {term>0&&<div style={{...full,opacity:term,transform:`translateX(${(1-term)*-85}px)`}}>
      <Img src={asset(spec.frontPage)} style={{...box(37,157,292,321),
        objectFit:"fill",filter:`invert(1) grayscale(1) blur(${1.1*explain}px)`,opacity:.47-.27*explain}}/>
      <div style={{...box(37,200,292,279),opacity:explain*.85,background:"linear-gradient(transparent,#3b393a)"}}/>
      <div style={{...box(28,120,309,52),color:"#c81411",fontFamily:"'Times New Roman',serif",fontSize:31,fontStyle:"italic",fontWeight:900,
        lineHeight:1,whiteSpace:"nowrap",textAlign:"center",opacity:termFade,
        clipPath:`inset(0 ${100*(1-term)}% 0 0)`}}>
        <span style={{display:"inline-block",transform:"scaleX(.78)"}}>{spec.englishTerm}</span>
      </div>
      <div style={{...box(27,147,310,73),color:"#f3f1ef",fontFamily:serif,fontSize:53,fontWeight:900,whiteSpace:"nowrap",
        textAlign:"center",opacity:termFade,clipPath:`inset(0 ${100*(1-term)}% 0 0)`}}>
        <span style={{display:"inline-block",transform:"scaleX(.68)"}}>“{spec.term}”</span>
      </div>
      <div style={{...box(39,205,289,4),background:"#da1211",opacity:term*(1-explain),transform:`translateX(${132*term}px) scaleX(.22)`,transformOrigin:"left center"}}/>
      <div style={{...box(43,294-28*conclusion,280,74),color:"#ea0b0b",fontFamily:serif,lineHeight:1.08,textAlign:"center",
        fontSize:32,fontWeight:900,opacity:explain}}>
        {spec.explanation.map((line,index)=><div key={index} style={{whiteSpace:"nowrap",
          clipPath:`inset(0 ${100*(1-reveal(t,spec.explanationReveal.at+index*.19,.41))}% 0 0)`}}>
          <span style={{display:"inline-block",transform:"scaleX(.77)"}}>{line}</span>
        </div>)}
      </div>
      <div style={{...box(41,359,281,72),color:"#f9f7f5",fontFamily:serif,lineHeight:1.17,textAlign:"center",
        transform:"scaleX(.85)",fontSize:23,fontWeight:740,opacity:conclusion}}>
        {spec.conclusion.map((line,index)=><div key={index} style={{whiteSpace:"nowrap",
          clipPath:`inset(0 ${100*(1-reveal(t,spec.conclusionReveal.at+index*.15,.46))}% 0 0)`}}>{line}</div>)}
      </div>
    </div>}
  </div>;
}

export const researchPaperDemo: PortraitDemo = {
  fps:30,durationInFrames:612,
  reference:"晚点LatePost · BV1Dquj6sEhJ · 256.83438–277.23438",
  spec:{
    frontPage:root+"competition-front.jpg",insidePage:root+"competition-inside.jpg",
    chapter:"合法性的考题",englishTerm:"competitive bottlenecks",term:"竞争性瓶颈",
    author:"Mark Armstrong",paperTitle:"双边市场中的竞争",paperOriginalTitle:"Competition in Two-Sided Markets",
    explanation:["消费者只用一个平台","供给方入驻所有平台"],
    conclusion:["平台之间争夺消费者，","较少顾及供给方压力。"],
    chapterReveal:{at:2.54},paperReveal:{at:4.86},termReveal:{at:9.87},
    explanationReveal:{at:11.93},conclusionReveal:{at:16.2},
  } satisfies ResearchPaperSpec,
};
