import {clamp, ease, type PortraitDemo} from "../../common";
import {promotionRouteContract, type PromotionRouteSpec} from "./promotion-route-contract";
import {charcoal, cover, displayFont, labels, roman, useSceneSeconds} from "./shared";
const points = [
  {y: 207, r: 2.35, at: -22 / 30},
  {y: 243.5, r: 2.25, at: 0},
  {y: 279.8, r: 2.25, at: 5 / 30},
  {y: 316, r: 3.8, at: 8 / 30},
  {y: 356, r: 3.7, at: 11 / 30},
  {y: 410.2, r: 3.75, at: 15 / 30},
  {y: 467.7, r: 5.5, at: 27 / 30},
] as const;
const route = [
  "M180 207 C173 226 172 226 180 243.5",
  "M180 243.5 C187 255 186 263 180 279.8",
  "M180 279.8 C170 298 173 307 180 316",
  "M180 316 C190 331 191 343 180 356",
  "M180 356 C167 374 166 393 180 410.2",
  "M180 410.2 C194 429 198 444 180 467.7",
];

function flash(age: number) {
  const step = Math.floor(age * 30 + .001);
  return step === 1 || step === 3 ? .06 : 1;
}

function PromotionRoute({spec}: {spec: PromotionRouteSpec}) {
  const time = useSceneSeconds();
  return (
    <div style={{...cover, background: charcoal}}>
      <div style={{position: "absolute", top: 106, left: 28, color: "#fff", font: `bold 60px/55px ${displayFont}`, letterSpacing: -1.2, whiteSpace: "nowrap", transform: "scale(.61,1.2)", transformOrigin: "left top", textShadow: ".25px 0 #fff"}}>
        {spec.title}
      </div>
      <div style={{position: "absolute", top: 166, left: 28, color: "#d00d0d", font: `italic 23px/24px ${roman}`, whiteSpace: "nowrap", transform: "scale(.74,1.3)", transformOrigin: "left top"}}>
        {spec.englishTitle}
      </div>
      <svg width="360" height="640" viewBox="0 0 360 640" style={cover}>
        {route.map((path, index) => {
          const start = index === 0 ? .16 : spec.expand.at + points[index].at;
          const end = spec.expand.at + points[index + 1].at;
          const progress = clamp((time - start) / Math.max(.065, end - start));
          return <path key={path} d={path} pathLength="1" strokeDasharray={`${progress} 1`} strokeWidth=".7" stroke="#8c8687" fill="none" opacity={progress > 0 ? .93 : 0} />;
        })}
        {points.map(({y, r, at}, index) => {
          const age = time - (index === 0 ? 0 : spec.expand.at + at);
          if (age < 0) return null;
          const left = index % 2 === 1;
          const tint = index === 4 ? "#f00000" : "#fff";
          const visible = ease((age + .055) / .26);
          return (
            <g key={index}>
              <circle cx="180" cy={y} r={r} fill={tint} opacity={flash(age)} />
              <text x={left ? 172 : 191} y={y + 4} textAnchor={left ? "end" : "start"} fill="#fcfcfa" opacity={visible} fontFamily={labels} fontSize="15.1">{spec.roles[index]}</text>
              {index === 4 && <text x="191" y={y + 19} fill="#c5c1c2" opacity={visible} fontFamily={labels} fontSize="9.1">({spec.leadNote})</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const demoSpec: PromotionRouteSpec = {
  title: "空乘晋升路线",
  englishTitle: "Flight attendant promotion path",
  roles: ["学员", "普通乘务员", "高级乘务员", "头等舱(两舱)乘务员", "乘务长", "乘务教员", "乘务检查员"],
  leadNote: "宽体机:主任乘务长+两名普通乘务长",
  expand: {at: 22 / 30},
};
const demo: PortraitDemo = {
  spec: demoSpec,
  durationInFrames: 143,
  fps: 30,
  reference: "晚点LatePost · BV1CqxF6MEcu · 51.1336–55.9336",
};

export const promotionRoute = {
  ...promotionRouteContract,
  Component: PromotionRoute,
  demo,
} as const;
