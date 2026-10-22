# 人物点名、品牌弹入与名人说

本组模板由 Provider v4 提供，正式渲染与预览共用组件。适配 9:16 和 16:9，不需要改宿主注册表。

## 独立横屏 Group（2026-10-21）

| 效果 | 原 Group | 新横屏 Group |
| --- | --- | --- |
| 公司静态背景 | company | company-landscape |
| 两个人物左右点名 | duo | duo-landscape |
| 实拍上 Logo 弹入 | pop | pop-landscape |
| 名人说逐字观点 | portrait | landscape |

Function Calling 名称、内容参数、素材、配音和绝对时间点完全相同，只替换 `group`。宿主输出尺寸独立设为 16:9；不向模板添加宽高、布局或打字速度参数。横屏使用独立组件文件：`src/image-plate/ImagePlateLandscapeTemplate.tsx`、`src/cutout-cue/CutoutCueLandscapeTemplate.tsx`、`src/speaker-quote/SpeakerQuoteLandscapeTemplate.tsx`。透明抠图、入场动作和声音复用已有实现。

```html
<image-plate group="company-landscape" mode="together">
  <cutout-cue group="duo-landscape" mode="together" values='["马丁·艾伯哈德","马克·塔彭宁"]'>
    不过，2003 年创立这家公司的，是<mg-value value="1">马丁·艾伯哈德</mg-value>和<mg-value value="2">马克·塔彭宁</mg-value>。
  </cutout-cue>
</image-plate>
```

渲染三个正式横屏组合 demo：

```powershell
npm exec -- tsx scripts/render-people-cues-proof.ts --landscape
```

输出到桌面 `特斯拉_A版细化_20261020/横屏版`，1920×1080、24 fps。有声 MP4、关键帧、完整参数示例一并保存。原竖屏 demo 保留。修改组件后可加 `--force` 重渲染横屏，不覆盖竖屏。

## 组合方式

```html
<image-plate group="company" mode="together">
  <cutout-cue group="duo" mode="together" values='["马丁·艾伯哈德","马克·塔彭宁"]'>
    不过，2003 年创立这家公司的，是<mg-value value="1">马丁·艾伯哈德</mg-value>和<mg-value value="2">马克·塔彭宁</mg-value>。
  </cutout-cue>
</image-plate>

<video-footage group="full-bleed" mode="together">
  <cutout-cue group="pop" mode="together" values='["莲花","特斯拉"]'>
    团队找到<mg-value value="1">莲花</mg-value>合作，<mg-value value="2">特斯拉</mg-value>开发电池组。
  </cutout-cue>
</video-footage>

<speaker-quote group="portrait" mode="together" values='["设计出一辆车很容易，难的是制造出一辆车。"]'>
  马斯克常说，<mg-value value="1">设计出一辆车很容易，难的是制造出一辆车。</mg-value>
</speaker-quote>
```

HTML 保留原文，不包含时间、图片地址和额外旁白。同标签同 group 只有一个实例时不写 order；多个实例才从 1 连续编号。

## Function Calling 参数

### create_image_plate

必填 `group="company"`、`order=null|正整数`、`image`、`caption=null|短资料说明`。静态满屏照片，无运镜，`layerRole=scene`。可嵌套透明人物层。

```json
{"group":"company","order":null,"image":"people-cues/tesla-company.jpg","caption":"TESLA · 创始人"}
```

### create_cutout_cues

必填 `group="duo"|"pop"`、`order`、`items`。每项固定为 `at`、`label`、`source`。`at` 是真实配音时间轴上的**绝对秒数**，宿主负责实例起止时间。

```json
{
  "group":"duo","order":null,
  "items":[
    {"at":104.095,"label":"马丁·艾伯哈德","source":{"mode":"transparent","image":"people-cues/martin-eberhard.png","subject":null,"references":[]}},
    {"at":105.765,"label":"马克·塔彭宁","source":{"mode":"transparent","image":"people-cues/marc-tarpenning.png","subject":null,"references":[]}}
  ]
}
```

此例假设宿主窗口从 100 秒开始。不能把示例时间直接用于正式项目。

- `duo` 恰好两项，按顺序左、右；点名后保留至窗口结束。图片建议同为腰部以上、人物占比接近的透明 PNG。
- `pop` 支持 1–8 项，在中央快速弹入，固定短停留后退出，下一项提前到来会缩短上一项。不改变底层实拍。
- `label` 可为空；音效、位置、颜色和动效强度由模板控制。
- `source.mode="transparent"` 直接使用已有透明图或准确矢量 Logo。
- `source.mode="chroma"` 复用已有 mg-cutout 的色底抠图流程。
- `source.mode="generate"` 先按 `subject` 和最多三张 `references` 生成，再复用抠图流程。`image=null`。真人身份优先提供参考照，品牌 Logo 优先用准确官网图形。

已有 `mg-cutout group=rise` 可做单个主体入场，本次新增的是**两人依次入场**和**多 Logo 点名弹入**，复用其素材准备能力。

### create_speaker_quote

必填 `group="portrait"`、`order`、`speaker`、`portrait`、`quotation`、`characters`。

```json
{
  "group":"portrait","order":null,
  "speaker":"埃隆·马斯克","portrait":"people-cues/elon-musk-portrait.png",
  "quotation":"paraphrase",
  "characters":[{"text":"设","at":201.2},{"text":"计","at":201.4}]
}
```

正式调用必须包含完整话语的每个 Unicode 字符和对应真实绝对时间，不能填固定打字速度。以上只有两字，用于说明形状。画像可不透明；上方文字随配音逐字显示。`direct` 只用于核验过的逐字原话；译述、概括和未核对文字用 `paraphrase`，画面显示“观点转述”。

## 素材与 demo

模板图片清单在 `public/people-cues/catalog.json`，归属和生成说明在同目录 `ATTRIBUTION.md`。Provider 会向规划模型提供图片清单，并把 footage 的真实画面候选区间与来源说明传给模型，不将画面笔记伪装成字幕。

```powershell
npm run typecheck
npm exec -- tsx --test tests/people-cues.test.ts tests/mg-cutout.test.ts tests/provider.test.ts tests/video-footage.test.ts
npm run render:previews -- --only image-plate:company,cutout-cue:duo,cutout-cue:pop,speaker-quote:portrait --force
npm run check:previews -- --only image-plate:company,cutout-cue:duo,cutout-cue:pop,speaker-quote:portrait
npm exec -- tsx scripts/render-people-cues-proof.ts
```

最后一条通过正式 `StoryClawMgEpisode` 渲染三段 720×1280、24 fps 的有声证明视频，输出到桌面 `特斯拉_A版细化_20261020`。其旁白使用 Windows SAPI 中文试听音色；demo 中按词边界获得位置，同词字符内部分配时间。正式生产应使用 Story Claw 真实字级时间轴，不能把 demo 的分配值当成生产字级精度。

当前整片尚未渲染，A 项目保持画面预设审核状态。示例 MP4 只作查看效果，不反向作为正式模板实现。
