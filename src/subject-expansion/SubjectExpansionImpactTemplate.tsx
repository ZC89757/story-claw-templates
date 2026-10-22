import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {evaluateSubjectExpansion, expansionEase} from "./evaluate";
import {evaluateExpansionImpactCard, evaluateExpansionImpactCamera, expansionImpactAudioWindow} from "./impact-evaluate";
import type {SubjectExpansionSpec} from "./types";

const ACCENTS = ["#72b4b0", "#e1a37a", "#b5bd84", "#baa5cf", "#dfbf73"];
const imageSrc = (image: string) => /^(https?:|data:)/i.test(image) ? image : staticFile(image.replace(/^public[\\/]+/i, "").replace(/^\/+/, ""));

export const expansionImpactPositions = (count: number) => count === 2
  ? [{x: 1090, y: 365}, {x: 1510, y: 695}]
  : count === 3 ? [{x: 1040, y: 355}, {x: 1530, y: 520}, {x: 1040, y: 715}]
    : count === 4 ? [{x: 1040, y: 365}, {x: 1530, y: 365}, {x: 1040, y: 715}, {x: 1530, y: 715}]
      : [{x: 920, y: 365}, {x: 1275, y: 365}, {x: 1630, y: 365}, {x: 1090, y: 715}, {x: 1510, y: 715}];

const CardSurface = ({label, relation, image, accent, width, height, hub = false}: {
  label: string; relation?: string; image: string | null; accent: string; width: number; height: number; hub?: boolean;
}) => <>
  {[8, 6, 4, 2].map((depth) => <div key={depth} style={{position: "absolute", inset: 0, borderRadius: 18, background: "#a9ad9d", transform: `translateZ(-${depth}px)`, border: "1px solid #d3d0be"}} />)}
  <div style={{position: "absolute", inset: 0, borderRadius: 18, background: "linear-gradient(155deg, #f9f5e7, #d9dccd)", border: "2px solid #ffffff8c", backfaceVisibility: "hidden", overflow: "hidden", boxSizing: "border-box", boxShadow: "inset 0 0 0 9px #f1f0e81c"}}>
    <div style={{position: "absolute", left: 18, right: 18, top: 17, height: 3, background: accent, opacity: 0.8}} />
    {image ? <Img src={imageSrc(image)} style={{position: "absolute", left: width * 0.15, top: hub ? 45 : 30, width: width * 0.7, height: hub ? height * 0.66 : height * 0.40, objectFit: "contain", filter: "drop-shadow(0 10px 6px #293b3328)"}} /> : <div style={{position: "absolute", left: width / 2 - 28, top: 51, width: 56, height: 56, border: `3px solid ${accent}`, borderRadius: 12, transform: "rotate(45deg)", background: `${accent}25`}} />}
    <div style={{position: "absolute", left: 18, right: 18, top: hub ? height * 0.80 : 140, bottom: 18, display: "flex", flexDirection: "column", gap: 5, justifyContent: "flex-end", textAlign: "center", overflowWrap: "anywhere"}}>
      <div style={{color: "#243d40", fontSize: label.length > 16 ? 19 : label.length > 8 ? 22 : hub ? 36 : 32, fontWeight: 650, lineHeight: 1.25}}>{label}</div>
      {relation ? <div style={{color: "#5c7675", fontSize: relation.length > 12 ? 17 : 23, lineHeight: 1.3}}>{relation}</div> : null}
    </div>
  </div>
  <div style={{position: "absolute", inset: 0, borderRadius: 18, background: "repeating-linear-gradient(45deg, #3d605c 0px, #3d605c 3px, #34544f 3px, #34544f 9px)", border: "8px solid #d9dfcb", transform: "translateZ(-9px) rotateY(180deg)", backfaceVisibility: "hidden", display: "flex", alignItems: "center", justifyContent: "center"}}>
    <div style={{width: 66, height: 66, border: "3px solid #c8d6b2", transform: "rotate(45deg)", boxShadow: "0 0 0 10px #c8d6b21c"}} />
  </div>
</>;

