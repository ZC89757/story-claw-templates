import {normalizeLegacyVideoRanges,validateLegacyVideoRanges} from "./legacy-video-windows";
import {validateFixedCardSubtitle} from "./reference-text-fit";
import {portraitContentParameters} from "./content-parameters";
import {contentTimingIds, referenceMinimumSeconds, referenceVideoWindow, validateReferenceTimings} from "./content-timing";
import {assertFunctionEnvelope, assertFunctionTiming, type FunctionCallTiming} from "../function-call";
import {PORTRAIT_CATALOG, type PortraitTemplateName} from "./catalog.js";
import {LEGACY_PORTRAIT_FUNCTIONS} from "./legacy-definitions";
import {REFERENCE_FUNCTIONS} from "./reference-definitions";
import {getReferenceProfile} from "./reference-profiles";
import {latepostContracts} from "./latepost/contracts";

const PORTRAIT_FUNCTIONS = [...LEGACY_PORTRAIT_FUNCTIONS, ...REFERENCE_FUNCTIONS];

type Shape = {type?:string;anyOf?:readonly Shape[];enum?:readonly unknown[];properties?:Record<string,Shape>;required?:readonly string[];additionalProperties?:boolean;items?:Shape;minItems?:number;maxItems?:number;minimum?:number;maximum?:number;minLength?:number;maxLength?:number;pattern?:string};
/** The approved closed JSON schemas are the source of truth; no extra visual tuning fields. */
export const validatePortraitShape = (value:unknown, schema:Shape, name="arguments"):void => {
  if(schema.anyOf){for(const branch of schema.anyOf){try{validatePortraitShape(value,branch,name);return;}catch{}}throw new Error(`${name}: no allowed type matches`);}
  if(schema.enum && !schema.enum.includes(value)) throw new Error(`${name}: invalid enum value`);
  if(schema.type==="null"){if(value!==null)throw new Error(`${name}: expected null`);return;}
  if(schema.type==="object"){
    if(!value||typeof value!=="object"||Array.isArray(value))throw new Error(`${name}: expected object`);
    const r=value as Record<string,unknown>,p=schema.properties??{};
    for(const key of schema.required??[])if(!Object.hasOwn(r,key))throw new Error(`${name}.${key}: required`);
    for(const [key,item] of Object.entries(r)){if(!Object.hasOwn(p,key))throw new Error(`${name}.${key}: unexpected field`);validatePortraitShape(item,p[key],`${name}.${key}`);}return;
  }
  if(schema.type==="array"){
    if(!Array.isArray(value)||value.length<(schema.minItems??0)||value.length>(schema.maxItems??Infinity))throw new Error(`${name}: invalid array length`);
    value.forEach((item,index)=>validatePortraitShape(item,schema.items!,`${name}[${index}]`));return;
  }
  if(schema.type==="string"){
    if(typeof value!=="string"||!value.trim()||value.length<(schema.minLength??0)||value.length>(schema.maxLength??Infinity))throw new Error(`${name}: invalid text`);
    if(schema.pattern && !new RegExp(schema.pattern).test(value))throw new Error(`${name}: text does not fit the original typeface character set`);return;
  }
  if(schema.type==="number"||schema.type==="integer"){
    if(typeof value!=="number"||!Number.isFinite(value)||(schema.type==="integer"&&!Number.isInteger(value))||value<(schema.minimum??-Infinity)||value>(schema.maximum??Infinity))throw new Error(`${name}: invalid number`);
  }
};

