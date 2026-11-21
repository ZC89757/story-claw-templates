import {useVideoConfig} from "remotion";
import type {PortraitDemo} from "../../common";
import {clamp} from "../../common";
import {terrainContract, type TerrainSpec} from "./terrain-contract";
import {assetRoot, Cutout, Layer, lerp, phase, song, useSeconds} from "./shared";

// The first three coordinates describe the car, followed by the grade from left to right.
const motion: readonly (readonly number[])[] = [
  [0, -292, 343, 0, 490, 490, 490, 490, 490, 490, 490],
  [.16, -245, 343, 0, 490, 490, 490, 490, 490, 490, 490],
  [.64, 28, 343, 0, 478, 478, 478, 478, 478, 478, 478],
  [2.18, 34, 343, 0, 482, 482, 482, 476, 464, 451, 428],
  [2.96, 30, 346, -5, 465, 465, 458, 450, 439, 424, 407],
  [3.64, 22, 349, -18, 456, 461, 443, 415, 398, 385, 354],
  [4.30, 24, 330, -22, 426, 423, 405, 381, 365, 351, 329],
  [4.96, 17, 308, -23, 430, 414, 401, 384, 357, 326, 307],
  [5.63, 32, 288, -23, 393, 378, 364, 347, 325, 312, 310],
  [6.30, 39, 312, -9, 390, 362, 350, 346, 343, 349, 359],
  [6.97, 39, 312, 0, 410, 379, 366, 368, 376, 392, 416],
  [7.63, 39, 309, 6, 343, 330, 344, 359, 375, 402, 442],
  [8.30, 48, 315, 16, 322, 329, 341, 360, 386, 426, 496],
  [8.96, 63, 344, 23, 330, 339, 352, 384, 433, 498, 522],
  [9.63, 70, 352, 30, 328, 336, 356, 394, 448, 500, 537],
  [10.30, 78, 371, 34, 359, 366, 389, 443, 495, 535, 553],
  [10.96, 77, 372, 34, 333, 369, 425, 470, 507, 523, 545],
  [11.63, 74, 371, 33, 332, 368, 425, 476, 511, 526, 552],
  [12.30, 72, 386, 23, 325, 377, 468, 488, 510, 550, 568],
  [13.00, 72, 393, 19, 317, 382, 469, 492, 509, 550, 583],
  [14.03, 69, 405, 18, 342, 426, 485, 519, 547, 569, 590],
];
const groundX = [-3, 58, 118, 179, 239, 299, 363];
const originalBeats = [0, 2.26, 4.34, 6.44, 7.36, 10.67, 14.033];
function atReferenceTime(time: number, destinations: readonly number[], source: readonly number[]) {
  const segment = destinations.findIndex((boundary, index) => index > 0 && time <= boundary);
  if (segment === -1) return source[source.length - 1];
  const progress = clamp((time - destinations[segment - 1]) / (destinations[segment] - destinations[segment - 1]));
  return lerp(source[segment - 1], source[segment], progress);
}

function Copy({text, time, start, end, side, red = false, top = 127, size = 88}: {
  text: string; time: number; start: number; end?: number; side: "center" | "right"; red?: boolean; top?: number; size?: number;
}) {
  const width = [...text].length * size * .43;
  return <div style={{position: "absolute", left: side === "center" ? (360 - width) / 2 : 349 - width, top,
    width, whiteSpace: "nowrap", color: red ? "#eb0008" : "#fff", fontFamily: song, fontSize: size,
    fontWeight: 900, letterSpacing: -2, lineHeight: 1, transform: "scaleX(.43)",
    transformOrigin: "top left", opacity: end === undefined ? 1 : 1 - phase(time, end, .37)}}>
    {[...text].map((char, index) => {
      const p = phase(time, start + index * .052, .16);
      return <span key={index} style={{display: "inline-block", opacity: p,
        transform: `translateY(${(1 - p) * 14}px)`, filter: `blur(${(1 - p) * 3}px)`}}>{char}</span>;
    })}
  </div>;
}
function CurveTerrain({spec}: {spec: TerrainSpec & {_duration?: number}}) {
  const seconds = useSeconds();
  const {durationInFrames, fps} = useVideoConfig();
  const timeline = [0, spec.climb.at, spec.gains.at, spec.reversal.at, spec.burden.at, spec.cost.at, spec._duration ?? durationInFrames / fps];
  const time = atReferenceTime(seconds, timeline, originalBeats);
  const [x, y, pitch, ...heights] = motion[0].slice(1).map((_, index) =>
    atReferenceTime(time, motion.map(row => row[0]), motion.map(row => row[index + 1])));
  const visibility = phase(time, 2.27, .56);
  const reverse = phase(time, 6.14, .48);
  const edge = groundX.map((value, index) => `${index ? "L" : "M"}${value} ${heights[index] + (1 - visibility) * 49}`).join(" ");
  const reversedColor = (red: number, green: number, blue: number, gray: number) =>
    `rgb(${lerp(red, gray, reverse)} ${lerp(green, gray, reverse)} ${lerp(blue, gray, reverse)})`;
  return <Layer style={{background: `linear-gradient(#000 0%,#000 23%,rgb(${19 * visibility} ${19 * visibility} ${19 * visibility}) 54%,#000 100%)`}}>
    <svg width={360} height={640} style={{position: "absolute", inset: 0, opacity: visibility}}>
      <defs>
        <linearGradient id="curve-terrain-fill" x1="0" x2="0" y1="0" y2="1">
          <stop stopColor={reversedColor(173, 0, 3, 104)}/>
          <stop offset="1" stopColor={reversedColor(94, 41, 43, 82)}/>
        </linearGradient>
      </defs>
      <path d={edge + " L363 642 L-3 642Z"} fill="url(#curve-terrain-fill)"/>
      <path d={edge} stroke={reversedColor(255, 0, 0, 135)} strokeWidth={13} strokeLinejoin="round" fill="none"/>
    </svg>
    <div style={{position: "absolute", left: x, top: y, width: 290, height: 113, transform: `rotate(${pitch}deg)`, transformOrigin: "50% 53%"}}>
      <Cutout source={spec.vehicle} x={0} y={0} width={290} height={113}/>
    </div>
    <Copy text={spec.opening} time={time} start={.17} end={1.66} side="center"/>
    <Copy text={spec.gains.text} time={time} start={4.34} end={6.22} side="right" top={127} size={83}/>
    <Copy text={spec.burden.text} time={time} start={7.36} side="right" red top={105} size={86}/>
    <Copy text={spec.cost.text} time={time} start={10.67} side="right" red top={193} size={86}/>
  </Layer>;
}
const demoSpec: TerrainSpec = {
  vehicle: assetRoot + "side-car.png", opening: "自制零部件", climb: {at: 2.26},
  gains: {text: "赚走所有零部件钱", at: 4.34}, reversal: {at: 6.44},
  burden: {text: "巨大的负担", at: 7.36}, cost: {text: "两万折旧成本", at: 10.67},
};
const demo: PortraitDemo = {spec: demoSpec, durationInFrames: 421, fps: 30, reference: "BV1WaHN6GEuN · 135.200–149.267"};
export const curveTerrain = {...terrainContract, Component: CurveTerrain, demo} as const;

