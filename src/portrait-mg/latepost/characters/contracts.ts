const closed = <T extends Record<string, unknown>>(properties: T) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

const line = (maxLength: number, description: string) => ({
  type: "string", minLength: 1, maxLength, pattern: "^[^\\r\\n]+$", description,
});
const fixedArray = (size: number, items: unknown) => ({
  type: "array", minItems: size, maxItems: size, items,
});
const at = (description: string) => ({type: "number", minimum: 0, description});
const cue = (description: string) => closed({at: at(description)});
const envelope = {
  group: {type: "string", enum: ["portrait"]},
  order: {anyOf: [{type: "integer", minimum: 1}, {type: "null"}]},
};
export const pairedQuoteLetterSeconds = .1;
const image = (description: string) => line(2000, description);
const video = (description: string) => closed({
  source: line(2000, description),
  sourceStart: {type: "number", minimum: 0},
});

export type VideoSlot = {source: string; sourceStart: number};
export type CommentStackSpec = {photo: string; comments: {text: string; at: number}[]; _duration?: number};
export type PairedQuoteSpec = {
  speakers: {photo: string; name: string; role: string}[];
  card: {at: number};
  lines: {text: string; at: number}[];
  emphasis: string;
  highlight: {at: number};
};

function fit(text: string, limit: number, field: string) {
  const width = Array.from(text, character => /^[\x20-\x7e]$/.test(character) ? .58 : 1)
    .reduce((sum, width) => sum + width, 0);
  if (width > limit) throw new Error(`${field}超过固定字位，请缩短文本`);
}

function verifyTimes(times: number[], duration: number, spacing: number, hold: number) {
  if (times.some((time, index) => time < 0 || (index > 0 && time - times[index - 1] < spacing)) ||
    times[times.length - 1] + hold > duration) {
    throw new Error("各段入场时间须依次排布，并留出最后一段的停留时间");
  }
}

export const commentStackContract = {
  id: "latepost-V13_001",
  tag: "mg-v-comment-bubble-stack",
  title: "评论气泡叠列",
  description: "七条短评随旁白从上至下依次弹出，白色气泡的尖角左右交错。暖色主题照片铺满竖屏并缓慢推近。",
  definition: {
    type: "function",
    strict: true,
    name: "create_portrait_comment_bubble_stack",
    description: "仅 9:16。并列呈现同一话题的七条简短评论。背景使用与评论主题相关的真实照片。comments.at 是旁白时间轴上的绝对秒数。",
    parameters: closed({
      ...envelope,
      photo: image("暖色近景照片的本地路径，按 9:16 裁切。"),
      comments: fixedArray(7, closed({
        text: line(24, "保留评论原意，省略外侧引号。七条的固定字位依次为 8.5、4.8、5.9、9.3、7.6、5.8、7.6 个全角字宽。"),
        at: at("气泡对应评论的绝对入场秒数。"),
      })),
    }),
  },
  minimumDuration: 2.5,
  validate(spec: unknown, duration: number) {
    const {comments} = spec as CommentStackSpec;
    comments.forEach((comment, index) => fit(comment.text, [8.5, 4.8, 5.9, 9.3, 7.6, 5.8, 7.6][index], "评论"));
    verifyTimes(comments.map(comment => comment.at), duration, .17, .48);
  },
  media: () => [{type: "image" as const, path: ["photo"]}],
} as const;

