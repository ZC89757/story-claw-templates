import {clamp} from "../common";
import {abs, Caption, Clip, lerp, Panel, useScene, type SceneProps, type SelectedSpec} from "./stage";

const id = "opening_layered";
const windowShape = "polygon(0 0,91% 0,100% 21%,100% 100%,9% 100%,0 78%)";
const branches = [
  {slot:"first", label:"firstLabel", x:22, y:348, tilt:-3, accent:"#f0cd87", shadow:"#ffd889"},
  {slot:"second", label:"secondLabel", x:111, y:462, tilt:3, accent:"#8be4ff", shadow:"#44caff"},
] as const;

function OpeningWindow({branch, p, travel, spec}: {
  branch: typeof branches[number]; p: number; travel: number; spec: SelectedSpec;
}) {
  const {slot, label, x, y, tilt, accent, shadow} = branch;
  const direction = x < 50 ? -1 : 1;
  return <Panel r={[x,y,226,128]} style={{
    transform:"translate("+(1-p)*direction*63+"px,"+(27*(1-p)+travel)+"px) rotate("+tilt+"deg)",
    opacity:clamp(p*4), filter:"drop-shadow(0 10px 10px #050d17bd)",
  }}>
    <div style={{...abs,clipPath:"inset(0 "+(100*(1-p))+"% 0 0)"}}>
      <div style={{...abs,clipPath:windowShape,background:"#0b1625"}}>
        <Clip id={id} slot={slot} spec={spec} style={{transform:"scale("+lerp(1.1,1.02,p)+")",filter:"saturate(.88) contrast(1.04)"}}/>
        <div style={{...abs,background:"linear-gradient(180deg,transparent 40%,#050d18e8 100%)"}}/>
        <div style={{position:"absolute",inset:0,opacity:Math.sin(Math.PI*p)*.52,
          background:"linear-gradient(106deg,transparent 38%,#efffffba 50%,transparent 62%)",
          transform:"translateX("+lerp(-230,230,p)+"px)",mixBlendMode:"screen"}}/>
      </div>
      <svg width="226" height="128" style={abs} aria-hidden="true">
        <path d="M1 1H206L225 27V127H20L1 101Z" fill="none" stroke={accent} strokeWidth="1" opacity=".75"/>
        <path d="M1 26V1H46M181 127H225V110" fill="none" stroke={accent} strokeWidth="2.5"/>
      </svg>
      <Panel r={[15,slot === "first" ? 82 : 94,180,25]} style={{display:"flex",alignItems:"center",gap:8,color:"#fff",
        font:'800 17px/1 "Selected Noto", "Microsoft YaHei", sans-serif',letterSpacing:1.5,textShadow:"0 1px 4px #000"}}>
        <i style={{width:4,height:13,background:accent,boxShadow:"0 0 5px "+shadow}}/>
        {spec[label].text}
      </Panel>
    </div>
  </Panel>;
}

function TitleFrame({arrival, time}: {arrival: number; time: number}) {
  const sweep = clamp(time / .52);
  return <svg width="360" height="136" viewBox="0 0 360 136" style={abs} aria-hidden="true">
    <path d="M19 97V33L36 16H286L337 66V103L322 119H70L58 107H19" fill="#0b1728"
      fillOpacity={.42+.2*arrival} stroke="#b4d4e765" strokeWidth="1"/>
    <path d="M19 79V33L36 16H124M246 119H322L337 103V85" fill="none"
      stroke="#ffe1a1" strokeWidth="1.7" opacity={.36+.6*arrival}/>
    <path d="M288 16L308 36H340M20 119H45L56 130H211" fill="none" stroke="#82dfff" strokeWidth="1" opacity=".63"/>
    <path d="M25 19H64M306 123H331" stroke="#f7deac" strokeWidth="1" opacity=".52"/>
    <path d="M24 110H335" pathLength="1" stroke="#fff0c5" strokeWidth="1.65" strokeDasharray=".16 1"
      strokeDashoffset={-sweep*.99} opacity={Math.sin(Math.PI*sweep)}
      style={{filter:"drop-shadow(0 0 4px #ffe9a7)"}}/>
  </svg>;
}

