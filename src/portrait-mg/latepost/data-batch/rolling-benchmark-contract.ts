export type RollingBenchmarkSpec={
  titleLead:string;titleEmphasis:string;note:string;sourceLine:string;axisLabel:string;portraitImage:string;
  firstYear:number;
  subject:{label:string;values:number[]};
  benchmark:{label:string;values:number[]};
  recent:{year:number;at:number};
  finish:{at:number};
};
const closed=<T extends Record<string,unknown>>(properties:T)=>({
  type:"object",properties,required:Object.keys(properties),additionalProperties:false,
});
const text=(maxLength:number)=>({type:"string",minLength:1,maxLength});
const series=closed({label:text(12),values:{type:"array",minItems:42,maxItems:62,items:{type:"number",minimum:1,maximum:500}}});
const at={type:"number",minimum:0};
const definition={
  type:"function" as const,name:"create_portrait_rolling_benchmark",strict:true as const,
  description:"仅 9:16。浅色肖像与双折线同架坐标。两条线先同步绘出长期对比，后半画面横向推动时间轴到近年区域，加淡红色背景，比较线越过主体线。序列使用同一年份、同基年的真实倍数；坐标自算。titleEmphasis 是原标题后段有下划线的短语。recent.at 为口播进入近年阶段，finish.at 为口播给出最终走势。portraitImage 提供独立透明静态 PNG。",
  parameters:closed({
    group:{type:"string",enum:["portrait"]},order:{anyOf:[{type:"integer",minimum:1},{type:"null"}]},
    titleLead:text(16),titleEmphasis:text(10),note:text(52),sourceLine:text(30),axisLabel:text(14),portraitImage:text(2048),
    firstYear:{type:"integer",minimum:1700,maximum:2050},
    subject:series,benchmark:series,
    recent:closed({year:{type:"integer",minimum:1720,maximum:2110},at}),finish:closed({at}),
  }),
};
function validate(input:unknown,duration:number){
  const spec=input as RollingBenchmarkSpec;
  const {subject,benchmark}=spec;
  const amount=subject.values.length;
  const local=spec.recent.year-spec.firstYear;
  if(amount!==benchmark.values.length||local<27||local>amount-8||spec.recent.year%10!==0
    || subject.values[local] <= benchmark.values[local] || subject.values.at(-1)! >= benchmark.values.at(-1)!) {
    throw new Error("滚动双曲线需要共同年份、十年刻度和原版的后段反超走势");
  }
  if(spec.recent.at<3.3||spec.finish.at-spec.recent.at<1.28||duration-spec.finish.at<.43) {
    throw new Error("滚动对标需要前半描线、平移结合后段描线及终点停留的时间");
  }
  const values=[[spec.titleLead,11.4],[spec.titleEmphasis,7],[spec.note,42],[spec.sourceLine,21],[spec.axisLabel,14],[subject.label,11],[benchmark.label,11]]as const;
  for(const [s,limit] of values){
    const units=Array.from(s).reduce((sum,c)=>sum+(/^[\x20-\x7e]$/.test(c)?.55:1),0);
    if(/[\r\n]/.test(s)||units>limit) throw new Error("双曲线文案应适配原版不变的字位，请缩短");
  }
}
export const rollingBenchmarkContract={
  id:"latepost-V12_002",tag:"mg-v-rolling-benchmark",title:"双曲线滚动对标",
  description:"肖像淡底上，两条时间线齐头描出；红色区间随横轴滑入，后段蓝线升到红线上方。",
  minimumDuration:5.02,definition,validate,
  media:()=>[{type:"cutout" as const,path:["portraitImage"]}],
} as const;
