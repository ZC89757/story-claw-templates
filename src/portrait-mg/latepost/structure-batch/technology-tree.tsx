import {ease, PortraitMedia, type PortraitDemo} from "../../common";
import {assetRoot, charcoal, cover, displayFont, labels, useSceneSeconds} from "./shared";
import {technologyTreeContract, type TechnologyTreeSpec} from "./technology-tree-contract";

function Cutout({source, box, amount}: {
  source: string;
  box: readonly [number, number, number, number];
  amount: number;
}) {
  if (amount === 0) return null;
  const [left, top, width, height] = box;
  return (
    <div style={{position: "absolute", left, top, width, height, opacity: amount,
      transform: `translateY(${8 * (1 - amount)}px) scale(${.84 + .16 * amount})`}}>
      <PortraitMedia media={{source, sourceStart: null}} style={{objectFit: "contain"}} />
    </div>
  );
}

function TechnologyTree({spec}: {spec: TechnologyTreeSpec}) {
  const time = useSceneSeconds();
  const upper = time - spec.upperProduct.at;
  const lower = time - spec.lowerBranch.at;
  const zoomAge = time - spec.zoom.at;
  const zoom = ease(zoomAge / .73);
  const slide = ease((zoomAge - .29) / 4.7);
  const upperPad = ease((upper - .18) / .48);
  const lowerPad = ease((lower - .36) / .47);
  const x = -122 * zoom - 16 * slide;
  const y = -160 * zoom;
  const scale = 1 + .39 * zoom;
  return (
    <div style={{...cover, background: charcoal}}>
      <div style={{...cover, transform: `translate(${x}px,${y}px) scale(${scale})`, transformOrigin: "left top"}}>
        <div style={{position: "absolute", left: 61, top: 38 - 16 * (1 - ease((time + .12) / .64)), color: "#4f4d4d",
          font: `bold 87px/.97 ${displayFont}`, whiteSpace: "nowrap", transform: "scale(.72,1.25)", transformOrigin: "left top",
          opacity: ease((time + .16) / .65)}}>{spec.title}</div>
        <svg width="360" height="640" viewBox="0 0 360 640" style={{...cover, overflow: "visible"}}>
          <defs>
            <linearGradient id="latepost-chip-stage" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#b90000" stopOpacity=".13" /><stop offset=".44" stopColor="#d80000" stopOpacity=".65" /><stop offset="1" stopColor="#ff0306" />
            </linearGradient>
          </defs>
          <g fill="none" stroke="#aa080d" strokeWidth="1.35">
            {([
              ["M113 125 V110 H243 V125", ease((time - .58) / .42)],
              ["M243 148 V232 M243 154 H326 V170", ease((upper + .13) / .33)],
              ["M113 148 V273 M113 154 H39 V171 M113 154 H144 V171", ease((upper - .54) / .43)],
              ["M113 291 V330 H39 V350 M113 330 H243 V402", ease((lower - .08) / .58)],
            ] as const).map(([path, progress]) => (
              <path key={path} d={path} pathLength="1" strokeDasharray={`${progress} 1`} opacity={progress === 0 ? 0 : .84} />
            ))}
          </g>
          <circle cx="243" cy="231" r={61 * upperPad} fill="url(#latepost-chip-stage)" opacity={upperPad} />
          <circle cx="244" cy="413" r={61 * lowerPad} fill="url(#latepost-chip-stage)" opacity={lowerPad} />
          <g fontFamily={labels} fontSize="13" fill="#f6f6f4" textAnchor="middle">
            <text x="113" y="140" opacity={ease((time - .53) / .38)}>{spec.leftFamily}</text>
            <text x="243" y="140" opacity={ease((time - .76) / .44)}>{spec.rightFamily}</text>
            <g opacity={ease((upper - .015) / .36)}><circle cx="326" cy="171" r="5.5" fill="#790a0d" /><text x="301" y="175">{spec.rightType}</text></g>
            <g opacity={ease((upper - .53) / .38)}>
              <circle cx="39" cy="171" r="5.4" fill="#790a0d" />
              <circle cx="144" cy="171" r="5.4" fill="#790a0d" />
              <text x="60" y="175">{spec.leftTypes.lineOne}</text><text x="60" y="191">{spec.leftTypes.lineTwo}</text>
              <text x="173" y="175">{spec.middleTypes.lineOne}</text><text x="173" y="191">{spec.middleTypes.lineTwo}</text>
            </g>
            <text x="244" y="286" opacity={ease((upper - .38) / .27)}>{spec.upperProduct.label}</text>
            <text x="112" y="286" opacity={ease((lower + .15) / .26)}>{spec.lowerBranch.label}</text>
            <g opacity={ease((lower - .38) / .27)}>
              <circle cx="39" cy="350" r="5.4" fill="#8c1e21" />
              <text x="48" y="355" textAnchor="start">{spec.lowerBranch.smallType}</text>
            </g>
            <text x="244" y="471" opacity={ease((lower - .78) / .33)}>{spec.lowerBranch.productLabel}</text>
          </g>
        </svg>
        <Cutout source={spec.upperProduct.image} box={[167, 202, 167, 66]} amount={ease((upper - .63) / .31)} />
        <Cutout source={spec.lowerBranch.frontImage} box={[164, 376, 83, 62]} amount={ease((lower - .66) / .32)} />
        <Cutout source={spec.lowerBranch.backImage} box={[247, 376, 79, 56]} amount={ease((lower - .71) / .34)} />
      </div>
    </div>
  );
}

const demo: PortraitDemo = {
  fps: 30,
  durationInFrames: 438,
  reference: "晚点LatePost · BV1qmgZ6QEC6 · 103.6–118.2",
  spec: {
    title: "存储芯片", leftFamily: "非易失性存储芯片", rightFamily: "易失性存储芯片",
    leftTypes: {lineOne: "OTP", lineTwo: "ROM"}, middleTypes: {lineOne: "EPROM", lineTwo: "EEPROM"},
    rightType: "SRAM",
    upperProduct: {label: "DRAM", image: assetRoot + "tree-dram.png", at: 4.92},
    lowerBranch: {label: "Flash 芯片", smallType: "NOR FLASH 芯片", productLabel: "NAND Flash 芯片",
      frontImage: assetRoot + "tree-flash-front.png", backImage: assetRoot + "tree-flash-back.png", at: 6.74},
    zoom: {at: 8.62},
  } satisfies TechnologyTreeSpec,
};

export const technologyTree = {...technologyTreeContract, Component: TechnologyTree, demo} as const;
