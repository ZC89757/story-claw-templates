import {resolveProduction, resolveNumeric} from "./schema";
const source = (image: string) => ({method: "existing" as const, prompt: null, image, background: {transparent: true}});
const old = (name: string) => source(`generic-documentary/${name}.png`);
const img = (name: string) => source(`generic-documentary/${name}.png`);
const stage = (id: string, label: string, actorId: string, picture: ReturnType<typeof source>, at: number, parts: ReturnType<typeof source>[] = []) => ({id, label, actorId, source: picture, at, parts: parts.map((source, i) => ({source, appearAt: at + .65 + i * .3, mergeAt: at + 2 + i * .3}))});
const side = (label: string, picture: ReturnType<typeof source> | null, value: number, at: number, caption: string | null = null, qualifier = "exact") => ({label, source: picture, value, at, caption, qualifier});
const production = (title: string, actors: {id: string;label: string}[], stages: ReturnType<typeof stage>[]) => ({group:"production-chain",order:null,title,actors,stages,links:stages.slice(1).map((s,i)=>({from:stages[i].id,to:s.id,at:s.at+.4}))});
const numeric = (title: string, unit: string, left: ReturnType<typeof side>, right: ReturnType<typeof side>, mode="absolute") => ({group:"editorial-scale",order:null,title,unit,mode,left,right,unitsPerMark:null});
export const genericDemos = [
  {id:"automotive",title:"汽车制造",note:"沿用特斯拉稿中的分工与价格口径。车辆为示意图；倍数不换算成精确车价。",production:production("超级工厂分工",[{id:"tesla",label:"特斯拉"},{id:"partner",label:"松下"}],[stage("site","厂房、土地与基础设施","tesla",old("factory"),0),stage("cells","设备投入、电芯制造","partner",old("cells"),3.2),stage("assembly","最终组装","tesla",old("fastback"),6.4,[old("battery-pack")])]),numeric:numeric("同期家用车价格比较","美元",side("凯美瑞",old("sedan"),21955,0,"美国起售价"),side("Model S",old("fastback"),2.6,3,"最低规划版本 · 抵免前","approx"),"relative")},
  {id:"semiconductor",title:"半导体制造",note:"流程为简化示意；产品 A/B 的容量为虚构演示数据，不代表真实芯片规格。",production:production("芯片制造分工",[{id:"design",label:"设计团队"},{id:"fab",label:"晶圆厂"},{id:"package",label:"封测厂"}],[stage("design","电路与版图设计","design",img("chip-design"),0),stage("wafer","晶圆制造","fab",img("wafer"),3.2),stage("package","封装与测试","package",img("chip-large"),6.4,[img("chip-small")])]),numeric:numeric("片上存储容量比较","KB",side("芯片 A",img("chip-small"),256,0),side("芯片 B",img("chip-large"),512,3))},
  {id:"coffee",title:"咖啡生产",note:"流程为简化示意；产品 A/B 的单杯价格为虚构演示数据，不代表商家售价。",production:production("一杯咖啡的分工",[{id:"farm",label:"种植端"},{id:"roaster",label:"烘焙端"},{id:"shop",label:"门店"}],[stage("beans","采收与处理","farm",img("beans"),0),stage("roast","烘焙与品控","roaster",img("roaster"),3.2),stage("brew","研磨与冲煮","shop",img("coffee-black"),6.4,[img("beans-generated")])]),numeric:numeric("单杯价格比较","元",side("产品 A",img("coffee-black"),18,0),side("产品 B",img("coffee-milk"),30,3))},
] as const;
export const countDemo = {...numeric("配置数量比较","种",side("方案 A",null,1500,0,null,"greater-than"),side("方案 B",null,100,3,null,"at-most")),group:"editorial-counts",unitsPerMark:10};
export const genericPreviewProduction = resolveProduction(genericDemos[0].production,{start:0,end:10}).spec;
export const genericPreviewNumeric = resolveNumeric(genericDemos[0].numeric,{start:0,end:8}).spec;
export const genericPreviewCounts = resolveNumeric(countDemo,{start:0,end:8}).spec;
