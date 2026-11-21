import type {PortraitDemo} from "../../common";
import {chipContract, type ChipSpec} from "./chip-contract";
import {assetRoot, Cutout, Layer, lerp, phase, sans, song, useSeconds} from "./shared";

const redDisk = "linear-gradient(143deg,rgba(173,0,0,0) 3%,rgba(184,0,0,.65) 37%,#ff0005 86%)";
const disk = (x: number, y: number, radius: number, scale: number) => ({
  position: "absolute" as const, left: x - radius, top: y - radius, width: radius * 2, height: radius * 2,
  borderRadius: "50%", background: redDisk, transform: `scale(${scale})`,
});

function PriceText({price, time, large = false}: {price: ChipSpec["small"]["price"]; time: number; large?: boolean}) {
  const progress = phase(time, price.at, large ? .4 : .37);
  const number = price.value.match(/[0-9]+/)![0];
  const prefix = price.value.startsWith("≈");
  const suffix = price.value.endsWith("+");
  return <div style={{position: "absolute", left: large ? 122 : 76, top: large ? 93 : 137,
    display: "flex", whiteSpace: "nowrap", alignItems: "baseline", opacity: progress,
    transform: `translateY(${(1 - progress) * (large ? 75 : 37)}px)`}}>
    <span style={{display: "inline-flex", alignItems: "baseline", gap: large ? 0 : 1, color: "#fa0008",
      font: `italic ${large ? 134 : 98}px/.93 'Times New Roman',serif`, letterSpacing: large ? -8 : -6}}>
      {prefix && <span style={{fontSize: ".45em", letterSpacing: 0}}>≈</span>}
      {number}
      {suffix && <span style={{fontSize: ".62em", letterSpacing: -4}}>+</span>}
    </span>
    <span style={{color: "white", fontFamily: song, fontSize: large ? 60 : 42, fontWeight: 700,
      marginLeft: large ? -11 : -2, transform: large ? "scaleX(.47) scaleY(1.22)" : "scaleX(.65) scaleY(1.16)", transformOrigin: "left center"}}>{price.unit}</span>
  </div>;
}

function ChipComparison({spec}: {spec: ChipSpec}) {
  const time = useSeconds();
  const first = phase(time, .07, .39);
  const firstArtwork = phase(time, .17, .30);
  const move = phase(time, spec.large.at, .63);
  const secondCircle = phase(time, spec.large.at + .32, .40);
  const secondArtwork = phase(time, spec.large.at + .56, .50);
  const dark = phase(time, spec.large.at - .18, .56);
  return <Layer style={{background: `linear-gradient(#${dark > .5 ? "000" : "101010"} 0%,rgb(${lerp(28, 7, dark)} ${lerp(28, 7, dark)} ${lerp(28, 7, dark)}) 21%,#303030 55%,#606060 100%)`,
    color: "white", fontFamily: sans}}>
    <Layer style={{transform: `translate(${lerp(0, -5, move)}px,${lerp(0, 182, move)}px) scale(${lerp(1, .665, move)})`, transformOrigin: "0 0"}}>
      <div style={{...disk(149, 305, 92, first), opacity: first}}/>
      <Layer style={{opacity: firstArtwork, transform: `translate(${(1 - firstArtwork) * 21}px,${(1 - firstArtwork) * 26}px)`}}>
        <Cutout source={spec.small.artwork} x={72} y={244} width={141} height={101}/>
        <div style={{position: "absolute", top: 363, left: 40, width: 217, textAlign: "center", fontSize: 17}}>{spec.small.name}</div>
      </Layer>
      <PriceText price={spec.small.price} time={time}/>
    </Layer>
    <div style={{...disk(244, 246, 94, secondCircle), opacity: secondCircle}}/>
    <Layer style={{opacity: secondArtwork, transform: `translateX(${(1 - secondArtwork) * 22}px)`}}>
      <Cutout source={spec.large.frontArtwork} x={124} y={218} width={112} height={76}/>
      <Cutout source={spec.large.backArtwork} x={255} y={217} width={105} height={77}/>
      <div style={{position: "absolute", top: 321, left: 174, width: 140, textAlign: "center", fontSize: 12}}>{spec.large.name}</div>
    </Layer>
    <PriceText price={spec.large.price} time={time} large/>
  </Layer>;
}

const demoSpec: ChipSpec = {
  small: {name: "NOR FLASH 芯片", artwork: assetRoot + "nor.png", price: {value: "≈1", unit: "美元", at: 2.55}},
  large: {name: "DRAM", frontArtwork: assetRoot + "dram-front.png", backArtwork: assetRoot + "dram-back.png",
    at: 4.08, price: {value: "10+", unit: "美元", at: 5.53}},
};
const demo: PortraitDemo = {spec: demoSpec, durationInFrames: 260, fps: 30, reference: "BV1qmgZ6QEC6 · 143.200–151.900"};
export const chipComparison = {...chipContract, Component: ChipComparison, demo} as const;

