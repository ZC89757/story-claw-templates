import {at, checkSpacing, clip, closed, identity, text, type Clip} from "./fields";

type Hours = {amount: string; at: number};
export type HoursConversionSpec = {
  background: Clip;
  wage: {label: string; at: number};
  monthly: Hours;
  daily: Hours;
};

export const hoursConversionContract = {
  id: "latepost-V04_003", tag: "mg-v-work-hours-conversion", title: "工时换算",
  description: "黑白工人和产线后出现快转的红钟，钟面退去后换成月薪、月工时和日均工时白条。",
  minimumDuration: 3.2,
  definition: {
    type: "function", name: "create_portrait_work_hours_conversion", strict: true,
    description: "仅9:16。连续工厂产线视频在前景，工资、月工时、日均工时按口播顺序出现。at 为绝对秒。工时数字可带加号，单位由模板绘制。",
    parameters: closed({
      ...identity, background: clip("连续实拍工人操作生产线，适合放在竖屏下方"),
      wage: closed({label: text(4), at: at("钟面退去后首张工资字条露出的绝对秒数")}),
      monthly: closed({amount: {...text(4), pattern: "^[0-9]{1,3}[+]?$"}, at: at("月工时字条进入的绝对秒数")}),
      daily: closed({amount: {...text(3), pattern: "^[0-9]{1,2}[+]?$"}, at: at("日均工时字条进入的绝对秒数")}),
    }),
  },
  validate: (spec: unknown, duration: number) => {
    const {wage, monthly, daily} = spec as HoursConversionSpec;
    checkSpacing([0, wage.at, monthly.at, daily.at, duration], [1.3, .6, .7, .6], "钟面和三张字条必须按顺序完整呈现");
  },
  media: (_spec: unknown, duration: number) => [{type: "video" as const, path: ["background"], seconds: duration}],
} as const;

type Case = {
  exterior: Clip; production: Clip & {at: number};
  hours: {label: string; at: number}; shift: {label: string; at: number}; takeHome: {amount: string; at: number};
};
export type PayrollCasesSpec = {first: Case; second: Case & {at: number}};
const caseFields = {
  exterior: clip("该案例的工厂外景实拍"),
  production: closed({...clip("同一案例的工厂内部产线实拍").properties, at: at("切换到生产线的绝对秒数")}),
  hours: closed({label: text(5), at: at("左侧工时或轮班标签出现的绝对秒数")}),
  shift: closed({label: text(5), at: at("右侧休息或夜班标签出现的绝对秒数")}),
  takeHome: closed({amount: {...text(6), pattern: "^[0-9]{1,6}$"}, at: at("到手金额出现的绝对秒数，金额单位为元")}),
};

export const payrollCasesContract = {
  id: "latepost-V04_005", tag: "mg-v-work-payroll-cases", title: "工时薪酬双案例",
  description: "画面上下留黑灰空间，两组工业镜头依次硬切。每组在同一位置盖上两张红底工时标签，再打出到手金额。",
  minimumDuration: 4.4,
  definition: {
    type: "function", name: "create_portrait_work_payroll_cases", strict: true,
    description: "仅9:16。每个案例提供厂房和产线连续实拍。两个短工时标签依次出现，大号到手金额随后出现。所有 at 为绝对秒，两个镜头独立准备。",
    parameters: closed({...identity, first: closed(caseFields), second: closed({...caseFields, at: at("切到第二案例并清空第一组标签的绝对秒数")})}),
  },
  validate: (spec: unknown, duration: number) => {
    const {first, second} = spec as PayrollCasesSpec;
    for (const [entry, start, end] of [[first, 0, second.at], [second, second.at, duration]] as const) {
      checkSpacing([start, entry.hours.at, entry.shift.at, entry.takeHome.at, end], [.2, .45, .55, .7], "每组工时牌和金额需依次入场");
      checkSpacing([start, entry.production.at, end], [.5, .5], "每组厂房和产线都需要独立时长");
    }
  },
  media: (spec: Record<string, any>, duration: number) => [
    {type: "video" as const, path: ["first", "exterior"], seconds: spec.first.production.at},
    {type: "video" as const, path: ["first", "production"], seconds: spec.second.at - spec.first.production.at},
    {type: "video" as const, path: ["second", "exterior"], seconds: spec.second.production.at - spec.second.at},
    {type: "video" as const, path: ["second", "production"], seconds: duration - spec.second.production.at},
  ],
} as const;
