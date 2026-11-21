import {useCurrentFrame, useVideoConfig} from "remotion";
import {clamp, ease, PortraitMedia, type PortraitDemo} from "../../common";
import type {RevenuePieSpec} from "./contracts";

const serif = "SimSun, 'Songti SC', serif";
const sans = "'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif";
const roman = "'Times New Roman', serif";
const red = "#ff0906";
const ink = "#ae0009";
const radius = 83;
const fullTurn = Math.PI * 2;
const textWidth = (text: string, fullWidth: number) => Array.from(text)
  .reduce((width, character) => width + (/^[\x20-\x7e]$/.test(character) ? .57 : 1) * fullWidth, 0);

function sector(start: number, end: number) {
  const span = clamp(end - start, 0, fullTurn - .0001);
  const position = (angle: number) => [radius * Math.sin(angle), -radius * Math.cos(angle)].join(" ");
  return `M0 0 L${position(start)} A${radius} ${radius} 0 ${span > Math.PI ? 1 : 0} 1 ${position(start + span)} Z`;
}

function Counter({x, y, value, progress, unit, large = false, small = false}: {
  x: number; y: number; value: number; progress: number; unit: string; large?: boolean; small?: boolean;
}) {
  const fontSize = large ? 57 : small ? 23 : 36;
  const unitSize = large ? 15 : small ? 8 : 12;
  const amount = (value * ease(progress)).toFixed(2);
  return <g transform={`translate(${x} ${y})`} opacity={clamp(progress * 9)}>
    <text y="0" fill={large ? "#dd0010" : ink} textLength={fontSize * (amount.length * (large ? .335 : .37))}
      lengthAdjust="spacingAndGlyphs" fontFamily={roman} fontSize={fontSize} fontStyle="italic"
      fontWeight="700" transform="scale(1 .83)">{amount}</text>
    <text x={large ? fontSize * (amount.length * (large ? .335 : .37)) + 3 : 2} y={large ? -2 : unitSize + 2}
      fontFamily={serif} fontSize={unitSize} fontWeight="400" fill="#aeaba9">（{unit}）</text>
  </g>;
}

