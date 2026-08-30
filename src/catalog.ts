import {MG_STYLE_CATALOG} from "./catalog-data.js";
import {MG_TEMPLATE_USAGE} from "./template-usage.js";
import type {MgTemplateName} from "./runtime";

export type {MgStyleCatalogEntry} from "./catalog-data.js";
export {MG_STYLE_CATALOG, MG_TEMPLATE_USAGE};

const templateHtmlTag = new Map(
  MG_STYLE_CATALOG.map((entry) => [entry.template, entry.htmlTag]),
);

const templateNames = new Set(MG_STYLE_CATALOG.map((entry) => entry.template));
const usageNames = new Set(MG_TEMPLATE_USAGE.map((entry) => entry.template));
const missingUsage = [...templateNames].filter((template) => !usageNames.has(template));
const extraUsage = [...usageNames].filter((template) => !templateNames.has(template));
if (missingUsage.length || extraUsage.length) {
  throw new Error(
    `MG 模板 useWhen 清单与 catalog 不一致：缺少 ${missingUsage.join(", ") || "无"}；多余 ${extraUsage.join(", ") || "无"}`,
  );
}

export const formatMgTemplateUsage = (): string => MG_TEMPLATE_USAGE
  .map(({template, useWhen}) => `- <${templateHtmlTag.get(template) ?? template}>：${useWhen}`)
  .join("\n");

export const MG_DEFAULT_STYLE_HINT = MG_STYLE_CATALOG
  .filter((entry) => entry.isDefault)
  .map((entry) => `${entry.htmlTag}=${entry.style}`)
  .join("、");

export const mgStylesForTemplate = (template: MgTemplateName) =>
  MG_STYLE_CATALOG.filter((entry) => entry.template === template);

export const defaultMgStyle = (template: MgTemplateName): string => {
  const entry = MG_STYLE_CATALOG.find((candidate) => candidate.template === template && candidate.isDefault);
  if (!entry) throw new Error(`MG template ${template} has no default style`);
  return entry.style;
};

export const isMgStyleForTemplate = (template: MgTemplateName, style: string): boolean =>
  MG_STYLE_CATALOG.some((entry) => entry.template === template && entry.style === style);

export const mgStyleName = (template: MgTemplateName, style: string): string => {
  const entry = MG_STYLE_CATALOG.find((candidate) => candidate.template === template && candidate.style === style);
  if (!entry) throw new Error(`MG template ${template} 不支持样式 ${style}`);
  return entry.name;
};
