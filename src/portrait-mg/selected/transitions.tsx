import type {ReactNode} from "react";
import {asset, clamp} from "../common";
import {abs, brush, Caption, Clip, Face, lerp, outline, Panel, polygon, redVertical,
  RollNumber, seed, Still, useScene, type SceneProps, type SelectedSpec} from "./stage";

function Flare({strength}: {strength: number}) {
  return <Panel style={{opacity:strength,background:
    "radial-gradient(ellipse 73px 131px at 50% 46%,#efffff 0%,#a7cdfd 15%,#4c6cf794 45%,transparent 85%),"+
    "radial-gradient(ellipse 244px 26px at 50% 46%,#aeecff 4%,#6098fe98 28%,transparent 87%)",mixBlendMode:"screen"}}/>;
}

function ImageTitle({spec, color}: {spec: SelectedSpec; color?: string}) {
  return <Panel r={[49,210,262,150]}>
    <Still entry={spec.picture}/>
    <Caption r={[4,27,254,90]} size={58} style={{fontStyle:"italic",color:color??"#ffda73",fontFamily:brush,
      textShadow:"2px 2px 0 #473110,0 0 14px #d0a009aa",transform:"skew(-8deg)"}}>{spec.title.text}</Caption>
  </Panel>;
}

function Shards({p, mode, children}: {p: number; mode: "image" | "word"; children: ReactNode}) {
  const cols=mode==="image"?6:5, rows=mode==="image"?4:3;
  return <Panel style={{pointerEvents:"none"}}>
    {Array.from({length:cols*rows},(_,i)=>{
      const col=i%cols,row=Math.floor(i/cols);
      const x0=col*100/cols, x1=(col+1)*100/cols, y0=row*100/rows,y1=(row+1)*100/rows;
      const center=[lerp(x0,x1,.15+.7*seed(i+18)),lerp(y0,y1,.16+.67*seed(i+39))] as const;
      const corners=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]] as const;
      return corners.map((point,j)=>{
        const n=41+i*4+j, side=(col+.5-cols/2)/cols;
        const dx=(side*222+(seed(n)-.5)*122)*p;
        const dy=(seed(n+61)-.53)*204*p + p*p*96;
        return <div key={n} style={{...abs,opacity:1-Math.pow(p,.84),transform:"translate("+dx+"px,"+dy+"px) rotate("+
          (p*(seed(n+99)-.5)*106)+"deg) scale("+lerp(1,.73,p)+")"}}>
          <div style={{...abs,clipPath:polygon([point,corners[(j+1)%4],center])}}>{children}</div>
        </div>;
      });
    })}
  </Panel>;
}

export function ChromaticBreak({spec}: SceneProps) {
  const s=useScene(spec), reveal=s.since(.05,.42), hit=s.progress("break",.48);
  const chroma=s.progress("break",.12,-.055)*(1-s.progress("break",.16,.08));
  return <>
    {spec.background && <Clip id="V21_003" slot="background" spec={spec} style={{filter:"blur(2px) brightness(.84)",transform:"scale(1.025)"}}/>}
    <Panel style={{background:"radial-gradient(ellipse at 50% 44%,#303d88,#111729 37%,#101317 72%)",opacity:clamp(reveal+.21)*(spec.background?.source ? .48 : 1)}}/>
    <Flare strength={(Math.sin(reveal*Math.PI)*.68+.32*reveal)*(1-hit)+.87*hit}/>
    {hit===0?<Panel style={{opacity:reveal,transform:"scale("+lerp(.87,1,reveal)+")"}}>
      <ImageTitle spec={spec}/>
    </Panel>:hit<1&&<Shards p={hit} mode="image"><ImageTitle spec={spec}/></Shards>}
    {chroma>0&&["#38f7ff","#fa8b29"].map((color,i)=><Panel key={color} style={{opacity:chroma*.62,
      transform:"translate("+((i?1:-1)*13*chroma)+"px,"+(i?-7:4)*chroma+"px) scale("+lerp(1,1.1,chroma)+")",
      filter:"saturate(5) hue-rotate("+(i?57:267)+"deg)",mixBlendMode:"screen"}}><ImageTitle spec={spec} color={color}/></Panel>)}
    <Panel style={{background:"#ddecff",opacity:chroma*.57}}/>
  </>;
}

