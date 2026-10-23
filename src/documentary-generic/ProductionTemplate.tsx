import {Img, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {DOC, DocumentaryCanvas, enter} from "../documentary-design";
import type {ProductionSpec, ProductionStage} from "./schema";
export const assetUrl = (image: string) => /^(https?:|data:|blob:)/.test(image) ? image : staticFile(image);
const colors = [DOC.orange, DOC.teal, "#526c61", "#806582"];

const StageVisual = ({stage, t}: {stage: ProductionStage; t: number}) => {
  if (!stage.image) throw new Error(`Unprepared production asset: ${stage.id}`);
  return <div style={{position: "relative", width: 520, height: 390, perspective: 1600}}>
    <div style={{position: "absolute", left: 28, right: 28, bottom: 5, height: 48, background: "#476477", opacity: .12, borderRadius: "50%", filter: "blur(15px)"}} />
    {stage.parts.map((part, i) => {
      const appear = enter(t, part.appearAt, .3), merge = enter(t, part.mergeAt, .8);
      const direction = i % 2 ? 1 : -1;
      return <Img key={i} src={assetUrl(part.image!)} style={{position: "absolute", zIndex: 1, left: 150 + direction * 160 * (1 - merge), top: 25 + 115 * merge, width: 220, height: 150, objectFit: "contain", transform: `translateY(${(1-appear)*20}px) scale(${1 - .65 * merge})`, opacity: appear * (1 - enter(t, part.mergeAt + .64, .16)), filter: "drop-shadow(0 10px 8px #25455725)"}} />;
    })}
    <Img src={assetUrl(stage.image)} style={{position: "absolute", zIndex: 2, inset: 0, width: 520, height: 365, objectFit: "contain", filter: "drop-shadow(0 20px 14px #29465420)"}} />
  </div>;
};

export const GenericProductionTemplate = ({spec}: {spec: ProductionSpec}) => {
  const t = useCurrentFrame() / useVideoConfig().fps;
  const count = spec.stages.length;
  // Follow stages after the third with a smooth camera move; no index selects subject artwork.
  const shift = spec.stages.reduce((sum, s, i) => sum + (i >= 3 ? 580 * enter(t, s.at, .8) : 0), 0);
  const x = (i: number) => (count === 2 ? 510 + i * 900 : 380 + i * 580) - shift;
  const firstMove = count === 2 ? 450 : 580;
  const settleIntro = enter(t, spec.stages[1].at, .75);
  const position = (i: number) => x(i) + (i === 0 ? firstMove * (1 - settleIntro) : 0);
  return <DocumentaryCanvas>
    <div style={{position: "absolute", left: 150, top: 118, fontSize: 58, fontWeight: 600}}>{spec.title}</div>
    <div style={{position: "absolute", left: 150, top: 225, display: "flex", gap: 48}}>{spec.actors.map((a, i) => <div key={a.id} style={{fontSize: 31, fontWeight: 600, color: colors[i], opacity: enter(t, spec.stages.find(s => s.actorId === a.id)!.at)}}><span style={{display: "inline-block", width: 12, height: 12, background: colors[i], borderRadius: 2, marginRight: 14}} />{a.label}</div>)}</div>
    <svg width={1920} height={1080} style={{position: "absolute", inset: 0}}>
      {spec.links.map((link, i) => {
        const a = spec.stages.findIndex(s => s.id === link.from), b = spec.stages.findIndex(s => s.id === link.to);
        const p = enter(t, link.at, 1), sx = position(a) + 235, ex = position(b) - 235, mid = (sx + ex) / 2, y = 690;
        return <g key={i} opacity={p}><path d={`M${sx} ${y}Q${mid} ${y-100} ${ex} ${y}`} fill="none" stroke="#8ea5b5" strokeWidth={12} opacity={.25}/><path d={`M${sx} ${y}Q${mid} ${y-100} ${ex} ${y}`} fill="none" stroke={DOC.teal} strokeWidth={3} pathLength={1} strokeDasharray={1} strokeDashoffset={1-p}/><path d={`M${ex-15} ${y-21}L${ex} ${y}L${ex-23} ${y-5}`} fill="none" stroke={DOC.teal} strokeWidth={3}/>{p>0&&p<1?<rect x={sx+(ex-sx)*p-13} y={y-200*p*(1-p)-10} width={26} height={20} rx={3} fill={DOC.orange}/>:null}</g>;
      })}
    </svg>
    {spec.stages.map((stage, i) => {
      const p = enter(t, stage.at, .65), c = colors[spec.actors.findIndex(a => a.id === stage.actorId)];
      return <div key={stage.id} style={{position: "absolute", left: position(i)-260, top: 340, width: 520, opacity: p, transform: `translateY(${(1-p)*50}px) scale(${i===0?1+.15*(1-settleIntro):1})`, transformOrigin: "50% 40%"}}>
        <StageVisual stage={stage} t={t}/>
        <div style={{margin: "35px 30px 22px", height: 4, background: c, transform: `scaleX(${p})`, transformOrigin: "0 50%"}}/>
        <div style={{fontSize: stage.label.length>16?30:35, lineHeight: 1.5, fontWeight: 600, textAlign: "center", padding: "0 10px", overflowWrap: "anywhere"}}>{stage.label}</div>
      </div>;
    })}
  </DocumentaryCanvas>;
};
