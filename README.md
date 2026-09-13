# Story Claw MG Templates

供 Story Claw 使用的 Remotion MG 动画模板库。模板固定视觉样式、布局、运动方式和事件动作；AI 只填写叙事内容、数据以及它们在整集视频中的绝对时间戳。

## 两阶段流程

### 1. AI 输出 MG 标注 HTML

AI 用自定义标签圈住适合制作 MG 的原文。HTML 标签只使用以下属性：

- `group`：同一段逻辑动画的稳定标识，同组标签最终对应一次 Function Call。
- `mode="together"`：同组内容连续或距离较近，合成一段完整 MG。
- `mode="split"`：同组节点相隔较远，只在各节点发生时显示 MG；间隔区间继续显示原画。
- `value`：同组标签在原文中的顺序，方便阅读和检查。

HTML 不填写 `at`。标签允许嵌套，例如时间线节点中可以再标记重点大字：

```html
<progress-timeline group="google-history" mode="split" value="6">
  2017年，谷歌研究团队发表
  <emphasis group="transformer-foundation" mode="together" value="1">Transformer论文</emphasis>
</progress-timeline>
```

### 2. AI 直接进行 Function Calling

第二次 AI 调用同时读取完整 HTML 和原始字级时间戳文件。它按 `group` 为每组标签选择一个模板函数，并根据标签内的文本组织函数参数。

每个函数都必须传：

- 根级 `group`：与 HTML 的 `group` 完全一致。
- 根级 `at`：这段 MG 在整集视频中的绝对开始秒数。
- 动态元素自己的 `at`：节点、表格单元格、图表数据点、关系边等出现时的绝对秒数。

resolver 将动态元素的绝对时间换算为模板内部时间：`localAt = elementAt - rootAt`。`mode` 只属于 HTML，不进入 Function Call；渲染拼接代码根据 HTML 中的 `together` 或 `split` 决定连续显示还是分段显示。

## Function Calling 参数

所有函数都采用严格 JSON Schema，禁止额外字段。下表仅列 AI 需要填写的业务参数；每个函数还都包含公共的 `group` 和根级绝对 `at`。

