import {clamp, ease, PortraitMedia, type PortraitDemo} from "../../common";
import {assetRoot, charcoal, cover, displayFont, roman, tween, useSceneSeconds} from "./shared";
import {flywheelContract, type FlywheelSpec} from "./flywheel-contract";

const nodes = ["first", "second", "third"] as const;
const crops = [
  {left: -109, top: -124, width: 242, height: 233},
  {left: -108, top: -185, width: 255, height: 292},
  {left: -121, top: -113, width: 227, height: 194},
] as const;

type Shape = {x: number; y: number; scale: number};
type Pose = {ring: Shape; seats: readonly Shape[]; levels: readonly number[]};
const overview: Pose = {
  ring: {x: 167, y: 407, scale: 1},
  seats: [{x: 86, y: 345, scale: .66}, {x: 264, y: 372, scale: .66}, {x: 147, y: 496, scale: .68}],
  levels: [1, 1, 1],
};
const spotlight: readonly Pose[] = [
  {
    ring: {x: 248, y: 363, scale: 1.52},
    seats: [{x: 139, y: 245, scale: 1}, {x: 409, y: 324, scale: 1}, {x: 189, y: 479, scale: 1}],
    levels: [1, .34, .42],
  },
  {
    ring: {x: 96, y: 306, scale: 1.52},
    seats: [{x: -39, y: 183, scale: 1}, {x: 204, y: 287, scale: 1}, {x: -24, y: 430, scale: 1}],
    levels: [.32, 1, .38],
  },
  {
    ring: {x: 211, y: 298, scale: 1.52},
    seats: [{x: 121, y: 168, scale: 1}, {x: 366, y: 240, scale: 1}, {x: 158, y: 405, scale: 1}],
    levels: [.34, .34, 1],
  },
];

const copySlots = [
  {x: 31, y: 151, ordinalX: 128, ordinalY: 100, narrow: .548, font: 67},
  {x: 98, y: 379, ordinalX: 28, ordinalY: 348, narrow: .53, font: 69},
  {x: 78, y: 394, ordinalX: 18, ordinalY: 371, narrow: .55, font: 69},
  {x: 79, y: 136, ordinalX: 25, ordinalY: 109, narrow: .49, font: 64},
] as const;

function blendShape(from: Shape, to: Shape, progress: number): Shape {
  return {x: tween(from.x, to.x, progress), y: tween(from.y, to.y, progress), scale: tween(from.scale, to.scale, progress)};
}

function DisplayCopy({text, ordinal, index, age, exit}: {
  text: string; ordinal: string; index: number; age: number; exit: number;
}) {
  const slot = copySlots[index];
  const live = 1 - ease((age - exit) / .22);
  if (age < 0 || live <= 0) return null;
  const ordinalOpacity = ease((age - .025) / .24) * live;
  return (
    <>
      <div style={{position: "absolute", top: slot.ordinalY, left: slot.ordinalX, font: `italic 64px/55px ${roman}`, color: "#bb0c0c", opacity: ordinalOpacity, transform: "scaleX(.77)", transformOrigin: "left top", whiteSpace: "nowrap"}}>
        {ordinal}
      </div>
      <div style={{position: "absolute", top: slot.y, left: slot.x + (index === 0 ? 40 * (1 - ease(age / .27)) : 0), font: `bold ${slot.font}px/1 ${displayFont}`, transform: `scale(${slot.narrow},1.5)`, transformOrigin: "left top", color: "#fff", whiteSpace: "nowrap", opacity: live, textShadow: ".25px 0 #fff,-.25px 0 #fff"}}>
        {[...text].map((char, letterIndex) => {
          const local = age - letterIndex * .035;
          const fade = ease((local + .04) / .09);
          return <span key={letterIndex} style={{display: "inline-block", opacity: fade, transform: `translate(${8 * (1 - fade)}px,${19 * (1 - fade)}px)`, filter: fade > 0 && fade < 1 ? `blur(${2.5 * (1 - fade)}px)` : undefined}}>{char}</span>;
        })}
      </div>
    </>
  );
}

