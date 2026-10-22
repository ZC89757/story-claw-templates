# 已撤回：无需新增宿主生图接口

2026-10-17：按用户要求重新核对现有模板，改为直接复用 `mg-cutout` / `era-shift` 已用的 protocol-4 参考图生图与纯色抠图回调。新模板只接收主体描述，内部自动附带 `public/subject-expansion/style-reference.png` 风格板，再生图、抠图和解析运行时路径。PNG 由同目录 SVG 源图导出，兼容现有生图备用通道；风格板只约束材质和配色，不用于冒充人物身份，提示词明确禁止复制其对象。

不再增加 `generateImageFromText`，不修改 Story Claw、不扩大公共 Provider 协议。以下为已撤回的历史方案，不得据此改主项目。

---

## 历史方案（已撤回）

此文件是设计提案，不是已经实现的接口。本次仅修改 Template 仓库，Provider 保持 protocolVersion=4，Story Claw 源码未改。

## 当前限制

Story Claw `runner/mg/renderer.ts` 的 `makeReferenceImageGenerator` 返回绝对本地路径，但拒绝空 references。`makeImageResolver` 能用无参考图提示词生图，却返回渲染目录相对路径；`makeSolidBackgroundRemover` 需要可读取的绝对本地路径。模板不掌握宿主 publicDir，不能靠猜目录、修改 cwd 或空参考图调用绕过契约。

## 建议批准的改动

新增一个可选的通用能力，保留旧接口与旧模板的行为：

```ts
type MgTextImageGenerationRequest = {
  prompt: string;
  aspectRatio: string;
  cacheKey: string;
};

// Provider.prepareRuntimeAssets 可选回调
generateImageFromText?: (request: MgTextImageGenerationRequest) => Promise<string>;
// 返回已经写好的绝对本地图片路径。
```

Template 的 `subject-expansion` 依次调用：

1. 模板用固定风格、纯绿背景、完整轮廓与无文字要求组装 prompt，调用 `generateImageFromText`。
2. 把返回的绝对路径交给已有 `removeSolidBackground`，得到透明 PNG。
3. 用已有 `resolveImage` 复制到渲染素材目录，写入 spec 的 image。成功后标记 prepared，保证重入不重复生成。

宿主只在 `runner/mg/renderer.ts` 增加通用适配器，并在 `prepareRuntimeAssets` 调用时传入。适配器复用现有 `generateImage(prompt, output, [], aspectRatio)`、缓存、错误处理和项目路径规则。不新增任何 subject-expansion 专用分支，不动注册表、HTML 解析或时间轴。

Provider 类型会增加可选回调及请求类型，旧宿主仍可使用 transparent 模式。是否递增协议版本需在实施前结合加载器的兼容检查确定；不能静默改变旧 `generateImageFromReferences` 的必填参考图语义。

## 获得批准后才做

实现两侧桥接、接通生成分支，并验证缓存命中、缺能力报错、生成或抠图失败不留下半成品，以及最终透明度。不在本次越界修改主项目，也不直接发起付费生图。
