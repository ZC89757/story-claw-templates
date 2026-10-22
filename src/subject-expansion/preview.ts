import {resolveSubjectExpansionFunctionArgs} from "./schema";
import type {SubjectExpansionFunctionArgs, SubjectExpansionSource} from "./types";

const image = (name: string): SubjectExpansionSource => ({mode: "transparent", prompt: null, image: `subject-expansion/${name}.svg`});

/** Local vector illustrations demonstrate composition; they are not generated or historical images. */
export const subjectExpansionGrowthArgs: SubjectExpansionFunctionArgs = {
  group: "progressive", order: null,
  subject: {label: "内容平台", source: image("platform")},
  items: [
    {id: "users", label: "使用者", relation: "使用产品", source: image("users"), at: 2},
    {id: "business", label: "商业服务", relation: "连接商业需求", source: image("business"), at: 8},
  ],
  highlights: [
    {targets: ["users"], note: "形成用户基础", at: 5},
    {targets: ["subject", "users", "business"], note: "在已有用户基础上，连接服务与商业需求", at: 12},
  ],
};

export const subjectExpansionOverseasArgs: SubjectExpansionFunctionArgs = {
  group: "progressive", order: null,
  subject: {label: "海外业务", source: image("platform")},
  items: [
    {id: "opportunity", label: "潜在收益", relation: "市场机会", source: image("business"), at: 2},
    {id: "conditions", label: "合规、争议与调整成本", relation: "经营条件", source: null, at: 5},
    {id: "users", label: "用户规模", relation: "业务覆盖", source: image("users"), at: 8},
  ],
  highlights: [
    {targets: ["users", "conditions"], note: "用户增多，不能推出制度风险降低", at: 11},
    {targets: ["subject", "conditions"], note: "社会影响力也会进入监管讨论", at: 14},
  ],
};

export const subjectExpansionPreviewSpec = resolveSubjectExpansionFunctionArgs(subjectExpansionGrowthArgs, {start: 0, end: 16}).spec;

export const subjectExpansionImpactPreviewArgs: SubjectExpansionFunctionArgs = {
  ...subjectExpansionOverseasArgs,
  group: "impact",
  items: subjectExpansionOverseasArgs.items.map((item, index) => ({...item, at: [1.5, 3.9, 6.3][index]})),
  highlights: [
    {targets: ["users", "conditions"], note: "用户规模增大，不等于制度风险降低", at: 8.3},
    {targets: ["subject", "conditions"], note: "经营条件，需要与潜在收益共同计算", at: 10.2},
  ],
};
export const subjectExpansionImpactPreviewSpec = resolveSubjectExpansionFunctionArgs(subjectExpansionImpactPreviewArgs, {start: 0, end: 12}).spec;
