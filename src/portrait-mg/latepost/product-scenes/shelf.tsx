import type {PortraitDemo} from "../../common";
import {PortraitMedia} from "../../common";
import {levels, shelfContract, shelfCounts, type ShelfSpec} from "./shelf-contract";
import {assetRoot, Cutout, Layer, phase, useSeconds} from "./shared";

const placement = [
  [[66,179,36,65],[101,179,36,65],[136,179,37,65],[179,177,26,67],[205,177,27,67],[232,177,26,67],[258,178,26,66]],
  [[68,262,51,79],[123,262,51,79],[182,261,51,80],[242,262,51,79]],
  [[75,369,29,71],[112,371,28,69],[149,372,29,68],[197,369,24,71],[220,369,24,71],[244,369,22,71],[265,369,23,71]],
  [[64,468,41,86],[110,468,41,86],[156,468,41,86],[203,468,41,86],[249,468,41,86]],
] as const;
const delays = [[0,.16,.32,.57,.68,.79,.9],[0,.14,.30,.42],[0,.19,.34,.49,.60,.70,.81],[0,.14,.26,.39,.52]];

function ShelfClearing({spec}: {spec: ShelfSpec}) {
  const time = useSeconds();
  const scale = .929 + .071 * phase(time, 0, .62) + .059 * phase(time, 1.25, 5.65);
  return <Layer style={{background: "#104875", transform: `scale(${scale})`, transformOrigin: "180px 320px"}}>
    <div style={{position: "absolute", left: -20, top: -32, width: 400, height: 704}}>
      <PortraitMedia media={{source: spec.shelf, sourceStart: null}} />
    </div>
    {levels.map((key, row) => spec[key].products.map((source, i) => {
      const [x, y, width, height] = placement[row][i];
      const opacity = 1 - phase(time, spec[key].at + delays[row][i], .29);
      return <Layer key={`${key}-${i}`} style={{opacity}}><Cutout {...{source, x, y, width, height}}/></Layer>;
    }))}
  </Layer>;
}

function demoRow(row: number, at: number) {
  return {at, products: Array.from({length: shelfCounts[row - 1]}, (_, i) => assetRoot + `shelf-${row}-${i + 1}.png`)};
}
const spec: ShelfSpec = {shelf: assetRoot + "shelf-empty.png", top: demoRow(1, 1.37), upperMiddle: demoRow(2, 2.66),
  lowerMiddle: demoRow(3, 3.32), bottom: demoRow(4, 4.12)};
const demo: PortraitDemo = {spec, durationInFrames: 210, fps: 30, reference: "BV18ZeB62Eas · 389.250–396.280"};
export const shelfClearing = {...shelfContract, Component: ShelfClearing, demo} as const;

