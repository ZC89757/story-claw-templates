import {PortraitMedia, type PortraitDemo} from "../../common";
import {charcoal, cover, demoAsset, reference, roman, travel, useSeconds} from "./shared";
import {phonesContract, type PhonesSpec} from "./phones-contract";

type Side = "left" | "right";
type Position = {x: number; y: number; angle: number; scale: number};
const initial: Record<Side, Position> = {
  right: {x: 139, y: 107, angle: -8, scale: 1},
  left: {x: -204, y: 159, angle: 14, scale: 1},
};
const foreground: Record<Side, Position> = {
  right: {x: 206, y: 78, angle: -8, scale: 1},
  left: {x: 28, y: 68, angle: 5, scale: 1.01},
};
const background: Record<Side, Position> = {
  right: {x: 239, y: 128, angle: -4, scale: .98},
  left: {x: -37, y: 132, angle: -4, scale: .99},
};
function pose(side: Side, stage: number): Position {
  if (stage < 0) return initial[side];
  return (stage % 2 === 0 ? side === "left" : side === "right") ? foreground[side] : background[side];
}

function Phone({side, spec, stage, seconds}: {side: Side; spec: PhonesSpec; stage: number; seconds: number}) {
  const {room, rounds, initialPrice} = spec;
  const before = pose(side, stage - 1);
  const after = pose(side, stage);
  const progress = stage < 0 ? 1 : travel((seconds - rounds[stage].at) / .43);
  const fromTo = (key: keyof Position) => before[key] + (after[key] - before[key]) * progress;
  const entries = rounds.filter((_, index) => index <= stage && index % 2 === (side === "left" ? 0 : 1));
  const newest = entries.at(-1);
  const previous = entries.at(-2)?.price ?? (side === "right" ? initialPrice : newest?.price);
  const ticker = newest ? travel((seconds - newest.at) / .33) : 1;
  const info = [`▣ ${room.area}`, `▱ ${room.bed}`, `♙ ${room.guests}`, `◈ ${room.amenity}`];
  const active = stage < 0 ? side === "right" : stage % 2 === 0 ? side === "left" : side === "right";
  const logo = side === "left" ? spec.leftLogo : spec.rightLogo;

  return <div style={{position: "absolute", zIndex: active ? 2 : 1, left: fromTo("x"), top: fromTo("y"), width: 158, height: 374,
    transform: `rotate(${fromTo("angle")}deg) scale(${fromTo("scale")})`}}>
    <div style={{position: "absolute", zIndex: 1, left: side === "right" ? -34 : -81, top: 103, width: 274, height: 390,
      transform: side === "left" ? "scaleX(-1)" : undefined, pointerEvents: "none"}}>
      <PortraitMedia media={{source: demoAsset("phone-hand.png"), sourceStart: null}} style={{objectFit: "fill"}}/>
    </div>
    <div style={{...cover, borderRadius: 25, overflow: "hidden", border: "3px solid #454548",
      boxShadow: "0 3px 6px #000b,inset 1px 1px 1px #eee", background: "#080808", padding: 5}}>
      <div style={{position: "relative", width: "100%", height: "100%", borderRadius: 18, overflow: "hidden", background: "#f4f3f2", color: "#161616", fontFamily: '"Microsoft YaHei",sans-serif'}}>
        <div style={{width: "100%", height: 175, overflow: "hidden"}}>
          <PortraitMedia media={{source: room.photo, sourceStart: null}} style={{filter: "grayscale(1)"}}/>
        </div>
        <div style={{margin: "7px 8px 0", fontWeight: 750, fontSize: 12, whiteSpace: "nowrap"}}>{room.name}</div>
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 2px", margin: "7px 8px", fontSize: 7.4, color: "#505050", whiteSpace: "nowrap"}}>
          {info.map(value => <div key={value}>{value}</div>)}
        </div>
        <div style={{position: "absolute", left: 8, top: 262, width: 127, height: 38, overflow: "hidden"}}>
          {[newest?.price ?? initialPrice, previous].map((price, index) => {
            if (index === 1 && ticker >= 1) return null;
            return <div key={index} style={{position: "absolute", top: (index - 1 + ticker) * 38, left: 0,
              display: "flex", alignItems: "baseline", color: "#bd1023", whiteSpace: "nowrap", font: `italic 34px/39px ${roman}`}}>
              <span style={{font: "bold 11px sans-serif", marginRight: 2}}>¥</span>{price}<span style={{font: "8px sans-serif", color: "#4b4b4b"}}>/晚</span>
            </div>;
          })}
        </div>
        <div style={{position: "absolute", left: "27%", top: 0, width: "46%", height: 10, borderRadius: "0 0 9px 9px", background: "#0a0a0a"}}/>
        <div style={{position: "absolute", display: "flex", alignItems: "center", gap: 4, top: 314, left: 7, height: 25, whiteSpace: "nowrap", fontSize: 7.4}}>
          <div style={{width: 54, height: 21}}><PortraitMedia media={{source: logo, sourceStart: null}} style={{objectFit: "contain"}}/></div>
          调价助手<span style={{color: "#d60610", background: "#f6c0c4", borderRadius: 6, width: 21, lineHeight: "8px"}}>●</span>
        </div>
      </div>
    </div>
  </div>;
}

function DuelingPhones({spec}: {spec: PhonesSpec}) {
  const seconds = useSeconds();
  const stage = spec.rounds.filter(({at}) => seconds >= at).length - 1;
  return <div style={{...cover, background: charcoal}}>
    <Phone side="left" spec={spec} stage={stage} seconds={seconds}/>
    <Phone side="right" spec={spec} stage={stage} seconds={seconds}/>
  </div>;
}

const demo: PortraitDemo = {
  spec: {
    room: {photo: demoAsset("phone-room.png"), name: "山景大床房", area: "38m²", bed: "大床1.8m", guests: "2人入住", amenity: "免费Wi-Fi"},
    rightLogo: demoAsset("phone-meituan.png"), leftLogo: demoAsset("phone-ctrip.png"), initialPrice: 300,
    rounds: [{price: 290, at: 3.5}, {price: 280, at: 6.4}, {price: 270, at: 8.05}, {price: 260, at: 9.3}, {price: 250, at: 10.48}, {price: 240, at: 12.45}],
  },
  durationInFrames: 402, fps: 30, reference: reference("V08_004"),
};

export const duelingPhones = {...phonesContract, Component: DuelingPhones, demo} as const;
