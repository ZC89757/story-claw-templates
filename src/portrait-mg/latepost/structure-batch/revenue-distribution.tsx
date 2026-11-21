import {ease, PortraitMedia, type PortraitDemo} from "../../common";
import {assetRoot, charcoal, cover, displayFont, labels, roman, useSceneSeconds} from "./shared";
import {revenueDistributionContract, type RevenueDistributionSpec} from "./revenue-distribution-contract";

const placements = {
  upstream: {photo: [28, 107, 94], text: [66, 181, 21]},
  broker: {photo: [118, 211, 108], text: [196, 269, 43]},
  factory: {photo: [71, 348, 96], text: [66, 421, 21]},
  worker: {photo: [186, 381, 96], text: [254, 423, 21]},
} as const;
const price = (value: number) => String(Number(value.toFixed(2)));

function Rail({d, arrow, progress}: {d: string; arrow: string; progress: number}) {
  if (progress === 0) return null;
  return (
    <>
      <path d={d} fill="none" stroke="#d6d2cf" strokeWidth=".82" pathLength="1" strokeDasharray={`${progress} 1`} opacity=".92"/>
      <path d={arrow} fill="#f6f4ef" opacity={ease((progress - .77) / .23)} />
    </>
  );
}

function RevenueDistribution({spec}: {spec: RevenueDistributionSpec}) {
  const time = useSceneSeconds();
  const ready = ease(time / .063);
  const purchase = time - spec.purchase.at;
  const worker = time - spec.workerPay.at;
  const factory = time - spec.factoryPay.at;
  const margin = time - spec.margin.at;
  const equipment = time - spec.equipment.at;
  const hours = time - spec.hours.at;
  const deposit = time - spec.deposit.at;
  const expand = time - spec.expand.at;
  const retained = spec.purchase.rate - spec.workerPay.rate - spec.factoryPay.rate;
  const revenue = retained * spec.hours.count;
  const depositText = spec.deposit.amount >= 10000 ? price(spec.deposit.amount / 10000) + "万" : spec.deposit.amount + "元";
  const numberAttrs = {fontFamily: roman, fontStyle: "italic" as const, fontSize: 14.4};
  const groups = Object.keys(placements) as (keyof typeof placements)[];
  return (
    <div style={{...cover, background: charcoal}}>
      <svg width="360" height="640" viewBox="0 0 360 640" style={cover}>
        <Rail d="M124 201 H278 V270" arrow="M276 265 L278 271 L281 265 L278 266 Z" progress={ease((purchase + .21) / .57)}/>
        <Rail d="M278 325 V419" arrow="M275 414 L278 420 L281 414 L278 415 Z" progress={ease(worker / .61)}/>
        <Rail d="M278 338 H67 V418" arrow="M64 413 L67 419 L70 413 L67 414 Z" progress={ease(factory / .58)}/>
        <Rail d="M67 212 V269 H113" arrow="M107 266 L114 269 L107 272 L109 269 Z" progress={ease(equipment / .55)}/>
        <Rail d="M115 261 H76 V212" arrow="M73 218 L76 211 L79 218 L76 216 Z" progress={ease(deposit / .47)}/>
      </svg>
      {groups.map(role => {
        const {photo: [x, y, size], text: [left, top, font]} = placements[role];
        const item = spec[role];
        return (
          <div key={role} style={{...cover, opacity: ready}}>
            <div style={{position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", overflow: "hidden"}}>
              <PortraitMedia media={{source: item.photo, sourceStart: null}} style={{filter: "grayscale(1)"}} />
            </div>
            <div style={{position: "absolute", left, top, font: `700 ${font}px/1 ${displayFont}`, color: "#f10000",
              transform: "scaleX(.84) scaleY(1.27)", transformOrigin: "left top", whiteSpace: "nowrap"}}>{item.name}</div>
          </div>
        );
      })}
      <svg width="360" height="640" viewBox="0 0 360 640" style={cover}>
        <g fill="#faf9f7" fontFamily={labels} fontSize="10.5">
          <g opacity={ease(purchase / .36)}>
            <text x="232" y="195">{spec.purchase.label}</text>
            <text x="228" y="221"><tspan {...numberAttrs}>{price(spec.purchase.rate)}</tspan>元/小时</text>
          </g>
          <text x="232" y="373" opacity={ease(worker / .48)}><tspan {...numberAttrs}>{price(spec.workerPay.rate)}</tspan>元/小时</text>
          <text x="65" y="332" opacity={ease(factory / .43)}><tspan {...numberAttrs}>{price(spec.factoryPay.rate)}</tspan>元/小时/人</text>
          <text x="284" y="289" opacity={ease(margin / .27)}><tspan {...numberAttrs}>{price(retained)}</tspan>元/小时</text>
          <g opacity={ease(hours / .43)}>
            <text x="284" y="309"><tspan {...numberAttrs}>{spec.hours.count}</tspan>小时</text>
            <text x="299" y="316" fontSize="9">=</text>
          </g>
          <text x="284" y="327" opacity={ease((hours - 1.25) / .34)} fill="#f40000" fontWeight="700">
            <tspan {...numberAttrs}>{price(expand > 1.27 ? revenue * spec.expand.multiplier : revenue)}</tspan>元
          </text>
          <text x={expand > .64 ? 58 : 66} y="286" opacity={ease(equipment / .41)} fill={expand > .64 ? "#f40000" : undefined}>
            <tspan {...numberAttrs}>{expand > .64 ? spec.equipment.count * spec.expand.multiplier : spec.equipment.count}</tspan>台设备
          </text>
          <text x="78" y="255" opacity={ease(deposit / .41)}>押金<tspan {...numberAttrs}>{depositText}</tspan></text>
        </g>
      </svg>
    </div>
  );
}

const demo: PortraitDemo = {
  fps: 30,
  durationInFrames: 739,
  reference: "晚点LatePost · BV1V9J46SEd9 · 154.0333125–178.6666875",
  spec: {
    upstream: {name: "上游公司", photo: assetRoot + "fees-upstream.png"},
    broker: {name: "匡志成", photo: assetRoot + "fees-middle.png"},
    factory: {name: "工厂老板", photo: assetRoot + "fees-factory.png"},
    worker: {name: "工人", photo: assetRoot + "fees-worker.png"},
    purchase: {label: "收购数据", rate: 25, at: .77},
    workerPay: {rate: 15, at: 3.20},
    factoryPay: {rate: 5, at: 4.53},
    margin: {at: 6.22},
    equipment: {count: 50, at: 8.02},
    hours: {count: 3000, at: 11.18},
    deposit: {amount: 100000, at: 16.86},
    expand: {multiplier: 10, at: 19.43},
  } satisfies RevenueDistributionSpec,
};

export const revenueDistribution = {...revenueDistributionContract, Component: RevenueDistribution, demo} as const;
