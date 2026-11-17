import {clamp} from "../common";
import {abs, brush, Caption, Clip, GoldFrame, lerp, outline, Panel, seed, SparkField, Squares, Still, Torn, useScene, type SceneProps} from "./stage";

export function CalloutObjects({spec}: SceneProps) {
  const id="V19_002", s=useScene(spec), p=s.progress("subject",.34);
  return <>
    <Clip id={id} slot="lead" spec={spec}/>
    <Clip id={id} slot="background" spec={spec} style={{filter:"brightness(.68) saturate(1.15)"}}/>
    <Panel r={[91,87,177,199]} style={{opacity:p,transform:"translateY("+lerp(82,0,p)+"px) scale("+lerp(.82,1,p)+")",
      background:"linear-gradient(120deg,#16364e,#1c7dad 46%,#112a40)",border:"3px double #a1d9ec",borderRadius:9,boxShadow:"0 0 21px #78e1ffb5"}}>
      <Panel r={[6,6,159,181]} style={{border:"1px solid #b6dbee77",borderRadius:6}}/>
      <Panel r={[33,19,111,122]}><Still entry={spec.subject} style={{objectFit:"contain",objectPosition:"center bottom",filter:"drop-shadow(0 1px 3px #9be9ff)"}}/></Panel>
      <Caption r={[3,117,166,66]} size={30} style={{fontFamily:brush}}>{s.title("label")}</Caption>
    </Panel>
    {(["left","middle","right"] as const).map((key,i)=>{
      const hit=s.progress(key,.36);
      return <Panel key={key} r={[36+98*i,299,93,166]} style={{opacity:hit,
        transform:"translateY("+lerp(184,0,hit)+"px) rotate("+[-8,-1,9][i]+"deg)",filter:"drop-shadow(0 3px 4px #1b0c16)"}}>
        <Still entry={spec[key]} style={{objectFit:"contain",objectPosition:"center bottom"}}/>
      </Panel>;
    })}
  </>;
}

export function PriorityCardShift({spec}: SceneProps) {
  const id="V19_003", s=useScene(spec), p=s.progress("third",.55), result=s.progress("result",.39);
  const cards=[
    {key:"first", color:"#246c92e8", x:lerp(108,42,p),y:lerp(120,116,p),size:lerp(150,136,p),angle:lerp(-9,-4,p),show:s.since(0,.34)},
    {key:"second", color:"#913632e8", x:lerp(83,190,p),y:lerp(171,122,p),size:lerp(177,126,p),angle:lerp(2,7,p),show:s.progress("second",.36)},
    {key:"third", color:"#652e9ce8", x:94,y:lerp(452,213,p),size:188,angle:lerp(6,-2,p),show:p},
  ];
  return <>
    <Clip id={id} spec={spec} slot="background" style={{filter:"brightness(.34) saturate(.52) blur(2px)"}}/>
    <Squares time={s.time}/>
    {cards.map(({key,color,x,y,size,angle,show})=>
      <Panel key={key} r={[x,y,size,size]} style={{background:"linear-gradient(140deg,"+color+",#141724)",border:"3px double #fff9",
        borderRadius:7,boxShadow:"0 7px 14px #000d",opacity:show,transform:"translateY("+lerp(51,0,show)+"px) rotate("+angle+"deg)"}}>
        <Panel r={[13,12,size-32,size*.59]} style={{clipPath:"polygon(3% 5%,94% 0,100% 96%,0 100%)",opacity:.92}}>
          <Still entry={spec[key]} style={{objectFit:"cover"}}/>
        </Panel>
        <Caption r={[0,size*.63,size-5,size*.3]} size={key==="third"?30:23} style={{fontFamily:brush}}>{s.title(key+"Label")}</Caption>
      </Panel>)}
    <Panel r={[103,423,159,72]} style={{opacity:result,transform:"translateY("+lerp(50,0,result)+"px) skew(-5deg)",
      border:"3px double #ecd176",background:"linear-gradient(123deg,#141515,#201906)",boxShadow:"0 0 12px #dbb74f75"}}>
      <Caption r={[1,0,151,67]} size={22} style={{fontStyle:"italic",color:"#fbe293",fontFamily:brush}}>{s.title("result")}</Caption>
    </Panel>
  </>;
}

