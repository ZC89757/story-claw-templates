import {checkCueSpacing, chineseWidth, closed, lineText, rootFields, stillImage} from "./schema";

type Milestone = {image: string; total: number; date: string; lineOne: string; lineTwo: string; at: number};
export type ProductionMilestonesSpec = {milestones: Milestone[]};

const datePattern = /^(\d{4})\.(\d{2})(?:\.(\d{2}))?$/;
function dayValue(date: string) {
  const match = datePattern.exec(date);
  if (!match) return Number.NaN;
  const [, year, month, day = "01"] = match;
  const value = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return value.getUTCFullYear() === Number(year)
    && value.getUTCMonth() === Number(month) - 1 && value.getUTCDate() === Number(day)
    ? value.valueOf() : Number.NaN;
}

function validate(spec: unknown, duration: number) {
  const {milestones} = spec as ProductionMilestonesSpec;
  checkCueSpacing([0, ...milestones.map(item => item.at), duration], [.35, .63, .63, .67], "产量里程碑须为三次车辆滑入、刻度上移留出时间");
  const dates = milestones.map(item => dayValue(item.date));
  const firstGap = dates[1] - dates[0];
  const finalGap = dates[2] - dates[1];
  if (dates.some(date => !Number.isFinite(date)) || firstGap <= 0 || finalGap <= 0 || finalGap >= firstGap
    || milestones.some(({total, lineOne, lineTwo}, index) => (index > 0 && total <= milestones[index - 1].total) || chineseWidth(lineOne) > 16 || chineseWidth(lineTwo) > 16)) {
    throw new Error("产量里程碑须填真实递增产量、逐渐缩短的日期间隔及每车两行短注释");
  }
}

export const productionMilestonesContract = {
  id: "latepost-V02_004",
  tag: "mg-v-production-milestones",
  title: "产量里程碑递进",
  description: "用于同类产品的三次产量里程碑，后两次间隔逐渐缩短。左侧红轴延伸并上移，三件真实产品从右侧滑入，保留淡色产量大字和两行注释。",
  minimumDuration: 2.4,
  definition: {
    type: "function",
    name: "create_portrait_production_milestones",
    strict: true,
    description: "仅9:16竖屏。真实日期依时间升序，后一次间隔更短且产量递增。三个载荷各为独立透明 PNG 及产量、日期、两行短说明。at 为口播引出对应里程碑的绝对秒数。",
    parameters: closed({
      ...rootFields,
      milestones: {
        type: "array", minItems: 3, maxItems: 3,
        items: closed({
          image: stillImage("真实产品或车身抠图，带有效 Alpha 的静态 PNG"),
          total: {type: "integer", minimum: 1, maximum: 99999999},
          date: {...lineText(10), pattern: "^\\d{4}\\.\\d{2}(?:\\.\\d{2})?$", description: "有日级可靠来源时填写 YYYY.MM.DD；仅有月份时填写 YYYY.MM。"},
          lineOne: lineText(20),
          lineTwo: lineText(20),
          at: {type: "number", minimum: 0},
        }),
      },
    }),
  },
  validate,
  media: () => [0, 1, 2].map(index => ({type: "cutout" as const, path: ["milestones", index, "image"]})),
} as const;
