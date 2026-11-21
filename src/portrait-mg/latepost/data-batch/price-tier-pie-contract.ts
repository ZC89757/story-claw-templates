export type PriceTierPieSpec = {
  period: string;
  title: string;
  sourceLine: string;
  tiers: {label: string; upper: number; leaderIcon: string}[];
  shares: {leader: string; remainder: string; leaderShare: number; at: number};
};

const text=(maxLength:number)=>({type:"string",minLength:1,maxLength});
const closed=<T extends Record<string,unknown>>(properties:T)=>({
  type:"object",properties,required:Object.keys(properties),additionalProperties:false,
});
const definition={
  type:"function" as const,
  name:"create_portrait_price_tier_pie",
  strict:true as const,
  description:"仅 9:16。四个连续价格档位按升序显示，最高档为起始门槛以上的开放档。tiers[0..2].upper 填各闭合档的价格上限，tiers[3].upper 填开放档开始值（与 tiers[2].upper 相同）。每档填写该档领先对象的真实透明标记素材。shares 填最后一档两方简称和真实领先份额，at 为聚焦最高档的口播绝对秒数。",
  parameters:closed({
    group:{type:"string",enum:["portrait"]},order:{anyOf:[{type:"integer",minimum:1},{type:"null"}]},
    period:text(15),title:text(23),sourceLine:text(45),
    tiers:{type:"array",minItems:4,maxItems:4,items:closed({label:text(6),upper:{type:"integer",minimum:1,maximum:999_999},leaderIcon:text(2048)})},
    shares:closed({leader:text(4),remainder:text(10),leaderShare:{type:"number",minimum:.52,maximum:.94},at:{type:"number",minimum:0}}),
  }),
};

function validate(input:unknown,duration:number) {
  const spec=input as PriceTierPieSpec;
  const [,medium,high,top]=spec.tiers;
  if (spec.tiers[0].upper>=medium.upper || medium.upper>=high.upper || top.upper!==high.upper) throw new Error("价格档位须顺序增高，最高档开放界与前一档上限相同");
  if (spec.tiers[0].upper/high.upper<.075 || (medium.upper-spec.tiers[0].upper)/high.upper<.10 || high.upper>9999) {
    throw new Error("竖屏价格梯级需为各档标注留足固定区域");
  }
  if (spec.shares.at<1.52 || duration-spec.shares.at<.86) throw new Error("请保留阶梯入场并留出饼图揭示时间");
  const widths=[[spec.period,13],[spec.title,14.5],[spec.sourceLine,25],...spec.tiers.map(tier=>[tier.label,6] as const),[spec.shares.leader,3],[spec.shares.remainder,7]] as const;
  for(const [value,limit] of widths){
    const units=Array.from(value).reduce((sum,char)=>sum+(/^[\x20-\x7e]$/.test(char)?.55:1),0);
    if (/[\r\n]/.test(value)||units>limit) throw new Error("价格分档与饼图使用固定字位，请缩短文案");
  }
}

export const priceTierPieContract={
  id:"latepost-V08_002",
  tag:"mg-v-price-tier-pie",
  title:"价格分档切单档份额",
  description:"四档红色阶梯和领先平台标记先入场。点亮各档后，压暗前三档，连向前景红白份额图。",
  minimumDuration:2.4,
  definition,validate,
  media:(input:unknown)=>(input as PriceTierPieSpec).tiers.map((_,index)=>({type:"cutout" as const,path:["tiers",index,"leaderIcon"]})),
} as const;
