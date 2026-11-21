import {closed, cue, envelope, fixedLine, text} from "./contract-helpers";

export type ResearchPaperSpec = {
  frontPage:string;
  insidePage:string;
  chapter:string;
  englishTerm:string;
  term:string;
  author:string;
  paperTitle:string;
  paperOriginalTitle:string;
  explanation:[string,string];
  conclusion:[string,string];
  chapterReveal:{at:number};
  paperReveal:{at:number};
  termReveal:{at:number};
  explanationReveal:{at:number};
  conclusionReveal:{at:number};
};

function validateResearchPaper(spec:unknown,duration:number) {
  const v=spec as ResearchPaperSpec;
  const marks=[0,v.chapterReveal.at,v.paperReveal.at,v.termReveal.at,v.explanationReveal.at,v.conclusionReveal.at,duration];
  if (marks.slice(1).some((at,i)=>at-marks[i]<[.4,.7,1,.95,1.05,.65][i])) {
    throw new Error("论文飞页、章节、署名和释义需要按原顺序完整呈现");
  }
  fixedLine(v.term,7,"概念中文");
  fixedLine(v.englishTerm,17,"概念英文");
  fixedLine(v.chapter,8,"原短章标题");
  fixedLine(v.paperTitle,8,"论文中文名");
  fixedLine(v.author,12,"作者名");
  fixedLine(v.paperOriginalTitle,20,"论文原名");
  v.explanation.forEach(line=>fixedLine(line,10,"红字释义"));
  v.conclusion.forEach(line=>fixedLine(line,14,"白字结果"));
}

const page=text(2000,"真实论文单页截图，本地图片路径，不带视频角标、水印或添加的文案。");
const twoLines = (description:string) => ({type:"array",minItems:2,maxItems:2,items:text(30),description});

export const researchPaperContract = {
  id:"latepost-V08_005",
  tag:"mg-v-paper-flight-concept",
  title:"飞页论文与双语术语",
  description:"适合从一篇真实论文引出一个双语术语，再分两行解释其机制与实际结果。保持多个独立纸页翻飞、正页归中、红底作者题名与原页虚化层。",
  definition:{
    type:"function" as const,
    name:"create_portrait_paper_flight_concept",
    strict:true,
    description:"仅9:16。两页真实论文静态图在多个透视纸页上翻飞；章节号固定 Part 3，输入原短章标题，之后出现作者及原中英题名，再用两行红字解释概念以及两行白字说明结果。资料应真实且短句可排入原字位。所有 at 为旁白的绝对秒数。",
    parameters:closed({
      ...envelope,frontPage:page,insidePage:page,
      chapter:text(15),englishTerm:text(32),term:text(12),author:text(23),
      paperTitle:text(18),paperOriginalTitle:text(47),
      explanation:twoLines("按原构图分写两行红字解释。"),
      conclusion:twoLines("按原构图分写两行白字结果。"),
      chapterReveal:cue("说到章标题"),
      paperReveal:cue("介绍论文和作者"),
      termReveal:cue("点出论文定义的术语"),
      explanationReveal:cue("开始说明机制"),
      conclusionReveal:cue("开始说明结果"),
    }),
  },
  minimumDuration:5.2,
  validate:validateResearchPaper,
  media:()=>[{type:"image",path:["frontPage"]},{type:"image",path:["insidePage"]}] as const,
} as const;
