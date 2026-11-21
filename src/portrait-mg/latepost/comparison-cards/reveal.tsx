import {clamp, ease, PortraitMedia, type PortraitDemo} from "../../common";
import {cover, demoAsset, reference, roman, song, travel, useSeconds} from "./shared";
import {scrollCardsContract, tableRevealContract, type ScrollCardsSpec, type TableRevealSpec} from "./reveal-contract";

const outlines = [
  {x: -58, y: 245, angle: 43}, {x: 24, y: 318, angle: 14}, {x: 94, y: 351, angle: -10},
  {x: 186, y: 335, angle: 13}, {x: 250, y: 315, angle: -17}, {x: 328, y: 246, angle: 29},
];

function TableReveal({spec}: {spec: TableRevealSpec}) {
  const seconds = useSeconds();
  const rise = travel(seconds / .34);
  const pair = travel((seconds - .12) / .52);
  const reveal = travel((seconds - spec.hidden.at) / .33);
  const leave = ease((seconds - spec.hidden.at - .08) / .28);
  return <div style={{...cover, background: "#030303"}}>
    <div style={{...cover, transform: `translateY(${(1 - rise) * 740}px)`}}>
      <div style={{position: "absolute", width: 654, height: 790, left: -147, top: -222, borderRadius: "50%",
        background: "#81413b", boxShadow: "0 7px 18px #000"}}>
        <div style={{position: "absolute", inset: "0 0 14px", borderRadius: "50%", background: "#06452c"}}/>
        <div style={{position: "absolute", inset: "0 9px 41px", borderRadius: "50%", background: "radial-gradient(ellipse at 50% 55%,#10673f,#05603b 55%,#084f37)"}}/>
      </div>
      {outlines.map(({x, y, angle}, index) => <div key={index} style={{position: "absolute", left: x, top: y + Math.sin(seconds * 1.9 + index) * 7,
        transform: `rotate(${angle + Math.sin(seconds * 1.4 + index) * 6}deg)`, width: 66, height: 114, borderRadius: 10, border: "1px solid #70b69843"}}/>)}
      <div style={{position: "absolute", width: 360, top: 103, color: "#6cbb8b", opacity: .48 * ease((seconds - .21) / .28),
        textAlign: "center", font: '900 103px/1 "Microsoft YaHei",sans-serif', transform: "scale(.94,1.23)"}}>{spec.heading}</div>
    </div>
    {[
      {item: spec.left, x: 43, y: 262, angle: -27, entryX: -144, direction: -1},
      {item: spec.right, x: 183, y: 265, angle: 28, entryX: 146, direction: 1},
    ].map(({item, x, y, angle, entryX, direction}, index) =>
      <PlayingCard key={index} {...item} x={x + entryX * (1 - pair) + direction * 37 * leave}
        y={y + (1 - pair) * 370 + leave * 50 + Math.sin(seconds * 3 + index) * 4}
        angle={angle + (1 - pair) * direction * 20 + leave * direction * 18} opacity={1 - leave}/>)}
    <PlayingCard {...spec.hidden} x={109} y={184 + (1 - reveal) * 203}
      angle={7 + (1 - reveal) * 19} opacity={clamp(reveal * 2)} mystery/>
  </div>;
}