function Circuit({time}: {time: number}) {
  return <svg width={360} height={640} style={{...abs, mixBlendMode:"screen"}}>
    {Array.from({length:21},(_,i)=>{
      const x=Math.round(seed(i+19)*17)*21, y=Math.round(seed(i+64)*28)*23, h=23*(2+Math.round(seed(i+91)*8));
      return <g key={i} fill="none" stroke={i%4===0?"#40d8fb":"#5295ff"} opacity={(i%4===0?.51:.29)+.14*Math.sin(time*6+i)}>
        <path d={"M "+x+" "+y+" v "+h+" h "+(i%2?55:-68)+" v -36"} strokeWidth={i%5===0?1.25:.66}/>
        <rect x={x-3} y={y-3} width="6" height="6" strokeWidth=".65"/>
      </g>;
    })}
  </svg>;
}

export function WindowPercentRoll({spec}: SceneProps) {
  const id="V22_001", s=useScene(spec), intro=s.progress("clip",.35), grow=s.progress("subject",.45), number=s.progress("ratio",.62);
  return <>
    <Clip id={id} slot="background" spec={spec} style={{filter:"brightness(.64) saturate(.76)"}}/>
    <Circuit time={s.time}/>
    <Panel r={[34,325,292,204]} style={{border:"1px solid #469acc",overflow:"hidden",boxShadow:"0 0 11px #37b6ff5e",
      background:"#07456e",opacity:intro*(1-grow),transform:"scale("+lerp(.76,1,intro)+")"}}>
      <Still entry={spec.clip} style={{objectPosition:"center 60%"}}/>
      <div style={{...abs,background:"linear-gradient(#076aa0ab,transparent 70%)"}}/>
      <Caption r={[8,9,272,61]} size={45} style={{fontStyle:"italic"}}>{s.title("title")}</Caption>
    </Panel>
    <Panel r={[lerp(48,-35,grow),lerp(373,176,grow),lerp(267,430,grow),lerp(142,470,grow)]}
      style={{opacity:clamp(grow*3),filter:"drop-shadow(0 0 3px #c9e7f8)"}}>
      <Still entry={spec.subject} style={{objectFit:"contain",objectPosition:"center bottom"}}/>
    </Panel>
    <RollNumber r={[18,158,324,118]} value={s.title("ratio")} progress={number}/>
  </>;
}

export function YearSilhouette({spec}: SceneProps) {
  const id="V27_001", s=useScene(spec), person=s.progress("person",.5), year=s.title("year");
  return <>
    <Clip id={id} spec={spec} slot="background" style={{filter:"brightness(.62) sepia(.21) contrast(1.07)"}}/>
    <Caption r={[17,106,326,98]} size={82} style={{letterSpacing:"-.02em"}}>
      {[...year].map((digit,i)=>{
        const p=s.progress("year",.31,i*.035);
        return <span key={i} style={{display:"inline-block",opacity:p,transform:"translate("+
          (1-p)*(i-1.5)*20+"px,"+lerp(i%2?44:-39,0,p)+"px)",filter:"blur("+lerp(7,0,p)+"px)"}}>{digit}</span>;
      })}
    </Caption>
    {["left","right"].map((key,i)=>{
      const h=s.progress(key,.48);
      return <Panel key={key} r={[i?221:43,218,94,132]} style={{opacity:h,transform:"perspective(350px) translate("+
        lerp(i?-71:65,0,h)+"px,"+lerp(105,0,h)+"px) rotateY("+lerp(i?54:-54,i?-9:9,h)+"deg)",
        background:i?"#2c6cbc":"#c4a559",border:"1px solid #efdfbf",overflow:"hidden",boxShadow:"0 3px 6px #000a"}}>
        <Still entry={spec[key]} style={{mixBlendMode:"luminosity"}}/>
        <div style={{...abs,background:"linear-gradient(135deg,#0004,transparent,#0007)"}}/>
        <Caption r={[15,6,63,116]} size={20} style={{writingMode:"vertical-rl",letterSpacing:".16em"}}>{s.title(key+"Label")}</Caption>
      </Panel>;
    })}
    <Panel r={[57,208,246,330]} style={{opacity:person,transform:"translateY("+lerp(155,0,person)+"px)"}}>
      <svg viewBox="0 0 246 330" width="246" height="330" style={abs}>
        <path d="M4 89 L242 89 L123 301 Z" fill="#080b2040" stroke="#fff3c8" strokeOpacity=".7" strokeWidth="3"
          style={{filter:"drop-shadow(0 0 7px #ffc370)"}}/>
      </svg>
      <Panel r={[32,0,185,298]} style={{filter:"drop-shadow(0 0 2px #e7f0ff) drop-shadow(0 0 5px #6481b1)"}}>
        <Still entry={spec.person} style={{objectFit:"contain",objectPosition:"center bottom",filter:"brightness(.12) sepia(.6) hue-rotate(174deg)"}}/>
      </Panel>
      <svg viewBox="0 0 246 330" width="246" height="330" style={abs}>
        <path d="M4 89 L123 301 L242 89" fill="none" stroke="#fff1cd" strokeWidth="2.8" style={{filter:"drop-shadow(0 0 5px #ffd184)"}}/>
      </svg>
      <Caption r={[88,81,72,169]} size={28} style={{writingMode:"vertical-rl",letterSpacing:".28em"}}>{s.title("label")}</Caption>
    </Panel>
  </>;
}

