export const MG_CUTOUT_CHROMA_COLOR = "#00ff00" as const;
export const MG_CUTOUT_GENERATED_ASPECT_RATIO = "2:3" as const;

export const mgCutoutGenerationPrompt = (subject: string): string => [
  "Create one clean, isolated person or object cutout based on the supplied reference images.",
  `Subject to show: ${subject.trim()}`,
  "Preserve the recognizable identity, shape, materials, clothing and colors from the references.",
  "Show the complete silhouette centered in a portrait frame with generous margin; do not crop the head, hands or object edges.",
  "Do not add a floor, cast shadow, scenery, text, labels, logos, borders or extra objects.",
  `Fill the entire background edge-to-edge with perfectly flat solid chroma green (${MG_CUTOUT_CHROMA_COLOR}) for clean automatic background removal.`,
  "Keep the silhouette crisp and clearly separated from the background; do not use green light or reflections on the subject.",
].join(" ");

export const mgCutoutPlanningInstructions = `
<mg-cutout group="rise"> 的 source 有三种模式：
- mode="transparent"：输入已经带 alpha 透明通道的 PNG/WebP，image 填可读取的图片 URL 或本地素材路径，subject=null，references=[]。
- mode="chroma"：输入已有纯绿幕图片，image 填图片的绝对本地文件路径；模板固定按 #00ff00 抠除，subject=null，references=[]。
- mode="generate"：需要从参考图生成新的人物或物体时，先用 search_web 找 1-3 张可靠直接图片地址（优先结果的 imageUrl），填写 subject 和 references，image=null。宿主会按模板固定提示词生成纯绿幕图片并自动抠除。
动画只把最终透明主体从画面下方升起并自然减速停住；模板不绘制或替换下层画面。不要输出其他视觉参数、背景、音效或抠图阈值。
`.trim();
