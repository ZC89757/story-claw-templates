export type HistoryThresholdSpec={
  title:string;
  sourceLine:string;
  metric:string;
  firstYear:number;
  focus:{label:string;values:number[]};
  comparison:{label:string;values:number[]};
  result:{at:number};
  threshold:{value:number;at:number};
};
const closed=<T extends Record<string,unknown>>(properties:T)=>({
  type:"object",properties,required:Object.keys(properties),additionalProperties:false,
});
const text=(maxLength:number)=>({type:"string",minLength:1,maxLength});
const value={type:"number",minimum:.05,maximum:8} as const;
const trail=closed({label:text(4),values:{type:"array",minItems:45,maxItems:65,items:value}});
const at={type:"number",minimum:0};
const definition={
  type:"function" as const,
  name:"create_portrait_history_threshold",
  strict:true as const,
  description:"仅 9:16。原版 1～8 纵轴的长周期趋势。给出两组同起年、同长度的真实逐年数值。先同时绘制地区曲线及比较线，右侧揭示最新结果时淡去比较线，随后从左侧绘出阈值虚线。result.at 和 threshold.at 是对应旁白绝对秒数。",
  parameters:closed({
    group:{type:"string",enum:["portrait"]},order:{anyOf:[{type:"integer",minimum:1},{type:"null"}]},
    title:text(32),sourceLine:text(30),metric:text(7),firstYear:{type:"integer",minimum:1800,maximum:2050},
    focus:trail,comparison:trail,result:closed({at}),threshold:closed({value,at}),
  }),
};
function validate(input:unknown,duration:number){
  const spec=input as HistoryThresholdSpec;
  if(spec.focus.values.length!==spec.comparison.values.length||spec.threshold.value<1.5||spec.threshold.value>3.6||
     spec.focus.values.at(-1)!>=spec.threshold.value) throw new Error("阈值图需要同长历史序列，最新结果低于可在原位显示的阈值");
  if(spec.result.at<2.85||spec.threshold.at-spec.result.at<.65||duration-spec.threshold.at<.64) throw new Error("需完成同期描线、突出当期结果，再绘制阈值");
  for(const [s,limit] of [[spec.title,20],[spec.sourceLine,23],[spec.metric,7],[spec.focus.label,3.5],[spec.comparison.label,3.5]] as const){
    const n=Array.from(s).reduce((sum,c)=>sum+(/^[\x20-\x7e]$/.test(c)?.55:1),0);
    if(/[\r\n]/.test(s)||n>limit)throw new Error("历史阈值图使用固定文字位置，请缩短文案");
  }
}
export const historyThresholdContract={
  id:"latepost-V13_002",tag:"mg-v-history-threshold",title:"历史曲线与阈值对照",
  description:"淡纹坐标中同铺地区与比较曲线。红色结果浮出后，基准比较线淡去，随后出现水平阈值虚线。",
  minimumDuration:4.2,definition,validate,
} as const;
