# 解说模板：复用决策与新增契约

本轮只维护 Template 及审核产物，不修改 Story Claw 源码，不提交 Git。Provider 仍为 v4。

## 去重结论

| 审核稿中的需求 | 处理 | 原因 |
| --- | --- | --- |
| 普通卡片依次出现 | 继续使用已有 mg-showcase | 原有 title/items(text,at) 已覆盖，不再做一个同参数模板 |
| 同一主体与多方关系 | 复用 subject-expansion | 不再为两处不合适的 comparison-window 做双窗口模板 |
| 带内容窗口的时间线 | progress-timeline 新增 content-window Group | 原有 title/nodes(at,year,title) 足够，参数完整保留 |
| 连续画布的移动与回访 | mg-canvas，新契约；两组共用 Schema | 需要唯一对象定义、可回访的步骤和图像来源；现有一次性卡片列表和星形关系不能表达 |
| 饼图 | part-whole-chart，新契约 | 必须明确数值总体及互斥部分；旧 metric 的字符串 value 不能可靠承载分母和数值校验 |
| 透明双轴折线 | dual-axis-chart，新契约 | 旧 multi-series-chart 只有一套单位/刻度，不能假装能放不同单位；透明图层角色也单独声明 |
| 证据缺口 | mg-argument，新契约 | 需要“前提、结论、待核验证据”，不应伪装成两主体对比或普通因果边 |
| 左右图文 | image-side-by-side，新契约 | 明确增加左右图片来源，旧纯文字对照参数不动 |
| 图文有向图 | image-directed-graph，新契约 | 需要任意具体节点的图片；旧 directed-graph 没有图片，collage-network 只自动匹配固定 Logo |

## 所有新函数的共同规则

- 整体 start/end 由宿主从审核 HTML 计算。根参数没有 at/startTime/endTime/duration。
- 内部 at 是整集绝对秒数，解析后转为局部秒数，并检查在 [start,end) 内。
- group 决定视觉样式，同标签各 Group 使用同一 Schema。order 只区分同标签同 Group 的多个实例。
- 所有对象关闭 additionalProperties。模型不填写坐标、动画曲线、颜色、镜头强度或素材循环策略。
- 图片 source 可使用已有透明图 `{mode:"transparent", image:"绝对路径或直接图片URL", prompt:null}`，或仅描述新主体 `{mode:"generate", image:null, prompt:"主体描述"}`。模板自带风格参考板，自动调用现有 protocol-4 参考生图和纯绿抠图链路；不新增宿主接口或用户参数。抽象节点可不配图。

## 连续画布

标签 `mg-canvas`，Group `path-follow` / `subject-detail`，函数 `create_continuous_canvas`。

```json
{
  "group": "path-follow",
  "order": null,
  "title": "内容平台的业务延展",
  "nodes": [
    {"id": "recommendation", "label": "信息推荐", "source": null},
    {"id": "video", "label": "短视频", "source": null},
    {"id": "global", "label": "海外业务", "source": null}
  ],
  "steps": [
    {"nodeId": "recommendation", "at": 100},
    {"nodeId": "video", "at": 104},
    {"nodeId": "global", "at": 108},
    {"nodeId": "recommendation", "at": 112}
  ]
}
```

示例假设标签从 100 秒开始。nodes 定义 1–12 个唯一对象；steps 为 1–32 个按时间严格递增的访问动作，首项等于标签开始，每节点至少访问一次，后续切换至少间隔 0.6 秒。可回访旧对象，不复制新节点。

path-follow 沿同一画布跟随对象；subject-detail 固定首节点为主体，切换右侧属性与内容。两组都不定义任意因果边；因果、依赖与反馈关系应交给关系图。仅列文字不要选此模板。

固定子区域为 `{x:0.36,y:0.18,width:0.62,height:0.62}`。第一次窗口立即可用；后续从 step.at+0.5 秒开放，到下一 step 关闭。子素材须在窗口开放后开始，且按自己的标签时段结束，不循环、不延长、不自动定格。

## 带窗口时间线：复用旧参数

使用 `progress-timeline group="content-window"`，仍调 `create_progress_timeline`，参数仍为 group/order/title/nodes，node 仍只有 at/year/title。**没有新建 timeline-window 函数，没有添加图片、children 或 slot 参数。**

