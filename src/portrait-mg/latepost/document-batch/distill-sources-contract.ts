import {closed, cue, envelope, fixedLine, text} from "./contract-helpers";

type Source = {
  image: string;
  party: string;
  leftNumber: string;
  leftUnit: string;
  rightNumber: string;
  rightUnit: string;
  focus: {at:number};
};
export type DistillSourcesSpec = {
  authority:string;
  first:Source;
  second:Source;
};

function validateDistillSources(spec: unknown, duration: number) {
  const value=spec as DistillSourcesSpec;
  if (value.first.focus.at<1.5 || value.second.focus.at-value.first.focus.at<1.45 ||
    duration-value.second.focus.at<3) {
    throw new Error("双文件要求原有封面推进、两次证据高亮和末尾活动背景均留足时间");
  }
  fixedLine(value.authority,12,"发布方字标");
  for (const [index,item] of [value.first,value.second].entries()) {
    fixedLine(item.party,index===0?13.5:7.1,"涉及对象");
    fixedLine(item.leftUnit,4,"原单位");
    fixedLine(item.rightUnit,4,"原单位");
    fixedLine(item.leftNumber+item.leftUnit, index===0?4.75:6.4, "首个原文数据");
    fixedLine(item.rightNumber+item.rightUnit, index===0?6.35:4.75,"第二个原文数据");
  }
}

const numeral = {...text(6),pattern:"^[0-9.,]+$"};
const source = closed({
  image:text(2000,"真实报告正面静态图片，本地路径。需将三个关键英文字段排在规定的横向红条之上，保留标题与上下文。"),
  party:text(32,"出现在提取框中的对象名单或机构。"),
  leftNumber:numeral,rightNumber:numeral,leftUnit:text(5),rightUnit:text(5),
  focus:cue("口播从正文提取该报告数据的绝对秒数"),
});

export const distillSourcesContract = {
  id:"latepost-V07_001",
  tag:"mg-v-two-documents-evidence-focus",
  title:"双份文件推近提炼",
  description:"适合同一发布方两份真实文件包含两个可核验的统计口径。暗底文件叠页上移，原字标横掠后推近页内三处红线，依次提出对象与两笔数字，再向第二份正文切换。",
  definition:{
    type:"function" as const,
    name:"create_portrait_two_documents_evidence_focus",
    strict:true,
    description:"只用于 9:16 的双来源提炼。两个不同真实报告用静态图，字标为报告共同发布方。原报告整段文字须由素材提供，分别填写短对象名和左右两个数字、单位。所有 at 为旁白的绝对秒数。",
    parameters:closed({...envelope,authority:text(20,"原报告共同发布方的短字标。"),first:source,second:source}),
  },
  minimumDuration:6.2,
  validate:validateDistillSources,
  media:()=>[{type:"image",path:["first","image"]},{type:"image",path:["second","image"]}] as const,
} as const;