function PlayingCard({label, figure, x, y, angle, opacity, mystery}: {
  label: string; figure: string; x: number; y: number; angle: number; opacity: number; mystery?: boolean;
}) {
  const width = mystery ? 169 : 144;
  const height = mystery ? 240 : 199;
  return <div style={{position: "absolute", left: x, top: y, width, height,
    border: "2px solid #080706", borderRadius: 16, background: "#f9f4f0", color: "#1d1615",
    boxShadow: "1px 3px 0 #070706", transform: `rotate(${angle}deg)`, opacity, overflow: "hidden"}}>
    <div style={{position: "absolute", inset: 13, border: "1px solid #98888350", borderRadius: 9, overflow: "hidden"}}>
      <div style={{...cover, background: mystery
        ? "radial-gradient(#2a1517 1px,transparent 1.6px) 0 90%/6px 6px" : "repeating-linear-gradient(36deg,transparent 0 25px,#611e251c 26px,transparent 27px 38px)",
        maskImage: mystery ? "linear-gradient(transparent 40%,#000 66%)" : undefined}}/>
      <div style={{position: "absolute", top: 19, left: 2, color: "#6c1723", whiteSpace: "nowrap",
        font: mystery ? `bold 64px/1.1 ${song}` : `bold 53px/1 ${roman}`, transform: mystery ? undefined : "scaleX(.8)", transformOrigin: "left"}}>
        {label}
      </div>
      <div style={{position: "absolute", left: -5, right: -2, bottom: 0, height: "88%"}}>
        <PortraitMedia media={{source: figure, sourceStart: null}} style={{objectFit: "contain", objectPosition: "bottom"}}/>
      </div>
    </div>
    <div style={{position: "absolute", left: 12, top: 11, color: "#2f2220", paddingRight: 3, background: "#f9f4f0",
      font: `bold ${mystery ? 17 : 9}px/1 ${roman}`}}>{mystery ? "?" : label}</div>
  </div>;
}

function ScrollCards({spec}: {spec: ScrollCardsSpec}) {
  const seconds = useSeconds();
  return <div style={{...cover, background: "linear-gradient(#202020,#363636 16%,#080808 76%,#010101)"}}>
    <div style={{position: "absolute", top: 93, left: 0, width: 360, height: 392, overflow: "hidden",
      maskImage: "linear-gradient(transparent,black 11%,black 58%,transparent 100%)"}}>
      <PortraitMedia media={spec.background}/>
    </div>
    <div style={{...cover, background: "radial-gradient(ellipse at 50% 36%,#0008 7%,#08080872 31%,#020202d8 65%,#000 91%)"}}/>
    {[spec.first, spec.second].map((card, index) => {
      const progress = travel((seconds - (index ? spec.second.at : 0)) / .45);
      return <div key={index} style={{position: "absolute", left: index ? 199 : 30, top: 204, width: 134,
        transform: `translateY(${(1 - progress) * 422}px)`, opacity: clamp(progress * 2)}}>
        <div style={{position: "relative", width: 134, height: 134, overflow: "hidden", background: "linear-gradient(145deg,#f4271a,#de1711 55%,#ce0c0b)"}}>
          <div style={{position: "absolute", inset: "15px 0 0 12px"}}>
            <PortraitMedia media={{source: card.figure, sourceStart: null}} style={{objectFit: "contain", objectPosition: "bottom right"}}/>
          </div>
          <div style={{position: "absolute", left: 13, top: 0, font: `bold 43px/1 ${roman}`, color: "#fff9f3"}}>{index + 1}</div>
          <div style={{position: "absolute", left: 13, top: 54, width: 81, height: 1.1, background: "#910a05", transformOrigin: "left", transform: "rotate(-28deg)"}}/>
        </div>
        <div style={{textAlign: "center", font: `bold 24px/1.2 ${song}`, color: "white", whiteSpace: "nowrap", marginTop: 2,
          transform: "scaleX(.87)", textShadow: "1px 2px 1px #000"}}>
          {card.label}
        </div>
      </div>;
    })}
  </div>;
}

const tableDemo: PortraitDemo = {
  spec: {
    heading: "互联网",
    left: {label: "Takeout", figure: demoAsset("table-delivery.png")},
    right: {label: "AIGC", figure: demoAsset("table-astronaut.png")},
    hidden: {label: "巨头", figure: demoAsset("table-mystery.png"), at: 3.31},
  },
  durationInFrames: 175, fps: 30, reference: reference("V11_001"),
};
const scrollDemo: PortraitDemo = {
  spec: {
    background: {source: demoAsset("comparison-scroll.mp4"), sourceStart: 0},
    first: {label: "开更多分公司", figure: demoAsset("steps-coverage.png")},
    second: {label: "关键性压价", figure: demoAsset("steps-price.png"), at: 2.35},
  },
  durationInFrames: 141, fps: 30, reference: reference("V11_003"),
};

export const tableReveal = {...tableRevealContract, Component: TableReveal, demo: tableDemo} as const;
export const scrollCards = {...scrollCardsContract, Component: ScrollCards, demo: scrollDemo} as const;
