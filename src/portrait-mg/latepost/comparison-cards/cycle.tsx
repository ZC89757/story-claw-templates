import {clamp, ease, type PortraitDemo} from "../../common";
import {charcoal, cover, reference, roman, song, travel, useSeconds} from "./shared";
import {cycleContract, type CycleSpec} from "./cycle-contract";

function Structure({content, offset}: {content: CycleSpec["structure"]; offset: number}) {
  return <div style={{...cover, transform: `translateY(${offset}px)`, color: "#fff"}}>
    <div style={{position: "absolute", left: -12, top: 37, width: 198, height: 279, transform: "skewY(-14deg)", background: "#040304"}}>
      <div style={{position: "absolute", top: -61, left: -14, width: 198, height: 103,
        background: "linear-gradient(#e3e0e2,#575457)", clipPath: "polygon(0 0,52% 0,100% 100%,0 100%)"}}/>
      <div style={{position: "absolute", left: 20, top: 46, width: 148, height: 190, borderLeft: "2px dashed #810e15",
        borderBottom: "2px dashed #810e15", borderRadius: "30% 0 0 73%", transform: "skewY(28deg)"}}/>
      <div style={{position: "absolute", bottom: 86, left: 0, right: 0, height: 12,
        background: "linear-gradient(180deg,#ef101d,#76090d 35%,#150104)"}}/>
      {[
        [46, 48, content.investor], [23, 97, content.shell], [64, 210, content.foreign], [149, 253, content.local],
      ].map(([x, y, label], index) => <div key={index} style={{position: "absolute", left: x, top: y, whiteSpace: "nowrap",
        font: `bold 15px/1 ${song}`, transform: "scaleX(.64)", transformOrigin: "left", textShadow: "0 0 2px #eee",
      }}><span style={{color: "#c71526", paddingRight: 3}}>▪</span>{label}</div>)}
      <div style={{position: "absolute", right: 12, top: 164, font: `bold 14px/1.35 ${song}`, transform: "scaleX(.75)"}}>境外<br/>境内</div>
    </div>
    <div style={{position: "absolute", left: 100, top: 31, width: 103, height: 108, transform: "skewY(-14deg) rotate(-2deg)",
      color: "#ec0a0f", textShadow: "1px 0 #ed1010", border: "5px solid #e00a11", borderRadius: "16px 5px 13px 7px",
      boxShadow: "0 0 2px #e00a11,inset 0 0 3px #e00a11", textAlign: "center"}}>
      <div style={{font: `bold 88px/.99 ${song}`, transform: "scaleX(.58)", whiteSpace: "nowrap", position: "absolute", width: 186, left: -41, top: 9}}>{content.stamp}</div>
    </div>
    <div style={{position: "absolute", right: 20, top: 126, width: 147, textAlign: "center", transform: "skewY(-14deg)", whiteSpace: "nowrap"}}>
      <div style={{font: `italic 95px/.92 ${roman}`, color: "#d30010", transform: "scaleX(.83)", textShadow: "0 0 4px #94000d"}}>{content.abbreviation}</div>
      <div style={{font: `bold 34px/1.15 ${song}`, transform: "scaleX(.66)", transformOrigin: "left", textShadow: "1px 1px #000", marginLeft: 5}}>{content.title}</div>
    </div>
  </div>;
}

function Period({entry, time, top, width, large}: {entry: CycleSpec["direct"]; time: number; top: number; width: number; large?: boolean}) {
  const grow = travel((time - entry.at) / (large ? .87 : .4));
  const show = clamp((time - entry.at - .28) / .24);
  return <div style={{position: "absolute", left: 101, top, height: 50, transform: "skewY(-12deg)", transformOrigin: "left top"}}>
    <div style={{position: "absolute", left: 0, bottom: 0, width: width * grow, height: 14,
      background: "linear-gradient(#ff0706,#db0a08)", boxShadow: "0 0 4px #a40010"}}/>
    <div style={{position: "absolute", left: 0, bottom: 14, font: `bold 19px/1 ${song}`, whiteSpace: "nowrap", color: "white",
      transform: "scaleX(.63)", transformOrigin: "bottom left", opacity: show}}>
      {entry.label}<span style={{font: `italic ${large ? 62 : 35}px/.7 ${roman}`, color: "#e30715", marginLeft: 4}}>{entry.days}</span>天
    </div>
  </div>;
}

function ListingCycle({spec}: {spec: CycleSpec}) {
  const seconds = useSeconds();
  const shift = 1 - ease((seconds - spec.direct.at + .59) / .58);
  const darken = ease((seconds - spec.earlier.at) / .2) * .73;
  const latest = seconds >= spec.later.at;
  const current = latest ? spec.later : spec.earlier;
  const fade = travel((seconds - current.at) / .18);
  return <div style={{...cover, background: charcoal}}>
    <Structure content={spec.structure} offset={63 * shift}/>
    <Period entry={spec.direct} time={seconds} top={425} width={183 * spec.direct.days / spec.indirect.days}/>
    <Period entry={spec.indirect} time={seconds} top={367} width={183} large/>
    <div style={{...cover, background: "linear-gradient(#030304,#08070800 125%)", opacity: darken}}/>
    <div style={{position: "absolute", top: 166, left: 0, width: 360, color: latest ? "#e10006" : "white", textAlign: "center",
      font: `bold 88px/1.05 ${song}`, whiteSpace: "nowrap", opacity: fade,
      transform: `skewY(-13deg) translateX(${(1 - fade) * 32}px) scale(.82,1.23)`, textShadow: "1px 2px 2px #090000"}}>
      {current.label}
    </div>
  </div>;
}

const demo: PortraitDemo = {
  spec: {
    structure: {abbreviation: "VIE", title: "可变利益实体", stamp: "合规", investor: "海外投资者", shell: "开曼壳公司", foreign: "外商独资企业", local: "纯内资公司"},
    direct: {label: "直接以境内主体在港股上市", days: 120, at: 1.47},
    indirect: {label: "保留 VIE 去境外上市", days: 402, at: 3.87},
    earlier: {label: "抄近路", at: 7.18}, later: {label: "绕远路", at: 9.22},
  },
  durationInFrames: 296, fps: 30, reference: reference("V10_005"),
};

export const listingCycle = {...cycleContract, Component: ListingCycle, demo} as const;