export const SubjectExpansionImpactTemplate = ({spec}: {spec: SubjectExpansionSpec}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const seconds = frame / fps;
  const focus = evaluateSubjectExpansion(spec, seconds);
  const camera = evaluateExpansionImpactCamera(spec, seconds);
  const positions = expansionImpactPositions(spec.items.length);
  const cardWidth = spec.items.length === 5 ? 278 : 326;
  const cardHeight = 258;
  const intro = expansionEase(seconds, 0.9);
  return <AbsoluteFill style={{background: "#102b2b", color: "#e4e9d9", fontFamily: '"Microsoft YaHei", sans-serif', overflow: "hidden"}}>
    <Audio src={staticFile("audio/subject-expansion-bed.wav")} loop volume={0.16} />
    {spec.items.map((item) => {
      const audio = expansionImpactAudioWindow(item.at, fps);
      return <Sequence key={item.id} from={audio.from} durationInFrames={Math.max(1, Math.min(Math.ceil(1.65 * fps) - audio.trimBefore, durationInFrames - audio.from))} layout="none">
        <Audio src={staticFile("audio/subject-expansion-roll.wav")} trimBefore={audio.trimBefore} volume={0.60} />
      </Sequence>;
    })}
    <AbsoluteFill style={{transform: `translate(${camera.x}px, ${camera.y}px) scale(1.018)`, transformOrigin: "center"}}>
      <AbsoluteFill style={{background: "radial-gradient(ellipse at 55% 43%, #36564b 0%, #183a35 46%, #092526 100%)"}} />
      <div style={{position: "absolute", inset: -400, backgroundImage: "linear-gradient(#dce3cc08 1px, transparent 1px), linear-gradient(90deg, #dce3cc08 1px, transparent 1px)", backgroundSize: "92px 92px", transform: "perspective(1300px) rotateX(37deg) rotateZ(-12deg) scale(1.15)", opacity: 0.65}} />
      <svg width={1920} height={1080} style={{position: "absolute", inset: 0}}>
        {spec.items.map((item, index) => {
          const state = evaluateExpansionImpactCard(seconds, item.at, index);
          const p = positions[index];
          const multiRow = spec.items.length >= 4;
          const target = multiRow ? {x: p.x, y: p.y - 143} : {x: p.x - cardWidth / 2 - 20, y: p.y};
          const d = multiRow
            ? `M 541 575 C 630 575, 655 ${p.y - 184}, 715 ${p.y - 184} H ${p.x - 20} Q ${p.x} ${p.y - 184}, ${p.x} ${p.y - 164} V ${target.y}`
            : `M 541 575 C 700 575, 710 ${p.y}, ${target.x} ${target.y}`;
          return <g key={item.id}>
            <path d={d} fill="none" stroke={ACCENTS[index]} strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - state.link} opacity={state.link * 0.75} />
            <circle cx={target.x} cy={target.y} r={5} fill={ACCENTS[index]} opacity={state.link} />
            {state.contact > 0 ? <ellipse cx={p.x} cy={p.y + 78} rx={cardWidth * (0.43 + (1 - state.contact) * 0.3)} ry={25 + (1 - state.contact) * 19} fill="none" stroke={ACCENTS[index]} strokeWidth={2 + state.contact * 5} opacity={state.contact * 0.6} /> : null}
          </g>;
        })}
      </svg>
      <div style={{position: "absolute", left: 115, top: 390, width: 450, height: 375, background: "#031e1cb3", filter: "blur(22px)", borderRadius: "50%", opacity: intro * 0.7, transform: "rotate(-8deg) scaleY(.8)"}} />
      <div style={{position: "absolute", left: 160, top: 315, width: 370, height: 425, opacity: intro, transformStyle: "preserve-3d", transform: `perspective(1200px) translateY(${(1 - intro) * 70}px) rotateX(22deg) rotateY(-6deg) rotateZ(-4deg)`}}>
        <CardSurface label={spec.subject.label} image={spec.subject.image} accent="#b3c299" width={370} height={425} hub />
      </div>
      {spec.items.map((item, index) => {
        const state = evaluateExpansionImpactCard(seconds, item.at, index);
        const p = positions[index];
        const emphasis = focus.items[index];
        if (!state.visible) return null;
        return <div key={item.id}>
          <div style={{position: "absolute", left: p.x - cardWidth / 2 - 12, top: p.y - 38, width: cardWidth + 24, height: 150, background: "#001e1bd6", filter: `blur(${state.airborne ? 34 : 15}px)`, borderRadius: "45%", opacity: state.airborne ? 0.15 : 0.72, transform: `scale(${state.airborne ? 1.35 : 1}, .7)`}} />
          <div style={{position: "absolute", left: p.x - cardWidth / 2, top: p.y - cardHeight / 2, width: cardWidth, height: cardHeight, transformStyle: "preserve-3d", opacity: state.opacity * (state.airborne ? 1 : emphasis.opacity), transform: `perspective(1400px) translate3d(${state.translateX}px, ${state.translateY}px, ${state.translateZ}px) rotateX(${state.rotateX}deg) rotateY(${state.rotateY}deg) rotateZ(${state.rotateZ}deg) scaleY(${state.scaleY})`, zIndex: state.airborne ? 30 : 10 + index}}>
            <CardSurface label={item.label} relation={item.relation} image={item.image} accent={ACCENTS[index]} width={cardWidth} height={cardHeight} />
          </div>
        </div>;
      })}
      {focus.note ? <div style={{position: "absolute", left: 770, top: 930, width: 1000, borderLeft: "3px solid #b9c89e", paddingLeft: 22, fontSize: 27, lineHeight: 1.5, color: "#d4dfcc", opacity: focus.noteProgress}}>{focus.note}</div> : null}
    </AbsoluteFill>
  </AbsoluteFill>;
};
