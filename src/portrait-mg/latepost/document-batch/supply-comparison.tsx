import {Img, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {asset, clamp, ease, type PortraitDemo} from "../../common";
import type {SupplyComparisonSpec} from "./contracts";

const root = "portrait-mg/latepost/document-batch/";
const sans = "'Microsoft YaHei',sans-serif";
const transitionTime = .25;
type Marker = {x: number; y: number; width: number; height: number; at: number};
type Strip = {table: string; width: number; height: number; top: number; left: number; markers: Marker[]};
type Logo = {source: string; x: number; y: number; width: number; height: number};
type Plate = {label: string; x?: number; labelY: number; labelSize: number; logos: Logo[]; strip: Strip};

function EvidenceStrip({time, strip}: {time: number; strip: Strip}) {
  const {left, top, width, height, markers, table} = strip;
  return (
    <div style={{position:"absolute", inset:0, overflow:"hidden"}}>
      <div style={{position:"absolute", left, top, width, height}}>
        {markers.map(({x,y,width:markWidth,height:markHeight,at}, index)=>{
          const reveal = ease((time-at)/.32);
          return <div key={index} style={{position:"absolute", left:x, top:y, width:markWidth*reveal, height:markHeight,
            background:"#ff211d", boxShadow:"0 0 2px #ec1815", opacity:clamp(reveal*2)}}/>;
        })}
        <Img src={asset(table)} style={{position:"absolute", inset:0, width:"100%", height:"100%"}}/>
      </div>
    </div>
  );
}

export function SupplyComparison({spec}: {spec: SupplyComparisonSpec}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame/fps;
  const {first,second,third} = spec;
  const next = ease((time-second.at)/transitionTime);
  const last = ease((time-third.at)/transitionTime);
  const firstMove = interpolate(time,[0,.4,.75,first.secondFocus.at,first.secondFocus.at+.55,second.at],
    [-54,-76,-93,-133,-208,-228],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  const secondMove = -20*Math.max(0,time-second.at);
  const productMove = -45 + clamp((time-third.firstTable.focus.at)/Math.max(.5,third.secondTable.focus.at-third.firstTable.focus.at))*45;
  const supplierMove = -39*(1-ease((time-third.secondTable.focus.at)/.45));
  const product = time < third.secondTable.focus.at;
  const firstEntry = ease((time+.12)/.47);
  const firstLogo: Logo = {source:first.logo,x:113,y:105,width:87,height:88};
  const secondLogos: Logo[] = [
    {source:second.leftLogo,x:86,y:125,width:80,height:74},
    {source:second.rightLogo,x:197,y:135,width:99,height:55},
  ];
  const thirdLogo: Logo = {source:third.logo,x:26,y:164,width:135,height:34};
  const states: [Plate,number][] = [
    [{label:first.label,x:119,labelY:195,labelSize:32,logos:[firstLogo],strip:{table:first.table,width:584,height:113,
      top:269,left:firstMove,markers:[
        {x:244,y:35,width:96,height:30,at:first.firstFocus.at},
        {x:444,y:43,width:107,height:30,at:first.secondFocus.at},
      ]}},(1-next)*firstEntry],
    [{label:second.label,x:93,labelY:208,labelSize:34,logos:secondLogos,strip:{table:second.table,width:390,height:112,
      top:270,left:secondMove,markers:[
        {x:94,y:34,width:96,height:44,at:second.firstFocus.at},
        {x:282,y:42,width:106,height:30,at:second.secondFocus.at},
      ]}},next*(1-last)],
    [{label:third.label,x:58,labelY:207,labelSize:34,logos:[thirdLogo],strip:product ? {
      table:third.firstTable.table,width:405,height:41,top:300,left:productMove,
      markers:[{x:157,y:14,width:115,height:18,at:third.firstTable.focus.at-.23}],
    } : {
      table:third.secondTable.table,width:399,height:41,top:300,left:supplierMove,
      markers:[{x:68,y:14,width:184,height:18,at:third.secondTable.focus.at-.28}],
    }},last*ease((time-third.firstTable.focus.at+.06)/.12)],
  ];

  return (
    <div style={{position:"absolute",inset:0,overflow:"hidden",background:"linear-gradient(#000 15%,#0b0809 32%,#373435 65%,#676568 100%)"}}>
      {states.map(([plate,opacity],index)=>opacity>0 && (
        <div key={index} style={{position:"absolute",inset:0,opacity}}>
          {plate.logos.map(({source,x,y,width,height},logoIndex)=><Img key={logoIndex} src={asset(source)}
            style={{position:"absolute",left:x,top:y,width,height,objectFit:"contain"}}/>)}
          <div style={{position:"absolute",left:plate.x,top:plate.labelY,whiteSpace:"nowrap",fontFamily:sans,
            fontSize:plate.labelSize,lineHeight:1.16,letterSpacing:1,color:"#f7f7f7",fontWeight:750}}>{plate.label}</div>
          <EvidenceStrip time={time} strip={plate.strip}/>
        </div>
      ))}
      <div style={{position:"absolute",left:20,top:400,width:320,textAlign:"center",color:"#ded9d9",fontFamily:sans,fontSize:9.2,
        lineHeight:"12px",whiteSpace:"nowrap",opacity:firstEntry}}>{spec.sourceNote}</div>
    </div>
  );
}

export const supplyComparisonDemo: PortraitDemo = {
  fps:30,
  durationInFrames:506,
  reference:"晚点LatePost · BV18ZeB62Eas · 159.40094–176.30106",
  spec:{
    first:{label:"小象 × 景源",logo:root+"mini-elephant.png",table:root+"supply-table-1.png",firstFocus:{at:4.85},secondFocus:{at:5.65}},
    second:{label:"盒马 × 今麦郎",leftLogo:root+"freshippo.png",rightLogo:root+"jml.png",table:root+"supply-table-2.png",at:8.72,
      firstFocus:{at:9.28},secondFocus:{at:9.85}},
    third:{label:"七鲜 × 靖宇修元",logo:root+"fresh7.png",at:11.02,
      firstTable:{table:root+"supply-table-3.png",focus:{at:11.19}},secondTable:{table:root+"supply-table-4.png",focus:{at:14.48}}},
    sourceNote:"注意：供应商可能每年更换，不同批次亦可能不同，以上仅举例。",
  } satisfies SupplyComparisonSpec,
};
