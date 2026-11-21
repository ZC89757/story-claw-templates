import {ease, PortraitMedia, type PortraitDemo} from "../../common";
import {assetRoot, cover, displayFont, labels, roman, tween, useSceneSeconds} from "./shared";
import {serviceTierPyramidContract, type ServiceTierPyramidSpec} from "./service-tier-pyramid-contract";

type Box = readonly [number, number, number, number];
const stages: {asset: string; narrowed: Box; split: Box}[] = [
  {asset: "tiers-bottom.png", narrowed: [34, 277, 291, 111], split: [9, 327, 343, 127]},
  {asset: "tiers-middle.png", narrowed: [67, 254, 222, 89], split: [74, 289, 211, 78]},
  {asset: "tiers-apex.png", narrowed: [106, 193, 139, 95], split: [119, 223, 118, 81]},
];
const dots = [
  {x: 140, y: 274, rowY: 357, lineX: 66, hadWhiteDot: true},
  {x: 164, y: 281, rowY: 315, lineX: 66, hadWhiteDot: true},
  {x: 171, y: 245, rowY: 273, lineX: 97, hadWhiteDot: true},
  {x: 215, y: 274, rowY: 357, lineX: 286, hadWhiteDot: false},
  {x: 189, y: 281, rowY: 315, lineX: 286, hadWhiteDot: false},
  {x: 183, y: 245, rowY: 273, lineX: 260, hadWhiteDot: false},
] as const;

function LayerImage({image, box, opacity}: {image: string; box: Box; opacity: number}) {
  if (opacity === 0) return null;
  const [left, top, width, height] = box;
  return (
    <div style={{position: "absolute", left, top, width, height, opacity}}>
      <PortraitMedia media={{source: assetRoot + image, sourceStart: null}} style={{objectFit: "fill"}} />
    </div>
  );
}

