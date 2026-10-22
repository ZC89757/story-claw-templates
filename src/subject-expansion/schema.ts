import {assertFunctionEnvelope, functionAtSchema, functionOrderSchema, toLocalAt, type FunctionCallTiming, type ResolvedFunctionCall} from "../function-call";
import {assertSubjectExpansionArgs, assertSubjectExpansionSpec} from "./validate";
import {SUBJECT_EXPANSION_GROUPS, type SubjectExpansionSpec} from "./types";

const label = {type: "string", minLength: 1, maxLength: 24} as const;
export const cutoutSourceSchema = {
  type: "object", additionalProperties: false, required: ["mode", "prompt", "image"],
  properties: {
    mode: {type: "string", enum: ["transparent", "generate"]},
    prompt: {anyOf: [{type: "string", minLength: 1, maxLength: 600}, {type: "null"}], description: "generate 只填主体描述，模板自带风格参考图并自动生图、抠除纯绿背景；transparent 填 null。"},
    image: {anyOf: [{type: "string", minLength: 1, maxLength: 2000}, {type: "null"}], description: "transparent 的已有透明图片 URL 或文件路径；generate 填 null。不能填生图描述。"},
  },
} as const;
const source = cutoutSourceSchema;

export const subjectExpansionParametersSchema = {
  type: "object", additionalProperties: false, required: ["group", "order", "subject", "items", "highlights"],
  properties: {
    group: {type: "string", enum: SUBJECT_EXPANSION_GROUPS},
    order: functionOrderSchema,
    subject: {type: "object", additionalProperties: false, required: ["label", "source"], properties: {label, source}},
    items: {type: "array", minItems: 2, maxItems: 5, items: {
      type: "object", additionalProperties: false, required: ["id", "label", "relation", "source", "at"],
      properties: {id: {type: "string", minLength: 1, maxLength: 40, pattern: "^[a-z][a-z0-9_-]*$"}, label, relation: label, source: {anyOf: [source, {type: "null"}]}, at: functionAtSchema},
    }},
    highlights: {type: "array", maxItems: 12, items: {
      type: "object", additionalProperties: false, required: ["targets", "note", "at"],
      properties: {targets: {type: "array", minItems: 1, maxItems: 6, items: {type: "string", minLength: 1, maxLength: 40}}, note: {anyOf: [{type: "string", minLength: 1, maxLength: 48}, {type: "null"}]}, at: functionAtSchema},
    }},
  },
} as const;

export const subjectExpansionFunctionDefinition = {
  type: "function", name: "create_subject_expansion", strict: true,
  description: "围绕同一个稳定主体逐步展开 2-5 个对象或约束。progressive 为平滑展开，impact 为翻牌拍桌、短震感与低频滚奏。两组共用所有参数，items.at 在 impact 中精确定位拍桌落点，翻转提前至多 0.72 秒，连线在拍桌 0.18 秒后画出，均由模板固定。关系线无箭头，不擅自表示因果。highlights 用已出现的 ID（或 subject）重新聚焦。at 全部是整集绝对秒数，整体时间由 HTML 决定。generate 只填主体 prompt，模板自带风格参考并自动生图抠图；transparent 使用已有透明图片。子视频或 MG 使用独立嵌套标签及调用。",
  parameters: subjectExpansionParametersSchema,
} as const;

export const resolveSubjectExpansionFunctionArgs = (input: unknown, timing: FunctionCallTiming): ResolvedFunctionCall<SubjectExpansionSpec> => {
  const envelope = assertFunctionEnvelope(input, timing);
  const args = assertSubjectExpansionArgs(input);
  for (const event of [...args.items, ...args.highlights]) {
    if (event.at < timing.start || event.at >= timing.end) throw new Error("subject-expansion: event.at must be within the host interval [start, end)");
  }
  const image = (source: typeof args.subject.source) => source.mode === "transparent" ? source.image : "";
  return {...envelope, spec: assertSubjectExpansionSpec({
    subject: {...args.subject, image: image(args.subject.source)},
    items: args.items.map((item) => ({...item, at: toLocalAt(item.at, timing.start), image: item.source ? image(item.source) : null})),
    highlights: args.highlights.map((event) => ({...event, targets: [...event.targets], at: toLocalAt(event.at, timing.start)})),
  })};
};