export const pairedQuoteContract = {
  id: "latepost-V14_004",
  tag: "mg-v-paired-portrait-quote",
  title: "双头像引语",
  description: "两张圆形头像先后弹出并补上姓名、身份，随后上移至白卡左缘。黑色引语分三行逐字出现，末尾关键词由红底扫过。",
  definition: {
    type: "function",
    strict: true,
    name: "create_portrait_paired_portrait_quote",
    description: "仅 9:16。呈现两位受访者的共同判断。头像用真实照片，三行引语保持原意。所有时间为旁白时间轴绝对秒数。",
    parameters: closed({
      ...envelope,
      speakers: fixedArray(2, closed({
        photo: image("居中头像照片的本地路径，组件将裁成圆形。"),
        name: line(4, "姓名，固定字位。"),
        role: line(13, "简短身份，固定字位。"),
      })),
      card: cue("两张头像开始上移汇合的绝对秒数，至少留出前 1.6 秒的介绍时间。"),
      lines: fixedArray(3, closed({
        text: line(20, "按卡片实际换行，每行最多 11 个全角字宽。"),
        at: at("开始写入该行的绝对秒数。"),
      })),
      emphasis: line(8, "第三行末尾用于扫红的连续关键词，省略句末标点。"),
      highlight: cue("末句关键词开始扫红的绝对秒数。"),
    }),
  },
  minimumDuration: 5,
  validate(spec: unknown, duration: number) {
    const {card: {at: cardAt}, lines, emphasis, highlight: {at: emphasisAt}} = spec as PairedQuoteSpec;
    lines.forEach(item => fit(item.text, 11, "引语"));
    const ending = lines[2].text.replace(/[。.！!？?，,；;]+$/, "");
    if (!ending.endsWith(emphasis)) throw new Error("扫红关键词必须位于第三行末尾");
    if (cardAt < 1.6 || lines[0].at - cardAt < 1.31) throw new Error("头像与白卡完整入场后再写引语");
    verifyTimes([...lines.map(item => item.at), emphasisAt], duration, .5, .35);
    if (lines.some((item, index) =>
      (lines[index + 1]?.at ?? emphasisAt) - item.at < Array.from(item.text).length * pairedQuoteLetterSeconds
    )) {
      throw new Error("引语每行须写完再换行，末行写完后再扫红");
    }
  },
  media: () => [0, 1].map(index => ({type: "image" as const, path: ["speakers", index, "photo"]})),
} as const;

export type OverheadQuestionSpec = {
  background: VideoSlot;
  question: {at: number; lines: string[]};
};
export type OfficeMonologueSpec = {
  background: VideoSlot;
  speaker: string;
  quote: {at: number; text: string}[];
};
export type InterviewContrastSpec = {
  interview: VideoSlot;
  upper: {at: number; text: string};
  lower: {at: number; text: string};
  _duration?: number;
};
export type CrewAppealsSpec = {
  background: VideoSlot;
  appeals: {at: number; text: string}[];
  quote: {at: number; lines: string[]};
};

const timedText = (limit: number, description: string) => closed({
  at: at("这行文字出现或开始写入的绝对秒数。"),
  text: line(limit, description),
});
const twoLines = (limit: number, description: string) => closed({
  ...cue("双行文字出现的绝对秒数。").properties,
  lines: fixedArray(2, line(limit, description)),
});

export const overheadQuestionContract = {
  id: "latepost-V01_001",
  tag: "mg-v-overhead-crowd-question",
  title: "俯视人群提问",
  description: "红色地面上的人物从俯视视角分散穿行，灰色长影斜向左下。镜头缓推，两行高挑的白色宋体叠出问题。",
  definition: {
    type: "function",
    strict: true,
    name: "create_portrait_overhead_crowd_question",
    description: "仅 9:16。用于从群体处境引出一个章节问题。提供红底俯视人物的连续视频和两行短问题。question.at 是旁白时间轴绝对秒数。",
    parameters: closed({
      ...envelope,
      background: video("竖屏连续视频的本地路径。画面为红底俯视群像，八个分散人物的灰色长影朝左下。视频覆盖整个镜头。"),
      question: twoLines(9, "首行最多 4 个全角字宽，第二行最多 6 个全角字宽。"),
    }),
  },
  minimumDuration: 2,
  validate(spec: unknown, duration: number) {
    const {question} = spec as OverheadQuestionSpec;
    question.lines.forEach((text, i) => fit(text, i === 0 ? 4 : 6, "章节问题"));
    verifyTimes([question.at], duration, 0, .65);
  },
  media: (_spec: unknown, duration: number) => [{type: "video" as const, path: ["background"], seconds: duration}],
} as const;

