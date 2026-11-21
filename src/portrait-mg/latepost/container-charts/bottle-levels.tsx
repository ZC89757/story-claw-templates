import {Img, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {asset, type PortraitDemo} from "../../common";
import {chartCanvas, chartSvg, easeOut, numbers, progress, sans} from "./common";
import {bottleLevelContract, type BottleLevelSpec} from "./bottle-levels-contract";

const assetDirectory = "portrait-mg/latepost/container-charts/";
const exampleMark = (name: string) => assetDirectory + name + ".png";
const glass = exampleMark("bottle-glass");
const redLiquid = exampleMark("bottle-liquid");

const slots = [
  {x: 84.5, y: 172, bodyIn: 4, markIn: 8, markX: 39, markY: 261, markW: 35, markH: 40, fill: .67},
  {x: 178.7, y: 172, bodyIn: 6, markIn: 9, markX: 138, markY: 277, markW: 78, markH: 26, fill: .50},
  {x: 273.5, y: 172, bodyIn: 7, markIn: 8, markX: 277, markY: 258, markW: 51, markH: 52, fill: .49},
  {x: 73.7, y: 321, bodyIn: -1, markIn: 1, markX: 26, markY: 416, markW: 40, markH: 39, fill: .46},
  {x: 144.7, y: 321, bodyIn: 2, markIn: 2, markX: 98, markY: 417, markW: 41, markH: 39, fill: .47},
  {x: 214.7, y: 321, bodyIn: 3, markIn: 3, markX: 169, markY: 417, markW: 41, markH: 39, fill: .48},
  {x: 285.2, y: 321, bodyIn: 5, markIn: 3, markX: 238, markY: 417, markW: 40, markH: 39, fill: .50},
] as const;

function levelOffset(percent: number) {
  return Math.max(13, 110 - (1.8 + .925 * percent));
}

function LiquidLevel({percent, time, at, duration, left, top}: {
  percent: number; time: number; at: number; duration: number; left: number; top: number;
}) {
  const motion = interpolate(time - at, [0, duration * .22, duration * .44, duration * .69, duration],
    [0, .12, .63, .9, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const level = 110 - (110 - levelOffset(percent)) * motion;
  const ripple = Math.sin(motion * Math.PI) * 2.2;
  return <Img src={asset(redLiquid)} style={{
    position: "absolute", left, top, width: 37, height: 110,
    clipPath: `polygon(0 ${level + ripple}px,100% ${level - ripple}px,100% 100%,0 100%)`,
  }} />;
}

function Percentage({time, at, x, y, percent}: {time: number; at: number; x: number; y: number; percent: number}) {
  const opacity = progress(time, at, .23);
  return <text x={x} y={y + (1 - easeOut(opacity)) * 7} textAnchor="middle" fill="#fff"
    stroke="#161316" strokeWidth={.7} paintOrder="stroke fill" opacity={opacity}
    fontFamily={numbers} fontSize={30} fontWeight={700}>{percent}<tspan fontSize={25}>%</tspan></text>;
}

function Shelves() {
  return <svg width={360} height={640} style={chartSvg}>
    <defs>
      <linearGradient id="retail-shelf-rear" x2="0" y2="1" x1="0" y1="0">
        <stop stopColor="#161417" stopOpacity={.74} />
        <stop offset="1" stopColor="#242226" stopOpacity={.66} />
      </linearGradient>
    </defs>
    <rect x={1} y={281} width={358} height={20} fill="#979497" />
    <rect x={1} y={301} width={358} height={20} fill="#3b383c" />
    <rect x={1} y={321} width={358} height={82} fill="url(#retail-shelf-rear)" />
    <rect x={1} y={403} width={358} height={27.5} fill="#3d3a3e" fillOpacity={.62} />
    <rect x={1} y={430.5} width={358} height={20} fill="#9b989b" />
    <rect x={1} y={450.5} width={358} height={20} fill="#4d4a4e" />
    <rect x={1} y={470.5} width={358} height={81.5} fill="#302d31" fillOpacity={.53} />
  </svg>;
}

export function BottleLevels({spec}: {spec: BottleLevelSpec}) {
  const time = useCurrentFrame() / useVideoConfig().fps;
  const {upper, lower, comparison, lead, followers} = spec;
  const retailers = [upper.first, upper.second, upper.third, lower.first, lower.second, lower.third, lower.fourth];
  const fillAts = [lead.at, comparison.at + 2 / 30, comparison.at, comparison.at + 1 / 30, followers.at, followers.at + 1 / 30, followers.at + 3 / 30];

  let titleX = 0;
  return <div style={chartCanvas}>
    <Shelves />
    {slots.map((slot, index) => {
      const left = slot.x - 18.5;
      const opacity = easeOut(progress(time, slot.bodyIn / 30 - .035, .39));
      return <div key={slot.x} style={{position: "absolute", inset: 0, opacity}}>
        <Img src={asset(glass)} style={{position: "absolute", left, top: slot.y, width: 37, height: 110}} />
        <LiquidLevel percent={retailers[index].percent} time={time} at={fillAts[index]} duration={slot.fill} left={left} top={slot.y} />
      </div>;
    })}
    {slots.map((slot, index) => {
      const entrance = progress(time, slot.markIn / 30, .24);
      const scale = interpolate(entrance, [0, .72, 1], [0, 1.06, 1]);
      return <Img key={slot.x} src={asset(retailers[index].mark)} style={{
        position: "absolute", left: slot.markX, top: slot.markY, width: slot.markW, height: slot.markH,
        objectFit: "contain", transform: `scale(${scale})`, opacity: progress(time, slot.markIn / 30, .09),
      }} />;
    })}
    <svg width={360} height={640} style={chartSvg}>
      <g transform="translate(27.5 0) scale(.965 1)" fill="#fcfbfc" fontFamily={sans} fontSize={22} fontWeight={700}>
        {[...spec.title].map((character, index) => {
          const reveal = progress(time, (index * .6 + 1) / 30, .12);
          const x = titleX;
          titleX += character === " " ? 7 : 22;
          return <text key={index} x={x} y={132 + (1 - easeOut(reveal)) * 6} opacity={reveal}>{character}</text>;
        })}
      </g>
      <text x={28} y={153.5} fill="#a39fa2" fontFamily={sans} fontSize={12} fontStyle="italic"
        opacity={progress(time, 7 / 30, .19)}>{spec.sourceNote}</text>
      {slots.map((slot, index) => <Percentage key={slot.x} time={time}
        at={fillAts[index] + (index === 0 ? .26 : .025)} x={slot.x}
        y={slot.y + levelOffset(retailers[index].percent) - 4} percent={retailers[index].percent} />)}
    </svg>
  </div>;
}

const demo: PortraitDemo = {
  fps: 30,
  durationInFrames: 240,
  reference: "晚点 LatePost · BV18ZeB62Eas · 65.280–73.300",
  spec: {
    title: "各零售渠道 自有品牌销售额占比",
    sourceNote: "数据来源：《2026 中国购物者报告》",
    upper: {
      first: {mark: exampleMark("aldi"), percent: 90},
      second: {mark: exampleMark("costco"), percent: 41},
      third: {mark: exampleMark("sams"), percent: 38},
    },
    lower: {
      first: {mark: exampleMark("hema"), percent: 35},
      second: {mark: exampleMark("walmart"), percent: 13},
      third: {mark: exampleMark("yonghui"), percent: 8},
      fourth: {mark: exampleMark("retail-red"), percent: 4},
    },
    comparison: {at: 11 / 30},
    lead: {at: 94 / 30},
    followers: {at: 186 / 30},
  } satisfies BottleLevelSpec,
};

export const bottleLevels = {...bottleLevelContract, Component: BottleLevels, demo};
