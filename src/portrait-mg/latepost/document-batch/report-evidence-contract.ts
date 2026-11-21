import {closed, cue, envelope, fixedLine, text} from "./contract-helpers";

export type ReportEvidenceSpec = {
  background: {source:string;sourceStart:number};
  cover: string;
  page: string;
  pageReveal: {at:number};
  first: {at:number;text:string};
  second: {at:number;text:string};
};

function validateReportEvidence(spec: unknown, duration: number) {
  const {pageReveal, first, second} = spec as ReportEvidenceSpec;
  if (pageReveal.at < .96 || first.at - pageReveal.at < .65 || second.at - first.at < .38 || duration - second.at < .9) {
    throw new Error("报告封面、内页、两条原文及退场需要完整时间");
  }
  fixedLine(first.text,8.6,"首条报告数字");
  fixedLine(second.text,8.6,"第二条报告数字");
}
const source = text(2000,"真实报告静态截图，仅包含原报告内容。");
const evidence = closed({at:{type:"number",minimum:0,description:"真实口播的绝对秒数。"},
  text:text(16,"原报告短数据结论，单行，最多约 8 个全角字。")});

export const reportEvidenceContract = {
  id:"latepost-V03_001",
  tag:"mg-v-report-two-evidence",
  title:"报告覆页与双数字提炼",
  description:"适合一份真实报告的一页包含两个可对照的核心统计。在真实背景视频上覆两页资料，由底部滑入封面，切内页并放大，再从左按顺序展开两条红底白字，整页下退出画。",
  definition:{
    type:"function" as const,
    name:"create_portrait_report_two_evidence",
    strict:true,
    description:"仅 9:16。真实报告的一页有两个需要提炼的原文数字时使用。底片须连续真实视频，封面/内页为独立静态图。pageReveal / first / second 的 at 为真实口播绝对秒数。",
    parameters:closed({
      ...envelope,
      background:closed({source:text(2000,"与报告主题相关的真实视频底片，本地路径。"),sourceStart:{type:"number",minimum:0}}),
      cover:source,
      page:source,
      pageReveal:cue("说到报告统计范围或转入报告详情"),
      first:evidence,second:evidence,
    }),
  },
  minimumDuration:3.2,
  validate:validateReportEvidence,
  media:(_spec:unknown,duration:number)=>[
    {type:"video" as const,path:["background"],seconds:duration},
    {type:"image" as const,path:["cover"]},
    {type:"image" as const,path:["page"]},
  ],
} as const;
