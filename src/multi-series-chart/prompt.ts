/** Instructions injected only when the multi-series-chart template is present. */
export const multiSeriesChartPlanningInstructions = `多系列图表模板补充规则：
- 先检查当前 HTML、正文上下文和已有数据；正文已经给出明确数值时，优先直接使用原文数值。
- 如果正文缺少具体数值，但明确提到可识别的模型、产品、年份或其他比较对象，且图表能帮助表达这段事实，先调用 search_web，再整理数据，最后调用 create_multi_series_chart。
- 搜索关键词必须包含正文中的实体和指标；优先使用官方技术文档、论文、公司公告、产品规格页或可靠基准报告，避免只依据搜索摘要或单一未经核验的博客。
- 只采用定义清楚、单位一致、能逐项映射到 xAxis.categories 的公开数据。不同来源定义不一致、时间口径不同或无法确认实体对应关系时，不要硬填，宁可不使用图表。
- 不得编造、估算或把搜索结果中的宣传性上限当成精确实测值。搜索结果互相冲突时，选择口径最清楚的来源；仍无法判断就不要调用图表函数。
- 参数量、训练数据量、算力、带宽等异构指标不能直接共用一个原始 y 轴。只有在来源明确给出同一指标和单位时才能并列；若使用有明确基准的相对指数，必须在 title、yAxis.label 或 yAxis.unit 中说明基准和单位。
- 每个 series 必须为每个 xAxis.categories 提供一个数值，category 必须逐字匹配类别；搜索完成并完成口径核验后，一个 HTML 实例只调用一次 create_multi_series_chart，不要把搜索 URL 或额外字段塞进函数参数。`;
