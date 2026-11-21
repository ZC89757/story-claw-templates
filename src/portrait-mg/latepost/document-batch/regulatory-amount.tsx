import {Img, useCurrentFrame, useVideoConfig} from "remotion";
import {asset, clamp, ease, type PortraitDemo} from "../../common";
import type {RegulatoryAmountSpec} from "./contracts";

const root = "portrait-mg/latepost/document-batch/";
const red = "#ff120d";
const reveal = (time: number, start: number, length: number) => ease((time - start) / length);

export function RegulatoryAmount({spec}: {spec: RegulatoryAmountSpec}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const push = reveal(t, spec.focus.at - .13, .4);
  const rise = (1 - reveal(t, -.12, .48)) * 43;
  const introOpacity = reveal(t, -.02, .44);
  const y = rise - 117 * push;
  const line = reveal(t, spec.focus.at + .08, .16);
  const card = reveal(t, spec.focus.at + .19, .28);
  const upper = reveal(t, spec.comparisons.at, .13);
  const lower = reveal(t, spec.comparisons.at + .14, .12);

  return (
    <div style={{position:"absolute", inset:0, overflow:"hidden", background:"linear-gradient(#000 16%,#070506 32%,#312e2f 63%,#676568 100%)"}}>
      <div style={{position:"absolute", inset:0, transform:`translateY(${y}px)`}}>
        <Img src={asset(spec.authority)} style={{position:"absolute", left:73, top:136, width:213, height:35, objectFit:"contain", opacity: introOpacity * (1 - .35 * push)}}/>
        <div style={{position:"absolute", top:181, left:17, width:326, textAlign:"center", color:"#f3f0ee",
          fontFamily:"SimSun, 'Songti SC', serif", fontWeight:900, fontSize:31, lineHeight:"34px", letterSpacing:0, transform:"scaleX(.78)",
          opacity:reveal(t,.03,.35) * (1 - .36 * push)}}>
          {spec.headline.map((lineText, index) => <div key={index} style={{whiteSpace:"nowrap"}}>{lineText}</div>)}
        </div>
        <div style={{position:"absolute", top:259, left:0, width:360, textAlign:"center", fontFamily:"'Times New Roman',serif",
          color:"#b90d0a", fontWeight:800, fontSize:23, letterSpacing:2, opacity:reveal(t,.08,.36)*(1-.43*push)}}>{spec.date}</div>
        <div style={{position:"absolute", top:295, left:39, width:280, height:1, background:"#b3aaab", opacity:.2*introOpacity}}/>
        <div style={{position:"absolute", top:314, left:35, width:286, height:241, opacity:reveal(t,-.04,.43)*(1-.33*push), isolation:"isolate"}}>
          <div style={{position:"absolute", top:14, left:23, width:60*line, height:9, background:"#e81311"}}/>
          <Img src={asset(spec.document)} style={{position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"fill",
            mixBlendMode:"screen"}}/>
        </div>
      </div>
      {card > 0 && <svg width={360} height={640} viewBox="0 0 360 640" style={{position:"absolute", inset:0, opacity:card*.68}}>
        <path d="M58 214 L51 276 M117 214 L307 276" stroke={red} strokeWidth=".65" fill="none"/>
      </svg>}
      <div style={{position:"absolute", top:275, left:51, width:257, height:47, background:red,
        transformOrigin:"left center", transform:`scaleX(${card})`, opacity:clamp(card*1.8),
        display:"grid", placeItems:"center", color:"#0d0504", fontFamily:"SimSun, 'Songti SC', serif",
        fontSize:34, fontWeight:900, lineHeight:1, whiteSpace:"nowrap"}}>
        <span style={{display:"block", position:"absolute", left:"50%", transform:"translateX(-50%) scaleX(.83)"}}>{spec.amount}</span>
      </div>
      <div style={{position:"absolute", top:249, right:53, padding:"0 2px", color:"#e61915", background:"#0a0606", opacity:upper,
        fontFamily:"SimSun, 'Songti SC', serif", fontWeight:800, fontSize:18, lineHeight:"23px", whiteSpace:"nowrap"}}>{spec.comparisonAbove}</div>
      <div style={{position:"absolute", top:324, right:53, padding:"0 2px", color:"#e61915", background:"#0a0606", opacity:lower,
        fontFamily:"SimSun, 'Songti SC', serif", fontWeight:800, fontSize:16, lineHeight:"22px", whiteSpace:"nowrap"}}>{spec.comparisonBelow}</div>
    </div>
  );
}

export const regulatoryAmountDemo: PortraitDemo = {
  fps: 30,
  durationInFrames: 217,
  reference: "晚点LatePost · BV1Dquj6sEhJ · 28.63350–35.90031",
  spec: {
    authority: root+"regulator-masthead.png",
    document: root+"regulator-body.png",
    headline: ["携程被罚没51.79亿元", "打破“全网最低价”"],
    date: "2026-07-25",
    amount: "罚没合计51.79亿元",
    comparisonAbove: "阿里罚款182.28亿元",
    comparisonBelow: "美团罚款34亿元",
    focus: {at: 3.13},
    comparisons: {at: 5.02},
  } satisfies RegulatoryAmountSpec,
};