export const portraitElementAts = (input:unknown):number[] => {
  if(Array.isArray(input))return input.flatMap(portraitElementAts);
  if(!input||typeof input!=="object")return [];
  return Object.entries(input).flatMap(([key,value])=>key==="at"&&typeof value==="number"?[value]:portraitElementAts(value));
};
export const isPortraitTemplate = (kind:string):kind is PortraitTemplateName => PORTRAIT_CATALOG.some(x=>x.template===kind);
export const portraitCatalogEntry = (kind:string) => PORTRAIT_CATALOG.find(x=>x.template===kind || x.id===kind || x.previewKind===kind);
const legacyMinDuration:Record<string,number>={V16_002:69/30,V01_001:.5,V01_002:.5,V01_003:.7,V01_005:.5,V01_006:.6,V01_007:1,V03_001:1,V04_001:3,V04_002:1.5,V05_001:1,V05_002:1.1,V07_003:3,V10_004:2.5,V10_005:3,V11_001:1,V11_002:.35,V12_001:2};
const minimumPortraitDuration = (id: string) =>
  latepostContracts.get(id)?.minimumDuration ?? referenceMinimumSeconds[id] ?? legacyMinDuration[id] ?? .4;

const checkOrdered=(events:any[],name:string,strict=false)=>{
  if(events.some((x,i)=>i>0&&(strict?x.at<=events[i-1].at:x.at<events[i-1].at)))throw new Error(`${name}: event times must ${strict?"strictly increase":"be non-decreasing"}`);
};
export const resolvePortraitFunctionArgs = (id:string,input:unknown,timing:FunctionCallTiming) => {
  assertFunctionTiming(timing);
  const index=PORTRAIT_CATALOG.findIndex(x=>x.id===id);
  if(index<0)throw new Error(`Unknown portrait template ${id}`);
  input=normalizeLegacyVideoRanges(id,input,timing.start,timing.end);
  if(id==="V01_006" && input && typeof input==="object" && Array.isArray((input as any).panels)){
    for(const [i,panel] of (input as any).panels.entries()){
      if(panel.layout!==undefined&&panel.layout!==(i===0?"wide":"tall"))throw new Error(id+": panel layout is fixed by its original position");
      delete panel.layout;
    }
  }
  const contractProfile = getReferenceProfile(id);
  if (contentTimingIds.has(id) && input && typeof input === "object" && !Array.isArray(input)) {
    const normalized = {...input as Record<string, any>};
    if (id === "V10_008" && normalized.fourth && normalized.fifth) {
      for (const key of ["middle","lower","fourth","fifth"]) {
        if (normalized[key]?.at !== undefined && normalized[key].at !== normalized.upper?.at) throw new Error(id+"."+key+": all five strips share upper.at");
        normalized[key] = {...normalized[key]}; delete normalized[key].at;
      }
    }
    if (id === "V26_001") for (const key of ["middle", "lower"]) {
      if (normalized[key] && typeof normalized[key] === "object") {normalized[key] = {...normalized[key]}; delete normalized[key].at;}
    }
    for (const [key, slot] of Object.entries(contractProfile?.slots ?? {})) {
      if (!normalized[key] || typeof normalized[key] !== "object") continue;
      const value = {...normalized[key]};
      if(slot.at===undefined && value.at!==undefined && !(id==="V10_008" && !normalized.fourth && !normalized.fifth && ["middle","lower"].includes(key))){
        if(Math.abs(value.at-timing.start)>1e-6)throw new Error(id+"."+key+": this slot starts with the scene and has no independent cue");
        delete value.at;
      }
      if (slot.type === "image" || slot.type === "cutout") {
        if (Object.hasOwn(value, "sourceStart") && value.sourceStart !== null) throw new Error("arguments."+key+".sourceStart: images require null");
        delete value.sourceStart;
      } else if (slot.type === "video" && value.sourceEnd === undefined) {
        const span = referenceVideoWindow(id, key, normalized, timing.start, timing.end);
        value.sourceEnd = value.sourceStart + span.duration;
      }
      normalized[key] = value;
    }
    input = normalized;
  }
  // New original-layout text slots remain nullable for legacy calls; no invented default wording.
  const optionalSlots = Object.entries(getReferenceProfile(id)?.slots ?? {}).filter(([, slot]) => slot.optional).map(([key]) => key);
  if (optionalSlots.length && input && typeof input === "object" && !Array.isArray(input)) {
    const legacy = input as Record<string, unknown>;
    input = {...legacy, ...Object.fromEntries(optionalSlots.filter(key => !Object.hasOwn(legacy, key)).map(key => [key, null]))};
  }
  const planningShape = portraitDefinition(index).parameters as unknown as Shape;
  // New plans must fill existing secondary text rows. Null remains a legacy-only input.
  let runtimeShape = planningShape;
  if (contentTimingIds.has(id) && optionalSlots.length && input && typeof input === "object") {
    const values = input as Record<string, unknown>;
    const nullableLegacy = optionalSlots.filter(key => values[key] === null);
    if (nullableLegacy.length) runtimeShape = {...planningShape, properties: {...planningShape.properties, ...Object.fromEntries(nullableLegacy.map(key => [key, {anyOf: [planningShape.properties![key], {type: "null"}]}]))}};
  }
  if (id === "V10_008" && input && typeof input === "object") {
    const values = input as Record<string, any>;
    if (!Object.hasOwn(values,"fourth") && !Object.hasOwn(values,"fifth")) {
      const properties = {...runtimeShape.properties};
      for (const key of ["fourth","fifth","fourthText","fifthText"]) delete properties[key];
      for (const key of ["middle","lower"]) properties[key] = {...properties[key], required:[...(properties[key].required??[]),"at"], properties:{...properties[key].properties,at:{type:"number",minimum:0}}};
      runtimeShape = {...runtimeShape,properties,required:Object.keys(properties)};
    }
  }
  if (["V04_002","V07_003"].includes(id) && input && typeof input==="object" && Object.hasOwn(input,"url") && !Object.hasOwn(input,"snapshotPath")){
    const properties={...runtimeShape.properties};delete properties.snapshotPath;
    properties.url={type:"string",minLength:1,maxLength:2000};
    runtimeShape={...runtimeShape,properties,required:Object.keys(properties)};
  }
  // Existing plans may omit fields that were introduced when separating reference content.
  const originalContent = portraitContentParameters[id];
  if (originalContent && id !== "V28_004" && input && typeof input === "object") {
    runtimeShape = {...runtimeShape, required: runtimeShape.required?.filter(
      key => !Object.hasOwn(originalContent, key) || Object.hasOwn(input, key),
    )};
  }
  validatePortraitShape(input, runtimeShape);
  const envelope=assertFunctionEnvelope(input,timing),args=input as Record<string,any>;
  if(id==="V01_006")args.panels.forEach((panel:any,i:number)=>panel.layout=i===0?"wide":"tall");
  const profile = getReferenceProfile(id);
  if (profile) {
    const order = profile.order ?? [];
    for (let i = 1; i < order.length; i++) {
      if (args[order[i]].at <= args[order[i - 1]].at) {
        throw new Error(`${id}.${order[i]}: time must follow ${order[i - 1]}`);
      }
    }
    for (const track of profile.tracks) {
      const start = track.from ? args[track.from].at : args[track.slot ?? ""]?.at ?? timing.start;
      if (track.until && args[track.until].at <= start) throw new Error(`${id}.${track.until}: exit must follow entrance`);
    }
  }
  if (contentTimingIds.has(id) && profile) {
    for (const [key, slot] of Object.entries(profile.slots)) {
      if (slot.type === "video") {
        if (slot.optional && args[key] == null) continue;
        if (id === "V10_008" && args[key] === undefined) continue;
        const span = referenceVideoWindow(id, key, args, timing.start, timing.end);
        if (!Number.isFinite(span.duration) || span.duration <= 0) throw new Error(id+"."+key+": video window must be positive");
        if (Math.abs(args[key].sourceEnd - args[key].sourceStart - span.duration) > .001) throw new Error(id+"."+key+": source range must equal the video slot duration");
      } else if (slot.type === "image" || slot.type === "cutout") args[key].sourceStart = null;
    }
  }
  if (id === "V28_004" && (args.target.x + args.target.width > 1 || args.target.y + args.target.height > 1)) {
    throw new Error("V28_004.target: highlight must be inside the original document");
  }
  validateLegacyVideoRanges(id,args,timing.start,timing.end);
  const minimumDuration = minimumPortraitDuration(id);
  if (timing.end - timing.start + .000001 < minimumDuration) throw new Error(`${id}: window is too short for the fixed entrance (${minimumDuration}s)`);
  for(const at of portraitElementAts(args))if(at<timing.start||at>=timing.end)throw new Error(`${id}: event.at outside host [start,end)`);
  if (id === "V10_008" && timing.end - args.upper.at < .4) throw new Error("V10_008: allow the complete five-strip entrance");
  if (contentTimingIds.has(id)) validateReferenceTimings(id, args, timing.start, timing.end);
  const local=(value:any):any=>Array.isArray(value)?value.map(local):value&&typeof value==="object"?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,k==="at"?Math.round(((v as number)-timing.start)*1e6)/1e6:local(v)])):value;
  const {group,order,...business}=args;
  const spec=local(business);
  latepostContracts.get(id)?.validate?.(spec, timing.end - timing.start);
  const readable=(text:string,width:number,minSize:number,label:string,asciiUnits=.75)=>{
    const units=Array.from(text).reduce((n,c)=>n+(/[WM@]/.test(c)?(asciiUnits===.75?1.1:asciiUnits):/[\x00-\x7F]/.test(c)?asciiUnits:1),0);
    if(units*minSize>width)throw new Error(`${id}.${label}: text exceeds the fixed readable area; shorten the wording`);
  };
  if (profile) for (const [key, slot] of Object.entries(profile.slots)) {
    if (slot.type === "text" && slot.maxUnits && args[key]?.text) {
      const lines=String(args[key].text).split(/\r?\n/);
      if(lines.length>(slot.maxLines??1))throw new Error(id+"."+key+": too many lines for fixed layout");
      for(const line of lines)readable(line,slot.maxUnits,1,key,slot.asciiUnits??.75);
    }
    if (id === "V21_008" && slot.type === "text" && args[key]?.text) validateFixedCardSubtitle(key,args[key].text);
  }
  if(id==="V01_003")for(const key of ["upper","lower"])if(timing.end-args[key].at<.7)throw new Error(`${id}.${key}: window must allow the complete entrance`);
  if(id==="V01_005")for(const card of args.cards)readable(card.text,6,1,"cards.text");
  if(id==="V01_007"){
    if(!args.background && timing.end-timing.start>169/30+.000001)throw new Error(id+": fixed background ends at 169 frames");
    args.nodes.forEach((n:any,i:number)=>readable(n.label,i?7:4,1,"nodes.label"));
  }
  if(id==="V04_001"){for(const card of args.cards)readable(card.text,5,1,"cards.text");readable(args.headline.text,6,1,"headline");if(timing.end-args.headline.at<.5)throw new Error(id+": allow complete headline entrance");}
  if(id==="V03_001"&&timing.end-args.people.at(-1).at<.4)throw new Error(`${id}: allow .4s after the last portrait entrance`);
  if(id==="V11_002")for(const card of args.cards)readable(card.text,2,1,"cards.text");
  if(id==="V01_001" && args.title)readable(args.title,8,1,"title");
  if(id==="V10_004")readable(args.text,2,1,"text");
  if(id==="V10_005"){readable(args.subject.label,4,1,"subject.label");readable(args.rejected.text,4,1,"rejected.text");readable(args.replacement.text,5,1,"replacement.text");}
  for(const key of ["upper","clips","panels","cards","nodes","people","highlights"]){if(Array.isArray(args[key]))checkOrdered(args[key],`${id}.${key}`,["upper","clips","panels"].includes(key));}
  if(id==="V01_001"||id==="V01_002"||id==="V05_002"){
    const sequence=args[id==="V01_001"?"upper":"clips"];
    if(Math.abs(sequence[0].at-timing.start)>1e-6)throw new Error(`${id}: first clip must start at host start`);
  }
  if(id==="V01_006"){
    const caps=[[40,16],[36,48,72,36,36]];
    args.panels.forEach((panel:any,i:number)=>{
      if(panel.comments.length!==caps[i].length)throw new Error(i===0?"wide comment panel requires two comments":"tall comment panel requires five comments");
      panel.comments.forEach((c:any,j:number)=>readable(c.text,caps[i][j],1,"panels.comments"));
    });
    if(args.panels[1].at-args.panels[0].at<42/30)throw new Error(id+": first panel must complete its original phase");
    if(timing.end-args.panels[1].at<56/30)throw new Error(id+": allow complete second panel entrance");
  }
  if(id==="V04_001"&&args.headline.at<args.cards.at(-1).at)throw new Error("profile headline must follow the cards");
  if(id==="V07_003"&&args.highlights[0].at-args.excerpt.at<.8)throw new Error("document excerpt needs .8s before the first highlight");
  if(id==="V10_005"&&args.replacement.at-args.rejected.at<.6)throw new Error("process correction needs .6s for the crossed-out claim");
  if(id==="V12_001"&&args.body&&args.body.at-timing.start<1.3)throw new Error("body cut cannot precede document unfolding");
  if(args.url){let url:URL;try{url=new URL(args.url);}catch{throw new Error("page URL must be valid http(s)");}if(!["http:","https:"].includes(url.protocol))throw new Error("page URL must be http(s)");}
  return {...envelope,spec:{...spec,_duration:timing.end-timing.start}};
};

