import {Sequence, useVideoConfig} from "remotion";
import {clamp, PortraitMedia, type PortraitDemo} from "../../common";
import {assetRoot, mapFootageFrames, supplierMapContract, type SupplierMapSpec} from "./contracts";
import {progress, sans, Still, time30, useTime} from "./shared";
import mapMotion from "./map-motion.json";

type Bottle = {source: string; x: number; y: number; width: number; height: number; at: number};
type Site = {x: number; y: number; label: string; at: number; bottles: Bottle[]};

function Pin({site, time}: {site: Site; time: number}) {
  const label = progress(time, site.at, .22);
  const pin = progress(time, site.at + .035, .19);
  return <div style={{position: "absolute", left: site.x, top: site.y}}>
    {site.bottles.map(bottle => {
      const reveal = progress(time, bottle.at, .18);
      return <Still key={bottle.x} source={bottle.source} style={{left: bottle.x - site.x, top: bottle.y - site.y,
        width: bottle.width, height: bottle.height, opacity: reveal, transform: `translateY(${(1 - reveal) * 7}px)`}} />;
    })}
    <div style={{position: "absolute", left: -44, top: -44, width: 88, height: 20, textAlign: "center",
      font: `700 18px/20px ${sans}`, color: "white", whiteSpace: "nowrap",
      clipPath: `inset(0 ${(1 - label) * 100}% 0 0)`}}>
      <span style={{backgroundColor: "#090909", padding: "0 2px"}}>{site.label}</span>
    </div>
    <svg width="20" height="32" viewBox="0 0 20 32" style={{position: "absolute", left: -10, top: -11,
      opacity: pin, transform: `translateY(${(1 - pin) * -9}px)`}}>
      <path d="M10 0a10 10 0 0 0-10 10c0 8 8 21 10 21s10-13 10-21A10 10 0 0 0 10 0Zm0 6a3.3 3.3 0 1 1 0 6.6A3.3 3.3 0 0 1 10 6Z" fill="#fa060d" fillRule="evenodd" />
    </svg>
  </div>;
}
function SupplierMap({spec}: {spec: SupplierMapSpec}) {
  const time = useTime();
  const {fps} = useVideoConfig();
  const [scale, x, y] = mapMotion[Math.round(clamp(time * 30, 0, mapMotion.length - 1))];
  const sites: Site[] = [
    {x: 77, y: 469, label: spec.firstName, at: time30(122), bottles: [
      {source: spec.firstBottle, x: 51, y: 350, width: 26, height: 74, at: time30(125)},
      {source: spec.firstExtraBottle, x: 81, y: 346, width: 27, height: 78, at: time30(262)},
    ]},
    {x: 214, y: 361, label: spec.secondName, at: time30(351), bottles: [
      {source: spec.secondBottle, x: 190, y: 246, width: 28, height: 72, at: time30(355)},
      {source: spec.secondExtraBottle, x: 219, y: 262, width: 20, height: 56, at: time30(359)},
    ]},
    {x: 262, y: 422, label: spec.thirdName, at: time30(431), bottles: [
      {source: spec.thirdBottle, x: 250, y: 312, width: 25, height: 72, at: time30(435)},
    ]},
  ];
  return <div style={{position: "absolute", inset: 0, background: "#111"}}>
    <Sequence durationInFrames={Math.ceil(mapFootageFrames * fps / 30)} layout="none">
      <PortraitMedia media={{source: assetRoot + "bama-map.mp4", sourceStart: 0}} style={{position: "absolute", inset: 0}} />
    </Sequence>
    <div style={{position: "absolute", inset: 0, transformOrigin: "0 0", transform: `translate(${x}px,${y}px) scale(${scale})`}}>
      {sites.map(site => <Pin key={site.x} site={site} time={time} />)}
    </div>
  </div>;
}
const spec: SupplierMapSpec = {firstName: "巴马百年", secondName: "巴马和泰", thirdName: "巴马铂泉",
  firstBottle: assetRoot + "bottle-spring.png", firstExtraBottle: assetRoot + "bottle-alkaline.png",
  secondBottle: assetRoot + "bottle-mineral.png", secondExtraBottle: assetRoot + "bottle-purified.png",
  thirdBottle: assetRoot + "bottle-reserve.png"};
const demo: PortraitDemo = {spec, durationInFrames: mapFootageFrames, fps: 30, reference: "BV18ZeB62Eas · 111.58–128.69"};
export const supplierMap = {...supplierMapContract, Component: SupplierMap, demo} as const;