export function YearDataWindows({spec}: SceneProps) {
  const id="V27_003", s=useScene(spec), upper=s.progress("upper",.42), lower=s.progress("lower",.43);
  const rim = (base: number, direction: number) => Array.from({length:72},(_,i)=>{
    const x=i*100/71;
    const step=clamp((x-21)/28)*14+clamp((x-74)/18)*18;
    return [x,base-step*direction+1.3*Math.sin(x*.47)+(seed(i+429)-.5)*1.15] as const;
  });
  const upperEdge=rim(45,1), lowerEdge=rim(26,1);
  const cap=[[0,0],[100,0]] as const, bottom=[[100,100],[0,100]] as const;
  const edgeMask=(points: typeof upperEdge, shift: number)=>points.map(([x,y])=>[x,y+shift] as const);
  return <>
    <Clip id={id} spec={spec} slot="background" style={{filter:"brightness(.39) saturate(.39)"}}/>
    <Caption r={[15,287,330,83]} size={48} style={{opacity:s.since(.13,.31)}}>{s.title("title")}</Caption>
    <Panel r={[0,lerp(-340,0,upper),360,640]}>
      <div style={{...abs,background:"#f0ede7",clipPath:polygon([...cap,...[...upperEdge].reverse()])}}/>
      <div style={{...abs,clipPath:polygon([...cap,...edgeMask(upperEdge,-1.27).reverse()])}}>
        <Clip id={id} spec={spec} slot="upper" style={{height:285,objectPosition:"center 38%"}}/>
      </div>
      <Caption r={[12,125,247,78]} size={38} style={{fontStyle:"italic",transform:"rotate(-7deg) skew(-7deg)",letterSpacing:".07em",opacity:upper}}>{s.title("upperLabel")}</Caption>
    </Panel>
    <Panel r={[0,lerp(660,279,lower),360,640]}>
      <div style={{...abs,background:"#f1eae2",clipPath:polygon([...lowerEdge,...bottom])}}/>
      <div style={{...abs,clipPath:polygon([...edgeMask(lowerEdge,1.27),...bottom])}}>
        <Clip id={id} spec={spec} slot="lower" style={{height:370,objectPosition:"center"}}/>
      </div>
      <Caption r={[97,124,255,74]} size={38} style={{fontStyle:"italic",transform:"rotate(-7deg) skew(-7deg)",letterSpacing:".06em",opacity:lower}}>{s.title("lowerLabel")}</Caption>
    </Panel>
  </>;
}

export function DocumentHighlight({spec}: SceneProps) {
  const id="V28_004", s=useScene(spec), rise=s.progress("document",.42), focus=s.progress("focus",.55), mark=s.progress("highlight",.63);
  const target=spec.target!;
  const documentAspect = spec._documentAspect ?? 796/2060;
  const finalWidth=Math.min(1620,Math.max(590,202/target.width));
  const w=lerp(274,finalWidth,focus), h=w/documentAspect;
  const x=lerp(380-353*rise,180-(target.x+target.width*.5)*w,focus);
  const y=lerp(156-91*rise,330-(target.y+target.height*.5)*h,focus);
  return <>
    <Clip id={id} spec={spec} slot="background" style={{filter:"blur("+rise*3+"px) brightness("+lerp(.94,.61,rise)+")"}}/>
    <Panel r={[x,y,w,h]} style={{background:"#fff",boxShadow:"0 4px 14px #000a",opacity:rise}}>
      <Still entry={spec.document} style={{objectFit:"fill"}}/>
      <Panel r={[target.x*w,target.y*h,target.width*w*mark,target.height*h]}
        style={{background:"#f8729f91",mixBlendMode:"multiply"}}/>
    </Panel>
  </>;
}

const roundPoints=Array.from({length:96},(_,i)=>{
  const angle=i/96*Math.PI*2, radius=48.3+seed(i+50)*1.5;
  return [50+Math.cos(angle)*radius,50+Math.sin(angle)*radius] as const;
});

