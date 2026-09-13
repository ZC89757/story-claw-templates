import type {CSSProperties} from "react";

const PreviewPlate = ({accent, secondary, style}: {accent: string; secondary: string; style: CSSProperties}) => <div style={{background: "radial-gradient(circle at 67% 24%, rgba(138,211,223,.22), transparent 32%), linear-gradient(135deg,#0d181d,#172c34 52%,#10171b)", overflow: "hidden", ...style}}>
  <div style={{position: "absolute", inset: 68, border: "3px solid rgba(222,242,246,.42)", borderRadius: 30, background: "rgba(8,15,19,.28)", boxShadow: "inset 0 0 0 2px rgba(255,255,255,.05)"}} />
  <div style={{position: "absolute", left: 180, top: 170, width: 780, height: 190, borderRadius: 24, background: "rgba(9,18,23,.68)", border: "2px solid rgba(255,255,255,.35)", boxShadow: "0 24px 60px rgba(0,0,0,.26)"}}>
    <div style={{position: "absolute", left: 42, top: 36, width: 170, height: 15, borderRadius: 8, background: accent}} />
    <div style={{position: "absolute", left: 42, top: 82, width: 565, height: 18, borderRadius: 9, background: "rgba(239,246,248,.72)"}} />
    <div style={{position: "absolute", left: 42, top: 122, width: 410, height: 12, borderRadius: 6, background: "rgba(239,246,248,.32)"}} />
  </div>
  <div style={{position: "absolute", right: 188, bottom: 170, width: 570, height: 332, borderRadius: 28, background: "linear-gradient(145deg,rgba(138,211,223,.42),rgba(15,28,35,.86))", border: "2px solid rgba(255,255,255,.36)", boxShadow: "0 28px 72px rgba(0,0,0,.35)", transform: "rotate(-7deg)"}}>
    {Array.from({length: 6}).map((_, index) => <div key={index} style={{position: "absolute", left: 48 + index * 76, bottom: 46, width: 42, height: 45 + ((index * 37) % 150), borderRadius: "9px 9px 3px 3px", background: index % 2 ? accent : secondary, opacity: .74}} />)}
  </div>
</div>;

/** Shared preview plate for generated-video entries. */
export const ScVideoPreviewPlate = ({accent, secondary, label}: {
  accent: string;
  secondary: string;
  label?: string;
}) => <div style={{position: "absolute", inset: 0, background: "#080c0f", overflow: "hidden"}}>
  <PreviewPlate accent={accent} secondary={secondary} style={{position: "absolute", inset: 0}} />
  {label ? <div style={{position: "absolute", left: 94, bottom: 90, color: accent, fontSize: 42, fontWeight: 900, fontFamily: '"Microsoft YaHei", Arial, sans-serif'}}>{label}</div> : null}
</div>;
