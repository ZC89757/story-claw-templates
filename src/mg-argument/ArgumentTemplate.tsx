import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {expansionEase} from "../subject-expansion/evaluate";
import type {ArgumentSpec} from "./schema";
export const ArgumentTemplate = ({spec}: {spec: ArgumentSpec}) => {
  const seconds = useCurrentFrame() / useVideoConfig().fps;
  const active = spec.claims.reduce((last, c, i) => c.at <= seconds ? i : last, -1);
  const claim = spec.claims[Math.max(0, active)]; const elapsed = seconds - claim.at;
  const line = expansionEase(elapsed - 0.35, 0.7);
  return <AbsoluteFill style={{background: "#f0eee7", color: "#304549", fontFamily: '"Microsoft YaHei", sans-serif'}}>
    <div style={{position: "absolute", left: 100, top: 68, fontSize: 29}}>{spec.title}</div>
    <svg width={1920} height={1080}>
      <line x1={620} y1={435} x2={620 + line * 205} y2={435} stroke="#6d9692" strokeWidth={4} />
      <line x1={1100} y1={435} x2={1300} y2={435} stroke="#a9b6ab" strokeWidth={3} strokeDasharray="7 9" opacity={line * 0.8} />
      <path d="M850 399 V471 M1080 399 V471" stroke="#c48b65" strokeWidth={3} opacity={line} />
    </svg>
    {[claim.premise, claim.conclusion].map((text, i) => <div key={i} style={{position: "absolute", left: i ? 1290 : 110, top: 290, width: 510, height: 290, display: "flex", alignItems: "center", justifyContent: "center", padding: 38, boxSizing: "border-box", border: `2px solid ${i ? "#b9c4b8" : "#719b96"}`, borderRadius: 20, background: "#fafbf4", fontSize: text.length > 22 ? 28 : 36, lineHeight: 1.6, textAlign: "center", opacity: active < 0 ? 0 : expansionEase(elapsed - i * 0.15)}}>{text}</div>)}
    <div style={{position: "absolute", left: 845, top: 405, width: 240, textAlign: "center", fontSize: 27, color: "#996e50", opacity: line}}>不能直接推出</div>
    <div style={{position: "absolute", left: 390, right: 390, top: 675, opacity: expansionEase(elapsed - 0.75), textAlign: "center"}}>
      <div style={{fontSize: 25, color: "#768b80", marginBottom: 22}}>需要进一步核验的证据</div>
      <div style={{display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap"}}>{claim.missingEvidence.map((text) => <div key={text} style={{borderBottom: "2px solid #c6a583", padding: "12px 22px", fontSize: 27, lineHeight: 1.4}}>{text}</div>)}</div>
    </div>
    <div style={{position: "absolute", left: 110, right: 110, bottom: 80, display: "flex", gap: 26}}>{spec.claims.slice(0, Math.max(0, active)).map((c, i) => <div key={i} style={{color: "#81938a", fontSize: 19, lineHeight: 1.4}}>{c.premise} · 仍需证据</div>)}</div>
  </AbsoluteFill>;
};
