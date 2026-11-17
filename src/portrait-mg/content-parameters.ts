// Additional original content slots exposed through the same closed Provider schemas.
const object = (properties: Record<string, unknown>) => ({
  type: "object", additionalProperties: false, required: Object.keys(properties), properties,
});
const string = (maxLength: number) => ({type: "string", minLength: 1, maxLength});
const path = string(2000);
const seconds = {type: "number", minimum: 0};
const video = object({source: path, sourceStart: seconds, sourceEnd: seconds});
const nullable = (schema: unknown) => ({anyOf: [schema, {type: "null"}]});
const signature = {...nullable({anyOf: [object({source: path}), object({text: string(14)})]}), description: "原署名位。提供真实署名文字、合适的透明 PNG 字标，或填 null 留空。"};
const footerText = {...nullable(object({text: string(14)})), description: "原底部单行字幕。填写与本段对应的短句，无对应内容填 null。"};
const subtitle = {...nullable(object({text: {...string(12), pattern: "^[ -~]+$"}})), description: "原金牌的小号英文副行，随对应金牌出现，无对应内容填 null。"};

export const portraitContentParameters: Record<string, Record<string, unknown>> = {
  V01_003: {backgroundImage: {...path, description: "网点底景使用的原图。保留原网点和推近动作。"}},
  V01_007: {background: {...video, description: "上下关系图底层视频，覆盖整段。"}},
  V04_001: {backgroundImages: {
    type: "array", minItems: 3, maxItems: 3, items: path,
    description: "依原顺序提供三张有关主体的暗色背景图。切换点固定，可重复使用同一张。",
  }},
  V05_001: {
    brushImage: {...nullable(path), description: "顶部和底部书法字图的替换素材。使用 9:16 透明 PNG，把新字放在原位置。无对应字图可填 null。"},
    objectImage: {...nullable(path), description: "左下原物件位置使用的透明 PNG。无对应物件可填 null。"},
  },
  V10_004: {background: {...video, description: "墨迹下连续播放的背景视频。"}},
  V10_005: {background: {...video, description: "圆标和纠正动效背后的连续视频。"}},
  V13_003: {signature},
  V16_002: {signature, footerText},
  V18_002: {signature, footerText},
  V18_003: {signature, footerText},
  V21_002: {firstSubtitle: subtitle, secondSubtitle: subtitle},
  V21_005: {background: {...video, description: "透视文档队列背后的连续实拍。"}},
  V28_004: {target: {...object({x:{type:"number",minimum:0,maximum:1}, y:{type:"number",minimum:0,maximum:1}, width:{type:"number",minimum:.01,maximum:1}, height:{type:"number",minimum:.003,maximum:1}}), description:"引文在原始截图中的归一化位置与尺寸，左上角为 0,0。高亮仅覆盖这一行的文字区域。"}},
  V31_003: {signature},
  V10_008: {signature},
};
