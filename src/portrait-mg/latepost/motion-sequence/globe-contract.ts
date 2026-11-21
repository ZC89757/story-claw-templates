import {at, closed, line, rootFields} from "./schema";

export type GlobeSpec = {
  names: {upperLeft: string; lowerLeft: string; lowerRight: string};
  strategy: {at: number; heading: string; firstLine: string; secondLine: string};
};

export const globeContract = {
  id: "latepost-V11_004",
  tag: "mg-v-globe-arrow-convergence",
  title: "多方箭头汇聚到地球",
  description: "三张白色价签与红箭头从左上和左右下方围住抬升的黑白地球，再逐步显出左侧红白策略文字。",
  minimumDuration: 2.2,
  definition: {
    type: "function",
    name: "create_portrait_globe_arrow_convergence",
    strict: true,
    description: "9:16。三方共同进入或竞逐全球市场时使用。价签各填一个短名称，策略保留红色短题和两行白字。地球、箭头和微缩道具随模板自带视频运动。",
    parameters: closed({
      ...rootFields,
      names: closed({
        upperLeft: line(6, "左上价签名称。"),
        lowerLeft: line(6, "左下价签名称。"),
        lowerRight: line(6, "右下价签名称。"),
      }),
      strategy: closed({
        at: at("第一行红色策略文字开始出现"),
        heading: line(3, "红色短题。"),
        firstLine: line(13, "白字第一行。"),
        secondLine: line(13, "白字第二行。"),
      }),
    }),
  },
  validate(spec: unknown, duration: number) {
    const {names, strategy} = spec as GlobeSpec;
    for (const name of Object.values(names)) {
      const width = [...name].reduce((sum, letter) => sum + (/^[A-Z]$/.test(letter) ? .75 : /^[\x20-\x7e]$/.test(letter) ? .57 : 1), 0);
      if (width > 3.1) throw new Error("价签名称须适合固定的三个全角字位");
    }
    const fullWidth = (text: string) => [...text].reduce(
      (sum, letter) => sum + (/^[\x20-\x7e]$/.test(letter) ? .57 : 1), 0);
    if ([strategy.firstLine, strategy.secondLine].some(text => fullWidth(text) > 9.1)) {
      throw new Error("策略文字超过固定字位，请缩短文本");
    }
    if (duration > 3.2 + 1e-6 || strategy.at < .57 || strategy.at + 1.2 > duration + 1e-6) {
      throw new Error("地球底片最长 3.2 秒，抬升后再展示策略，并为策略文字保留至少 1.2 秒");
    }
  },
} as const;
