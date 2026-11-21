import {Sequence, useVideoConfig} from "remotion";
import {ease, PortraitMedia, type PortraitDemo} from "../../common";
import {cover, demoAsset, reference, roman, song, travel, useSeconds} from "./shared";
import {businessTriangleContract, type BusinessTriangleSpec} from "./business-triangle-contract";

const layout = [
  {x: 126, y: 128},
  {x: 51, y: 273},
  {x: 201, y: 273},
] as const;

function BusinessTriangle({spec}: {spec: BusinessTriangleSpec}) {
  const seconds = useSeconds();
  const {fps} = useVideoConfig();
  const cut = Math.round(spec.secondShot.at * fps);
  const dissolve = 1 - ease((seconds - spec.fade.at) / .36);
  return <div style={{...cover, background: "radial-gradient(ellipse at 50% 18%,#4b4b4b 0%,#252525 24%,#050505 78%)"}}>
    <div style={{position: "absolute", left: 0, top: 101, width: 360, height: 374, overflow: "hidden", background: "#070707"}}>
      <Sequence from={0} durationInFrames={cut} layout="none"><PortraitMedia media={spec.background} /></Sequence>
      <Sequence from={cut} layout="none"><PortraitMedia media={spec.secondShot} /></Sequence>
      <div style={{...cover, background: "linear-gradient(180deg,#05050691,#05040698 49%,#030305c5)"}} />
    </div>
    <div style={{...cover, opacity: dissolve}}>
      {[spec.main, spec.left, spec.right].map((card, index) => {
        const start = index === 0 ? 0 : index === 1 ? spec.left.at : spec.right.at;
        const age = seconds - start;
        const {x, y} = layout[index];
        const enter = travel(age / (index === 0 ? .57 : .48));
        return <div key={index} style={{position: "absolute", left: x, top: y, width: 106, height: 138,
          transform: `translateY(${(650 - y) * (1 - enter)}px)`, opacity: Math.min(1, Math.max(0, age * 12))}}>
          <div style={{position: "relative", width: 106, height: 106, background: "radial-gradient(ellipse at 25% 0%,#f43125,#d91716 75%,#d21819)", boxShadow: "0 1px 3px #41040870"}}>
            <div style={{position: "absolute", left: 12, top: 20, width: 85, height: 77}}>
              <PortraitMedia media={{source: card.logo, sourceStart: null}} style={{objectFit: "contain"}} />
            </div>
            <div style={{position: "absolute", left: 8, top: -2, font: `bold 34px/1 ${roman}`, color: "#fff9ee"}}>{index + 1}</div>
            <div style={{position: "absolute", top: 44, left: 10, width: 65, height: 1.2, background: "#800e0b", transform: "rotate(-28deg)", transformOrigin: "left"}} />
          </div>
          <div style={{position: "absolute", top: 110, right: 0, font: `bold 23px/1 ${song}`, whiteSpace: "nowrap", color: "white",
            textShadow: "1px 1px 1px #000", transform: "scaleX(.79)", transformOrigin: "right"}}>
            {card.name}
          </div>
        </div>;
      })}
    </div>
  </div>;
}

const demo: PortraitDemo = {
  spec: {
    background: {source: demoAsset("business-warehouse.mp4"), sourceStart: 0},
    secondShot: {source: demoAsset("business-shopping.mp4"), sourceStart: 0, at: .96},
    main: {name: "拼多多主站", logo: demoAsset("business-pdd.png")},
    left: {name: "多多买菜", logo: demoAsset("business-grocery.png"), at: .62},
    right: {name: "Temu", logo: demoAsset("business-temu.png"), at: 1.12},
    fade: {at: 2.7},
  },
  durationInFrames: 92, fps: 30, reference: reference("V11_005"),
};

export const businessTriangle = {...businessTriangleContract, Component: BusinessTriangle, demo} as const;