export function SourcePie({spec}: SceneProps) {
  const id="V19_004", s=useScene(spec), source=s.progress("sourceLabel",.28), pie=s.progress("ratio",.65), result=s.progress("result",.32);
  const fill=Number.parseInt(s.title("ratio"),10);
  return <>
    <Clip id={id} slot="background" spec={spec} style={{filter:"brightness(.51)"}}/>
    <Panel style={{opacity:.45}}><Squares time={s.time*.58}/></Panel>
    <Panel r={[48,173,264,239]} style={{opacity:source,background:"linear-gradient(132deg,#172130b8,#2a578492)",borderRadius:14,
      border:"1px solid #c6d8eec2",boxShadow:"0 0 14px #829cff66",transform:"translateY("+lerp(28,0,source)+"px)"}}>
      <Panel r={[62,22,140,140]} style={{opacity:clamp(pie*4),borderRadius:"50%",
        background:"conic-gradient(#9bcfff "+(pie*fill)+"%,#fff 0 "+(pie*100)+"%,transparent 0)",
        filter:"drop-shadow(0 0 8px #abe6fe)"}}/>
      <Panel r={[11,174,241,61]} style={{opacity:result,transform:"translateY("+lerp(19,0,result)+"px)",
        background:"linear-gradient(110deg,#165779,#447cb8 50%,#246784)",border:"3px double #a3edff",
        boxShadow:"0 0 9px #52d7ff",borderRadius:10}}>
        <Caption r={[6,0,222,55]} size={17} style={{fontStyle:"italic",color:"#e9fbff"}}>{s.title("result")}</Caption>
      </Panel>
    </Panel>
    <Panel r={[86,96,188,66]} style={{opacity:source,background:"#fff",border:"1px solid #5554",borderRadius:9,
      transform:"translateY("+lerp(-24,0,source)+"px)",boxShadow:"0 3px 6px #0009"}}>
      <Caption r={[1,0,183,65]} size={36} style={{fontFamily:brush,color:"#a40917",textShadow:"none"}}>{s.title("sourceLabel")}</Caption>
    </Panel>
  </>;
}

function MetricSymbol({type}: {type: string}) {
  const paths:Record<string,string>={
    comment:"M 2 4 Q 2 1 5 1 H 17 Q 21 1 21 5 V 13 Q 21 16 17 16 H 11 L 5 20 V 16 Q 2 16 2 13 Z",
    save:"M 12 0 L 15 8 L 24 9 L 18 15 L 19 24 L 12 19 L 5 24 L 6 15 L 0 9 L 9 8 Z",
    share:"M 13 2 L 23 11 L 13 20 V 14 C 7 14 3 16 1 21 C 1 11 6 7 13 7 Z",
    like:"M 12 22 C 8 18 0 13 0 7 C 0 -1 8 -2 12 4 C 16 -2 24 -1 24 7 C 24 13 16 19 12 22 Z",
  };
  return <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><path d={paths[type]} fill={type==="like"?"#f3296f":"#fff"}/>
    {type==="comment" && [6,11,16].map(x=><circle key={x} cx={x} cy={8.5} r={1.1} fill="#333"/>)}
  </svg>;
}

export function InteractionsPanorama({spec}: SceneProps) {
  const id="V20_002", s=useScene(spec), rip=s.progress("comment",.55,-.19), like=s.progress("like",.39), lower=s.progress("lower",.57);
  return <>
    <Panel style={{background:"linear-gradient(142deg,#171009,#010101 40% 88%,#30220c)"}}/>
    <SparkField time={s.time}/>
    <Panel r={[lerp(13,0,rip),lerp(93,-15,rip),lerp(334,360,rip),lerp(464,357,rip)]} style={{overflow:"hidden",
      border: rip<.6?"1px solid #e2c879":"none"}}>
      <Torn r={[0,0,lerp(334,360,rip),lerp(498,382,rip)]} bottom={rip>.58}>
        <Clip id={id} slot="upper" spec={spec}/>
      </Torn>
    </Panel>
    <div style={{opacity:1-rip}}><GoldFrame signature={s.title("signature")}/></div>
    {["comment","save","share"].map((key,i)=>{
      const p=s.progress(key,.3)*(1-like);
      return <Caption key={key} r={[22+i*108,364,100,96]} size={24} style={{opacity:p,transform:"translateY("+lerp(21,0,p)+"px)",fontStyle:"italic"}}>
        <MetricSymbol type={key}/><br/>{s.title(key)}
      </Caption>;
    })}
    <Caption r={[80,363,200,93]} size={28} style={{opacity:like*(1-lower),transform:"scale("+lerp(.65,1,like)+")",fontStyle:"italic"}}>
      <MetricSymbol type="like"/><br/>{s.title("like")}
    </Caption>
    <Torn r={[-3,lerp(653,387,lower),314,254]} top bottom style={{opacity:lower}}>
      <Clip id={id} slot="lower" spec={spec}/>
    </Torn>
  </>;
}

