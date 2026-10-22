import {resolveCanvasFunctionArgs} from "./mg-canvas/schema";
import {resolvePartWholeFunctionArgs} from "./part-whole-chart/schema";
import {resolveDualAxisFunctionArgs} from "./dual-axis-chart/schema";
import {resolveArgumentFunctionArgs} from "./mg-argument/schema";
import {resolveImageComparisonFunctionArgs} from "./image-side-by-side/schema";
import {resolveImageGraphFunctionArgs} from "./image-directed-graph/schema";
import {resolveProgressTimelineFunctionArgs} from "./progress-timeline/schema";
const timing = {start: 0, end: 12};
export const demoSource = (name: string) => ({mode: "transparent", prompt: null, image: `subject-expansion/${name}.svg`});
export const canvasPreviewArgs = {group: "path-follow", order: null, title: "节点在同一画布上保留与回访", nodes: [
  {id: "platform", label: "内容平台", source: demoSource("platform")}, {id: "users", label: "用户参与", source: demoSource("users")}, {id: "business", label: "商业连接", source: demoSource("business")},
], steps: [{nodeId: "platform", at: 0}, {nodeId: "users", at: 3}, {nodeId: "business", at: 6}, {nodeId: "platform", at: 9}]};
export const canvasPreviewSpec = resolveCanvasFunctionArgs(canvasPreviewArgs, timing).spec;
export const piePreviewArgs = {group: "pie", order: null, title: "2012年底：手机上网者占全体网民的比例", total: {label: "全体网民", value: 5.64, unit: "亿"}, parts: [{label: "手机上网者", value: 4.2, at: 1}]};
export const piePreviewSpec = resolvePartWholeFunctionArgs(piePreviewArgs, timing).spec;
export const dualAxisPreviewArgs = {group: "line-overlay", order: null, title: "数量与占比 · 演示数据", categories: ["第一年", "第二年", "第三年"], leftAxis: {label: "数量", unit: "万"}, rightAxis: {label: "占比", unit: "%"}, series: [
  {name: "人数（演示）", axis: "left", data: [{category: "第一年", value: 300, at: 0}, {category: "第二年", value: 370, at: 3}, {category: "第三年", value: 420, at: 6}]},
  {name: "占比（演示）", axis: "right", data: [{category: "第一年", value: 52, at: 0}, {category: "第二年", value: 63, at: 3}, {category: "第三年", value: 75, at: 6}]},
]};
export const dualAxisPreviewSpec = resolveDualAxisFunctionArgs(dualAxisPreviewArgs, timing).spec;
export const argumentPreviewArgs = {group: "evidence-gap", order: null, title: "判断收益分配，还需要什么证据", claims: [
  {premise: "企业增长很快", conclusion: "所有参与者收入同步提高", missingEvidence: ["创作者收入分布", "劳动报酬变化"], at: 0},
  {premise: "平台掌握规则", conclusion: "全部收入都是不合理租金", missingEvidence: ["平台成本", "股权收益与收入来源"], at: 6},
]};
export const argumentPreviewSpec = resolveArgumentFunctionArgs(argumentPreviewArgs, timing).spec;
export const imageComparisonPreviewArgs = {group: "split-panel", order: null, title: "两种进入方式", left: {label: "自建产品", source: demoSource("platform")}, right: {label: "收购已有社区", source: demoSource("users")}, items: [
  {side: "left", text: "从头获得用户与创作者", at: 0}, {side: "right", text: "取得已经运转的社区", at: 3}, {side: "right", text: "同时承担整合成本", at: 6},
], highlights: [{side: "right", at: 7.5}]};
export const imageComparisonPreviewSpec = resolveImageComparisonFunctionArgs(imageComparisonPreviewArgs, timing).spec;
export const imageGraphPreviewArgs = {group: "flow", order: null, title: "内容与参与者的反馈关系", nodes: [
  {id: "content", label: "内容供给", source: demoSource("platform"), at: 0}, {id: "users", label: "观看者", source: demoSource("users"), at: 2}, {id: "creator", label: "创作者", source: demoSource("creator"), at: 4},
], edges: [{from: "content", to: "users", relation: "吸引观看", at: 2.5}, {from: "users", to: "creator", relation: "反馈与激励", at: 4.5}, {from: "creator", to: "content", relation: "继续供给", at: 7}]};
export const imageGraphPreviewSpec = resolveImageGraphFunctionArgs(imageGraphPreviewArgs, timing).spec;
export const timelineWindowPreviewSpec = resolveProgressTimelineFunctionArgs({group: "content-window", order: null, title: "公司发展中的不同证据", nodes: [
  {year: "2012年", title: "手机普及与进入时机", at: 0}, {year: "2017年", title: "内容投入与供给培育", at: 3}, {year: "2020年", title: "用户规模", at: 6}, {year: "2023年", title: "内容生产的广泛参与", at: 9},
]}, timing).spec;
