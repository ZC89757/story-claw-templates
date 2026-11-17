import {clamp} from "../common";
import {abs, brush, Caption, Clip, Face, lerp, outline, Panel, redVertical, seed, Still, useScene, type SceneProps} from "./stage";

export function PosterComparison({spec}: SceneProps) {
  const s = useScene(spec), turn = s.since(0,.65), amount = s.progress("amount",.28);
  const curl = 100 * Math.pow(1-turn, .84);
  const paper = "polygon(0 0,100% 0,100% " + (100-curl) + "%," + (100-curl*.65) + "% " + (100-curl*.34) + "%,0 100%)";
  return <>
    <Panel r={[0,286,360,354]}><Clip id="V07_001" spec={spec} slot="background"/></Panel>
    <Panel r={[0,0,360,289]} style={{backgroundColor:"#111315",backgroundImage:
      "linear-gradient(#f4f2f43d 1px,transparent 1px),linear-gradient(90deg,#f4f2f43d 1px,transparent 1px)",backgroundSize:"38px 38px"}}>
      <div style={{...abs,clipPath:paper}}>
        <Still entry={spec.poster}/>
        <div style={{...abs,background:"linear-gradient(173deg,transparent 57%,#f8c8e6a0 86%,#fff3)"}}/>
        <div style={{...abs,opacity:1-turn,background:"linear-gradient(147deg,transparent 60%,#fffbc5 82%,#ad6a8f80)"}}/>
      </div>
    </Panel>
    <Caption r={[100,214,160,54]} size={42} style={{opacity:amount,transform:"scale("+lerp(.85,1,amount)+")",fontFamily:"Georgia, serif"}}>{s.title("amount")}</Caption>
    {[["left",25,"#09c4eb"],["right",254,"#de3798"]].map(([key,x,color],i)=>{
      const p=s.progress("amount",.35,.07+i*.04), r=Number(x);
      return <Panel key={key} r={[r,242,78,104]} style={{opacity:p,transform:"translateY("+lerp(28,0,p)+"px)"}}>
        <Panel r={[4,0,71,72]} style={{borderRadius:"50%",overflow:"hidden",background:String(color),border:"3px solid "+color}}>
          <Still entry={spec[String(key)]} style={{mixBlendMode:"luminosity"}}/>
        </Panel>
        <Caption r={[-17,64,112,42]} size={27}>{s.title(key+"Label")}</Caption>
      </Panel>;
    })}
  </>;
}

export function CircleRatio({spec}: SceneProps) {
  const id="V07_002", s=useScene(spec), hit=s.progress("ratio",.33), slide=s.progress("ratio",.34,.19);
  return <>
    <Panel style={{transform:"scale(1.05)",filter:"blur("+hit*5+"px)"}}><Clip id={id} slot="background" spec={spec}/></Panel>
    <svg width={360} height={640} style={{...abs,mixBlendMode:"screen",opacity:.66}}>
      {Array.from({length:30},(_,i)=>{
        const y=510+12*i-(s.time*160)%12, x=90+seed(i)*178, w=49+i*17;
        return <path key={i} d={"M "+(180-w)+" "+y+" Q "+x+" "+(y-62)+" "+(180+w)+" "+(y-230)}
          stroke={i%4===0?"#ff9e56":"#2d9ce3"} strokeWidth={i%3===0?1.8:.46} strokeOpacity={.25+seed(i+28)*.6} fill="none"/>;
      })}
    </svg>
    <Panel r={[102,302,248,89]} style={{clipPath:"inset(0 "+(100-slide*100)+"% 0 0)",transform:"skew(-7deg)",background:"linear-gradient(90deg,#70090d,#a61f1d 70%,#7a1713)"}}>
      <Caption r={[24,0,222,89]} size={51} style={{fontStyle:"italic",letterSpacing:".04em"}}>{s.title("ratio")}</Caption>
    </Panel>
    <Panel r={[17,246,151,151]} style={{borderRadius:"50%",overflow:"hidden",boxShadow:"0 2px 11px #0407108c",
      transform:"scale("+lerp(.38,1,hit)+")",opacity:hit}}><Still entry={spec.detail}/></Panel>
  </>;
}

