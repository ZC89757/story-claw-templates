import {getSelectedProfile, selectedProfiles, selectedVideoWindow, validateSelectedTimings} from "./selected/profiles";

/** Content-only contracts for the reference replicas. No visual controls are caller supplied. */
export const contentTimingIds = new Set([...Object.keys(selectedProfiles),"V10_008","V19_006","V28_002","V19_001","V31_003","V21_002","V21_005","V19_005","V22_002","V21_009","V20_003","V18_003","V28_001","V18_002","V20_007","V21_006","V25_001","V10_001","V07_004","V21_008","V27_006","V11_003","V16_001","V16_002","V26_001","V20_006","V20_009","V13_003","V24_001"]);
export const finiteDecorationSeconds: Record<string, number> = {V07_004:114/30,V27_006:6,V11_003:287/30,V20_009:106/30,V21_002:88/30,V21_009:4,V20_003:12,V28_001:66/30,V21_006:56/30};
export const referenceMinimumSeconds: Record<string, number> = {V07_004:28/30,V21_008:13/30,V27_006:16/30,V11_003:32/30,V16_001:46/30,V16_002:69/30,V26_001:34/30,V20_006:27/30,V20_009:31/30,V13_003:.4,V24_001:69/30};

/** Same interval calculation is used by the FC resolver and actual asset preparation. */
export function referenceVideoWindow(id: string, key: string, spec: Record<string, any>, sceneStart: number, sceneEnd: number) {
  if (getSelectedProfile(id)) {
    const {start, end} = selectedVideoWindow(id, key, spec, sceneStart, sceneEnd);
    return {start, end, duration: end - start};
  }
  let start = sceneStart, end = sceneEnd;
  if (id === "V10_008") {
    if (key === "lead") end = spec.upper?.at;
    else start = spec.fourth && spec.fifth ? spec.upper?.at : spec[key]?.at ?? spec.upper?.at;
  }
  if (id === "V19_006") {if(key==="firstClip")end=spec.secondClip.at;else if(key==="secondClip")start=spec.secondClip.at;}
  if (id === "V31_003") {if(key==="background")end=spec.chosenClip.at;else if(key==="chosenClip")start=spec.chosenClip.at;}
  if (id === "V22_002" && key==="circle") end=Math.min(sceneEnd,spec.drop.at+.6);
  if (id === "V20_003") {
    if(key==="upper")end=Math.min(sceneEnd,spec.upperNext.at+.5);
    if(key==="lower")end=Math.min(sceneEnd,spec.lowerNext.at+.7);
    if(key==="lowerNext"){start=spec.lowerNext.at;end=Math.min(sceneEnd,spec.closeLower.at+.5);}
    if(key==="upperNext")start=spec.upperNext.at;
  }
  if (id === "V18_003") {
    if(key==="strips"){start=spec.strips.at??sceneStart;end=spec.inset.at;}
    if(key==="inset"){start=spec.inset.at;end=spec.next.at;}
    if(key==="next")start=spec.next.at;
  }
  if (id === "V18_002") {if(key==="firstBackground")end=spec.secondBackground.at;else if(key==="secondBackground")start=spec.secondBackground.at;}
  if (id === "V10_001" && ["firstClip","secondClip","finalClip"].includes(key)) start=spec[key].at;
  if (id === "V20_006" && (key === "lower" || key === "oval")) start = spec[key]?.at;
  if (id === "V24_001") {
    if (key === "clip") end = spec.nextClip?.at;
    if (key === "nextClip") {start = spec.nextClip?.at; end = spec.closing?.at;}
  }
  return {start, end, duration: end - start};
}

/** Validate only real motion dependencies; independent slots may cue in any order. */
export function validateReferenceTimings(id: string, args: Record<string, any>, start: number, end: number) {
  validateSelectedTimings(id, args, start, end);
  const maximum = id === "V21_005" && !args.background ? 6 : finiteDecorationSeconds[id];
  if (maximum && end - start > maximum + 1e-6) throw new Error(id+": fixed reference decoration supports at most "+maximum+"s; do not freeze, reverse, or invent a loop");
  const at = (key: string) => args[key]?.at ?? start;
  const tail = (key: string, frames: number) => {if (end - at(key) + 1e-6 < frames / 30) throw new Error(id+"."+key+": allow the complete entrance/effect before the scene ends");};
  const after = (later: string, earlier: string, frames = 0) => {if (at(later) - at(earlier) + 1e-6 < frames / 30) throw new Error(id+"."+later+": time must follow the complete "+earlier+" phase");};
  switch (id) {
    case "V28_002": if(at("replacement")-start<8/30)throw new Error(id+": allow the original pre-swap fade");tail("replacement",11);break;
    case "V19_001":for(const key of ["leftObject","rightObject"])tail(key,9);for(const key of ["leftLabel","rightLabel"])tail(key,13);break;
    case "V31_003":after("chosenClip","right");tail("chosenClip",34);break;
    case "V21_005":after("excerpt","select",15);break;
    case "V07_004": if(at("answer")-start+1e-6<21/30)throw new Error(id+": let the fixed question entrance finish before answer");tail("answer",7);break;
    case "V21_008": tail("title",13);tail("left",13);tail("right",12);break;
    case "V27_006": after("firstLine","title");after("secondLine","title");tail("title",16);tail("firstLine",11);tail("secondLine",13);break;
    case "V11_003": after("finalTop","first",16);after("finalTop","second",17);after("finalMiddle","finalTop");after("finalBottom","finalTop");for(const key of ["finalTop","finalMiddle","finalBottom"])tail(key,15);break;
    case "V16_001": after("second","first",32);tail("title",9);tail("second",14);break;
    case "V16_002": for(const key of ["top","middle","bottom"])tail(key,41);break;
    case "V26_001": for(const key of ["upperHit","middleHit","lowerHit"])tail(key,9);if(at("middleHit")-start+1e-6<25/30||at("lowerHit")-start+1e-6<22/30)throw new Error(id+": leave room for the fixed pre-flash wipes");break;
    case "V20_006": after("oval","lower",11);tail("lower",12);tail("oval",16);break;
    case "V20_009": after("after","before",12);tail("after",19);break;
    case "V13_003": tail("document",1);break;
    case "V24_001": after("closing","opening",22);after("closing","nextClip",1);tail("closing",47);break;
  }
}