function Flywheel({spec}: {spec: FlywheelSpec}) {
  const time = useSceneSeconds();
  const events = nodes.map(node => spec[node].at);
  const upcoming = events.findIndex(at => time < at);
  const index = (upcoming < 0 ? events.length : upcoming) - 1;
  const active = index < 0 ? overview : spotlight[index];
  const prior = index <= 0 ? overview : spotlight[index - 1];
  const progress = index < 0 ? 1 : clamp((time - events[index]) / [.56, .56, .61][index]);
  const spread = ease((time - .015) / .47);
  const reveal = .055 + spread * .945;
  const ring = blendShape(prior.ring, active.ring, progress);
  const ringSize = 255 * ring.scale * reveal;
  const seatOrder = index < 0 ? [0, 1, 2] : [0, 1, 2].filter(seat => seat !== index).concat(index);
  const copy = [spec.title, spec.first.title, spec.second.title, spec.third.title];
  const ordinals = [`Part.${spec.part}`, "First", "Second", "Third"];
  const textStarts = [-.02, events[0] + .11, events[1] + .11, events[2] + .15];
  const phoneAge = time - spec.third.at;
  const phoneDrift = -5 * ease((phoneAge - .8) / .46) - 12 * ease((phoneAge - 1.26) / .34);
  return (
    <div style={{...cover, background: charcoal}}>
      <div style={{position: "absolute", left: ring.x - ringSize / 2, top: ring.y - ringSize / 2, width: ringSize, height: ringSize,
        border: `${13 * ring.scale * reveal}px solid #e10e0e`, borderRadius: "50%", opacity: tween(.41, index < 0 ? .41 : .28, progress)}} />
      {seatOrder.map(seat => {
        const target = blendShape(prior.seats[seat], active.seats[seat], progress);
        const crop = crops[seat];
        const x = 170 + (target.x - 170) * reveal;
        const overviewDrift = index < 0 ? 1 : index === 0 ? 1 - ease(progress) : 0;
        const drift = seat === 0 ? -Math.min(time, 4) * 2.4 * overviewDrift
          : seat === 1 ? Math.min(time, 4) * 2.1 * overviewDrift
            : phoneDrift;
        const y = 405 + (target.y - 405) * reveal + drift;
        const scale = target.scale * reveal;
        const opacity = tween(prior.levels[seat], active.levels[seat], progress);
        return (
          <div key={seat} style={{position: "absolute", left: x, top: y, transform: `scale(${scale})`, transformOrigin: "left top", opacity}}>
            <div style={{position: "absolute", top: -104, left: -104, width: 208, height: 208, background: "#ff0000", borderRadius: "50%"}} />
            <div style={{position: "absolute", ...crop}}>
              <PortraitMedia media={{source: spec[nodes[seat]].artwork, sourceStart: null}} style={{objectFit: "contain"}} />
            </div>
          </div>
        );
      })}
      {copy.map((text, copyIndex) => (
        <DisplayCopy key={copyIndex} text={text} ordinal={ordinals[copyIndex]} index={copyIndex}
          age={time - textStarts[copyIndex]} exit={(events[copyIndex] ?? Infinity) - textStarts[copyIndex]} />
      ))}
    </div>
  );
}

const demoSpec: FlywheelSpec = {
  title: "追不上的商业飞轮",
  part: 1,
  first: {artwork: assetRoot + "flywheel-ticket.png", title: "卖票引流", at: 4.02},
  second: {artwork: assetRoot + "flywheel-rooms.png", title: "卖客房赚钱", at: 5.57},
  third: {artwork: assetRoot + "flywheel-phone.png", title: "流量分配推高利润", at: 7.33},
};
const demo: PortraitDemo = {
  spec: demoSpec,
  durationInFrames: 278,
  fps: 30,
  reference: "晚点LatePost · BV1Dquj6sEhJ · 82.23375–91.5005",
};

export const flywheel = {...flywheelContract, Component: Flywheel, demo} as const;
