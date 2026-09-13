/** Fixed visual recipe for generated era-shift foregrounds. */

export const ERA_SHIFT_CHROMA_COLOR = "#00ff00" as const;
export const ERA_SHIFT_GENERATED_ASPECT_RATIO = "2:3" as const;

export const eraShiftForegroundPrompt = (person: string, retry = false): string => {
  const retryInstruction = retry
    ? "Make the background even flatter and cleaner than before: absolutely no cast shadow, halo, gradient, floor, reflection, texture, or stray object at the silhouette edge."
    : "Use a perfectly flat, uniform background with no cast shadow, floor, reflection, gradient, texture, or stray object.";
  return [
    "Create a clean isolated portrait or full-body cutout of the person or named group described below.",
    `Subject identity and appearance: ${person.trim()}`,
    "Use the supplied reference images only to preserve the subject's recognizable identity and clothing cues.",
    "Show the complete silhouette centered in frame with comfortable margin; keep the face and hands visible when present.",
    "Do not add props, scenery, text, logos, labels, borders, or any other people unless the description explicitly names a group.",
    `Put the subject on a solid chroma-green background exactly near ${ERA_SHIFT_CHROMA_COLOR}; the background must fill every corner.`,
    retryInstruction,
    "The result is an extraction source, so prioritize a crisp silhouette and clean separation from the background.",
  ].join(" ");
};

export const eraShiftPlanningInstructions = `
策略转向的前景支持两种模式：
- foreground.mode="existing"：从工具说明列出的固定透明前景中选一张，并填写 foreground.image；foreground.person 填 null，foreground.references 填 []。
- foreground.mode="generate"：当正文涉及固定目录没有的人物或人物组合时，先调用 search_web 搜索该人物的可靠肖像或全身照片，再从结果中选择 1-3 个直接图片地址（优先使用返回对象里的 imageUrl，不要使用网页地址或 screenshotUrl）。然后填写 foreground.person 为要呈现的人物/组合，foreground.references 为这些直接图片地址，foreground.image 填 null。
模板会在运行时用这些参考图生成纯色背景人物图并自动抠成透明 PNG；不要自行填写生图提示词、背景色、抠图阈值或其他视觉参数。搜索不到可读取的直接图片地址时，换关键词继续搜索，不能编造 URL。
`.trim();