export function LayeredOpening({spec}: SceneProps) {
  const s = useScene(spec);
  const intro = s.since(0,.38);
  const title = s.progress("title",.24);
  const lift = s.progress("first",.49);
  const lock = s.progress("second",.48);
  const toNext = s.since(s.end-.26,.26);
  const travel = lerp(0,-12,lock);
  const lastScan = s.progress("second",.53,.37);
  return <Panel style={{background:"#112842",overflow:"hidden"}}>
    <Clip id={id} slot="background" spec={spec} style={{
      filter:"brightness("+lerp(1.02,.86,lift)+") saturate(1.12) contrast(1.03)",
      transform:"scale("+(lerp(1.10,1.025,intro)+s.time*.013)+" ) translateY(" + (-8*lift) + "px)",
      transformOrigin:"50% 31%",
    }}/>
    <Panel style={{background:"linear-gradient(180deg,#0b26454f 0%,transparent 37%,#0c203435 52%,#091625b8 82%,#060d1fdf)"}}/>
    <svg width="360" height="640" style={{...abs, pointerEvents:"none"}} aria-hidden="true">
      <path d="M0 177L152 23H360V0H0Z" fill="#155271" opacity=".18"/>
      <path d="M360 638H119L360 402Z" fill="#b95f32" opacity=".17"/>
      <path d="M0 591L214 379H360M0 201L108 93H139M327 640L360 608" fill="none" stroke="#8ad5e9" strokeOpacity=".26"/>
      <path d="M19 181V39L36 22H108M250 618H324L342 600V562" fill="none" stroke="#e3f4f6" strokeOpacity=".62"/>
      <path d="M19 77V39L36 22H70M308 618H324L342 600V583" fill="none" stroke="#eefaef" strokeWidth="2" opacity=".82"/>
      <path d="M0 250L255 0M105 640L360 390" stroke="#d6ffff" strokeWidth=".7" opacity=".23"/>
      <path d="M0 344L100 244M291 221L360 152" stroke="#89dce9" strokeWidth="2" opacity={.65-.32*intro}/>
      <path d="M246 54H332V121M38 550V595H86" fill="none" stroke="#b7e5ef" strokeDasharray="3 5" strokeOpacity=".37"/>
    </svg>
    <Panel style={{...abs,opacity:(1-intro)*.24,mixBlendMode:"screen",
      transform:"translateX("+lerp(-261,295,intro)+"px)",
      background:"linear-gradient(132deg,transparent 39%,#eafcff 48%,#9eecff56 52%,transparent 61%)"}}/>
    <Panel r={[0,lerp(236,199,lift)+travel,360,136]} style={{
      opacity:clamp(title*4.5),transform:"scale("+lerp(1.06,1,title)+")",
    }}>
      <TitleFrame arrival={title} time={Math.max(0,s.time-s.at("title"))}/>
      <Caption r={[25,22,306,92]} size={46} style={{
        color:"#fff8e8", letterSpacing:1, textShadow:"0 4px 12px #02070f, 0 1px 0 #dac99a",
        clipPath:"inset(0 "+(100*(1-title))+"% 0 0)",
      }}>{s.title("title")}</Caption>
    </Panel>
    {branches.map(branch=>
      <OpeningWindow key={branch.slot} branch={branch} travel={travel} spec={spec} p={s.progress(branch.slot,.43)}/>)}
    <Panel style={{...abs,opacity:Math.sin(Math.PI*lastScan)*.34,mixBlendMode:"screen",
      background:"linear-gradient(130deg,transparent 45%,#d8f8ff 50%,transparent 55%)",
      transform:"translateX("+lerp(-325,315,lastScan)+"px)"}}/>
    <Panel style={{...abs,background:"linear-gradient(129deg,transparent 48%,#2e7590bd 49%,#a4dfedc7 51%,transparent 53%)",
      opacity:Math.sin(toNext*Math.PI)*.44,transform:"translateX("+lerp(-320,345,toNext)+"px)",pointerEvents:"none"}}/>
  </Panel>;
}
