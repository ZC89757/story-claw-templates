import {clamp, ease, PortraitMedia, type PortraitDemo} from "../../common";
import {assetRoot, charcoal, cover, displayFont, labels, useSceneSeconds} from "./shared";
import {bilateralExchangeContract, type BilateralExchangeSpec} from "./bilateral-exchange-contract";

const forward = "M155 154 C222 144 331 163 316 307";
const back = "M177 426 C123 422 73 400 47 325";
type Rect = readonly [number, number, number, number];

function Artwork({source, rect, opacity = 1, maskImage, transform}: {
  source: string;
  rect: Rect;
  opacity?: number;
  maskImage?: string;
  transform?: string;
}) {
  const [left, top, width, height] = rect;
  return (
    <div style={{position: "absolute", left, top, width, height, opacity, maskImage, transform}}>
      <PortraitMedia media={{source, sourceStart: null}} style={{objectFit: "contain"}} />
    </div>
  );
}

function Silhouette({title, image, center, art, rise}: {
  title: string; image: string; center: readonly [number, number]; art: Rect; rise: number;
}) {
  const [x, y] = center;
  const letters = Array.from(title).slice(0, Math.max(0, Math.floor((rise + .04) / .041))).join("");
  return (
    <>
      <div style={{position: "absolute", left: x - 78, top: y - 78, width: 156, height: 156, borderRadius: "50%",
        background: "linear-gradient(152deg,#d70808 0%,#ff0300 52%,#ef0803 90%)", boxShadow: "inset 0 0 1px #ff9674"}} />
      <Artwork source={image} rect={art} maskImage="linear-gradient(#000 73%,#000d 90%,#000a 100%)" />
      <div style={{position: "absolute", top: y + 39 + 10 * (1 - ease(rise / .17)), left: x - 79, width: 159, textAlign: "center", color: "#fcfaf8",
        font: `700 29px/1 ${displayFont}`, transform: "scale(.86,1.42)", transformOrigin: "center top", opacity: ease((rise + .04) / .19), whiteSpace: "nowrap"}}>{letters}</div>
    </>
  );
}

function IconDisc({image, caption, box, center, captionOrigin, age}: {
  image: string; caption: string; box: Rect; center: readonly [number, number]; captionOrigin: readonly [number, number]; age: number;
}) {
  const reveal = ease(age / .52);
  if (reveal === 0) return null;
  const [x, y] = center;
  const [left, top] = captionOrigin;
  return (
    <div style={{...cover, opacity: reveal, transform: `scale(${.36 + .64 * reveal})`, transformOrigin: `${x}px ${y}px`}}>
      <div style={{position: "absolute", left: x - 49, top: y - 49, width: 98, height: 98, borderRadius: "50%", background: "linear-gradient(#252525,#434343)"}} />
      <Artwork source={image} rect={box} />
      <div style={{position: "absolute", left, top, color: "#fff", font: `700 12px/16px ${labels}`, whiteSpace: "nowrap"}}>{caption}</div>
    </div>
  );
}

function CoinStack({age, left, top, tall, scatter}: {age: number; left: number; top: number; tall: boolean; scatter: -1 | 1}) {
  const rise = ease((age - .36) / .32);
  const asset = assetRoot + (tall ? "dual-coins-tall.png" : "dual-coins-short.png");
  if (age <= 0) return null;
  return (
    <>
      {Array.from({length: 3}, (_, index) => {
        const local = (age - index * .12) / .52;
        if (local <= 0 || local >= 1) return null;
        const travel = clamp(local);
        const x = left + scatter * (8 + index * 7) * Math.sin(Math.PI * travel);
        const y = top - (29 + index * 10) * Math.sin(Math.PI * travel) + 8;
        return (
          <div key={index} style={{position: "absolute", left: x, top: y, width: 28, height: 13, overflow: "hidden",
            transform: `rotate(${scatter * 360 * travel}deg) scaleX(${.38 + .62 * Math.abs(Math.cos(travel * 15))})`}}>
            <Artwork source={assetRoot + "dual-coins-tall.png"} rect={[0, -4, 28, 47]} />
          </div>
        );
      })}
      <Artwork source={asset} rect={[left, top, tall ? 42 : 44, tall ? 72 : 39]} opacity={rise}
        transform={`translateY(${-6 * (1 - rise)}px) scaleY(${.72 + .28 * rise})`} />
    </>
  );
}

function BilateralExchange({spec}: {spec: BilateralExchangeSpec}) {
  const time = useSceneSeconds();
  const departure = time - spec.outgoing.at;
  const returnAge = time - spec.returning.at;
  const outgoingPath = ease((departure + .16) / .82);
  const returnPath = ease((returnAge + .12) / .86);
  return (
    <div style={{...cover, background: charcoal}}>
      <svg viewBox="0 0 360 640" width="360" height="640" style={cover}>
        <defs>
          {[[forward, outgoingPath], [back, returnPath]].map(([path, draw], index) => (
            <mask key={index} id={`latepost-loop-line-${index}`} maskUnits="userSpaceOnUse" x="0" y="0" width="360" height="640">
              <path d={String(path)} fill="none" stroke="white" strokeWidth="5" pathLength="1" strokeDasharray={`${draw} 1`} />
            </mask>
          ))}
        </defs>
        <g fill="none" stroke="#b50a15" strokeWidth="1.4" strokeDasharray="2.5 3.4" opacity=".84">
          <path d={forward} mask="url(#latepost-loop-line-0)" opacity={outgoingPath > 0 ? 1 : 0} />
          <path d={back} mask="url(#latepost-loop-line-1)" opacity={returnPath > 0 ? 1 : 0} />
        </g>
        <path d="M316 307 L311 300 L320 301 Z" fill="#c20d16" opacity={ease((departure - .49) / .17)} />
        <path d="M47 324 L45 333 L53 331 Z" fill="#c20d16" opacity={ease((returnAge - .54) / .17)} />
      </svg>
      <Silhouette title={spec.supplier.label} image={spec.supplier.image} center={[103, 229]} art={[48, 109, 112, 196]} rise={time - .16} />
      <Silhouette title={spec.customer.label} image={spec.customer.image} center={[255, 385]} art={[177, 278, 148, 187]} rise={time - spec.customer.at} />
      <IconDisc image={spec.outgoing.image} caption={spec.outgoing.label} box={[238, 142, 45, 99]} center={[273, 204]} captionOrigin={[276, 204]} age={departure} />
      <IconDisc image={spec.returning.image} caption={spec.returning.label} box={[58, 362, 78, 65]} center={[92, 399]} captionOrigin={[58, 413]} age={returnAge} />
      <CoinStack age={departure - .62} left={169} top={431} tall={false} scatter={1} />
      <CoinStack age={departure - .48} left={300} top={398} tall scatter={-1} />
      <CoinStack age={returnAge - .73} left={154} top={232} tall scatter={1} />
    </div>
  );
}

const demo: PortraitDemo = {
  fps: 30,
  durationInFrames: 252,
  reference: "晚点LatePost · BV1V9J46SEd9 · 73.0–81.4",
  spec: {
    supplier: {label: "机器人公司", image: assetRoot + "dual-maker.png"},
    customer: {label: "数采工厂", image: assetRoot + "dual-factory.png", at: 1.55},
    outgoing: {label: "机器人", image: assetRoot + "dual-product.png", at: 3.53},
    returning: {label: "数据", image: assetRoot + "dual-data.png", at: 4.86},
  } satisfies BilateralExchangeSpec,
};

export const bilateralExchange = {...bilateralExchangeContract, Component: BilateralExchange, demo} as const;