export function TornCircleShatter({spec}: SceneProps) {
  const id="V29_001", s=useScene(spec), start=s.progress("first",.26), second=s.progress("second",.29);
  const shatter=s.progress("shatter",.52), montage=s.progress("top",.45), final=s.progress("finalClip",.48);
  const number=second>.01?s.title("second"):s.title("first");
  const stamp=(text:string)=> <Caption r={[51,252,258,105]} size={63}
    style={{fontFamily:brush,fontStyle:"italic",WebkitTextStroke:"2.1px #101111",paintOrder:"stroke fill",textShadow:"5px 6px #000",
      transform:"scale("+lerp(.64,1,Math.max(start,second))+")",opacity:start}}>{text}</Caption>;
  return <>
    <Panel style={{background:"radial-gradient(at 78% 32%,#503618,#0c0805 53%,#030303)"}}/>
    <Clip id={id} spec={spec} slot="background" style={{filter:"brightness(.73) saturate(1.16)"}}/>
    <Panel r={[52,127,254,356]} style={{opacity:1-montage,borderRadius:"50%",background:"#e8e2d9",clipPath:polygon(roundPoints),
      boxShadow:"0 0 33px #d8e0e2",transform:"rotate(-6deg) scale("+lerp(.96,1,start)+")"}}>
      <Panel r={[3,3,248,350]} style={{clipPath:polygon(roundPoints)}}>
        <Clip id={id} spec={spec} slot="circle" style={{transform:"rotate(6deg) scale(1.2)"}}/>
      </Panel>
    </Panel>
    <Panel r={[45,118,270,373]} style={{borderRadius:"50%",opacity:(.12+.22*Math.sin(s.time*3)**2)*(1-montage),
      boxShadow:"inset 0 0 21px 11px #eef8fe,0 0 16px #ebf4fa",filter:"blur(5px)"}}/>
    {shatter===0?stamp(number):shatter<1&&<Shards p={shatter} mode="word">{stamp(number)}</Shards>}
    <Panel r={[0,70,360,480]} style={{background:"linear-gradient(119deg,#995318,#5e061b 37%,#5a0b1c 73%,#23090e)",
      opacity:montage,clipPath:"polygon(0 "+(104-104*montage)+"%,100% "+(73-73*montage)+"%,100% 100%,0 100%)"}}/>
    {([
      ["top",[-16,70,192,129],0,-110,-29],
      ["right",[155,178,226,146],.1,155,29],
      ["bottom",[-13,325,203,146],.18,-137,56],
    ] as const).map(([slot,r,delay,dx,dy])=>{
      const p=s.progress("top",.38,delay);
      return <Face key={slot} r={r} id={id} spec={spec} slot={slot} style={{opacity:p,
        transform:"translate("+(1-p)*dx+"px,"+(1-p)*dy+"px)",borderRadius:27}}/>;
    })}
    <Panel r={[0,70,360,401]} style={{opacity:clamp(final*5),clipPath:"inset("+(1-final)*37+"% "+(1-final)*46+"% round "+(1-final)*33+"px)"}}>
      <Clip id={id} spec={spec} slot="finalClip"/>
    </Panel>
    <Panel r={[0,0,360,70]} style={{backgroundImage:"url("+asset("portrait-mg/selected/gold-masthead.png")+")",backgroundSize:"cover"}}/>
    <Panel r={[0,470,360,170]} style={{background:"#030302",borderTop:"2px solid #d8b978"}}/>
    <Caption r={[12,527,336,60]} size={29} style={{fontFamily:"Georgia, serif",fontWeight:400,fontStyle:"italic",color:"#b4a483ae",letterSpacing:".16em"}}>{s.title("signature")}</Caption>
  </>;
}

const edge = (center:number, lean:number, phase:number) => Array.from({length:62},(_,i)=>{
  const y=i*100/61;
  return [center+lean*(y-50)/100+4.2*Math.sin(y*.105+phase*.2)+(seed(i+phase)-.5)*2.6,y] as const;
});