export function TiltedPhotos({spec}: SceneProps) {
  const s=useScene(spec);
  return <>
    <Still entry={spec.background} style={{filter:"blur(10px) brightness(.47)",transform:"scale(1.08)"}}/>
    {([
      ["top",[0,-13,288,228],-2,-72,-22],
      ["lower",[119,273,263,281],9,142,49],
      ["center",[26,149,313,316],6,-16,83],
    ] as const).map(([key,r,angle,dx,dy])=>{
      const p=s.progress(key,.37);
      return <Panel key={key} r={r} style={{border:"2px solid #242424",boxShadow:"3px 8px 9px #000d",
        transform:"translate("+(1-p)*dx+"px,"+(1-p)*dy+"px) rotate("+(angle+(1-p)*-10)+"deg) scale("+lerp(.82,1,p)+")",opacity:p}}>
        <Still entry={spec[key]}/>
      </Panel>;
    })}
    <Panel style={{boxShadow:"inset 0 0 14px 5px #101111"}}/>
  </>;
}

export function ImageList({spec}: SceneProps) {
  const s=useScene(spec), id="V10_002";
  return <>
    <Clip id={id} slot="background" spec={spec} style={{filter:"brightness(.65)"}}/>
    {[1,2,3,4].map(i=>{
      const p=s.progress("image"+i,.31);
      return <Panel key={i} r={[34,25+(i-1)*142,292,130]} style={{overflow:"hidden",border:"2px solid #ffffff6a",borderRadius:8,
        boxShadow:"0 6px 10px #1e130b9c",opacity:p, transform:"perspective(400px) translateY("+lerp(70,0,p)+"px) rotateX("+lerp(-35,0,p)+"deg)"}}>
        <Still entry={spec["image"+i]} style={{filter:"brightness(.68) saturate(.65)"}}/>
        <div style={{...abs,background:"linear-gradient(160deg,#0028393c,transparent,#13191474)"}}/>
        <Caption r={[4,15,280,70]} size={46} style={{fontFamily:brush,fontStyle:"italic",letterSpacing:".06em"}}>{s.title("title"+i)}</Caption>
        <Caption r={[9,84,272,21]} size={11} style={{color:"#eae9dd",fontFamily:"Georgia, serif",fontStyle:"italic",letterSpacing:".09em"}}>{s.title("sub"+i)}</Caption>
      </Panel>;
    })}
  </>;
}

function Flourishes() {
  const ornament = "M 0 24 C 9 23 21 19 20 9 C 19 1 7 1 8 10 C 9 16 19 12 15 7 M 0 33 Q 14 27 13 21 M 0 3 Q 15 -4 32 0 M 0 19 Q 2 12 0 0 Q 10 2 17 0";
  return <svg style={abs} width={298} height={431} viewBox="0 0 298 431">
    <rect x="8" y="7" width="282" height="415" rx="10" fill="none" stroke="#f1ead2" strokeOpacity=".77"/>
    <rect x="11" y="10" width="276" height="409" rx="8" fill="none" stroke="#d1c6b7" strokeOpacity=".4"/>
    <g fill="none" stroke="#eee6d1" strokeWidth="1.3">
      {[["translate(12 12)"],["translate(286 12) scale(-1 1)"],["translate(12 418) scale(1 -1)"],["translate(286 418) scale(-1 -1)"]]
        .map(([transform])=><path key={transform} d={ornament} transform={transform}/>)}
      <path d="M118 49 Q132 44 140 51 Q143 47 149 40 Q156 48 159 51 Q168 44 180 49 M136 53 H162"/>
    </g>
  </svg>;
}