固定子区域 `{x:0.27,y:0.12,width:0.68,height:0.68}`。第一节点立即开放，后续从 node.at+0.45 秒开放，到下一节点切换关闭。年份与简短说明留在窗外，底部时间轴保留。与原模板一样首节点必须从实例开始。

窗口裁剪仅对 content-window 生效。正式宿主已有的 nodeId 为 `htmlTag::group::instance`；运行时从该稳定身份或明确的 group 识别新组。原 horizontal/vertical 不获得窗口裁剪，也不改变原动画。

## 部分与整体

标签 `part-whole-chart`，Group `pie`，函数 `create_part_whole_chart`。

```json
{
  "group": "pie", "order": null,
  "title": "2012年底的手机上网者",
  "total": {"label": "全体网民", "value": 5.64, "unit": "亿"},
  "parts": [{"label": "手机上网者", "value": 4.2, "at": 101}]
}
```

总体必须为正数，1–6 个部分必须非负、互不重叠且同单位，和不能超过总体。剩余区域固定称“其余”，不替换成电脑用户。人数按提供值显示，计算比例保留最多一位小数；不能从两个四舍五入人数生成伪精确比例。模板不能自行验证统计类别是否重叠，规划必须先确认口径。

## 透明双轴折线

标签 `dual-axis-chart`，Group `line-overlay`，函数 `create_dual_axis_chart`。

参数为 group/order/title/categories/leftAxis/rightAxis/series。两个 axis 均为 `{label,unit}`；series 恰好两项，每项 `{name,axis:"left"|"right",data:[{category,value,at}]}`。左右各绑定一条线，分类完整对应、唯一，并按同一时间分类推进。

左右尺度独立计算，百分比轴固定 0–100。数据区域之外透明，可真正叠在 sc-video/video-footage 上；数据区域有半透明阅读底板。不同单位的高度或斜率不可直接比较，不能把“增长率”和“人数”塞进同一条线。预览中的演示数据已明确标为演示，不写回原文。

## 证据缺口

标签 `mg-argument`，Group `evidence-gap`，函数 `create_evidence_gap`。

参数为 group/order/title/claims，claim 为 `{premise,conclusion,missingEvidence:string[],at}`。1–4 项按时间切换，上一项收为记录。连接停在缺口，显示“不能直接推出”和待核验证据，不用红叉，不推断现实中的收益为零。

## 左右图文

标签 `image-side-by-side`，Group `split-panel`，函数 `create_image_comparison`。

参数为 group/order/title/left/right/items/highlights。left/right 各为 `{label,source}`；item 为 `{side,text,at}`，highlight 为 `{side,at}`。左右均需有内容，不能在一侧出现前高亮。主体图片随该侧第一次内容出现，后续说明在原位补充。

仅用于同一比较维度的两侧；“同一业务的机会和约束”使用 subject-expansion。旧 side-by-side-comparison 不增加图片字段。

## 图文关系

标签 `image-directed-graph`，Group `flow`，函数 `create_image_directed_graph`。

参数为 group/order/title/nodes/edges。node 为 `{id,label,source,at}`，source 可为 null；edge 为 `{from,to,relation,at}`。2–10 个唯一节点，1–24 条唯一有向边，支持回路，不允许自环、未知端点或边早于节点。

图片只表达节点身份，不用面积表示未经核实的权利或收益大小。品牌图标优先复用 collage-network，普通无图片关系继续用 directed-graph。

**尚需主项目批准的边界：** 现有 HTML 解析器只允许原 directed-graph 标签带 nodes/edges 属性；当前审核稿的 image-directed-graph 含同类属性。模板渲染已实现，但保留这套显式审核拓扑并由宿主严格比对，需要通用拓扑桥接。没有删除这些属性或用注释冒充机器校验，也没有私改主项目。

## 验证与未做事项

每种样式的预览直接调用正式组件；窗口预览中也放入真实子 MG。定向测试覆盖数值边界、单位、事件时段、节点回访、循环拓扑、透明素材重入和旧时间线的兼容性。

图片生成复用已有接口，不需要主项目改动；旧的无参考生图接口提案已撤回。现有风格参考板仅约束材质和配色，提示词明确禁止复制板上对象。模板示意素材不冒充新闻截图、真实产品界面或历史影像。图文关系图的审核拓扑仍需批准宿主通用接入后才能用于本集全流程。