export function SideTearsObject({spec}: SceneProps) {
  const id="V30_001", s=useScene(spec), split=s.progress("side",.47), object=s.progress("object",.51);
  const title=s.progress("title",.43), lift=s.progress("title",.5,.38);
  return <>
    <Clip id={id} spec={spec} slot="background" style={{filter:"blur(10px) saturate(1.29) brightness(.88)",transform:"scale(1.08)"}}/>
    {[false,true].map((right,i)=>{
      const line=edge(right?78:26,right?-49:-51,i*73);
      const ends=right?[[100,100],[100,0]] as const:[[0,100],[0,0]] as const;
      const inlay=line.map(([x,y])=>[x+(right? .85:-.85),y] as const);
      return <Panel key={i} style={{opacity:clamp(split*5),transform:"translateX("+(1-split)*(right?138:-138)+"px)"}}>
        <div style={{...abs,clipPath:polygon([...line,...ends]),background:"#f7e8e0"}}/>
        <div style={{...abs,clipPath:polygon([...inlay,...ends])}}>
          <Clip id={id} spec={spec} slot="side" style={{filter:"brightness(.91) contrast(1.09)"}}/>
        </div>
      </Panel>;
    })}
    <Panel r={[3,273,354,265]} style={{opacity:clamp(object*7),transform:"translateY("+lerp(317,0,object)+"px)",
      filter:"drop-shadow(0 2px 3px #fff9) drop-shadow(0 5px 5px #000b)"}}>
      <Still entry={spec.object} style={{objectFit:"contain",objectPosition:"center 75%"}}/>
    </Panel>
    <Panel r={[49,lerp(370,99,lift),262,80]} style={{opacity:title,overflow:"hidden",
      background:"linear-gradient(95deg,#2d1461,#423275 46%,#27595c)",border:"2px solid #b7dbd6",borderRadius:4,
      filter:"blur("+lerp(9,0,title)+"px)",boxShadow:"0 4px 8px #1c0d10ac",transform:"scaleX("+lerp(1.45,1,title)+")"}}>
      <Panel r={[7,6,242,66]} style={{border:"1px solid #d4dec658",borderRadius:5}}/>
      <Caption r={[3,4,252,67]} size={34} style={{fontFamily:brush}}>{s.title("title")}</Caption>
    </Panel>
  </>;
}

export function PresenterDiagonal({spec}: SceneProps) {
  const id="V31_001", s=useScene(spec), presenter=s.progress("presenter",.33), top=s.progress("upper",.38),
    lower=s.progress("upper",.37,.1), focus=s.progress("focus",.49), reset=s.since(s.end-.19,.13);
  return <>
    <Clip id={id} spec={spec} slot="background" style={{filter:"grayscale(1) brightness(.58) contrast(1.16)"}}/>
    <Panel style={{opacity:top*(1-focus)}}><Clip id={id} spec={spec} slot="backing" style={{filter:"grayscale(1) brightness(.58) sepia(1) hue-rotate(176deg) saturate(3)"}}/></Panel>
    <Panel style={{opacity:top*(1-focus)*.57,background:"repeating-linear-gradient(0deg,#14274b66 0px,#14274b66 2px,transparent 3px,transparent 13px)"}}/>
    <Face r={[112,55,253,177]} id={id} spec={spec} slot="upper" style={{opacity:top*(1-focus),transform:
      "translate("+lerp(159,0,top)+"px,-"+lerp(71,0,top)+"px) rotate(-3deg)",borderRadius:29}}/>
    <Caption r={[64,66,55,149]} size={30} style={{...redVertical,opacity:top*(1-focus)}}>{s.title("upperLabel")}</Caption>
    <Face r={[-12,260,274,204]} id={id} spec={spec} slot="lower" style={{opacity:lower*(1-focus),transform:
      "translate("+lerp(-178,0,lower)+"px,"+lerp(80,0,lower)+"px) rotate(2.4deg)",borderRadius:26}}/>
    <Caption r={[252,285,51,143]} size={30} style={{...redVertical,opacity:lower*(1-focus)}}>{s.title("lowerLabel")}</Caption>
    <Panel r={[lerp(202,8,focus),lerp(335,391,focus),158,324]} style={{
      opacity:presenter*(1-reset)*lerp(1,.48,focus),transform:"translateY("+lerp(210,0,presenter)+"px)",filter:outline}}>
      <Still entry={spec.presenter} style={{objectFit:"contain",objectPosition:"center bottom",filter:focus>.35?"sepia(.58) saturate(.5)":"none"}}/>
    </Panel>
    <Face r={[lerp(148,45,focus),lerp(311,184,focus),lerp(206,292,focus),lerp(130,244,focus)]} id={id} spec={spec} slot="focus"
      style={{opacity:focus*(1-reset),borderRadius:22}} videoStyle={{filter:"sepia(1) hue-rotate(171deg) saturate(2.9) contrast(1.23)"}}/>
    <Caption r={[42,254,291,108]} size={76} style={{fontFamily:brush,color:"#c61817",opacity:focus*(1-reset)}}>{s.title("focusLabel")}</Caption>
  </>;
}
