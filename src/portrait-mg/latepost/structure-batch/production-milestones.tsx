import {ease, PortraitMedia, type PortraitDemo} from "../../common";
import {assetRoot, charcoal, cover, labels, roman, useSceneSeconds} from "./shared";
import {productionMilestonesContract, type ProductionMilestonesSpec} from "./production-milestones-contract";

const rows = [
  {y: 334, box: [116, 235, 234, 121], totalTop: 204},
  {y: 473, box: [116, 396, 234, 91], totalTop: 361},
  {y: 541, box: [116, 480, 235, 103], totalTop: 441},
] as const;

const typeOn = (copy: string, time: number, letterDuration: number) =>
  Array.from(copy).slice(0, Math.max(0, Math.floor(time / letterDuration))).join("");

function ProductionMilestones({spec}: {spec: ProductionMilestonesSpec}) {
  const time = useSceneSeconds();
  const [first, second, third] = spec.milestones;
  const scroll = 91 * ease((time - second.at + .08) / .48) + 30 * ease((time - third.at + .07) / .39);
  const year = Number(first.date.slice(0, 4)) - 1;
  return (
    <div style={{...cover, background: charcoal}}>
      <div style={{...cover, transform: `translateY(${-scroll}px)`}}>
        <svg width="360" height="640" viewBox="0 0 360 640" style={{...cover, overflow: "visible"}}>
          <defs>
            <linearGradient id="latepost-pipeline-red" x1="0" x2="1" y1="0" y2="0">
              <stop stopColor="#950508"/><stop offset=".61" stopColor="#b11517"/><stop offset="1" stopColor="#920105"/>
            </linearGradient>
          </defs>
          {rows.map(({y}, index) => {
            const from = index === 0 ? -42 : rows[index - 1].y;
            const progress = index === 0
              ? ease(time / (first.at + .04))
              : ease((time - spec.milestones[index].at + .09) / .45);
            return <rect key={y} x="34.7" y={from} width="28.85" height={(y - from) * progress} rx="11.5" fill="url(#latepost-pipeline-red)" opacity=".89" />;
          })}
          <line x1="49" x2="49" y1="-44" y2="821" stroke="#e4e2e1" strokeWidth=".58" strokeDasharray="1.7 2.35" opacity=".42"/>
          {[0, 1, 2, 3, 4].map(index => (
            <text key={index} x="50" y={120 + 149 * index} textAnchor="middle" fontFamily={roman} fontSize="29" fontStyle="italic" fill="#c4bdb9" opacity=".42" letterSpacing="-1.8">{year + index}</text>
          ))}
          {rows.map(({y}, index) => (
            <line key={y} x1="19" x2="64" y1={y} y2={y} stroke="#e5e1da" strokeWidth="1" opacity={ease((time - spec.milestones[index].at) / .27)} />
          ))}
        </svg>
        {rows.map(({y, box, totalTop}, index) => {
          const item = spec.milestones[index];
          const age = time - item.at;
          const enter = ease(age / .43);
          const labelsIn = ease((age + .04) / .29);
          if (labelsIn === 0 && enter === 0) return null;
          const [x, top, width, height] = box;
          return (
            <div key={index} style={cover}>
              <div style={{position: "absolute", left: 109, top: totalTop, font: `italic 69px/1 ${roman}`, whiteSpace: "nowrap",
                letterSpacing: "-4px", color: "#ded8d6", opacity: .14 * labelsIn, transform: "scaleX(.78)", transformOrigin: "left top"}}>{typeOn(String(item.total), age + .09, .036)}</div>
              <div style={{position: "absolute", left: 69, top: y - 15, color: "#f8f7f6", whiteSpace: "nowrap", opacity: labelsIn}}>
                <div style={{height: 16, font: `italic 15.5px/16px ${roman}`, letterSpacing: "-1.05px"}}>{typeOn(item.date, age + .025, .042)}</div>
                <div style={{font: `9.6px/11.4px ${labels}`}}>{typeOn(item.lineOne, age - .12, .027)}<br />{typeOn(item.lineTwo, age - .23, .025)}</div>
              </div>
              <div style={{position: "absolute", left: x, top, width, height, opacity: enter, transform: `translateX(${136 * (1 - enter)}px)`}}>
                <PortraitMedia media={{source: item.image, sourceStart: null}} style={{objectFit: "contain"}} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const demo: PortraitDemo = {
  fps: 30,
  durationInFrames: 209,
  reference: "晚点LatePost · BV1WaHN6GEuN · 123.5–130.4666875",
  spec: {
    milestones: [
      {image: assetRoot + "milestone-red.png", total: 1000000, date: "2021.05.19", lineOne: "第100万辆新能源汽车", lineTwo: "下线车型为汉EV", at: .55},
      {image: assetRoot + "milestone-blue.png", total: 2000000, date: "2022.05", lineOne: "第200万辆新能源汽车", lineTwo: "下线车型为秦PLUS DM-i", at: 3.43},
      {image: assetRoot + "milestone-silver.png", total: 3000000, date: "2022.11.16", lineOne: "第300万辆新能源汽车", lineTwo: "下线车型为海豹", at: 5.22},
    ],
  } satisfies ProductionMilestonesSpec,
};

export const productionMilestones = {...productionMilestonesContract, Component: ProductionMilestones, demo} as const;