export function RevenuePie({spec}: {spec: RevenuePieSpec}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  const title = ease((time - .18) / .43);
  const base = ease((time - .18) / .66);
  const retailAge = time - spec.retail.at;
  const leftAge = time - spec.franchise.at;
  const retailIn = ease(retailAge / .48);
  const retailRise = ease((retailAge - .33) / .94);
  const leftIn = ease(leftAge / .53);
  const leftRise = ease((leftAge - .05) / 1.09);
  const sum = spec.retail.amount + spec.franchise.amount + spec.leased.amount + spec.other.amount;
  const retailEnd = fullTurn * spec.retail.amount / sum;
  const otherEnd = retailEnd + fullTurn * spec.other.amount / sum;
  const leasedEnd = otherEnd + fullTurn * spec.leased.amount / sum;
  const retailX = 183 - 3 * retailRise - 5 * leftRise;
  const retailY = 321 - 59 * retailRise - 1 * leftRise;
  const leftX = 183 - 19 * leftRise;
  const leftY = 321 - 37 * leftRise;
  const retailLabelY = retailY - 34;

  return <div style={{position: "absolute", inset: 0, overflow: "hidden",
    background: "linear-gradient(180deg,#433e40 0px,#433e40 32px,#363233 71px,#282729 109px,#606060 461px,#656565 480px,#747474 525px,#7e7e7e 572px,#7e7e7e 640px)"}}>
    <div style={{position: "absolute", top: 109, left: 0, width: 360, height: 353, overflow: "hidden", background: "#080b0e"}}>
      <PortraitMedia media={spec.background} style={{display: "block", filter: "brightness(.55) saturate(.73)"}} />
      <div style={{position: "absolute", inset: 0, background: "linear-gradient(180deg,#05060644,transparent 38%,#0c0d1010 74%,#0c0c0c48)"}} />
    </div>
    <svg width="360" height="462" viewBox="0 0 360 462" style={{position: "absolute", left: 0, top: 0}}>
      <g opacity={title}>
        <text x="0" y="149" transform="translate(27 0) scale(.92 1)" fontFamily={sans} fontSize="23" fontWeight="700" fill="#fbfaf8">{spec.title}</text>
        <text x="27" y="173" fontFamily={serif} fontSize="13" fontStyle="italic" fill="#a09e99">数据来源: {spec.source}</text>
      </g>
      <path d={sector(fullTurn * (1 - base), fullTurn)} transform="translate(183 321)"
        fill="#898887" opacity={base * .22}/>
      <path d={sector(0, retailEnd)} transform={`translate(${retailX} ${retailY})`}
        fill={red} opacity={retailIn * (1 - leftIn)}/>
      <path d={sector(0, retailEnd)} transform={`translate(${retailX} ${retailY})`}
        fill="#a4a2a1" opacity={retailIn * leftIn * .52}/>
      <path d={sector(leasedEnd, fullTurn)} transform={`translate(${leftX} ${leftY})`}
        fill={red} opacity={leftIn}/>
      <path d={sector(retailEnd, otherEnd)} transform={`translate(${168 + 4 * leftRise} ${287 - 9 * leftRise})`}
        fill="#d3d0c8" opacity={leftIn * .58}/>
      <path d={sector(otherEnd, leasedEnd)} transform={`translate(${171 - 1 * leftRise} ${296 - 5 * leftRise})`}
        fill="#f54647" opacity={leftIn}/>
      <g fill="#fffdf7" fontFamily={serif} fontWeight="700">
        <g opacity={ease((time - .34) / .3)}>
          <path d="M213 398v27" stroke="#bbb6b2" strokeWidth=".66" opacity=".75"/>
          <text x="85" y="446" fontSize="24" textLength="54" lengthAdjust="spacingAndGlyphs">总收入</text>
          <Counter x={145} y={451} value={spec.total} progress={1} unit={spec.unit} large/>
        </g>
        <g opacity={retailIn}>
          <text x={retailX + 3} y={retailLabelY} fontSize="23" textLength={textWidth(spec.retail.label, 17.75)} lengthAdjust="spacingAndGlyphs">{spec.retail.label}</text>
          <path d={`M250 ${retailLabelY - 7}h13`} stroke="#a5a29f" strokeWidth=".8" opacity={ease((retailAge - .83) / .28)}/>
          <Counter x={264} y={retailLabelY + 2} value={spec.retail.amount} progress={clamp((retailAge - .83) / 1.49)} unit={spec.unit}/>
        </g>
        <g opacity={leftIn} transform={`translate(0 ${12 * (1 - leftRise)})`}>
          <text x="161" y="202" textAnchor="end" fontSize="22" textLength={textWidth(spec.franchise.label, 18)} lengthAdjust="spacingAndGlyphs">{spec.franchise.label}</text>
          <text x="160" y="228" textAnchor="end" fontSize="24" textLength="36" lengthAdjust="spacingAndGlyphs">收入</text>
          <path d="M93 218h28" stroke="#a5a29f" strokeWidth=".8"/>
          <Counter x={27} y={231} value={spec.franchise.amount} progress={clamp((leftAge - .4) / .92)} unit={spec.unit}/>
        </g>
        <g opacity={ease((leftAge - .07) / .47)} transform={`translate(0 ${17 * (1 - leftRise)})`}>
          <text x="191" y="358" textAnchor="end" fontSize="15" textLength={textWidth(spec.leased.label, 13)} lengthAdjust="spacingAndGlyphs">{spec.leased.label}</text>
          <text x="185" y="374" textAnchor="end" fontSize="15" textLength="23" lengthAdjust="spacingAndGlyphs">收入</text>
          <path d="M118 367h36 M240 347h19" stroke="#aca4a0" strokeWidth=".7"/>
          <Counter x={88} y={374} value={spec.leased.amount} progress={clamp((leftAge - .47) / .83)} unit={spec.unit} small/>
          <text x="217" y="351" fontSize="15" textLength={textWidth(spec.other.label, 12)} lengthAdjust="spacingAndGlyphs">{spec.other.label}</text>
          <Counter x={261} y={352} value={spec.other.amount} progress={clamp((leftAge - .47) / .83)} unit={spec.unit} small/>
        </g>
      </g>
    </svg>
  </div>;
}

export const revenuePieDemo: PortraitDemo = {
  fps: 30,
  durationInFrames: 224,
  reference: "D:/MG_Reference_Library/creators/latepost/effects/V05_005/reference.mp4",
  spec: {
    background: {source: "portrait-mg/latepost/footage-charts/pillow-footage.mp4", sourceStart: 0},
    title: "2026 上半年亚朵收入结构",
    source: "公司财报",
    total: 63.02,
    unit: "亿元",
    retail: {label: "零售收入", amount: 26.46, at: 1.53},
    franchise: {label: "加盟酒店", amount: 32.93, at: 5.68},
    leased: {label: "租赁酒店", amount: 2.50},
    other: {label: "其他", amount: 1.12},
  } satisfies RevenuePieSpec,
};