export function EchoCollapse({spec}: SceneProps) {
  const id="V20_005", s=useScene(spec), converge=s.since(0,.42), close=s.progress("close",.39);
  const flicker=(1-converge)*(.68+.32*Math.sin(s.frame*1.7)**2);
  return <>
    <Panel style={{background:"radial-gradient(at 76% 60%,#231c1c,#090909 52%,#040404)"}}/>
    <Clip id={id} slot="background" spec={spec} style={{filter:"blur(2px) contrast(1.09)",transform:"scale(1.04)"}}/>
    {Array.from({length:6},(_,i)=><Panel key={i} r={[140,122,246,537]} style={{filter:"blur("+(3+i*1.5)+"px) brightness(1.9) "+outline,
      opacity:flicker*(.18+i*.027),transform:"translateX("+((1-converge)*(i-4)*48)+"px) scaleX("+(1+(1-converge)*(i-4)*.14)+")"}}>
      <Still entry={spec.subject} style={{objectFit:"contain",objectPosition:"center bottom"}}/>
    </Panel>)}
    <Panel r={[140,122,246,537]} style={{opacity:clamp(s.time*8),transform:"translateX("+lerp(-62,0,converge)+"px) scaleX("+lerp(1,.022,close)+")",
      filter:outline}}>
      <Still entry={spec.subject} style={{objectFit:"contain",objectPosition:"center bottom"}}/>
    </Panel>
    <Panel style={{background:"#ffede5",opacity:flicker*.25}}/>
  </>;
}

function WaveNet({time}: {time: number}) {
  const point=(x:number,y:number)=>{
    const wave=Math.sin(x*.034+y*.16-time*4);
    return [x,329+(y-14)*4.2+wave*(11+y*.59)+Math.cos(x*.016-time*2.6)*24];
  };
  return <svg width={360} height={640} style={abs}>
    {Array.from({length:27},(_,row)=><polyline key={row} points={Array.from({length:69},(_,col)=>point(col*5.5,row).join(",")).join(" ")}
      fill="none" stroke={row%6===0?"#b6dfff":"#537c9a"} strokeWidth={row%6===0?1.1:.44} opacity={.28+.29*seed(row+60)}/>)}
    {Array.from({length:69},(_,col)=><polyline key={col} points={Array.from({length:27},(_,row)=>point(col*5.5,row).join(",")).join(" ")}
      fill="none" stroke="#88b6e7" strokeWidth=".38" opacity=".32"/>)}
  </svg>;
}

export function StreakBadge({spec}: SceneProps) {
  const s=useScene(spec), streak=s.since(0,.44), badge=s.progress("label",.34);
  const bounce = Math.sin(Math.PI*badge*1.49)*13;
  return <>
    {spec.background && <Clip id="V21_001" slot="background" spec={spec} style={{filter:"blur(2px) brightness(.82)",transform:"scale(1.025)"}}/>}
    <Panel style={{background:"radial-gradient(ellipse at 50% 50%,#212932,#080c13 46%,#07080a)",opacity:spec.background?.source ? .42 : 1}}/>
    <WaveNet time={s.time}/>
    {Array.from({length:5},(_,i)=><Panel key={i} r={[24,257,312,208]} style={{
      opacity: i===4?clamp(streak*8):(.34-i*.046)*Math.sin(streak*Math.PI),
      transform:"translateX("+(lerp(-353,0,streak)-(4-i)*(1-streak)*40)+"px)",
      filter:i===4?"drop-shadow(0 6px 4px #000)":"blur("+(11-i*1.7)+"px) brightness(1.45)"}}>
      <Still entry={spec.object} style={{objectFit:"contain"}}/>
    </Panel>)}
    <Panel r={[102,68,178,178]} style={{borderRadius:"50%",border:"2px solid #ece5a9",opacity:clamp(badge*5),
      background:"repeating-linear-gradient(0deg,#3dc9ff0a 0px,#3dc9ff0a 1px,transparent 2px,transparent 4px), radial-gradient(circle at 50% 62%,#0379b3,#092c4c 51%,#090f1a)",
      boxShadow:"0 0 15px #fef2a461, inset 0 0 14px #4ba6df",transform:"translateY("+(lerp(-342,0,badge)+bounce*(1-badge))+"px)"}}>
      <svg width={174} height={174} viewBox="0 0 174 174" style={abs} aria-hidden="true">
        <g fill="none" stroke="#c9dded" strokeWidth="1" opacity=".82">
          <path d="M27 50 C34 44 53 53 64 45 Q74 37 87 48 Q101 37 110 45 C125 53 141 44 147 50 M34 52 Q25 52 28 48 M139 52 Q148 52 145 48 M43 54 H131 M35 124 H139 M74 124 Q82 117 87 125 Q92 117 100 124"/>
        </g>
      </svg>
      <Caption r={[8,31,157,104]} size={52} style={{fontStyle:"italic",textShadow:"2px 2px 0 #07375c,0 0 12px #0aa4f2"}}>{s.title("label")}</Caption>
    </Panel>
  </>;
}
