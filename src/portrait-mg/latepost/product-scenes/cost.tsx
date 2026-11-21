import type {PortraitDemo} from "../../common";
import {costContract, type AnchorName, type CostSpec} from "./cost-contract";
import {assetRoot, Cutout, Layer, lerp, nightGradient, phase, sans, useSeconds} from "./shared";

const anchors = [
  {key: "headlight", x: 44, y: 326, labelX: 43, labelY: 198, lineY: 271, delay: .20, align: "left"},
  {key: "battery", x: 157, y: 332, labelX: 148, labelY: 171, lineY: 241, delay: .27, align: "left"},
  {key: "body", x: 250, y: 264, labelX: 235, labelY: 171, lineY: 241, delay: .31, align: "left"},
  {key: "chip", x: 100, y: 323, labelX: 92, labelY: 397, lineY: 401, delay: .19, align: "right"},
  {key: "motor", x: 111, y: 340, labelX: 107, labelY: 397, lineY: 401, delay: .23, align: "left"},
  {key: "chassis", x: 227, y: 353, labelX: 213, labelY: 397, lineY: 401, delay: .36, align: "left"},
] as const satisfies readonly {key: AnchorName; x: number; y: number; labelX: number; labelY: number; lineY: number; delay: number; align: "left" | "right"}[];

function CostCallouts({spec}: {spec: CostSpec}) {
  const time = useSeconds();
  const assembly = phase(time, 0, .42);
  const drift = phase(time, 1, 13);
  return <Layer style={{background: nightGradient, color: "white", fontFamily: sans}}>
    <div style={{position: "absolute", left: 25, top: 111, fontSize: 19, fontWeight: 700, whiteSpace: "nowrap"}}>
      {[...spec.title].map((letter, index) => <span key={index} style={{opacity: phase(time, index * .029 - .21, .09)}}>{letter}</span>)}
    </div>
    <div style={{position: "absolute", left: 26, top: 141, fontSize: 9, color: "#909090", fontStyle: "italic",
      opacity: phase(time, .05, .27)}}>{spec.sourceNote}</div>
    <Layer style={{transform: `translate(${-2 * drift}px,${lerp(24, 0, assembly) - 2 * drift}px) scale(${lerp(.82, 1, assembly) + .04 * drift})`, transformOrigin: "171px 324px"}}>
      <Layer style={{opacity: lerp(.18, 1, phase(time, 0, .33))}}><Cutout source={spec.vehicle} x={39} y={260} width={263} height={133}/></Layer>
      {anchors.map(anchor => {
        const label = spec.labels[anchor.key];
        const active = label.focus ? phase(time, label.focus.at, .12) * (1 - phase(time, label.focus.at + .38, .3)) : 0;
        const entry = phase(time, anchor.delay, .25);
        const letters = phase(time, anchor.delay + .11, .38);
        const right = anchor.align === "right";
        const labelStyle = right ? {right: 360 - anchor.labelX, textAlign: "right" as const} : {left: anchor.labelX};
        return <Layer key={anchor.key}>
          <div style={{position: "absolute", top: Math.min(anchor.y, anchor.lineY), left: anchor.x,
            height: Math.abs(anchor.lineY - anchor.y), borderLeft: `1px dotted rgba(255,255,255,${.31 + .5 * active})`, opacity: entry,
            transform: `scaleY(${entry})`, transformOrigin: anchor.lineY > anchor.y ? "top" : "bottom"}}/>
          <div style={{position: "absolute", top: anchor.y - 4, left: anchor.x - 4, width: 8, height: 8,
            background: "#ed0012", borderRadius: "50%", opacity: entry, transform: `scale(${entry * (1 + .26 * active)})`}}/>
          <div style={{position: "absolute", ...labelStyle, top: anchor.labelY + (1 - letters) * 15, opacity: letters,
            whiteSpace: "nowrap", clipPath: `inset(-10px ${100 * (1 - letters)}% 0 0)`, filter: `brightness(${1 + .35 * active})`}}>
            {anchor.key === "headlight" && <div style={{position: "absolute", left: -7, top: -8, fontSize: 8, color: "#969696"}}>（成本占比）</div>}
            <div style={{font: "italic 27px/30px 'Times New Roman', serif", color: "#d50013", transform: "scaleX(.79)",
              transformOrigin: right ? "right" : "left"}}>{label.share}</div>
            <div style={{fontSize: 10, fontWeight: 700, lineHeight: "14px"}}>{label.name}</div>
            <div style={{fontSize: 8, lineHeight: "10px", color: "#e5e5e5"}}>
              {label.detail}{label.secondLine && <><br/>{label.secondLine}</>}
            </div>
          </div>
        </Layer>;
      })}
    </Layer>
  </Layer>;
}

const demoSpec: CostSpec = {
  title: "比亚迪自制部件占整车成本比重",
  sourceNote: "数据来源：根据公开资料整理",
  vehicle: assetRoot + "cutaway.png",
  labels: {
    headlight: {share: "4%", name: "弗迪视觉", detail: "汽车照明系统", secondLine: null, focus: {at: 12.7}},
    battery: {share: "40%", name: "弗迪电池", detail: "生产汽车动力电池", secondLine: "储能和手机电池", focus: {at: 9.1}},
    body: {share: "17%", name: "弗迪模具", detail: "生产汽车白车身", secondLine: "及汽车生产设备", focus: null},
    chip: {share: "7%", name: "比亚迪半导体", detail: "生产 IGBT", secondLine: "（功率半导体）", focus: null},
    motor: {share: "8%", name: "弗迪动力", detail: "生产汽车电机", secondLine: "发动机系统", focus: {at: 10.2}},
    chassis: {share: "13%", name: "弗迪科技", detail: "生产部分汽车电子", secondLine: "配件及整个底盘", focus: {at: 11.5}},
  },
};
const demo: PortraitDemo = {spec: demoSpec, durationInFrames: 439, fps: 30, reference: "BV1WaHN6GEuN · 80.667–95.333"};
export const componentCosts = {...costContract, Component: CostCallouts, demo} as const;


