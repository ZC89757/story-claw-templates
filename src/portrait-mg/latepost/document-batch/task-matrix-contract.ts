import {closed, cue, envelope, fixedLine, text} from "./contract-helpers";
export const taskTileOrder=[8,3,10,0,6,1,9,5,4,11,2,7] as const;
export const taskTileOffset=(index:number)=>taskTileOrder.findIndex(tile=>tile===index)*.037;

type Video = {source: string;sourceStart:number};
export type TaskMatrixSpec = {
  intro:[Video,Video,Video];
  introLabels:[string,string,string];
  tiles:{video:Video;value:string}[];
  detail:Video;
  sample:string;
  laborRate:string;
  detailValue:string;
  matrix:{at:number};
  switchPrice:{at:number};
  isolate:{at:number};
};

const video = closed({source:text(2000,"原素材类型为真实动态视频，本地路径。"),sourceStart:{type:"number",minimum:0}});
const rate = {...text(8),pattern:"^[0-9]+(\\.[0-9]{1,2})?$"};
const uncertain = {...text(8),pattern:"^[0-9?]+(\\.[0-9?]{1,2})?$"};
function validateTaskMatrix(spec:unknown,duration:number) {
  const value=spec as TaskMatrixSpec;
  if (value.matrix.at<1.24 || value.switchPrice.at-value.matrix.at<.45 ||
    value.isolate.at-value.switchPrice.at<.68 || duration-value.isolate.at<1.3) {
    throw new Error("第一视角素材矩阵必须按录档、人工价、智能价值、细看顺序，各自留足动作");
  }
  for(const label of value.introLabels) fixedLine(label,16,"档案标签");
  fixedLine(value.sample,22,"细看档案编号");
}

export const taskMatrixContract = {
  id:"latepost-V03_005",
  tag:"mg-v-task-value-footage-matrix",
  title:"任务视频矩阵与价值价签",
  description:"适合三次逐条展示同类动作后，对十二路真实第一视角视频统一打人工单价，再逐格换成不同估值，最后独立展示一个样本。保留真实视频窗、米白和青色价签、底部细进度。",
  definition:{
    type:"function" as const,
    name:"create_portrait_task_value_footage_matrix",
    strict:true,
    description:"仅9:16。由三个连续取样视频、十二个矩阵视频与一个末尾宽幅取样视频组成。不能以静图或其他带版式的成片替代视频，各视频需覆盖其实际播放窗口。所有 at 为旁白字级绝对时间。",
    parameters:closed({
      ...envelope,
      intro:{type:"array",minItems:3,maxItems:3,items:video},
      introLabels:{type:"array",minItems:3,maxItems:3,items:text(28,"原档案窗口内的双语短标签")},
      tiles:{type:"array",minItems:12,maxItems:12,items:closed({video,value:uncertain})},
      detail:video,sample:text(35,"末尾同一位置的样本编号和少量说明。"),
      laborRate:rate,detailValue:uncertain,
      matrix:cue("从档案画廊转入矩阵的绝对秒数"),
      switchPrice:cue("从人工单价转向智能价值的绝对秒数"),
      isolate:cue("转入最后独立样本的绝对秒数"),
    }),
  },
  minimumDuration:3.8,
  validate:validateTaskMatrix,
  media:(spec:unknown,duration:number)=>{
    const value=spec as TaskMatrixSpec;
    return [
      ...value.intro.map((_item,index)=>({type:"video" as const,path:["intro",String(index)],seconds:value.matrix.at/3})),
      ...value.tiles.map((_item,index)=>({type:"video" as const,path:["tiles",String(index),"video"],seconds:value.isolate.at-value.matrix.at-taskTileOffset(index)})),
      {type:"video" as const,path:["detail"],seconds:duration-value.isolate.at},
    ];
  },
} as const;
