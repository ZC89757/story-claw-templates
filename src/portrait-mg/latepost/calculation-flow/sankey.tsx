import {useId} from "react";
import {useCurrentFrame, useVideoConfig} from "remotion";
import {clamp, ease, type PortraitDemo} from "../../common";
import {sankeyContract, sumColumn, sumFlow, type SankeySpec} from "./sankey-contract";

type Band = {left: number; width: number};
type Ribbon = {path: string; relay: number};

const left = 35;
const right = 326;
const top = 176;
const middle = 300;
const bottom = 449;
const serif = '"SimSun", "Songti SC", "Noto Serif CJK SC", serif';
const sans = '"Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
const blue = "#228dde";

function nodeBands(amounts: number[], gaps: number[], scale: number): Band[] {
  let x = left;
  return amounts.map((value, index) => {
    const band = {left: x, width: value * scale};
    x += band.width + (gaps[index] ?? 0);
    return band;
  });
}

function ribbonPath(x1: number, x2: number, y1: number, y2: number, width: number) {
  const c1 = y1 + (y2 - y1) * (y1 === middle ? .86 : .62);
  const c2 = y2 - (y2 - y1) * (y1 === middle ? .18 : .41);
  return `M${x1},${y1} C${x1},${c1} ${x2},${c2} ${x2},${y2}
    H${x2 + width} C${x2 + width},${c2} ${x1 + width},${c1} ${x1 + width},${y1} Z`;
}

function stage(
  flows: number[][], inputs: Band[], outputs: Band[], y1: number, y2: number, scale: number, relayAtSource: boolean,
): Ribbon[] {
  const outputHeads = outputs.map(band => band.left);
  return flows.flatMap((row, source) => {
    let inputHead = inputs[source].left;
    return row.flatMap((value, target) => {
      if (value === 0) return [];
      const width = value * scale;
      const path = ribbonPath(inputHead, outputHeads[target], y1, y2, width);
      inputHead += width;
      outputHeads[target] += width;
      return {path, relay: relayAtSource ? source : target};
    });
  });
}

