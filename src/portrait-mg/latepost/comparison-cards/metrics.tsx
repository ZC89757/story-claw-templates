import {clamp, ease, PortraitMedia, type PortraitDemo} from "../../common";
import {charcoal, cover, demoAsset, reference, roman, song, useSeconds} from "./shared";
import {metricsContract, type MetricsSpec} from "./metrics-contract";

function MetricListSwap({spec}: {spec: MetricsSpec}) {
  const seconds = useSeconds();
  const reorder = spec.reorder.at;
  const rise = ease((seconds - reorder) / .37);
  const drop = ease((seconds - reorder - .12) / .3);

  return <div style={{...cover, background: charcoal}}>
    {spec.rows.map((row, index) => {
      const itemTime = seconds - index * .16 + .06;
      const label = ease(itemTime / .14);
      const icon = ease((itemTime - .21) / .25);
      const initialY = 115 + index * 89;
      const top = initialY + (index === 3 ? -267 * rise : 89 * drop);
      return <div key={index} style={{position: "absolute", left: 0, top, width: 360, height: 83}}>
        <div style={{position: "absolute", left: 68, top: 0, width: 82, height: 76, transform: `scale(${icon})`, opacity: icon}}>
          <PortraitMedia media={{source: row.icon, sourceStart: null}} style={{objectFit: "contain"}} />
        </div>
        <div style={{position: "absolute", right: 166, top: 43, font: `italic 31px/1 ${roman}`, transform: "scaleX(.83)",
          transformOrigin: "right", color: "#97071a", textShadow: "0 0 2px #59000a", opacity: ease((itemTime - .075) / .19)}}>
          {row.english}
        </div>
        <div style={{position: "absolute", left: 195, top: 10, font: `bold 48px/1 ${song}`, whiteSpace: "nowrap",
          transformOrigin: "top left", transform: `translateY(${12 * (1 - label)}px) scale(.57,1.34)`, color: "#fff", opacity: label}}>
          {row.label}
        </div>
      </div>;
    })}
    {[0, 1, 2].map((index) => {
      const offset = index * .14;
      const enter = ease((seconds - offset) / .22);
      const recover = ease((seconds - reorder - .27 - offset) / .16);
      const fade = 1 - .55 * clamp((seconds - reorder) / .15);
      return <div key={index} style={{position: "absolute", left: 237, top: 169 + index * 94, width: 66, height: 63,
        background: "#800112", clipPath: "polygon(0 5%,8% 0,51% 86%,91% 0,100% 5%,55% 100%,48% 100%)",
        opacity: Math.max(enter * fade, recover) * .83}} />;
    })}
  </div>;
}

const demo: PortraitDemo = {
  spec: {
    rows: [
      {label: "认知", english: "Cognition", icon: demoAsset("metric-cognition.png")},
      {label: "格局", english: "Vision", icon: demoAsset("metric-vision.png")},
      {label: "技术", english: "Technology", icon: demoAsset("metric-technology.png")},
      {label: "管理", english: "Management", icon: demoAsset("metric-management.png")},
    ],
    reorder: {at: 2.75},
  },
  durationInFrames: 164, fps: 30, reference: reference("V01_005"),
};

export const metrics = {...metricsContract, Component: MetricListSwap, demo} as const;
