# Story Claw MG Templates

可由大模型通过 Function Calling 填参的 Remotion 动画模板库。

当前包含：

- `xy-chart`：二维坐标统计图。
- `progress-timeline`：支持大小节点、文字/图片/视频详情和长时间线自动跟拍的进度条。

模板没有内置叙事时间；时间、位置、标签和移动方式全部来自参数 JSON。

## Story Claw 集成

```ts
import {
  assertXYChartSpec,
  xyChartFunctionDefinition,
  XYChartTemplate,
} from "@story-claw/mg-templates/xy-chart";

// 1. 在 LLM 请求中注册。工具调用的 arguments 即 XYChartSpec。
const tools = [xyChartFunctionDefinition];

// 2. 模型返回 tool_call 后解析并做业务校验。
const spec = assertXYChartSpec(JSON.parse(toolCall.function.arguments));

// 3. 放入 Remotion composition。模板从 useCurrentFrame() 读取当前时间。
export const Scene = () => <XYChartTemplate spec={spec} />;
```

`xyChartFunctionDefinition` 的 schema 使用 keyframe 数组，而不是 JSON 动态键对象。两种结构的语义相同：每项都是 `at -> {x, y}`；数组能让 Function Calling 的严格 schema 可靠校验时间字段。

时间语义固定为：**`at` 秒时必须到达该坐标**。

- `motion: "ease"`：从上一个关键帧连续缓动至当前关键帧。
- `motion: "instant"`：在当前关键帧的 `at` 秒瞬间跳变。

## 最小参数

```json
{
  "title": "公司总产值变化",
  "axes": {
    "x": {"min": 0, "max": 6, "label": "经营年份", "unit": "年", "ticks": 7},
    "y": {"min": 0, "max": 1800, "label": "公司总产值", "unit": "万元", "ticks": 7}
  },
  "keyframes": [
    {"at": 0, "x": 0, "y": 0, "label": "开始", "motion": "instant"},
    {"at": 3.4, "x": 1, "y": 48, "label": "第1年 48万", "motion": "ease"},
    {"at": 7.1, "x": 2, "y": 96, "label": "第2年 96万", "motion": "ease"}
  ]
}
```

在送入渲染器前始终调用 `assertXYChartSpec()`。它会检查：时间递增、坐标落在轴范围内、刻度合法、首个关键帧从 `0` 秒开始以及节点数量上限。

## 进度时间线

```ts
import {
  assertProgressTimelineSpec,
  progressTimelineFunctionDefinition,
  ProgressTimelineTemplate,
} from "@story-claw/mg-templates/progress-timeline";
```

每个节点传入 `at`、`progress`、`kind`、`detail` 和 `motion`。`at` 是移动触发时间：触发前进度保持不动，从 `at` 开始移动。移动时长由模板内部统一控制，不需要模型传参。`kind` 区分大节点与小节点；`detail.type` 支持 `text`、`image`、`video`。开启 `followViewport` 后，镜头会在相邻大节点之间平滑移动，避免长时间线被压缩到同一画面。

同一份参数可直接交给 `ProgressTimelineTemplate`（横向版）或 `VerticalProgressTimelineTemplate`（纵向纪录片版）。切换模板不需要大模型重新生成参数。

## 渐进有向图

`DirectedGraphTemplate` 只接收 `edges`，每条边包含 `at`、`from`、`to`、`relation`。第一个 `from` 自动作为初始节点，节点坐标由 Dagre 自动布局。到达 `at` 前画面不变；到达后模板先绘制箭头和关系文字，再渐进显示目标节点。动画时长和布局参数都封装在模板内部。

## 标题模板

`TypewriterTitleTemplate`、`FadeTitleTemplate`、`SlideTitleTemplate`、`RandomRevealTitleTemplate` 共用同一个 `TitleSpec` 和 `titleFunctionDefinition`。参数严格只有 `text`、`at`、`sequence`；切换标题动画时不需要重新请求或修改模型参数。

`EmphasisTextTemplate` 用于重点大字，参数严格只有 `text` 和 `at`。到达时间戳后，文字从画面下方向中央快速滑入；速度、回弹、字号、描边和阴影均由模板固定。

`TimedTableTemplate` 接收 `size` 和按行优先排列的 `cells`。表格线框从第 0 帧完整显示，每个单元格只接收 `at` 和 `text`，并在时间戳到达后填充内容。

`MultiSeriesChartTemplate` 通过同一个 `MultiSeriesChartSpec` 支持多系列柱状图和折线图。唯一的模式参数是 `chartType: "bar" | "line"`；每个数据点在自己的 `at` 时间戳到达后才开始生长或连线。
