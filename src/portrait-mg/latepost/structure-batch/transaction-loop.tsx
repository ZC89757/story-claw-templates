import {clamp, ease, PortraitMedia, type PortraitDemo} from "../../common";
import {assetRoot, cover, displayFont, labels, useSceneSeconds} from "./shared";
import {transactionLoopContract, type TransactionLoopSpec} from "./transaction-loop-contract";

type Camera = {x: number; y: number; scale: number};
const initial = {x: 30.5, y: 89, scale: .837};
const right = {x: -185, y: -67, scale: 1.26};
const left = {x: 96, y: -54, scale: 1.26};
const full = {x: 0, y: 0, scale: 1};

function cameraAt(time: number, spec: TransactionLoopSpec) {
  const first = spec.investment.at;
  const second = spec.orderDeal.at;
  const third = spec.purchase.at;
  const frames: [number, Camera][] = [
    [0, initial], [first - .85, initial],
    [first - .633, {x: -21, y: 152, scale: 1.15}],
    [first - .45, {x: -52, y: 177, scale: 1.245}],
    [first, {x: -52, y: 177, scale: 1.26}],
    [first + .2, {x: -151, y: -7, scale: 1.26}],
    [first + .367, {x: -182, y: -63, scale: 1.26}],
    [first + .5, right], [second, right],
    [second + .167, {x: -69, y: -63, scale: 1.26}],
    [second + .333, {x: 62, y: -55, scale: 1.26}],
    [second + .5, {x: 90, y: -54, scale: 1.26}],
    [second + .667, left], [third - 1.65, left],
    [third - 1.15, {x: 56, y: -29, scale: 1.14}],
    [third - .97, {x: 25, y: -9, scale: 1.05}],
    [third - .31, full],
  ];
  for (let index = 1; index < frames.length; index++) {
    const [end, next] = frames[index];
    if (time > end) continue;
    const [start, prev] = frames[index - 1];
    const portion = clamp((time - start) / (end - start));
    return {x: prev.x + (next.x - prev.x) * portion, y: prev.y + (next.y - prev.y) * portion, scale: prev.scale + (next.scale - prev.scale) * portion};
  }
  return full;
}

const red = "#c80928";
const positions = {
  top: {x: 178, y: 109, logoW: 102, logoH: 90, titleOffset: 61},
  left: {x: 68, y: 302, logoW: 100, logoH: 85, titleOffset: 70},
  right: {x: 291, y: 302, logoW: 104, logoH: 73, titleOffset: 70},
};

function Captions({x, y, text, secondOpacity = 1}: {
  x: number; y: number; text: Pick<TransactionLoopSpec["investment"], "lineOne" | "lineTwo">; secondOpacity?: number;
}) {
  return (
    <g textAnchor="middle" fill={red} fontFamily={labels} fontSize="19" fontWeight="600" transform={`translate(${x} ${y}) scale(.91 1.09)`}>
      <text filter="url(#latepost-caption-clear)">{text.lineOne}</text>
      <text y="21" opacity={secondOpacity} filter="url(#latepost-caption-clear)">{text.lineTwo}</text>
    </g>
  );
}

