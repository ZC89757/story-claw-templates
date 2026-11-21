import {ease, PortraitMedia, type PortraitDemo} from "../../common";
import {assetRoot, charcoal, cover, displayFont, roman, tween, useSceneSeconds} from "./shared";
import {rankPyramidContract, type RankPyramidSpec} from "./rank-pyramid-contract";

const steps = [
  [414, 466, 207, 214, "#4a3336"],
  [357, 402, 198, 205, "#563132"],
  [309, 347, 190, 196, "#651f22"],
  [270, 302, 183, 189, "#7f1619"],
  [235, 264, 177, 181, "#950f11"],
  [205, 230, 172, 176, "#b00b0d"],
  [177, 201, 167, 171, "#ca0103"],
  [154, 174, 162, 166, "#db0000"],
  [135, 151, 158, 161, "#eb0000"],
  [117, 131, 155, 158, "#fb0000"],
] as const;

function RankPyramid({spec}: {spec: RankPyramidSpec}) {
  const time = useSceneSeconds();
  const rise = time - spec.rise.at;
  const avatarAt = time - .34;
  const scaleIn = ease(avatarAt / .23);
  const x = tween(180, 272, rise / .29);
  const y = tween(262, 185, rise / .29);
  const letterIn = ease((time - .32) / .18);
  const pointer = ease((rise - .56) / .17);
  return (
    <div style={{...cover, background: charcoal}}>
      <svg width="360" height="640" viewBox="0 0 360 640" style={cover}>
        {steps.map(([top, bottom, rightTop, rightBottom, color], index) => {
          const enter = ease((rise - .045 - index * .061) / .16);
          return (
            <g key={top} opacity={enter} transform={`translate(${-72 * (1 - enter)} ${16 * (1 - enter)})`}>
              <path fill={color} d={`M28 ${top} H${rightTop} L${rightBottom} ${bottom} H28 Z`} />
              <text x="97" y={(top + bottom) / 2 + 5} textAnchor="middle" fill="#fff" fontFamily={roman} fontSize="16" fontStyle="italic" letterSpacing="-1">{spec.lowestRank + index}</text>
              {index === 0 && <text x="39" y="454" fill="#fff" fontFamily={displayFont} fontSize="28" fontWeight="700" textLength="41" lengthAdjust="spacingAndGlyphs">{spec.rankLabel}</text>}
            </g>
          );
        })}
        <path d="M169 126 L236 145 L216 175 Z" fill="#eb0807" opacity={pointer} transform={`translate(${31 * (1 - pointer)} 0)`} />
      </svg>
      {scaleIn > 0 && (
        <div style={{position: "absolute", width: 146, height: 146, left: x - 73, top: y - 73, borderRadius: "50%", border: "2.2px solid #f60000", overflow: "hidden", transform: `scale(${scaleIn})`, boxSizing: "border-box"}}>
          <PortraitMedia media={{source: spec.portrait, sourceStart: null}} />
        </div>
      )}
      <div style={{position: "absolute", left: x + 15 - 69, top: y + 81, width: 138, textAlign: "center", color: "#c7070d", whiteSpace: "nowrap",
        font: `italic 39px/1 ${roman}`, opacity: letterIn, transform: "scale(.66,1.13)", transformOrigin: "center top"}}>{spec.latinName}</div>
      <div style={{position: "absolute", left: x + 15 - 91, top: y + 106 + 29 * (1 - letterIn), width: 182, textAlign: "center", color: "#fff", whiteSpace: "nowrap",
        font: `700 60px/1 ${displayFont}`, opacity: letterIn, transform: "scale(.54,1.45)", transformOrigin: "center top", textShadow: ".32px 0 #fff"}}>{spec.name}</div>
    </div>
  );
}

const demo: PortraitDemo = {
  fps: 30,
  durationInFrames: 204,
  reference: "晚点LatePost · BV17TWg6QE2G · 58.9–65.7",
  spec: {
    portrait: assetRoot + "rank-avatar.png",
    name: "罗福莉",
    latinName: "Luo Fuli",
    rankLabel: "职级",
    lowestRank: 13,
    rise: {at: 4.06},
  } satisfies RankPyramidSpec,
};

export const rankPyramid = {...rankPyramidContract, Component: RankPyramid, demo} as const;
