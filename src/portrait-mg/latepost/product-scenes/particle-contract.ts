import {at, closed, cue, line, requireSpacing, rootFields} from "./schema";

export type ParticleSpec = {part: number; question: string; zoom: {at: number}; compression: {text: string; at: number}};
export const particleContract = {
  id: "latepost-V07_003",
  tag: "mg-v-particle-compression",
  title: "发光粒子压缩",
  description: "真实连续片层在黑底上呈现左大右小的粒子团和发光管道。白色提问逐字展开后，镜头沿管道推进，到右端时出现压缩大字。",
  minimumDuration: 5.2,
  definition: {
    type: "function",
    name: "create_portrait_particle_compression",
    strict: true,
    description: "仅 9:16 竖屏。用于讲述把大的模型或信息表示压缩成小模型。模板自带连续透明管道和流动粒子片层，画面只填章节数字、简短提问、末段两字标题及两次时间点。",
    parameters: closed({...rootFields,
      part: {type: "integer", minimum: 1, maximum: 9},
      question: line(8, "右上逐字出现的白色提问"),
      zoom: cue("提问完成，镜头开始沿管道向右推进"),
      compression: closed({text: line(2, "小端上方的白色大字"), at: at("压缩大字出现")})}),
  },
  validate(spec: unknown, duration: number) {
    const {zoom, compression} = spec as ParticleSpec;
    const times = [0, zoom.at, compression.at, duration];
    requireSpacing(times, [1.8, 2.3, 1.1], "须为粒子片层的提问、推进和压缩分别留足时间");
    if (zoom.at > 6.3 || compression.at - zoom.at > 7.9 || duration - compression.at > 3.8) {
      throw new Error("压缩各阶段时长不得超过原片的两倍，以保留连续粒子流速");
    }
  },
} as const;
