export type FirstLastColumnsSpec = {
  title:string;
  sourceLine:string;
  firstYear:number;
  values:number[];
  first:{at:number};
  last:{at:number};
};

const closed=<T extends Record<string,unknown>>(properties:T)=>({
  type:"object",properties,required:Object.keys(properties),additionalProperties:false,
});
const text=(maxLength:number)=>({type:"string",minLength:1,maxLength});
const at=closed({at:{type:"number",minimum:0}});
const definition={
  type:"function" as const,
  name:"create_portrait_first_last_columns",
  description:"仅 9:16。连续九年共用一纵轴，用红柱从左到右依次升起。先标第一年，后压暗中间七年并标最后一年。填同单位真实数据，单位放在原有标题末尾。first.at、last.at 分别是口播点到起止数字的绝对秒数。",
  strict:true as const,
  parameters:closed({
    group:{type:"string",enum:["portrait"]},order:{anyOf:[{type:"integer",minimum:1},{type:"null"}]},
    title:text(39),sourceLine:text(40),
    firstYear:{type:"integer",minimum:1900,maximum:2091},
    values:{type:"array",minItems:9,maxItems:9,items:{type:"number",minimum:0,maximum:9999}},
    first:at,last:at,
  }),
};

function validate(input:unknown,duration:number){
  const spec=input as FirstLastColumnsSpec;
  if(spec.values[0]<=0 || spec.values.some((value,index)=>index>0&&value>spec.values[index-1]) || spec.values[8]>=spec.values[0]) throw new Error("首尾柱图需要同尺度且整体下降的九年数值");
  if(spec.first.at<2.55||spec.last.at-spec.first.at<.69||duration-spec.last.at<.50) throw new Error("需要保留逐柱升起、首柱读数和末柱聚焦的完整阶段");
  for(const [value,limit] of [[spec.title,19.7],[spec.sourceLine,27]] as const) {
    const width=Array.from(value).reduce((sum,char)=>sum+(/^[\x20-\x7e]$/.test(char)?(/[WM]/.test(char)?.86:.52):1),0);
    if(/[\r\n]/.test(value)||width>limit)throw new Error("请缩短首尾柱图标题和来源，使其符合原字位");
  }
}

export const firstLastColumnsContract={
  id:"latepost-V09_005",
  tag:"mg-v-first-last-columns",
  title:"下降柱状图聚焦首尾",
  description:"九根红柱依年升起，先在左侧亮出首值，随后压暗中间柱，右侧补末值。",
  minimumDuration:3.75,
  definition,validate,
} as const;
