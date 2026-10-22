import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {expansionEase} from "../subject-expansion/evaluate";
import type {ImageComparisonSpec} from "./schema";
import {EditorialComparisonTemplate} from "./EditorialComparisonTemplate";
const SplitPanelComparisonTemplate = ({spec}: {spec: ImageComparisonSpec}) => {
  const seconds = useCurrentFrame() / useVideoConfig().fps;
  const focus = [...spec.highlights].reverse().find((h) => h.at <= seconds);
  return <AbsoluteFill style={{background: "#f1eee4", color: "#29464b", fontFamily: '"Microsoft YaHei", sans-serif'}}>
    <div style={{position: "absolute", left: 95, top: 65, fontSize: 29}}>{spec.title}</div>
    <div style={{position: "absolute", left: 959, top: 180, width: 1, height: 760, background: "#adbdaf"}} />
    {(["left", "right"] as const).map((side, i) => {
      const data = spec[side]; const items = spec.items.filter((p) => p.side === side);
      const start = items[0].at; const progress = expansionEase(seconds - start);
      const color = i ? "#bd7958" : "#538d8b";
      return <div key={side} style={{position: "absolute", left: i ? 1010 : 90, top: 180, width: 820, height: 780, opacity: progress * (focus && focus.side !== side ? 0.65 : 1), transform: `translateY(${(1 - progress) * 28}px)`}}>
        <div style={{color, fontSize: 34, fontWeight: 600, textAlign: "center"}}>{data.label}</div>
        {data.image ? <Img src={staticFile(data.image.replace(/^public[\\/]/, ""))} style={{position: "absolute", left: 180, top: 65, width: 460, height: 310, objectFit: "contain"}} /> : null}
        <div style={{position: "absolute", left: 40, right: 40, top: 420}}>{items.map((item, index) => <div key={index} style={{fontSize: item.text.length > 35 ? 23 : 27, lineHeight: 1.45, padding: "12px 0 12px 22px", borderLeft: `3px solid ${color}`, marginBottom: 16, opacity: expansionEase(seconds - item.at), transform: `translateX(${(1 - expansionEase(seconds - item.at)) * 20}px)`}}>{item.text}</div>)}</div>
      </div>;
    })}
  </AbsoluteFill>;
};
export const ImageComparisonTemplate=({spec,group="split-panel"}:{spec:ImageComparisonSpec;group?:string})=>group==="editorial-paper"?<EditorialComparisonTemplate spec={spec}/>:<SplitPanelComparisonTemplate spec={spec}/>;
