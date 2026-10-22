import {assertFunctionEnvelope,functionAtSchema,functionOrderSchema,toLocalAt,type FunctionCallTiming} from "../function-call";
export type QuoteCharacter={text:string;at:number};
export type SpeakerQuoteSpec={speaker:string;portrait:string;quotation:"direct"|"paraphrase";characters:QuoteCharacter[];prepared?:boolean};
export const speakerQuoteFunctionDefinition={
  type:"function",name:"create_speaker_quote",strict:true,
  description:"Create a speaker portrait with narration-synchronized text above it. Supply each character and its real absolute word-timeline timestamp, in order; no guessed typewriter speed. quotation=paraphrase for a translated summary or unverified wording, direct only for a verified verbatim quote. The portrait is a rectangular image and does not require transparency.",
  parameters:{type:"object",additionalProperties:false,required:["group","order","speaker","portrait","quotation","characters"],properties:{group:{type:"string",enum:["portrait","landscape"]},order:functionOrderSchema,speaker:{type:"string",minLength:1,maxLength:40},portrait:{type:"string",minLength:1,maxLength:2000},quotation:{type:"string",enum:["direct","paraphrase"]},characters:{type:"array",minItems:1,maxItems:160,items:{type:"object",additionalProperties:false,required:["text","at"],properties:{text:{type:"string",minLength:1,maxLength:2},at:functionAtSchema}}}}},
} as const;
export const assertSpeakerQuoteSpec=(input:unknown):SpeakerQuoteSpec=>{
  const spec=input as SpeakerQuoteSpec;
  if(!spec||typeof spec.speaker!=="string"||!spec.speaker.trim()||spec.speaker.length>40||typeof spec.portrait!=="string"||!spec.portrait.trim()||spec.portrait.length>2000)throw new Error("speaker-quote requires speaker and portrait");
  if(!["direct","paraphrase"].includes(spec.quotation)||!Array.isArray(spec.characters)||!spec.characters.length||spec.characters.length>160)throw new Error("invalid speaker-quote characters or quotation type");
  for(const [i,c]of spec.characters.entries()){
    if(typeof c.text!=="string"||[...c.text].length!==1||!Number.isFinite(c.at)||c.at<0)throw new Error("quote requires one Unicode character and a finite timestamp per item");
    if(i&&c.at<spec.characters[i-1]!.at)throw new Error("quote character times must be in narration order");
  }
  return spec;
};
export const resolveSpeakerQuoteFunctionArgs=(input:unknown,timing:FunctionCallTiming)=>{
  const envelope=assertFunctionEnvelope(input,timing),value=input as SpeakerQuoteSpec;
  if(!["portrait","landscape"].includes(envelope.group)||Object.keys(input as object).some(k=>!["group","order","speaker","portrait","quotation","characters"].includes(k)))throw new Error("invalid speaker-quote arguments");
  if(!Array.isArray(value.characters))throw new Error("speaker-quote characters are required");
  const characters=value.characters.map(c=>{
    if(Object.keys(c).some(k=>!["text","at"].includes(k))||c.at>=timing.end)throw new Error("quote character must be inside its HTML window");
    return {text:c.text,at:toLocalAt(c.at,envelope.at)};
  });
  return {...envelope,spec:assertSpeakerQuoteSpec({speaker:value.speaker,portrait:value.portrait,quotation:value.quotation,characters})};
};
export const visibleQuoteCharacters=(characters:QuoteCharacter[],time:number)=>characters.filter(c=>c.at<=time+.000001).map(c=>c.text).join("");
export const speakerQuotePlanningInstructions=`speaker-quote group=portrait 是完整人物引语画面，画像为不透明图片，上方正文按真实字级时间轴逐字出现。16:9 横屏选择 group=landscape，画像靠右、文字在左上，所有内容参数和时间点与 portrait 一样；group 与审核 HTML 一致。characters 每项必须只有一个 Unicode 字符，at 使用该字真实绝对时间，禁止设置固定打字速度。portrait 使用准备好的真实照片或标记为生成的人物画像。中文译述、概括或未核对原句时 quotation=paraphrase，画面标“观点转述”且不加引号；只有核验的逐字原话才可 direct。原文逐字保留在 HTML，人物名/话语可用 mg-value 定位；不在正文追加引语来源。`;