function ServiceTierPyramid({spec}: {spec: ServiceTierPyramidSpec}) {
  const time = useSceneSeconds();
  const splitAge = time - spec.tiers.at;
  const splitProgress = ease((splitAge - .07) / .68);
  const layersOpacity = ease((splitAge + .02) / .26);
  const zoomAge = time - spec.peak.at;
  const zoomProgress = ease((zoomAge - .11) / .79);
  const settle = ease((zoomAge - 1.1) / 3.0);
  const modelScale = 1 + .55 * zoomProgress + .035 * settle;
  const cameraX = tween(176, 174, (zoomAge - .11) / .79);
  const cameraY = tween(225, 281, (zoomAge - .11) / .79);
  const introTitle = ease((splitAge + .09) / .23) * (1 - ease((zoomAge + .24) / .24));
  const peakTitle = ease((zoomAge + .045) / .28);
  const flash = Math.max(0, 1 - Math.abs(time - .49) / .23);
  const sheetLeft = 38 - 4 * splitProgress - 8.5 * (zoomProgress * .15 + settle * .85);
  const sheetTop = 133 - 5 * splitProgress - 10 * (zoomProgress * .25 + settle * .75);
  return (
    <div style={{...cover, background: "linear-gradient(#433e3b 0%,#2c2729 16%,#020202 35%,#414141 63%,#7e7e7e 87%)"}}>
      <div style={{position: "absolute", left: sheetLeft, top: sheetTop, width: 287 + 7 * splitProgress + 19 * zoomProgress, height: 301 + 10 * splitProgress + 25 * zoomProgress,
        boxShadow: "0 0 3px #f80000a9", background: "linear-gradient(158deg,#ff0000 0%,#f60000 51%,#b40609 84%,#d90000 100%)"}} />
      <div style={{position: "absolute", left: 17 - 16 * zoomProgress, top: 330 + 61 * splitProgress + 129 * zoomProgress,
        width: 298 + 60 * zoomProgress, height: 57 + 25 * zoomProgress, background: "#120607", borderRadius: "50%", filter: "blur(21px)", opacity: .66, transform: "rotate(12deg)"}}/>
      <div style={{...cover, transformOrigin: "left top", transform: `translate(${cameraX}px,${cameraY}px) scale(${modelScale}) translate(-176px,-225px)`}}>
        <LayerImage image="tiers-closed.png" box={[36, 194, 287, 196]} opacity={1 - layersOpacity} />
        {stages.map(({asset, narrowed, split}) => (
          <LayerImage key={asset} image={asset} opacity={layersOpacity}
            box={[
              narrowed[0] + (split[0] - narrowed[0]) * splitProgress,
              narrowed[1] + (split[1] - narrowed[1]) * splitProgress,
              narrowed[2] + (split[2] - narrowed[2]) * splitProgress,
              narrowed[3] + (split[3] - narrowed[3]) * splitProgress,
            ]} />
        ))}
      </div>
      {flash > 0 && (
        <div style={{position: "absolute", left: 59, top: 319, width: 12, height: 12, borderRadius: "50%",
          background: "radial-gradient(#fff 0%,#fff6 34%,transparent 71%)", boxShadow: "0 0 15px #ffffff40", opacity: flash}} />
      )}
      <div style={{position: "absolute", left: sheetLeft + 10, top: sheetTop + 12, opacity: introTitle, whiteSpace: "nowrap"}}>
        <div style={{color: "#fff", font: `bold 52px/53px ${displayFont}`, transform: "scaleX(.70)", transformOrigin: "left top"}}>{spec.tiers.label}</div>
        <div style={{color: "#140202", font: `italic 28px/27px ${roman}`}}>({spec.tiers.english})</div>
      </div>
      <div style={{position: "absolute", left: sheetLeft + 10, top: sheetTop + 11, opacity: peakTitle, whiteSpace: "nowrap"}}>
        <div style={{color: "#fff", font: `bold 52px/53px ${displayFont}`, transform: "scaleX(.70)", transformOrigin: "left top"}}>{spec.peak.label}</div>
        <div style={{color: "#140202", paddingLeft: 7, font: `italic 24px/19px ${roman}`}}>
          ({spec.peak.englishOne}<br />&nbsp;{spec.peak.englishTwo})
        </div>
      </div>
      <svg width="360" height="640" viewBox="0 0 360 640" style={cover}>
        {dots.map(({x, y, rowY, lineX, hadWhiteDot}, index) => {
          const px = cameraX + (x - 176) * modelScale;
          const py = cameraY + (y - 225) * modelScale;
          const reveal = ease((time - spec.labels[index].at) / .43);
          const ink = Math.round(255 * (1 - ease((zoomAge - .33) / .34)));
          return (
            <g key={index}>
              <circle cx={px} cy={py} r={3.35 * modelScale} fill={`rgb(255,${ink},${ink})`}
                opacity={hadWhiteDot ? layersOpacity : ease((zoomAge - .33) / .34)} />
              <path d={`M${px} ${py} L${lineX} ${rowY}`} fill="none" stroke="#f8d9d8" strokeWidth=".7" pathLength="1" strokeDasharray={`${reveal} 1`} opacity={reveal > 0 ? .93 : 0} />
              <text x={index < 3 ? 35 : 319} y={rowY + 1} fill="#f3d0d1" fontFamily={labels} fontSize="15.5" textAnchor={index < 3 ? "start" : "end"} opacity={ease((reveal - .52) / .48)}>{spec.labels[index].text}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const demo: PortraitDemo = {
  fps: 30,
  durationInFrames: 440,
  reference: "晚点LatePost · BV1dKaA6mEbK · 123.934–138.633",
  spec: {
    tiers: {label: "三个层级", english: "21 Touch Points", at: 3.08},
    peak: {label: "最上层", englishOne: "Most Important", englishTwo: "Touch Points", at: 5.32},
    labels: [
      {text: "隔音", at: 6.74},
      {text: "味道", at: 7.27},
      {text: "服务态度", at: 7.91},
      {text: "睡眠", at: 9.08},
      {text: "早餐", at: 9.57},
      {text: "退房效率", at: 10.14},
    ],
  } satisfies ServiceTierPyramidSpec,
};

export const serviceTierPyramid = {...serviceTierPyramidContract, Component: ServiceTierPyramid, demo} as const;
