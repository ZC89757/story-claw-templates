import {at, closed, line, rootFields} from "./schema";

type Hours = {hours: number; at: number};

export type WorkHoursSpec = {
  background: {source: string; sourceStart: number};
  ticks: {start: string; briefing: string; boarding: string; end: string};
  total: Hours;
  paid: Hours;
};

const timeLabel = {type: "string", pattern: "^(?:[01]?[0-9]|2[0-3]):[0-5][0-9]$"};
const hours = (description: string) => closed({
  hours: {type: "integer", minimum: 1, maximum: 24, description},
  at: at(description + "大字出现"),
});

export const workHoursContract = {
  id: "latepost-V15_003",
  tag: "mg-v-work-hours-paid-contrast",
  title: "工时进度条与计酬反差",
  description: "全幅连续视频依次呈现早班准备、集体开会和机舱工作，上方红条由左向右推进。末段画面压暗虚焦，红色总时长换成计酬时长，轨道保留四段亮条。",
  minimumDuration: 7.8,
  definition: {
    type: "function",
    name: "create_portrait_work_hours_paid_contrast",
    strict: true,
    description: "9:16。实际工作时间大于计酬时长时使用。底片使用一条覆盖完整画面时长的真实连续视频，镜头顺序为早班准备、集中准备、机舱工作。固定四个轨道时间位，依次揭示实际工时和计酬时长。",
    parameters: closed({
      ...rootFields,
      background: closed({
        source: line(2000, "干净的连续竖屏视频路径，片长须覆盖 sourceStart 和整段播放时间"),
        sourceStart: {type: "number", minimum: 0, description: "从视频第几秒开始播放"},
      }),
      ticks: closed({start: timeLabel, briefing: timeLabel, boarding: timeLabel, end: timeLabel}),
      total: hours("实际工时"),
      paid: hours("计酬飞行时长"),
    }),
  },
  validate(spec: unknown, duration: number) {
    const {total, paid} = spec as WorkHoursSpec;
    if (total.at + 1e-6 < 1.58) {
      throw new Error("总工时出现前须为红色进度条保留至少 1.58 秒");
    }
    if (paid.hours >= total.hours || paid.at - total.at < 1.6 || duration - paid.at + 1e-6 < .85) {
      throw new Error("计酬时长须小于实际工时，两次数字揭示之间及结尾须保留停留时间");
    }
  },
  media: (_spec: unknown, duration: number) => [{type: "video" as const, path: ["background"], seconds: duration}],
} as const;