export function OrnateList({spec}: SceneProps) {
  const s=useScene(spec), p=s.progress("first",.54,-.23);
  const later=s.progress("second",.62)+s.progress("third",.62)+s.progress("fourth",.62);
  return <>
    <Panel style={{transform:"scale("+(1+p*.21)+") rotate("+(-p*8)+"deg)",filter:"blur("+p*3+"px) brightness("+lerp(1,.47,p)+")"}}>
      <Clip id="V10_003" slot="background" spec={spec}/>
    </Panel>
    <Panel r={[32,33,298,438]} style={{opacity:p,background:"linear-gradient(157deg,#0c0c0df8,#080809f8 70%,#171717)",borderRadius:11,
      boxShadow:"0 7px 23px #000d",transform:"perspective(680px) rotateY("+lerp(-49,0,p)+"deg) rotate("+lerp(-6,.6,p)+"deg)"}}>
      <Flourishes/>
      {["first","second","third","fourth"].map((key,i)=>{
        const hit=s.progress(key,.29);
        return <Panel key={key} r={[43,155+i*77-later*28,212,66]} style={{background:["#c7504d","#417b78","#92529f","#e64720"][i],
          clipPath:"polygon(2% 3%,99% 0,97% 100%,0% 95%)",opacity:hit,transform:"translateY("+lerp(22,0,hit)+"px) rotate("+[1,-1,1.6,-1.5][i]+"deg)"}}>
          <Caption r={[7,0,193,66]} size={31} style={{fontFamily:brush}}>{s.title(key)}</Caption>
        </Panel>;
      })}
    </Panel>
  </>;
}

export function TwoVideoProfiles({spec}: SceneProps) {
  const id="V11_005", s=useScene(spec), first=s.progress("first",.37), second=s.progress("second",.5);
  const y=lerp(301,77,second);
  return <>
    <Clip id={id} slot="background" spec={spec} style={{filter:"blur(10px) brightness(.56)",transform:"scale(1.14)"}}/>
    <Panel style={{background:"radial-gradient(ellipse at 50% 70%,transparent,#071433 85%),radial-gradient(circle,#9ea7e341 0.55px,transparent .9px)",
      backgroundSize:"auto,3px 3px",opacity:.61}}/>
    <Face r={[35,y,290,179]} id={id} slot="first" spec={spec} style={{opacity:first, transform:"scale("+lerp(.86,1,first)+")"}}/>
    <Caption r={[44,y+129,272,48]} size={24} style={{fontStyle:"italic",opacity:first}}>{s.title("firstLabel")}</Caption>
    <Face r={[35,lerp(365,256,second),290,179]} id={id} slot="second" spec={spec} style={{opacity:second}}/>
    <Caption r={[44,lerp(365,256,second)+129,272,48]} size={24} style={{fontStyle:"italic",opacity:second}}>{s.title("secondLabel")}</Caption>
  </>;
}

export function CutoutDiagonalPair({spec}: SceneProps) {
  const s=useScene(spec), id="V18_001", person=s.progress("person",.34), away=s.progress("upper",.31,-.33);
  const top=s.progress("upper",.37), lower=s.progress("lower",.45);
  return <>
    <Clip id={id} slot="background" spec={spec}/>
    <Clip id={id} slot="nextBackground" spec={spec}/>
    <Panel r={[157,174,210,475]} style={{opacity:person*(1-away),transform:"translate("+
      (lerp(81,0,person)+110*away)+"px,"+lerp(98,0,person)+"px)",filter:outline}}>
      <Still entry={spec.person} style={{objectFit:"contain",objectPosition:"right bottom"}}/>
    </Panel>
    <Caption r={[150,267,57,191]} size={31} style={{...redVertical,opacity:person*(1-away)}}>{s.title("personLabel")}</Caption>
    <Face r={[105,19,274,253]} id={id} slot="upper" spec={spec} style={{opacity:top,
      transform:"translate("+lerp(191,0,top)+"px,"+lerp(-79,0,top)+"px)",borderRadius:29}}/>
    <Caption r={[49,22,49,251]} size={38} style={{...redVertical,opacity:top,filter:"drop-shadow(0 0 1px #fff7)"}}>{s.title("upperLabel")}</Caption>
    <Face r={[-18,341,279,238]} id={id} slot="lower" spec={spec} style={{opacity:lower,
      transform:"translate("+lerp(-161,0,lower)+"px,"+lerp(72,0,lower)+"px)",borderRadius:29}}/>
    <Caption r={[265,337,58,239]} size={35} style={{...redVertical,opacity:clamp(lower*1.7)}}>{s.title("lowerLabel")}</Caption>
  </>;
}