function portraitDefinition(index: number) {
  const latepost = latepostContracts.get(PORTRAIT_CATALOG[index].id);
  if (latepost) return latepost.definition;
  const definition = PORTRAIT_FUNCTIONS[index];
  const extra = portraitContentParameters[PORTRAIT_CATALOG[index].id];
  if (!extra) return definition;
  return {...definition, parameters: {
    ...definition.parameters,
    properties: {...definition.parameters.properties, ...extra},
    required: [...definition.parameters.required, ...Object.keys(extra)],
  }};
}

export const portraitBindings = PORTRAIT_CATALOG.map((entry,index)=>({
  name:portraitDefinition(index).name,label:entry.name,template:entry.template,
  definition:portraitDefinition(index),groups:["portrait"] as const,
  minDurationSeconds:minimumPortraitDuration(entry.id),
  resolve:(input:unknown,timing:FunctionCallTiming)=>resolvePortraitFunctionArgs(entry.id,input,timing),
  elementAts:(input:Record<string,any>)=>portraitElementAts(input),
}));

export const portraitPlanningInstructions = `竖屏 mg-v-* 仅用于 9:16。每个完整动效只标注一个对应标签，固定 group="portrait"、mode="together"，保持原文，不在 HTML 中填时间或素材路径。规划阶段每个实例调用一次，按各函数字段使用实际口播字级绝对时间 at。视频槽只能用连续真实视频，sourceStart 为素材内入点；函数提供 sourceEnd 时必须填写素材内终点，取用长度覆盖该槽实际播放窗口。图片槽只填写其函数实际公开的字段；优化后的图片槽没有 sourceStart，不得添加，旧式函数要求此字段时填写 null。抠像槽必须用有效透明 PNG。网页先保存真实快照，资料槽只用原文截图。模型只填原有字位，不额外加解释或标题。新规划须填写函数公开的原有文字位（包括英文副行），只有函数明示可空的槽可以填 null。署名只填写用户或素材的真实署名，有字标图时用透明 PNG。无对应署名、原字幕、副行或物件的可空槽填 null。按画面能承载的信息数量、关系和素材类型选模板。upper/clips 首项从实例起点开始；透明叠加保留宿主视频底片。`;