function Sankey({spec}: {spec: SankeySpec}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  const id = useId().replace(/:/g, "");
  const relayAmounts = spec.outgoing.map(sumFlow);
  const total = sumFlow(relayAmounts);
  const scale = (right - left - 47) / total;
  const sources = nodeBands(spec.incoming.map(sumFlow), [23, 24], scale);
  const relays = nodeBands(relayAmounts, [28, 4, 4, 11], scale);
  const destinations = nodeBands(spec.destinations.map((_, index) => sumColumn(spec.outgoing, index)), [9, 8, 11, 11, 8], scale);
  const ribbons = [
    ...stage(spec.incoming, sources, relays, top, middle, scale, false),
    ...stage(spec.outgoing, relays, destinations, middle, bottom, scale, true),
  ];
  const earlyAxes = ease((time - .10) / .30);
  const blueEdge = top + (bottom - top) * ease((time - spec.alternatives.at) / .89);
  const redEdge = top + (bottom - top) * ease((time - spec.focus.at) / .96);
  const labelExit = 1 - ease((time - spec.destinationFocus.at + .37) / .37);
  const push = ease((time - spec.destinationFocus.at) / .26);
  const endpointGlow = ease((time - spec.destinationFocus.at - .08) / .40);
  const zoom = 1 + .58 * push;
  const dx = (1 - zoom) * left - 10 * push;
  const dy = (1 - zoom) * bottom - 86 * push;
  const shareIn = ease((time - spec.share.at) / .28);
  const labelGrowth = ease((time - spec.amount.at + .39) / .38);
  const amountIn = ease((time - spec.amount.at) / .19);
  const focusBand = relays[4];
  const focusRight = focusBand.left + focusBand.width;
  const relayLabelX = relays[3].left + relays[3].width;
  const amount = Math.round(relayAmounts[4]);
  const percent = Math.round(relayAmounts[4] / total * 100);
  const renderRibbons = (group: Ribbon[], gradient: string) => group.map(({path}, index) =>
    <path key={index} d={path} fill={`url(#${id}-${gradient})`}
      stroke="#131013" strokeWidth=".8" strokeOpacity={gradient === "gray" ? .45 : .25}
      paintOrder="stroke fill" />);

  return <svg width="360" height="640" viewBox="0 0 360 640" style={{position: "absolute", inset: 0}}>
    <defs>
      <linearGradient id={`${id}-background`} x2="0" y2="1">
        <stop offset=".18" stopColor="#040404" />
        <stop offset="1" stopColor="#6d6b6c" />
      </linearGradient>
      <linearGradient id={`${id}-gray`} x1="0" x2="0" y1={top} y2={bottom} gradientUnits="userSpaceOnUse">
        <stop stopColor="#1b1a1d" /><stop offset=".54" stopColor="#424043" /><stop offset="1" stopColor="#575658" />
      </linearGradient>
      <linearGradient id={`${id}-blue`} x1="0" x2="0" y1={top} y2={bottom} gradientUnits="userSpaceOnUse">
        <stop stopColor="#211544" /><stop offset=".46" stopColor="#2287c3" /><stop offset=".52" stopColor="#34204d" />
        <stop offset="1" stopColor="#1d7bc5" />
      </linearGradient>
      <linearGradient id={`${id}-red`} x1="0" x2="0" y1={top} y2={bottom} gradientUnits="userSpaceOnUse">
        <stop stopColor="#240e13" /><stop offset=".453" stopColor="#db0015" />
        <stop offset=".456" stopColor="#69202a" /><stop offset="1" stopColor="#e30313" />
      </linearGradient>
      <linearGradient id={`${id}-end`} x1="0" x2="0" y1={bottom - 119} y2={bottom} gradientUnits="userSpaceOnUse">
        <stop stopColor="#ce0715" stopOpacity="0" /><stop offset="1" stopColor="#db0014" />
      </linearGradient>
      <clipPath id={`${id}-blueEdge`}><rect x="0" width="360" y={top} height={blueEdge - top} /></clipPath>
      <clipPath id={`${id}-redEdge`}><rect x="0" width="360" y={top} height={redEdge - top} /></clipPath>
      <clipPath id={`${id}-endEdge`}><rect x="0" width="360" y={bottom - 119 * endpointGlow} height={119 * endpointGlow} /></clipPath>
    </defs>
    <rect width="360" height="640" fill={`url(#${id}-background)`} />
    <g transform={`translate(${dx} ${dy}) scale(${zoom})`}>
      <text x="28" y="131" fontFamily={sans} fontSize="21" fontWeight="700" fill="#fff">{spec.title}</text>
      <text x="28" y="150" fontFamily={sans} fontSize="12" fontStyle="italic" fill="#999">资料来源：{spec.credit}</text>
      {renderRibbons(ribbons, "gray")}
      <g opacity={labelExit} clipPath={`url(#${id}-blueEdge)`}>
        {renderRibbons(ribbons.filter(({relay}) => relay > 0 && relay < 4), "blue")}
      </g>
      <g opacity={labelExit} clipPath={`url(#${id}-redEdge)`}>
        {renderRibbons(ribbons.filter(({relay}) => relay === 4), "red")}
      </g>
      <g clipPath={`url(#${id}-endEdge)`}>{renderRibbons(ribbons, "end")}</g>
      <g opacity={earlyAxes} fontFamily={sans} textAnchor="middle">
        {sources.map(({left: x, width}, index) => <g key={index}>
          <rect x={x} y={top - 2} width={width} height="2.2" fill="#a4a2a3" />
          <text x={x + width / 2} y={top - 7} fontSize="8" fill="#a9a7a7">{spec.sources[index]}</text>
        </g>)}
        {destinations.map(({left: x, width}, index) => <g key={index}>
          <rect x={x} y={bottom} width={width} height="2" fill="#a09e9e" />
          <text x={x + width / 2} y={bottom + 11} fontSize="10" fill="#e6e5e5">
            {index < 3 ? [...spec.destinations[index]].map((char, charIndex) =>
              <tspan key={charIndex} x={x + width / 2} dy={charIndex ? 9 : 0}>{char}</tspan>) : spec.destinations[index]}
          </text>
        </g>)}
      </g>
      <g opacity={labelExit} fontFamily={serif} fontWeight="700" fill="#fff">
        <g transform={`translate(${relayLabelX} ${middle + 23}) scale(.65 1.12)`}
          opacity={ease((blueEdge - middle + 10) / 28)}>
          <text textAnchor="end" fill={blue} fontSize="20">{spec.alternativeLabel}</text>
        </g>
        <g transform={`translate(${focusRight} ${middle + 24 + 28 * labelGrowth}) scale(${.66 + .07 * labelGrowth} 1.13)`}
          opacity={ease((redEdge - middle + 5) / 34)}>
          <text textAnchor="end" fontSize={22 + 25 * labelGrowth}>{spec.focusLabel}</text>
        </g>
        <g transform={`translate(${focusRight} ${middle - 6 + 26 * (1 - shareIn)}) scale(.79 1.16)`} opacity={shareIn}>
          <text textAnchor="end" fontFamily='"Times New Roman", serif' fontSize="57">{percent}%</text>
        </g>
        <g transform={`translate(${focusRight} ${middle + 78}) scale(.75 1.08)`} opacity={amountIn}>
          <text textAnchor="end" fontSize="23">{amount}{spec.unit}</text>
        </g>
      </g>
    </g>
  </svg>;
}

// Width ratios measured at the nodes of GCAP Figure 3, then normalized to
// the figure's published amounts. Canada and the euro area share one top slot.
// https://www.nber.org/system/files/working_papers/w30865/w30865.pdf
const publishedRelayAmounts = [5340, 790, 610, 410, 12390];
const incomingWidths = [
  [8.985, .88, .211, .155, 4.214],
  [25.089, 4.735, 3.973, 3.375, 41.863],
  [29.522, 3.795, 3.13, 1.319, 101.508],
];
const outgoingWidths = [
  [0, 0, 9.64, 0, 0, 53.963],
  [0, 0, 0, 0, 0, 9.412],
  [0, 0, 0, .641, 0, 6.677],
  [0, 0, .045, 0, 0, 4.806],
  [5.732, 8.331, .819, 32.263, 34.196, 66.238],
];

const demo: PortraitDemo = {
  spec: {
    title: "万亿资金在“避税天堂”中转",
    credit: "Global Capital Allocation Project",
    sources: ["英国", "欧元区、加拿大", "美国"],
    alternativeLabel: "其他避税天堂",
    focusLabel: "开曼群岛",
    destinations: ["百度", "美团", "平安", "阿里巴巴", "腾讯", "其他公司"],
    incoming: incomingWidths.map(row => row.map((width, index) =>
      width / sumColumn(incomingWidths, index) * publishedRelayAmounts[index])),
    outgoing: outgoingWidths.map((row, index) => row.map(width =>
      width / sumFlow(row) * publishedRelayAmounts[index])),
    unit: "亿美元",
    alternatives: {at: .66},
    focus: {at: 1.98},
    share: {at: 3.17},
    amount: {at: 5.69},
    destinationFocus: {at: 7.86},
  } satisfies SankeySpec,
  durationInFrames: 284,
  fps: 30,
  reference: "晚点参考 V10_001 · BV18bM462E31 · 18.7001–28.2",
};

export const sankey = {...sankeyContract, Component: Sankey, demo};
