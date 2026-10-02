import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from "remotion";

type Story = {
  source: string;
  title: string;
  summary: string;
  highlight: string;
  mode: "fade" | "slide" | "cut";
};

const STORIES: Story[] = [
  {
    source: "TOKENSTEAD / SCMP",
    title: "Z.ai 因未经授权上传数据引发争议",
    summary: "多名开发者发现，ZCode 会把本地工作区压缩后上传至外部服务器，其中包含项目 Git 历史。",
    highlight: "313MB 加密文件等待上传",
    mode: "fade",
  },
  {
    source: "TECHCRUNCH / REUTERS / BBC",
    title: "OpenAI 智能体曾提前两个月探测 Hugging Face 漏洞",
    summary: "在大规模入侵发生前，OpenAI 的智能体已经在测试中探测过相关弱点。",
    highlight: "1206 个智能体交换逾 7 万条消息",
    mode: "slide",
  },
  {
    source: "REUTERS / FINANCIAL TIMES",
    title: "OpenAI 预计到 2030 年烧掉近 2800 亿美元现金",
    summary: "报道预计，2026 至 2030 年累计现金消耗接近 2800 亿美元，而同期总收入约为 8400 亿美元。",
    highlight: "2030 年营收预计达到 3500 亿美元",
    mode: "cut",
  },
];

const clamp = (n: number) => Math.min(1, Math.max(0, n));
const easeOut = (n: number) => 1 - Math.pow(1 - clamp(n), 3);

const BrowserPage = ({story, progress}: {story: Story; progress: number}) => {
  const focus = easeOut(clamp((progress - 0.28) / 0.48));
  const pageX = interpolate(focus, [0, 1], [0, -46]);
  const pageY = interpolate(focus, [0, 1], [0, -28]);
  const pageScale = interpolate(focus, [0, 1], [1, 1.055]);
  const highlightOpacity = clamp((progress - 0.32) / 0.22);
  return <div style={{position: "absolute", left: 80, top: 150, width: 560, height: 760, borderRadius: 18, overflow: "hidden", background: "#f7f8f6", boxShadow: "0 28px 90px rgba(0,0,0,.55)", transform: `translate3d(${pageX}px, ${pageY}px, 0) scale(${pageScale})`, transformOrigin: "center center"}}>
    <div style={{height: 42, background: "#e8ecea", display: "flex", alignItems: "center", gap: 8, padding: "0 16px", boxSizing: "border-box", borderBottom: "1px solid #c8cfcc"}}>
      <i style={{width: 11, height: 11, borderRadius: "50%", background: "#ef625d"}} />
      <i style={{width: 11, height: 11, borderRadius: "50%", background: "#e6b34f"}} />
      <i style={{width: 11, height: 11, borderRadius: "50%", background: "#59bd69"}} />
      <span style={{marginLeft: 12, color: "#65716d", fontSize: 13, fontFamily: "Consolas, monospace"}}>news-desk.local / article</span>
    </div>
    <div style={{position: "absolute", inset: "42px 0 0", padding: "42px 44px", boxSizing: "border-box", color: "#182522", fontFamily: "Arial, Microsoft YaHei, sans-serif"}}>
      <div style={{fontSize: 13, color: "#159b67", fontWeight: 800, letterSpacing: 1.8}}>{story.source}</div>
      <h1 style={{fontSize: 34, lineHeight: 1.12, margin: "22px 0 18px", fontWeight: 900}}>{story.title}</h1>
      <div style={{height: 4, width: 92, background: "#13a878", marginBottom: 24}} />
      <p style={{fontSize: 21, lineHeight: 1.6, margin: 0, color: "#44524e"}}>{story.summary}</p>
      <div style={{height: 1, background: "#d2dad6", margin: "28px 0"}} />
      <div style={{fontSize: 14, color: "#7a8983", marginBottom: 14}}>重点摘录 / VERIFIED EXCERPT</div>
      <div style={{position: "relative", fontSize: 27, lineHeight: 1.35, fontWeight: 900}}>
        <span style={{position: "absolute", left: -9, right: 12, top: 8, height: 35, background: "rgba(66, 221, 152, .52)", transform: `scaleX(${highlightOpacity})`, transformOrigin: "left center", zIndex: 0}} />
        <span style={{position: "relative", zIndex: 1}}>{story.highlight}</span>
      </div>
      <div style={{marginTop: 46, height: 120, border: "1px solid #c9d3ce", background: "linear-gradient(135deg,#eef5f0,#dbe8e0)", display: "flex", alignItems: "center", justifyContent: "center", color: "#43836a", fontFamily: "Consolas, monospace", fontSize: 18}}>SOURCE PAGE CAPTURE</div>
      <div style={{display: "flex", justifyContent: "space-between", marginTop: 24, color: "#8a9691", fontSize: 12, fontFamily: "Consolas, monospace"}}><span>REPORT / 2026.09</span><span>SCROLL 04</span></div>
    </div>
  </div>;
};

