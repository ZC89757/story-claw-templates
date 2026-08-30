import type {ReactNode} from "react";
import {
  AbsoluteFill,
  Composition,
  getInputProps,
  OffthreadVideo,
  registerRoot,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import {ProgressTimelineTemplate, VerticalProgressTimelineTemplate} from "../src/progress-timeline";
import {TimedTableTemplate} from "../src/timed-table";
import {DirectedGraphTemplate, RadialRelationTemplate} from "../src/directed-graph";
import {
  FadeTitleTemplate,
  BlurSlideTitleTemplate,
  RandomRevealTitleTemplate,
  ScrambleTitleTemplate,
  SlideTitleTemplate,
  SplitFlapTitleTemplate,
  ShotcraftTitleTemplate,
  TypewriterTitleTemplate,
} from "../src/title";
import {EmphasisTextTemplate} from "../src/emphasis";
import {XYChartTemplate} from "../src/xy-chart";
import {MultiSeriesChartTemplate} from "../src/multi-series-chart";
import {ContainmentTemplate} from "../src/containment";
import {DecompositionTemplate} from "../src/decomposition";
import {BalanceComparisonTemplate, SideBySideComparisonTemplate} from "../src/weighted-comparison";
import {CollageNetworkTemplate} from "../src/collage-network";
import {ImageStackTemplate} from "../src/image-stack";
import {ImageGridTemplate} from "../src/image-grid";
import {ShowcaseTemplate} from "../src/showcase";
import {MetricTemplate} from "../src/metric";
import {TransitionTemplate} from "../src/transition";
import {RhythmTemplate} from "../src/rhythm";
import {EffectTemplate} from "../src/effect";
import {CameraTemplate} from "../src/camera";
import type {
  MgOverlayTemplateName,
  MgRenderInput,
  MgRuntimeOverlay,
  MgRuntimeScene,
} from "../src/runtime";

const ScaledCanvas = ({children, full = false}: {children: ReactNode; full?: boolean}) => {
  const {width, height} = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  const scale = fit * (full ? 1 : width >= height ? 0.86 : 0.96);
  return <div style={{
    position: "absolute",
    left: (width - 1920 * scale) / 2,
    top: (height - 1080 * scale) / 2,
    width: 1920,
    height: 1080,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
  }}>{children}</div>;
};

const MainTemplate = ({scene}: {scene: MgRuntimeScene}) => {
  const spec = scene.spec as never;
  switch (scene.template) {
    case "progress-timeline": return scene.group === "vertical"
      ? <VerticalProgressTimelineTemplate spec={spec} />
      : <ProgressTimelineTemplate spec={spec} />;
    case "timed-table": return <TimedTableTemplate spec={spec} />;
    case "directed-graph": return scene.group === "radial"
      ? <RadialRelationTemplate spec={spec} />
      : <DirectedGraphTemplate spec={spec} />;
    case "xy-chart": return <XYChartTemplate spec={spec} />;
    case "multi-series-chart": return <MultiSeriesChartTemplate spec={spec} />;
    case "containment": return <ContainmentTemplate spec={spec} />;
    case "decomposition": return <DecompositionTemplate spec={spec} />;
    case "weighted-comparison": return <BalanceComparisonTemplate spec={spec} />;
    case "side-by-side-comparison": return <SideBySideComparisonTemplate spec={spec} />;
    case "collage-network": return <CollageNetworkTemplate spec={spec} />;
    case "image-stack": return <ImageStackTemplate spec={spec} />;
    case "image-grid": return <ImageGridTemplate spec={spec} />;
    case "showcase": return <ShowcaseTemplate spec={spec} style={scene.group} />;
    case "metric": return <MetricTemplate spec={spec} style={scene.group} />;
    case "transition": return <TransitionTemplate spec={spec} style={scene.group} />;
    case "rhythm": return <RhythmTemplate spec={spec} style={scene.group} />;
    case "effect": return <EffectTemplate spec={spec} style={scene.group} />;
    case "camera": return <CameraTemplate spec={spec} style={scene.group} baseFile={scene.baseFile} timelineOffsetFrames={scene.timelineOffsetFrames} />;
    default: throw new Error(`Unsupported replacement template: ${scene.template}`);
  }
};

const OverlayTemplate = ({template, group, spec}: {template: MgOverlayTemplateName; group: string; spec: unknown}) => {
  if (template === "title") {
    if (group === "blur-slide") return <BlurSlideTitleTemplate spec={spec as never} />;
    if (group === "scramble") return <ScrambleTitleTemplate spec={spec as never} />;
    if (group === "split-flap") return <SplitFlapTitleTemplate spec={spec as never} />;
    if (group === "slide") return <SlideTitleTemplate spec={spec as never} />;
    if (group === "typewriter") return <TypewriterTitleTemplate spec={spec as never} />;
    if (group === "random-reveal") return <RandomRevealTitleTemplate spec={spec as never} />;
    if (["fade", "slide", "typewriter", "random-reveal", "blur-slide", "scramble", "split-flap"].includes(group)) return <FadeTitleTemplate spec={spec as never} />;
    return <ShotcraftTitleTemplate spec={spec as never} style={group} />;
  }
  if (template === "transition") return <TransitionTemplate spec={spec as never} style={group} />;
  if (template === "rhythm") return <RhythmTemplate spec={spec as never} style={group} />;
  if (template === "effect") return <EffectTemplate spec={spec as never} style={group} />;
  return <EmphasisTextTemplate spec={spec as never} />;
};

const Overlay = ({overlay}: {overlay: MgRuntimeOverlay}) => <Sequence
  from={overlay.fromFrame}
  durationInFrames={overlay.durationFrames}
  premountFor={Math.min(15, overlay.fromFrame)}
>
  <AbsoluteFill style={{background: ["transition", "rhythm", "effect"].includes(overlay.template) ? "transparent" : "rgba(8, 12, 14, 0.28)"}}>
    <ScaledCanvas full>
      <Sequence from={-overlay.timelineOffsetFrames} layout="none">
        <OverlayTemplate template={overlay.template} group={overlay.group} spec={overlay.spec} />
      </Sequence>
    </ScaledCanvas>
  </AbsoluteFill>
</Sequence>;

const GeneratedScene = ({scene}: {scene: MgRuntimeScene}) => {
  if (scene.renderMode === "overlay") {
    if (!scene.baseFile) throw new Error(`Overlay scene ${scene.id} is missing baseFile`);
    if (scene.template === "camera") {
      return <AbsoluteFill style={{background: "#111", overflow: "hidden"}}>
        <Sequence from={-scene.timelineOffsetFrames} layout="none">
          <CameraTemplate spec={scene.spec as never} style={scene.group} baseFile={scene.baseFile} />
        </Sequence>
        {scene.overlays.map((overlay) => <Overlay key={`${overlay.instance}-${overlay.fromFrame}`} overlay={overlay} />)}
      </AbsoluteFill>;
    }
    return <AbsoluteFill style={{background: "#111"}}>
      <OffthreadVideo
        src={staticFile(scene.baseFile)}
        muted
        style={{width: "100%", height: "100%", objectFit: "cover"}}
      />
      {scene.overlays.map((overlay) => <Overlay key={`${overlay.instance}-${overlay.fromFrame}`} overlay={overlay} />)}
    </AbsoluteFill>;
  }

  return <AbsoluteFill style={{background: scene.background, overflow: "hidden"}}>
    <ScaledCanvas>
      <Sequence from={-scene.timelineOffsetFrames} layout="none">
        <MainTemplate scene={scene} />
      </Sequence>
    </ScaledCanvas>
    {scene.overlays.map((overlay) => <Overlay key={`${overlay.instance}-${overlay.fromFrame}`} overlay={overlay} />)}
  </AbsoluteFill>;
};

const Root = () => {
  const supplied = getInputProps() as Partial<MgRenderInput>;
  const scene = supplied.scene ?? {
    id: "preview",
    instance: "preview",
    group: "preview",
    template: "raw-overlay",
    renderMode: "overlay",
    durationFrames: 1,
    timelineOffsetFrames: 0,
    background: "#111",
    baseFile: "preview.mp4",
    overlays: [],
  } satisfies MgRuntimeScene;
  const input: MgRenderInput = {
    width: supplied.width ?? 1280,
    height: supplied.height ?? 720,
    fps: supplied.fps ?? 25,
    scene,
  };

  return <Composition
    id="StoryClawMgScene"
    component={GeneratedScene}
    defaultProps={{scene: input.scene}}
    width={input.width}
    height={input.height}
    fps={input.fps}
    durationInFrames={Math.max(1, input.scene.durationFrames)}
  />;
};

registerRoot(Root);