function TransactionLoop({spec}: {spec: TransactionLoopSpec}) {
  const time = useSceneSeconds();
  const camera = cameraAt(time, spec);
  const progress = ease((time - spec.purchase.at) / .67);
  const labelProgress = ease((time - spec.purchase.at - .49) / .37);
  return (
    <div style={{...cover, background: "radial-gradient(ellipse at 45% 10%,#fffcf5 0%,#fdf7f1 60%,#fcece8 100%)"}}>
      <div style={{...cover, transform: `translate(${camera.x}px,${camera.y}px) scale(${camera.scale})`, transformOrigin: "left top"}}>
        <svg width="360" height="640" viewBox="0 0 360 640" style={{...cover, overflow: "visible"}}>
          <defs>
            <radialGradient id="latepost-transaction-rings">
              <stop offset="0" stopColor="#f8dbd8" stopOpacity=".13" />
              <stop offset=".56" stopColor="#f2c9c8" stopOpacity=".09" />
              <stop offset=".58" stopColor="#efc3c1" stopOpacity=".15" />
              <stop offset=".87" stopColor="#efc3c1" stopOpacity=".09" />
              <stop offset=".995" stopColor="#facfc9" stopOpacity=".19" />
              <stop offset="1" stopColor="#facfc9" stopOpacity="0" />
            </radialGradient>
            <marker id="latepost-transaction-arrow" orient="auto" markerWidth="5" markerHeight="5" refX="4" refY="2.5" viewBox="0 0 5 5">
              <path d="M0 0 L5 2.5 L0 5 L1 2.5 Z" fill={red} />
            </marker>
            <clipPath id="latepost-transaction-purchase">
              <rect x="116" y="346" width={126 * progress} height="48" />
            </clipPath>
            <filter id="latepost-caption-clear" x="-20%" y="-30%" width="140%" height="160%">
              <feMorphology in="SourceAlpha" operator="dilate" radius="1.7" result="mask" />
              <feFlood floodColor="#fef4ef" floodOpacity=".96" />
              <feComposite in2="mask" operator="in" />
              <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <circle cx="172" cy="218" r="306" fill="url(#latepost-transaction-rings)" />
          <circle cx="172" cy="218" r="188" fill="#f8e2dd" fillOpacity=".16" />
          <g stroke={red} fill="none" strokeWidth="1.75" strokeLinecap="round" strokeDasharray="3 5" markerEnd="url(#latepost-transaction-arrow)">
            <path d="M112 126 C79 147 45 187 42 230" />
            <path d="M315 236 C312 204 291 150 259 127" />
            <path d="M120 363 C147 382 204 378 239 359" clipPath="url(#latepost-transaction-purchase)" />
          </g>
          <Captions x={62} y={171} text={spec.orderDeal} secondOpacity={ease((time - spec.orderDeal.at - .19) / .36)} />
          <Captions x={301} y={174} text={spec.investment} />
          <g opacity={labelProgress}><Captions x={180} y={368} text={spec.purchase} /></g>
        </svg>
        {(Object.keys(positions) as Array<keyof typeof positions>).map(node => {
          const {x, y, logoW, logoH, titleOffset} = positions[node];
          return (
            <div key={node} style={{position: "absolute", left: x - 68, top: y - 68, width: 136, height: 136, borderRadius: "50%", background: "#fff", boxShadow: "1.6px 2.4px 7px #7049591b"}}>
              <div style={{position: "absolute", left: (136 - logoW) / 2, top: (136 - logoH) / 2, width: logoW, height: logoH}}>
                <PortraitMedia media={{source: spec[node].logo, sourceStart: null}} style={{objectFit: "contain"}} />
              </div>
              <div style={{position: "absolute", left: -40, top: 68 + titleOffset - 20, width: 216, color: "#12100f", textAlign: "center", whiteSpace: "nowrap", font: `bold 24px/25px ${displayFont}`, transform: "scaleX(.92)", textShadow: ".3px 0 #12100f,-.3px 0 #12100f"}}>
                {spec[node].name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const demoSpec: TransactionLoopSpec = {
  top: {logo: assetRoot + "graph-openai.png", name: "OpenAI"},
  left: {logo: assetRoot + "graph-oracle.png", name: "甲骨文"},
  right: {logo: assetRoot + "graph-nvidia.png", name: "英伟达"},
  investment: {lineOne: "投资1000亿美元", lineTwo: "建设算力", at: 1.3},
  orderDeal: {lineOne: "3000亿美元订单", lineTwo: "购买算力", at: 2.5},
  purchase: {lineOne: "购买GPU", lineTwo: "扩充算力", at: 5.8},
};
const demo: PortraitDemo = {
  spec: demoSpec,
  durationInFrames: 229,
  fps: 30,
  reference: "晚点LatePost · BV1y6nEz8EBm · 33.5–41.133",
};

export const transactionLoop = {...transactionLoopContract, Component: TransactionLoop, demo} as const;