| 函数 | AI 填写的参数 | 模板或 resolver 自动处理 |
| --- | --- | --- |
| `use_video_footage` | `source`，`sourceStart`，`sourceEnd` | 扫描固定素材库及同名元数据，校验路径和截取边界，全屏静音播放 |
| `create_progress_timeline` | `title`，`nodes[{at,title}]` | 节点位置、进度、大小、详情、镜头跟随和运动 |
| `create_xy_chart_timeline` | `title`，`axes.x/y{label,unit}`，`keyframes[{at,x,y,label}]` | 坐标范围、刻度和点的运动 |
| `create_directed_graph_timeline` | `title`，`nodes[{id,label,at}]`，`edges[{at,from,to,relation}]` | 复制 HTML 人工审核的节点/连线拓扑；节点布局、连线动作和显现时间由模板处理 |
| `create_title_cue` | `text` | 编号及所选标题模板的运动 |
| `create_emphasis_text_cue` | `text` | 字号、换行、入场运动、描边和阴影 |
| `create_news_flashback` | `text`，`pages[{image,source,title}]` | 整屏翻页展示联网检索到的网页截图，中央保留 HTML 原文大字；翻页节拍、卡片边框、扫描线、闪白和音效由模板固定处理 |
| `create_timed_table` | `rows`，`columns`，`cells[{row,column,text,at}]` | 网格和单元格显现动画 |
| `create_multi_series_chart` | `group`，`title`，`xAxis{label,categories}`，`yAxis{label,unit}`，`series[].data[{category,at,value}]` | `group` 决定柱状图或折线图；坐标范围、刻度、颜色和运动由模板计算 |
| `create_containment_timeline` | `title`，`root`，`relations[{at,parent,child}]`，`highlights[{at,target}]` | 包含与强调动作、嵌套布局和镜头 |
| `create_decomposition_timeline` | `title`，`whole`，`parts[{at,part}]`，`highlights[{at,target}]` | 拆出与强调动作、卡片布局和运动 |
| `create_weighted_comparison` | `title`，`leftLabel`，`rightLabel`，`items[{at,side,text,weight}]`，`highlights[{at,side}]` | 加入/强调动作、天平物理和计分动画 |
| `create_side_by_side_comparison` | `title`，`leftLabel`，`rightLabel`，`items[{at,side,text}]`，`highlights[{at,side}]` | 普通左右布局和显现动作，不计算权重 |
| `create_collage_network` | `title`，`subtitle`，`nodes[{id,label,at,role}]`，`edges[{at,from,to,relation}]` | 素材路径、节点视觉类型、关系颜色、布局和镜头 |
| `create_image_stack` | `title`，`images[{image,label,at}]` | URL/本地素材或 AI 提示词的逐层叠加、卡片布局和运动 |
| `create_image_grid` | `title`，`images[{image,label,at}]` | URL/本地素材或 AI 提示词的并列网格布局和运动 |
| `create_era_shift` | `foreground{mode,image,person,references}`，`switchAt`，`startItems[{text,logo}]`，`endItems[{text,logo}]` | 固定前景或参考图生成的自定义人物前景、两套代码生成背景及固定时间切换；生成图先放纯色背景再由宿主抠成透明 PNG，Logo 从模板包固定目录校验 |
| `create_showcase_timeline` | `title`，`items[{at,text}]` | 卡片、列表、网格和界面陈列的布局、深度、颜色、缓动和固定音效 |
| `create_metric_timeline` | `title`，`points[{at,label,value}]` | 计数器、里程表、仪表、波形和粒子指标的运动与单位显示 |
| `create_transition_cue` | `text` | 闪切、擦除、甩镜、遮罩的几何形状、方向、强度、时长和固定音效 |
| `create_rhythm_cue` | `text` | 节拍脉冲、冻结、频闪和蒙太奇强调的时序与固定音效 |
| `create_effect_cue` | `text`，可选 `items[{text,at}]` | 光斑、扫描、框线、冲击、装配和品牌效果；颜色、强度、缓动和固定音效 |

动态表格的 `row`、`column` 从 1 开始，每个位置必须恰好填写一次。表头直接作为第 1 行单元格传入，不另设 `header` 参数，也不依赖数组顺序推断位置。

普通左右对比与加权天平是两个独立函数。只有原文确实表达权重、优先级或力量差异时才使用 `create_weighted_comparison`；普通“过去与现在”“优势与风险”使用无 `weight` 的 `create_side_by_side_comparison`。

## 已有视频素材

`<video-footage group="full-bleed" mode="together">` 从模板包的固定目录选取已有视频，不调用 AI 生成视频：

```text
public/video-footage/
├── sources/
│   └── nvidia-history.mp4
└── metadata/
    └── nvidia-history.json
```

视频和 JSON 必须同名并保持相同子目录。元数据只保留选片所需的视频时长和字幕时间轴：

```json
{
  "source": "nvidia-history.mp4",
  "duration": 120.5,
  "subtitles": [
    {
      "start": 18.2,
      "end": 24.6,
      "text": "英伟达推出新一代数据中心芯片"
    }
  ]
}
```

Provider 每次提供 `use_video_footage` 时都会重新扫描这两个目录，把当前可用素材、字幕和时间戳写入工具说明。规划 Agent 先阅读它们，再输出素材相对路径及源视频内的 `sourceStart/sourceEnd`。未配对元数据、越界时间、URL、绝对路径和目录穿越都会被拒绝；所选片段短于 HTML 时间窗口时渲染也会直接报错，不循环或冻结尾帧。

## 参数边界

以下字段不向 AI 暴露：

- `motion`、`action`、`sequence`
- `progress`、节点 `kind`、`detail`
- 坐标轴范围和刻度数
- `assetSrc`、节点视觉类型、关系线颜色
- 动画时长、布局坐标、视口跟随行为和视觉样式

策略转向模板的固定素材按用途分目录保存，调用时只填写文件名或 Provider 列出的本地路径，不能传目录字段。没有合适固定人物时，规划 Agent 先用 `search_web` 选 1-3 个直接 `imageUrl`，再使用 `foreground.mode="generate"`；人物描述和参考地址会进入 Function Call，纯色背景、生图提示词和抠图参数由模板固定：

