# 通用审核拓扑：已获批准并接入

2026-10-17 用户批准先备份主项目再修改，并明确要求按标签中的节点、连线执行，不把逻辑锁定在某个标签名。备份 `908234e` 已推送 `origin/main`。

实际实现没有增加 Provider descriptor 字段：所有已注册标签的 nodes/edges 都走同一个解析器；是否必须提供审核拓扑由现有 Function Calling Schema 的 nodes(id,label)、edges(from,to) 结构自动判断。规划与严格比对按实例是否携带 graph 执行，不再按 directed-graph 标签名分支。适用于普通图、图文图、拼贴网络及后续使用同一结构的模板。原有参数、节点 ID、标签、边顺序与端点保持。

这也将拼贴网络纳入相同的审核规则：HTML 需明确给出节点和连线；其 role 等附加参数仍由原函数 Schema 决定。未修改生图接口或配音时间逻辑。

以下是实施前记录，原可选 descriptor 方案已由上述通用方案替代。

---

## 历史提案

当前渲染组件、图片来源和函数参数已实现。审核 HTML v4 的 5 个 `image-directed-graph` 仍保留 nodes/edges，主项目会明确拒绝这两个属性，因此保留红点、标记 productionReady=false；没有删属性或移进注释绕过校验。

## 现有边界

`runner/mg/html.ts` 以 `htmlTag === "directed-graph"` 决定是否允许和解析 nodes/edges。`runner/mg/planner.ts` 同样只为该标签注入并校验已审核拓扑。新图文标签无法获得同样保障。

## 建议的最小通用扩展

给 Provider descriptor 增加可选能力声明：

```ts
annotationTopology?: "directed";
```

由 Template 为旧 directed-graph 和新 image-directed-graph 声明此能力。保留原 nodes/edges 的审核格式：nodes 为标签文字数组，edges 为节点下标的 [from,to] 数组；规划时仍映射到 n0/n1/... 稳定 id。

获批后只改：

1. Template Provider 类型与这两类模板的能力声明。
2. Story Claw `runner/mg/html.ts`：用能力声明代替具体标签名，复用原有属性白名单、拓扑解析、错误校验和持久化结构。
3. Story Claw `runner/mg/planner.ts`：用同一能力声明选择拓扑注入与 Function Call 严格比对，保留已有校验规则。

不在宿主增加新模板名、渲染组件或专用函数映射；不改变已有模板的参数。继续阻止模型增加节点、改名、增删边或改变端点。

该能力是可选字段，需在获批实施时核对 v4 加载器的兼容边界；旧程序对新图文属性已有明确拒绝行为，不能宣称旧程序已可渲染此审核稿。

## 获批后的验证

旧 directed-graph 的行为与测试保持；新图文拓扑可通过原生 HTML 校验；修改节点标签、顺序、数量或边端点的调用应被拒绝；64 个实例全文原文一致、顺序和父子范围不变。此提案不包含启动整期渲染或付费素材生成。
