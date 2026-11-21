export type AssetReturnWindowSpec={
  title:string;note:string;sourceLine:string;portraitImage:string;
  firstYear:number;startWindowYear:number;values:number[];
  currency:string;converted:{value:number;currency:string;note:string};
  multiple:number;
  multipleBeat:{at:number};initialRate:{value:number;at:number};newRate:{value:number;at:number};
};
const closed=<T extends Record<string,unknown>>(properties:T)=>({
  type:"object",properties,required:Object.keys(properties),additionalProperties:false,
});
const text=(maxLength:number)=>({type:"string",minLength:1,maxLength});
const at={type:"number",minimum:0};
const value={type:"number",minimum:.01,maximum:999};
const rate={type:"number",minimum:.01,maximum:99};
const definition={
  type:"function" as const,
  name:"create_portrait_asset_return_window",
  strict:true as const,
  description:"仅9:16。单条长期资产曲线从起始点向右描出，依次亮终点与换算值、总倍数、年化，最后起始点滑到后一个年份并用同一折线显示新年化。values 为同单位、逐年真实数据。必须提供内容所述的真实倍数和两项年化收益，不能从图形画面估计。portraitImage 为主题肖像独立透明静态图；三处 at 为实际口播绝对秒数。",
  parameters:closed({
    group:{type:"string",enum:["portrait"]},order:{anyOf:[{type:"integer",minimum:1},{type:"null"}]},
    title:text(30),note:text(54),sourceLine:text(30),portraitImage:text(2048),
    firstYear:{type:"integer",minimum:1700,maximum:2000},
    startWindowYear:{type:"integer",minimum:1710,maximum:2100},
    values:{type:"array",minItems:35,maxItems:145,items:value},
    currency:text(7),converted:closed({value,currency:text(7),note:text(33)}),
    multiple:{type:"integer",minimum:2,maximum:999},multipleBeat:closed({at}),
    initialRate:closed({value:rate,at}),newRate:closed({value:rate,at}),
  }),
};
function validate(input:unknown,duration:number){
  const spec=input as AssetReturnWindowSpec;
  const latest=spec.firstYear+spec.values.length-1;
  if(spec.startWindowYear<spec.firstYear+8||spec.startWindowYear>latest-7||spec.values.at(-1)!<=spec.values[0]
    ||Math.max(...spec.values)>1.1*spec.values.at(-1)!) throw new Error("长期收益模板的后段起算点需在序列内，曲线终点应接近或达到最高值");
  if(spec.multipleBeat.at<3.05||spec.initialRate.at-spec.multipleBeat.at<.55||spec.newRate.at-spec.initialRate.at<.90
    ||duration-spec.newRate.at<1.04) throw new Error("请为终点量、倍数、原年化及起算点滑动保留完整时间");
  const items=[[spec.title,19],[spec.note,43],[spec.sourceLine,23],[spec.currency,7],[spec.converted.currency,7],[spec.converted.note,27]] as const;
  for(const [value,max] of items){
    const units=Array.from(value).reduce((sum,c)=>sum+(/^[\x20-\x7e]$/.test(c)?.56:1),0);
    if(/[\r\n]/.test(value)||units>max) throw new Error("长期收益版式保留固定字位，请缩短文案");
  }
}
export const assetReturnWindowContract={
  id:"latepost-V12_001",tag:"mg-v-asset-return-window",title:"长期收益曲线更换起算点",
  description:"米色肖像后方不动，红点走出资产曲线。走数显示金额、倍数和年化，最后沿同一折线截去前段并改用近年计量。",
  minimumDuration:5.54,definition,validate,
  media:()=>[{type:"cutout" as const,path:["portraitImage"]}],
} as const;