export const officeMonologueContract = {
  id: "latepost-V01_003",
  tag: "mg-v-office-monologue-quote",
  title: "办公室独白引语",
  description: "黑白几何办公室中，人物站在成排工位前。偏斜的红色对话框在人物头顶扩张，白色引语跟随口播逐字写入。",
  definition: {
    type: "function",
    strict: true,
    name: "create_portrait_office_monologue_quote",
    description: "仅 9:16。用于一位受访者在工作场景中讲述的连续长引语。视频应保留正面人物和其头顶的留白。quote.at 是每行的绝对起始秒数。",
    parameters: closed({
      ...envelope,
      background: video("黑白几何办公室里的连续人物视频本地路径，竖屏、人物头顶留白、覆盖整段。"),
      speaker: line(12, "短署名或匿名身份，左上固定字位。"),
      quote: {type: "array", minItems: 1, maxItems: 4, items: timedText(38, "引语原文分行，每行最多 26 个全角字宽。")},
    }),
  },
  minimumDuration: 2.5,
  validate(spec: unknown, duration: number) {
    const {quote} = spec as OfficeMonologueSpec;
    quote.forEach(item => fit(item.text, 26, "独白"));
    if (quote[0].at < .62) throw new Error("保留身份入场及对话框弹出的时间");
    verifyTimes(quote.map(item => item.at), duration, .26, .35);
    if (quote.some((item, index) =>
      (quote[index + 1]?.at ?? duration - .35) - item.at < Array.from(item.text).length * .065
    )) {
      throw new Error("独白每行须写完再换行，并为末行保留停留时间");
    }
  },
  media: (_spec: unknown, duration: number) => [{type: "video" as const, path: ["background"], seconds: duration}],
} as const;

export const interviewContrastContract = {
  id: "latepost-V01_004",
  tag: "mg-v-interview-opposition",
  title: "采访观点对照",
  description: "人物采访在画面中部缓慢推近。上方先浮出白色观点，中央红色 VS 短促落定，下方白色观点紧随出现。",
  definition: {
    type: "function",
    strict: true,
    name: "create_portrait_interview_opposition",
    description: "仅 9:16。让两个相互拉扯的诉求在同一人物采访上并列对照。上下观点各占一行。upper.at 和 lower.at 是绝对秒数。",
    parameters: closed({
      ...envelope,
      interview: video("无版式字和水印的真实连续采访视频本地路径，人物面向镜头，以肩胸以上为主。文件剩余时长覆盖整段。"),
      upper: timedText(15, "上方观点，最多 9 个全角字宽。"),
      lower: timedText(15, "下方观点，最多 9 个全角字宽。"),
    }),
  },
  minimumDuration: 1.4,
  validate(spec: unknown, duration: number) {
    const {upper, lower} = spec as InterviewContrastSpec;
    fit(upper.text, 9, "上方观点");
    fit(lower.text, 9, "下方观点");
    verifyTimes([upper.at, lower.at], duration, .5, .68);
  },
  media: (_spec: unknown, duration: number) => [{type: "video" as const, path: ["interview"], seconds: duration}],
} as const;

export const crewAppealsContract = {
  id: "latepost-V15_005",
  tag: "mg-v-crew-appeals-quote",
  title: "群像诉求汇入引语",
  description: "红黑色群像前排清晰、后排渐暗。工作诉求在不同字位陆续浮出，文字一起变虚，最后聚合为居中的两行长引语。",
  definition: {
    type: "function",
    strict: true,
    name: "create_portrait_crew_appeals_quote",
    description: "仅 9:16。用于多位从业者对工作环境提出短诉求，并以一句可溯源的共通诉求收束。所有 at 都是旁白时间轴绝对秒数。",
    parameters: closed({
      ...envelope,
      background: video("红黑群像竖屏连续视频的本地路径。人物上半身集中在画面上半至中部，下部留深色区域给引语。视频覆盖整段。"),
      appeals: fixedArray(9, timedText(18, "一条诉求最多 17 个全角字宽。")),
      quote: twoLines(22, "结尾引语的上下两行，单行最多 17 个全角字宽。"),
    }),
  },
  minimumDuration: 4,
  validate(spec: unknown, duration: number) {
    const {appeals, quote} = spec as CrewAppealsSpec;
    appeals.forEach(item => fit(item.text, 17, "散列诉求"));
    quote.lines.forEach(item => fit(item, 17, "结尾引语"));
    verifyTimes([...appeals.map(item => item.at), quote.at], duration, .16, .75);
  },
  media: (_spec: unknown, duration: number) => [{type: "video" as const, path: ["background"], seconds: duration}],
} as const;

export const characterContracts = [
  commentStackContract, pairedQuoteContract, overheadQuestionContract,
  officeMonologueContract, interviewContrastContract, crewAppealsContract,
] as const;
