import {closed, cue, envelope, fixedLine, text} from "./contract-helpers";

type ReportExcerpt = {
  original: [string, string | null];
  percentage: number;
  label: string;
  focus: {at: number};
  summary: {at: number};
};

export type ReportZoomSpec = {
  cover: string;
  reverse: string;
  document: string;
  year: string;
  turn: {at: number};
  first: ReportExcerpt;
  second: ReportExcerpt;
};

const excerpt = closed({
  original: {type: "array", minItems: 2, maxItems: 2, items: {anyOf: [text(60), {type: "null"}]},
    description: "真实原句按原构图分行。第一例须两行；第二例须一行，数组末项填 null。"},
  percentage: {type: "number", minimum: 0, maximum: 100, description: "报告所述百分比，填写数值。"},
  label: text(7, "与百分比并列的中文短标签，保留原有字位。"),
  focus: cue("口播开始解读该条原文时的绝对秒数。"),
  summary: cue("口播报告该百分比结论时的绝对秒数。"),
});

function validateReportZoom(spec: unknown, duration: number) {
  const value = spec as ReportZoomSpec;
  const ticks = [0, value.turn.at, value.first.focus.at, value.first.summary.at, value.second.focus.at, value.second.summary.at, duration];
  if (ticks.slice(1).some((at,index)=>at-ticks[index] < [1.4,1.4,.55,.8,.46,.55][index])) {
    throw new Error("报告封面翻页、正文推近与两条证据需要按顺序留出完整动作");
  }
  if (!value.first.original[0] || !value.first.original[1] || !value.second.original[0] || value.second.original[1] !== null) {
    throw new Error("两条原文分别必须占两行与一行");
  }
  for (const part of [value.first,value.second]) {
    for (const line of part.original) if (line) fixedLine(line,35,"报告原文");
    fixedLine(part.label,6,"结论标签");
  }
}

const picture = text(2000,"独立静态报告截图的本地路径，保留报告原文，不带视频帐号、水印或标注。");
export const reportZoomContract = {
  id:"latepost-V14_003",
  tag:"mg-v-report-paired-findings",
  title:"报告翻页与双结论",
  description:"适合一份真实报告的两句百分比结论。浅色原构图中，封面横移翻到说明页和正文；随后推近同一正文，逐词扫出两条原句并分别抽出数字和短标签。",
  definition:{
    type:"function" as const,
    name:"create_portrait_report_paired_findings",
    strict:true,
    description:"仅 9:16。输入同一真实报告的封面、反面说明页、原正文截图，按真实报告填写两条原句与百分比，禁止编造来源。各 at 采用宿主旁白的绝对秒数。正文被摘录的结论须位于截图上部执行摘要段。",
    parameters:closed({
      ...envelope,
      cover:picture,
      reverse:picture,
      document:picture,
      year:{...text(4),pattern:"^\\d{4}$"},
      turn:cue("旁白转入报告的绝对秒数"),
      first:excerpt,
      second:excerpt,
    }),
  },
  minimumDuration:5.4,
  validate:validateReportZoom,
  media:()=>[{type:"image",path:["cover"]},{type:"image",path:["reverse"]},{type:"image",path:["document"]}] as const,
} as const;
