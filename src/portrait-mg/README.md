# 竖屏 MG 模板

《广告》v18 的 41 段分镜使用了下列 38 种 e 说财经参考。已有 9 种竖屏实现复用原代码，另 29 种将原片和 v18 对照后抽成独立模板。参考编号用于追溯出处，模板入口使用稳定 HTML 标签。

所有模板使用 360 × 640 设计坐标和 9:16 等比画布。新模板在 `reference-profiles.ts` 中固定背景层、槽位、裁切、进退场和原有字位。Function Calling 的字段由每个模板的素材槽与口播锚点生成，画面参数不交给模型自由生成。演示使用包内样例素材，业务成片素材由每次规划提供。

- `group="portrait"`，整段时间由宿主提供。`at` 是口播字级时间轴上的绝对秒数，Provider 转换成相对秒数。素材内入点用 `sourceStart` 表示。
- 视频槽提供真实连续视频和非负 `sourceStart`。静图与透明主体槽使用 `sourceStart: null`。透明主体提供实际带 Alpha 的 PNG。
- 文案只填写原有字位。报道和资料使用真实截图或原句。有图像摘句的模板要求提供从同一页截取的原文。
- 预览使用与正式运行时相同的 Remotion 组件。源视频长度不足会报错。准备视频需要 FFmpeg、FFprobe，可用 `FFMPEG_PATH`、`FFPROBE_PATH` 指定路径。

## v18 分镜对应

| 原版编号 | v18 镜头与时间 | Story Claw 标签 | 实现 |
| --- | --- | --- | --- |
| V01_001 | s01 00:00.000–00:07.333 | `mg-v-torn-split` | 复用原本地实现 |
| V07_004 | s02 00:07.333–00:18.200 | `mg-v-question-reveal` | 新增 |
| V10_004 | s03 00:18.200–00:20.700 | `mg-v-ink-title` | 复用原本地实现 |
| V05_002 | s04 00:20.700–00:28.067 | `mg-v-filmstrip` | 复用原本地实现 |
| V19_005 | s05 00:28.067–00:35.733 | `mg-v-particle-sphere-title` | 新增 |
| V10_005 | s06 00:35.733–00:40.567 | `mg-v-process-correction` | 复用原本地实现 |
| V07_003 | s07 00:40.567–00:53.367、s43 03:56.100–04:11.000 | `mg-v-document-highlight` | 复用原本地实现 |
| V20_006 | s08 00:53.367–00:57.967 | `mg-v-torn-oval-inset` | 新增 |
| V01_006 | s09 00:57.967–01:03.467 | `mg-v-comment-panels` | 复用原本地实现 |
| V22_002 | s10 01:03.467–01:08.233 | `mg-v-circle-roll-drop` | 新增 |
| V04_002 | s11 01:08.233–01:11.667、s44 04:11.000–04:24.167 | `mg-v-page-perspective` | 复用原本地实现 |
| V19_006 | s12 01:11.667–01:25.833 | `mg-v-staggered-price-cards` | 新增 |
| V28_002 | s13 01:25.833–01:30.667 | `mg-v-round-object-swap` | 新增 |
| V19_001 | s14 01:30.667–01:36.000 | `mg-v-perspective-faceoff` | 新增 |
| V31_003 | s15 01:36.000–01:40.667 | `mg-v-two-option-click` | 新增 |
| V21_009 | s16 01:40.667–01:42.267 | `mg-v-radiant-round-tag` | 新增 |
| V12_001 | s17 01:42.267–01:50.233 | `mg-v-rotating-document` | 复用原本地实现 |
| V27_006 | s18 01:50.233–01:56.400 | `mg-v-assembled-two-lines` | 新增 |
| V24_001 | s19 01:56.400–02:04.467 | `mg-v-torn-title-reversal` | 新增 |
| V10_008 | s20 02:04.467–02:13.867 | `mg-v-stacked-footage-strips` | 新增 |
| V13_003 | s21 02:13.867–02:25.367 | `mg-v-report-scroll-window` | 新增 |
| V16_002 | s22 02:25.367–02:28.767 | `mg-v-folded-three-photos` | 新增 |
| V21_005 | s23 02:28.767–02:35.567 | `mg-v-document-row-focus` | 新增 |
| V20_009 | s24 02:35.567–02:41.767 | `mg-v-same-card-text-sweep` | 新增 |
| V20_003 | s25 02:41.767–02:49.200、s45 04:24.167–04:37.933 | `mg-v-two-window-switch` | 新增 |
| V18_003 | s26 02:49.200–03:00.200 | `mg-v-strip-join-inset` | 新增 |
| V21_002 | s27 03:00.200–03:03.433 | `mg-v-gold-price-arrow` | 新增 |
| V21_008 | s28 03:03.433–03:09.833 | `mg-v-one-large-two-small` | 新增 |
| V28_001 | s29 03:09.833–03:13.867 | `mg-v-electric-frame-title` | 新增 |
| V18_002 | s30 03:13.867–03:20.833 | `mg-v-red-scroll-quote` | 新增 |
| V01_002 | s31 03:20.833–03:24.167 | `mg-v-picture-in-picture` | 复用原本地实现 |
| V26_001 | s32 03:24.167–03:32.433 | `mg-v-three-diagonal-clips` | 新增 |
| V11_003 | s33 03:32.433–03:40.933 | `mg-v-torn-label-stages` | 新增 |
| V16_001 | s34 03:40.933–03:50.833 | `mg-v-sliding-document-pair` | 新增 |
| V20_007 | s35 03:50.833–03:56.100 | `mg-v-three-gradient-ribbons` | 新增 |
| V21_006 | s46 04:37.933–04:39.400 | `mg-v-fragment-electric-title` | 新增 |
| V25_001 | s47 04:39.400–04:44.467 | `mg-v-blue-gold-nameplate` | 新增 |
| V10_001 | s48 04:44.467–05:00.533 | `mg-v-offset-media-collage` | 新增 |