export const NewsWebDemo = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sceneFrames = 6 * fps;
  const index = Math.min(STORIES.length - 1, Math.floor(frame / sceneFrames));
  const story = STORIES[index];
  const local = frame - index * sceneFrames;
  const progress = clamp(local / sceneFrames);
  const entrance = easeOut(clamp(local / (0.8 * fps)));
  const opacity = story.mode === "fade" ? entrance : 1;
  const slideX = story.mode === "slide" ? interpolate(entrance, [0, 1], [720, 0]) : 0;
  const cutFlash = story.mode === "cut" && local < 3 ? 0.62 : 0;
  const captionY = interpolate(easeOut(clamp((progress - 0.16) / 0.4)), [0, 1], [80, 0]);
  return <AbsoluteFill style={{background: "#070b0d", color: "#effaf4", overflow: "hidden"}}>
    <div style={{position: "absolute", inset: 0, opacity: .34, backgroundImage: "linear-gradient(rgba(96,164,139,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(96,164,139,.18) 1px, transparent 1px)", backgroundSize: "54px 54px", transform: `perspective(500px) rotateX(58deg) translateY(210px) scale(1.55)`}} />
    <div style={{position: "absolute", left: 80, top: 64, fontFamily: "Consolas, monospace", fontSize: 17, letterSpacing: 2, color: "#7fd4ae"}}>AI HOT / SOURCE PAGE STUDY</div>
    <div style={{position: "absolute", right: 80, top: 64, fontFamily: "Consolas, monospace", fontSize: 14, color: "#65766e"}}>ENTRY {String(index + 1).padStart(2, "0")} / {story.mode.toUpperCase()}</div>
    <div style={{position: "absolute", left: 0, right: 0, top: 0, bottom: 0, opacity, transform: `translate3d(${slideX}px,0,0)`}}><BrowserPage story={story} progress={progress} /></div>
    <div style={{position: "absolute", left: 710, right: 82, top: 300, transform: `translateY(${captionY}px)`, opacity: entrance}}>
      <div style={{fontFamily: "Consolas, monospace", fontSize: 14, color: "#56e5a1", letterSpacing: 1.5, marginBottom: 14}}>KEY POINT / HIGHLIGHT</div>
      <div style={{fontSize: 42, lineHeight: 1.14, fontWeight: 900, textShadow: "0 8px 24px rgba(0,0,0,.5)"}}>{story.highlight}</div>
      <div style={{height: 2, background: "#35d592", marginTop: 26, width: `${160 + 100 * progress}px`, transformOrigin: "left"}} />
      <div style={{marginTop: 24, color: "#9eaca6", fontSize: 16, lineHeight: 1.6}}>网页先进入画面，再通过镜头推近跟随标注位置，最后由字幕完成解释。</div>
    </div>
    <div style={{position: "absolute", left: 80, right: 80, bottom: 72, display: "flex", justifyContent: "space-between", fontFamily: "Consolas, monospace", fontSize: 13, color: "#789087"}}><span>FADE / SLIDE / CUT</span><span>CAMERA FOLLOW ACTIVE</span></div>
    {cutFlash > 0 ? <div style={{position: "absolute", inset: 0, background: "#eafff0", opacity: cutFlash}} /> : null}
  </AbsoluteFill>;
};
