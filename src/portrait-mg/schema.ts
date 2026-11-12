import {assertFunctionEnvelope, assertFunctionTiming, type FunctionCallTiming} from "../function-call";
import {PORTRAIT_CATALOG, type PortraitTemplateName} from "./catalog.js";
import {LEGACY_PORTRAIT_FUNCTIONS} from "./legacy-definitions";
import {REFERENCE_FUNCTIONS} from "./reference-definitions";
import {getReferenceProfile} from "./reference-profiles";

const PORTRAIT_FUNCTIONS = [...LEGACY_PORTRAIT_FUNCTIONS, ...REFERENCE_FUNCTIONS];

type Shape = {type?:string;anyOf?:readonly Shape[];enum?:readonly unknown[];properties?:Record<string,Shape>;required?:readonly string[];additionalProperties?:boolean;items?:Shape;minItems?:number;maxItems?:number;minimum?:number;maximum?:number;minLength?:number;maxLength?:number};
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
    if(typeof value!=="string"||!value.trim()||value.length<(schema.minLength??0)||value.length>(schema.maxLength??Infinity))throw new Error(`${name}: invalid text`);return;
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
const legacyMinDuration: Record<string, number> = {V01_001: .5, V01_002: .5, V01_006: .6, V04_002: 1.5, V05_002: 1.1, V07_003: 3, V10_004: 2.5, V10_005: 3, V12_001: 2};

const checkOrdered=(events:any[],name:string,strict=false)=>{
  if(events.some((x,i)=>i>0&&(strict?x.at<=events[i-1].at:x.at<events[i-1].at)))throw new Error(`${name}: event times must ${strict?"strictly increase":"be non-decreasing"}`);
};
export const resolvePortraitFunctionArgs = (id:string,input:unknown,timing:FunctionCallTiming) => {
  assertFunctionTiming(timing);
  const index=PORTRAIT_CATALOG.findIndex(x=>x.id===id);
  if(index<0)throw new Error(`Unknown portrait template ${id}`);
  validatePortraitShape(input,PORTRAIT_FUNCTIONS[index].parameters as unknown as Shape);
  const envelope=assertFunctionEnvelope(input,timing),args=input as Record<string,any>;
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
  const minimumDuration = legacyMinDuration[id] ?? .4;
  if (timing.end - timing.start < minimumDuration) throw new Error(`${id}: window is too short for the fixed entrance (${minimumDuration}s)`);
  for(const at of portraitElementAts(args))if(at<timing.start||at>=timing.end)throw new Error(`${id}: event.at outside host [start,end)`);
  const local=(value:any):any=>Array.isArray(value)?value.map(local):value&&typeof value==="object"?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,k==="at"?Math.round(((v as number)-timing.start)*1e6)/1e6:local(v)])):value;
  const {group,order,...business}=args;
  const spec=local(business);
  for(const key of ["upper","clips","panels","cards","nodes","people","highlights"]){if(Array.isArray(args[key]))checkOrdered(args[key],`${id}.${key}`,["upper","clips","panels"].includes(key));}
  if(id==="V01_001"||id==="V01_002"||id==="V05_002"){
    const sequence=args[id==="V01_001"?"upper":"clips"];
    if(Math.abs(sequence[0].at-timing.start)>1e-6)throw new Error(`${id}: first clip must start at host start`);
  }
  if(id==="V01_006")for(const p of args.panels)if(p.layout==="wide"&&p.comments.length>2)throw new Error("wide comment panel supports at most two comments");
  if(id==="V07_003"&&args.highlights[0].at-args.excerpt.at<.8)throw new Error("document excerpt needs .8s before the first highlight");
  if(id==="V10_005"&&args.replacement.at-args.rejected.at<.6)throw new Error("process correction needs .6s for the crossed-out claim");
  if(id==="V12_001"&&args.body&&args.body.at-timing.start<1.3)throw new Error("body cut cannot precede document unfolding");
  if(args.url){let url:URL;try{url=new URL(args.url);}catch{throw new Error("page URL must be valid http(s)");}if(!["http:","https:"].includes(url.protocol))throw new Error("page URL must be http(s)");}
  return {...envelope,spec:{...spec,_duration:timing.end-timing.start}};
};

export const portraitBindings = PORTRAIT_CATALOG.map((entry,index)=>({
  name:PORTRAIT_FUNCTIONS[index].name,label:entry.name,template:entry.template,
  definition:PORTRAIT_FUNCTIONS[index],groups:["portrait"] as const,
  minDurationSeconds:legacyMinDuration[entry.id] ?? .4,
  resolve:(input:unknown,timing:FunctionCallTiming)=>resolvePortraitFunctionArgs(entry.id,input,timing),
  elementAts:(input:Record<string,any>)=>portraitElementAts(input),
}));

export const portraitPlanningInstructions = `竖屏 mg-v-* 仅用于 9:16。每个完整动效只标注一个对应标签，固定 group="portrait"、mode="together"，保持原文，不在 HTML 中填时间或素材路径。规划阶段每个实例调用一次，按各函数字段使用实际口播字级绝对时间 at。视频槽只能用连续真实视频，sourceStart 为素材内入点；图片槽的 sourceStart 为 null，抠像槽必须用有效透明 PNG。网页先保存真实快照，资料槽只用原文截图。模型只填原有字位，不额外加解释或标题。`;