```text
public/era-shift/
├── foreground/       # 可选前景人物或物体图
└── logos/            # 可选背景实体 Logo
```

`switchAt` 是背景从 `startItems` 切换到 `endItems` 的绝对时间；Item 不填写单独的时间戳，Logo、卡片布局和入场间隔由模板固定处理。

其中柱状图和折线图通过两个不同的函数名选择；标题的打字、淡入、滑入和随机显现效果通过不同模板选择。想增加新的运动方式，应新增或选择模板，不应让 AI 临时填写运动参数。

## Shotcraft 分类

Shotcraft 的 193 个 style 已按“语义标签 + group 样式”方式接入模板目录（当前 catalog 共 219 项，包含基础模板和其他新增结构）：

- `mg-title` / `文字`：字卡、逐字入场、乱码、翻牌、描边、打字机等。模型只传一段文字和根 `at`。
- `mg-showcase` / `界面`：卡片、列表、网格、命令面板、胶囊和界面陈列。模型只传 `items` 的文字及 `at`。
- `mg-metric` / `数据`：里程表、计数、仪表、波形、粒子和进度。模型只传 `points` 的标签、数值及 `at`。
- `mg-transition` / `转场`：几何擦除、闪切、甩镜和遮罩，作为原画上的透明叠加层，只传接缝锚点。
- `mg-rhythm` / `节奏`：节拍脉冲、冻结、频闪和蒙太奇强调，只传重音锚点。
- `mg-effect` / `效果`：纯图形光斑、扫描、框线、冲击、装配、开场和收尾效果，作为原画上的透明叠加层，只传锚点文字与时间。

复杂 Shotcraft 卡在本库中采用“固定视觉抽象”：Function Calling 契约可直接使用，但不会要求模型描述 CSS、颜色、视口坐标或外部素材。每个原始 style 的来源分类、目标标签、转换级别和素材备注见 `references/shotcraft-mg-migration.json`。

模板内置的 `public/audio/` 音效会随 MG 片段保留；最终封装时与对齐旁白混音，原画母版 `epXX_raw.mp4` 不会被改写。

## 预览视频

`public/mg-previews/` 保存每个 catalog 样式的真实 Remotion MP4。生成器会把模板 `src/`、`catalog-data.js`、`examples/` 预览数据和 `runtime/preview-entry.tsx` 的内容计算为 SHA-256，并写入 `public/mg-previews/manifest.json`。

模板或预览示例变更后不会自动渲染。手动执行：

```bash
npm run check:previews
npm run render:previews
```

需要强制重渲染时使用 `npm run render:previews -- --force`。Story Claw 只读取这些 MP4；缺失文件时显示统一占位图。

只修改少数样式时可以按文件名、`template:style` 或 style id 增量生成，例如：

```bash
npm run render:previews -- --force --only=showcase-axial-stretch.mp4,showcase-list-reveal.mp4
npm run check:previews -- --only=showcase-axial-stretch.mp4,showcase-list-reveal.mp4
```

不传 `--only` 时仍按完整目录检查或生成；增量生成会保留其他样式的旧清单状态，不会把它们误标为最新。
## 集成示例

```ts
import {
  progressTimelineFunctionDefinition,
  resolveProgressTimelineFunctionArgs,
  ProgressTimelineTemplate,
} from "@story-claw/mg-templates/progress-timeline";

// 注册给第二阶段 AI。
const tools = [progressTimelineFunctionDefinition];

// tool_call.arguments 中的 at 均为整集绝对时间。
const resolved = resolveProgressTimelineFunctionArgs(
  JSON.parse(toolCall.function.arguments),
);

// resolved.at 用于拼接定位；resolved.spec 内部已换算为局部时间。
export const Scene = () => <ProgressTimelineTemplate spec={resolved.spec} />;
```

在进入渲染器前必须调用对应的 `resolve...FunctionArgs()`。resolver 会执行时间换算、业务校验和模板默认值补全；它不会要求 AI 再传运动或样式参数。
