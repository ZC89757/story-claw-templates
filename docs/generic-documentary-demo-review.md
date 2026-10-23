# 通用纪录片 MG：第一阶段评审

状态：等待用户亲自审片；本阶段不接 Story Claw 完整制作流程。

## 回滚基准

- Story Claw：`a8b74de`，已推送 `origin/main`。
- 模板包：`d0f8238`，已推送 `origin/master`。
- 当前开发分支：`codex/reusable-documentary-mg`。
- 浏览器登录资料、调试缓存、大型原始 footage 保留本地，不纳入代码快照。

## 新的正式能力

两个模板均由 Provider 注册，并由 `runtime/render-entry.tsx` 实际渲染。
本阶段沿用 Provider v4 的素材准备接口，没有修改主程序或升级公共协议。

### `create_production_chain`

HTML：`<production-chain group="production-chain">`。

- `title`：标题。
- `actors`：参与方 id 与 label，1–4 个。
- `stages`：2–6 个环节，分别提供 id、label、actorId、source、parts、at。
- `source`：method=existing/generate，background.transparent 控制是否去背景，不按文字识别行业。
- `parts`：0–3 个部件，每项 source/appearAt/mergeAt。按指定时间出现并移动至主体后方遮挡融合，不推断真实机械坐标。
- `links`：明确的 from / to / at。仅接受向前的阶段流向；任意回路继续使用图文关系图。
- 时间为整集绝对秒数，宿主确定窗口。首环节与窗口同起，相邻环节至少1.2秒。
- 颜色、阴影、进出场、工位布局和镜头跟随由组件控制。

### `create_numeric_comparison`

HTML：`<numeric-comparison group="editorial-scale|editorial-counts">`。

- `title`、`unit`、`mode`、`left`、`right`、`unitsPerMark`。
- 两侧分别填写 label、source、value、qualifier、caption、at。
- absolute：共用同一口径和单位；relative：左侧为正数精确基准，右侧为倍数，不换算成伪精确价格。
- qualifier：exact / approx / at-most / at-least / greater-than / less-than。
- 上下界不显示精确比例条。
- scale 必须提供两侧图片，unitsPerMark=null；counts 图片为 null，每格数量明确，最多150格，部分格按比例显示。
- 模型不提供坐标、字体、颜色或运动曲线。

## 兼容性

原汽车专用实现移动到 `src/legacy-documentary/`，原导出路径兼容转发，旧 Function Call 参数不改。
旧调用的行业假设只为重现历史项目保留。新调用使用独立的结构化契约。
后续正式流程迁移要显式转换旧项目参数，不能悄悄给旧调用猜新图片。

## 三个题材

每段18秒，前10秒分工、后8秒比较。三段使用相同 Provider 函数及组件，仅参数和资产不同。

1. 汽车：沿用特斯拉稿的分工和价格口径，2.6倍不计算成确定车价。
2. 半导体：设计、晶圆、封测；256/512 KB 为虚构产品演示数据。
3. 咖啡：种植、烘焙、门店；18/30元为虚构产品演示数据。

第二、三个流程是简化示意，不是实际企业经营或具体机械工艺的证明。
图像为可替换 PNG 素材（原 SVG 已栅格化，咖啡部件实测 AI 生图并抠图）；生产组件不依赖文件名、公司名或题材关键字。
demo 的具体参数在 `src/documentary-generic/demos.ts`，资产在 `public/generic-documentary/`。

## 复现

```powershell
node scripts/build-generic-demo-assets.cjs
npm run typecheck
npm run test:documentary
npm run demo:documentary -- --out=D:/StoryClawRuns/generic-mg-review-20261023
```

浏览器路径可通过 `REMOTION_BROWSER_EXECUTABLE` 指定。
demo 调用 Provider 解析与素材准备，再使用 Provider 公开的 runtimeEntryUrl 渲染。
预览 HTML 只播放真实 MP4，不复制一份 CSS 动画。

## 本次审核范围

- 是否保留银灰舞台、蓝红配色、立体物体与渐进展示的设计效果。
- 同一组件跨题材是否自然，是否还需要逐期改代码。
- 文字密度、布局、出场顺序、装配示意是否清楚。
- 这些是显式参数驱动的能力验证，尚未证明弱模型能够自动规划同等质量。

用户明确通过后，才继续正式项目导入、项目资产管理、局部重跑、字幕和剧情配乐接入。

## 参数执行版

source.method=existing 读取图片，generate 调用现有生图服务。background.transparent=true 检查透明度；透明图跳过抠除，纯色背景自动检测底色并调用宿主抠图；复杂背景通过参考图编辑整理后再抠除，并验证 alpha。false 不抠图。底色由程序选择，模型不传。透明检查当前支持 PNG/JPEG，其他格式先转 PNG；不静默忽略。复杂背景的 AI 编辑可能改变细节，真实品牌与产品仍须审图。

parts 的 appearAt/mergeAt 均为绝对秒数，Provider 转为局部时间一次；主体在上层，部件从外侧移入下层。至少留0.5秒展示和0.8秒融合。三个 demo 中为7.05秒出现、8.4秒开始融合；实际生成证据保存在评审目录 source-proof/execution.json。

三个完整 demo 已加入 public/mg-previews/documentary-demo-*.mp4，模板库详情页可切换题材。已更新本机安装目录；旧安装包备份到 D:/StoryClawRuns/generic-mg-review-20261023/installed-pack-before-actions。34 项相关自动测试、真实生图抠图调用、3 段 MP4 全解码与浏览器播放验证通过。