## 早先的 17 套竖屏模板

早先实现的 17 个 `mg-v-*` 标签，统一 `group="portrait"`，360×640 设计坐标，正式预览 720×1280 / 30fps。所有能力由模板包 Provider 提供，Story Claw 主项目无需改动。

`catalog.js` 管理目录与场景/叠加角色，`definitions.ts` 是已确认的最小 Function Calling Schema，`schema.ts` 负责闭合参数校验和绝对时间转局部时间。`groups/` 注册正式组件及演示配置；预览直接使用正式组件，不播放原成片冒充实现。

## 参数与素材

- 整段时间由宿主传入；元素 `at` 使用绝对秒数。不要把整段 `at/startTime/endTime` 加入函数参数。
- Media 为 `{source, sourceStart}`。图片入点为 `null`；视频入点为素材内非负秒数。路径必须指向已经准备的本地文件，或 `portrait-mg/` 中实际存在的包内素材。
- 颜色、布局、纹理、曲线和动效速度固定在模板内部。人物和物品前景需要带有效 Alpha 的 PNG。
- `assets.ts` 检查文件格式及所需视频时长，禁止循环/冻帧补足。外部视频裁切为有界 data URI，适配现有宿主的图像素材解析接口。
- 人物介绍和闪白抠像通过 `people/prepare.py` 从新输入图片生成静态形变图和数值场。`_prepared` 仅为运行时内部数据，不属于 FC Schema，也不是预渲染成片。
- 网页模板读取规划阶段保存的真实网页快照，唯一匹配文字并记录换行矩形，禁止找不到文字时编造页面。`capture` 为内部数据。两个预览使用原 Python 工程生成的本地演示页面，并明确设置 `fixture: true`。
- 运行素材准备需要 FFmpeg / FFprobe 和 Python（Pillow、NumPy、OpenCV）；网页抓图需要已安装的 Chromium / Chrome / Edge。可用 `FFMPEG_PATH`、`FFPROBE_PATH`、`STORY_CLAW_PYTHON_PATH` 指定可执行文件。

透明叠加：`mg-v-item-cards`、`mg-v-comment-panels`、`mg-v-cutout-collage`、`mg-v-document-highlight`。其余标签为场景层。叠加预览底片仅存在于 demo 配置，不进入业务 Schema。

## 验证与预览

```sh
npm run typecheck
npm run test:portrait
npm run render:previews -- --only portrait-mg --force
npm run check:previews -- --only portrait-mg
```

批量预览默认并发 2，按目录复制依赖素材。早先的 17 个正式预览写入 `public/mg-previews/mg-v-*-portrait.mp4`；源码和包内媒体均进入清单校验哈希。

每项 demo 的 `reference/referenceStart` 明确记录原版对照片及剥离起点。通用模板剥离示例专属片头尾切、日期、点赞数、比分和签名，保留对应 MG 效果。实现阶段对照记录在 `scratch/portrait-mg/audit/` 及各分组目录；独立审计已按用户要求停止，最终视觉验收由用户亲自完成。交付脚本 `scratch/portrait-mg/delivery/build-delivery.ts` 生成新版和同步对比浏览页。

## 验证

```sh
npm run typecheck
npm run test:portrait
npm run render:previews -- --only mg-v-question-reveal-portrait.mp4
npm run check:previews -- --only mg-v-question-reveal-portrait.mp4
```
