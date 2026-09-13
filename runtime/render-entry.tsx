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
import {NewsFlashbackTemplate} from "../src/news-flashback";
import {XYChartTemplate} from "../src/xy-chart";
import {MultiSeriesChartTemplate} from "../src/multi-series-chart";
import {ContainmentTemplate} from "../src/containment";
import {DecompositionTemplate} from "../src/decomposition";
import {BalanceComparisonTemplate, SideBySideComparisonTemplate} from "../src/weighted-comparison";
import {CollageNetworkTemplate} from "../src/collage-network";
import {ImageStackTemplate} from "../src/image-stack";
import {ImageGridTemplate} from "../src/image-grid";
import {NewsReportTemplate} from "../src/news-report";
import {EraShiftTemplate} from "../src/era-shift";
import {RouteShiftTemplate} from "../src/route-shift";
import {ShowcaseTemplate} from "../src/showcase";
import {MetricTemplate} from "../src/metric";
import {TransitionTemplate} from "../src/transition";
import {RhythmTemplate} from "../src/rhythm";
import {EffectTemplate} from "../src/effect";
import {ScLongtakeTemplate} from "../src/sc-longtake";
import {VideoFootageTemplate} from "../src/video-footage/VideoFootageTemplate";
import type {
  MgRenderInput,
  MgRuntimeCompositionNode,
  MgRuntimeEpisodeInput,
  MgRuntimeLayer,
  MgRuntimeLayerPlacement,
  MgRuntimeScene,
} from "../src/runtime";

const ScaledCanvas = ({children, full = false}: {children: ReactNode; full?: boolean}) => {
  const {width, height} = useVideoConfig();
  const fit = Math.min(width / 1920, height / 1080);
  const scale = fit * (full ? 1 : width >= height ? 0.86 : 0.96);
  return <div style={{
    position: "absolute", left: (width - 1920 * scale) / 2, top: (height - 1080 * scale) / 2,
    width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: "top left",
  }}>{children}</div>;
};

/** This switch stays inside the template package. The host only sends kind. */
const RuntimeTemplate = ({layer, durationInFrames}: {
  layer: MgRuntimeLayer;
  durationInFrames: number;
}) => {
  const spec = layer.spec as never;
  switch (layer.kind) {
    case "progress-timeline": return layer.group === "vertical" ? <VerticalProgressTimelineTemplate spec={spec} /> : <ProgressTimelineTemplate spec={spec} />;
    case "timed-table": return <TimedTableTemplate spec={spec} />;
    case "directed-graph": return layer.group === "radial" ? <RadialRelationTemplate spec={spec} /> : <DirectedGraphTemplate spec={spec} />;
    case "xy-chart": return <XYChartTemplate spec={spec} />;
    case "multi-series-chart": return <MultiSeriesChartTemplate spec={spec} group={layer.group as "bar" | "line"} />;
    case "containment": return <ContainmentTemplate spec={spec} />;
    case "decomposition": return <DecompositionTemplate spec={spec} />;
    case "weighted-comparison": return <BalanceComparisonTemplate spec={spec} />;
    case "side-by-side-comparison": return <SideBySideComparisonTemplate spec={spec} />;
    case "collage-network": return <CollageNetworkTemplate spec={spec} />;
    case "image-stack": return <ImageStackTemplate spec={spec} />;
    case "image-grid": return <ImageGridTemplate spec={spec} />;
    case "news-report": return <NewsReportTemplate spec={spec} />;
    case "era-shift": return <EraShiftTemplate spec={spec} />;
    case "route-shift": return <RouteShiftTemplate spec={spec} />;
    case "showcase": return <ShowcaseTemplate spec={spec} style={layer.group} />;
    case "metric": return <MetricTemplate spec={spec} style={layer.group} />;
    case "transition": return <TransitionTemplate spec={spec} style={layer.group} />;
    case "rhythm": return <RhythmTemplate spec={spec} style={layer.group} />;
    case "effect": return <EffectTemplate spec={spec} style={layer.group} />;
    case "sc-longtake": return <ScLongtakeTemplate spec={spec} />;
    case "video-footage": return <VideoFootageTemplate spec={spec} durationInFrames={durationInFrames} />;
    case "title": {
      if (layer.group === "blur-slide") return <BlurSlideTitleTemplate spec={spec} />;
      if (layer.group === "scramble") return <ScrambleTitleTemplate spec={spec} />;
      if (layer.group === "split-flap") return <SplitFlapTitleTemplate spec={spec} />;
      if (layer.group === "slide") return <SlideTitleTemplate spec={spec} />;
      if (layer.group === "typewriter") return <TypewriterTitleTemplate spec={spec} />;
      if (layer.group === "random-reveal") return <RandomRevealTitleTemplate spec={spec} />;
      if (["fade", "slide", "typewriter", "random-reveal", "blur-slide", "scramble", "split-flap"].includes(layer.group)) return <FadeTitleTemplate spec={spec} />;
      return <ShotcraftTitleTemplate spec={spec} style={layer.group} transparentBackground />;
    }
    case "emphasis": return <EmphasisTextTemplate spec={spec} />;
    case "news-flashback": return <NewsFlashbackTemplate spec={spec} />;
    default: throw new Error(`Unsupported template runtime kind: ${layer.kind}`);
  }
};

const RuntimeLayerCanvas = ({layer, timelineOffsetFrames, durationInFrames}: {
  layer: MgRuntimeLayer;
  timelineOffsetFrames: number;
  durationInFrames: number;
}) => {
  const content = <Sequence from={-timelineOffsetFrames} layout="none">
    <RuntimeTemplate layer={layer} durationInFrames={durationInFrames} />
  </Sequence>;
  if (layer.kind === "video-footage") return content;
  return <ScaledCanvas full={layer.canvas === "full"}>{content}</ScaledCanvas>;
};

const Layer = ({layer}: {layer: MgRuntimeLayerPlacement}) => <Sequence
  from={layer.startFrame}
  durationInFrames={layer.durationFrames}
  premountFor={Math.min(15, layer.startFrame)}
>
  <AbsoluteFill style={{
    background: layer.render.layerRole === "scene" ? layer.render.background : layer.render.overlayBackdrop ?? "transparent",
    overflow: "hidden",
    pointerEvents: "none",
  }}>
    <RuntimeLayerCanvas
      layer={layer.render}
      timelineOffsetFrames={layer.timelineOffsetFrames}
      durationInFrames={layer.durationFrames}
    />
  </AbsoluteFill>
</Sequence>;

const CompositionVideo = ({videoPath, muted = false, transparent = false}: {
  videoPath: string;
  muted?: boolean;
  transparent?: boolean;
}) => <OffthreadVideo
  src={staticFile(videoPath)}
  muted={muted}
  transparent={transparent}
  style={{width: "100%", height: "100%", objectFit: "cover"}}
/>;

const isTransparentVideo = (node: MgRuntimeCompositionNode): boolean =>
  node.layerRole === "overlay" || /\.mov(?:$|[?#])/i.test(node.videoPath);

const NodeContent = ({node, durationInFrames}: {node: MgRuntimeCompositionNode; durationInFrames: number}) => {
  const timelineOffsetFrames = node.timelineOffsetFrames ?? 0;
  if (node.videoPath) {
    return <CompositionVideo videoPath={node.videoPath} transparent={isTransparentVideo(node)} />;
  }
  if (!node.render) return null;
  return <AbsoluteFill style={{
    background: node.render.layerRole === "scene" ? node.render.background : node.render.overlayBackdrop ?? "transparent",
    overflow: "hidden",
    pointerEvents: "none",
  }}>
    <RuntimeLayerCanvas
      layer={node.render}
      timelineOffsetFrames={timelineOffsetFrames}
      durationInFrames={durationInFrames}
    />
  </AbsoluteFill>;
};

const Node = ({node}: {node: MgRuntimeCompositionNode}) => {
  const durationInFrames = Math.max(1, node.endFrame - node.startFrame);
  const activeWindows = node.activeWindows?.map((window) => ({
    startFrame: Math.max(0, Math.min(durationInFrames, Math.trunc(window.startFrame))),
    endFrame: Math.max(0, Math.min(durationInFrames, Math.trunc(window.endFrame))),
  })).filter((window) => window.endFrame > window.startFrame);
  const content = activeWindows?.length
    ? activeWindows.map((window, index) => <Sequence
      key={`${node.nodeId}-active-${index}`}
      from={window.startFrame}
      durationInFrames={window.endFrame - window.startFrame}
      layout="none"
    >
      <Sequence from={-window.startFrame} layout="none">
        <NodeContent node={node} durationInFrames={durationInFrames} />
      </Sequence>
    </Sequence>)
    : activeWindows
      ? null
      : <NodeContent node={node} durationInFrames={durationInFrames} />;
  return <Sequence
    from={node.startFrame}
    durationInFrames={durationInFrames}
    premountFor={Math.min(15, node.startFrame)}
    style={{zIndex: node.zIndex}}
  >
    <AbsoluteFill style={{overflow: "hidden", pointerEvents: "none"}}>
      {content}
    </AbsoluteFill>
  </Sequence>;
};

const stableNodes = (nodes: readonly MgRuntimeCompositionNode[]): MgRuntimeCompositionNode[] =>
  nodes
    .map((node, index) => ({node, index}))
    .filter(({node}) => node.endFrame > node.startFrame)
    .sort((left, right) => left.node.zIndex - right.node.zIndex || left.index - right.index)
    .map(({node}) => node);

/** One composition owns every video node and template layer. */
const EpisodeComposition = ({episode}: {episode: MgRuntimeEpisodeInput}) => {
  const nodes = stableNodes(episode.nodes ?? []);
  return <AbsoluteFill style={{
    background: episode.transparentBackground ? "transparent" : "#000",
    overflow: "hidden",
  }}>
    {episode.baseFile ? <CompositionVideo videoPath={episode.baseFile} muted /> : null}
    {(episode.layers ?? []).map((layer) => <Layer key={layer.id} layer={layer} />)}
    {nodes.map((node) => <Node key={node.nodeId} node={node} />)}
  </AbsoluteFill>;
};

/* Retained for any standalone template-package consumer using the old scene prop. */
const LegacyScene = ({scene}: {scene: MgRuntimeScene}) => <AbsoluteFill style={{background: scene.background}} />;

const Root = () => {
  const supplied = getInputProps() as Partial<MgRuntimeEpisodeInput & MgRenderInput> & {episode?: Partial<MgRuntimeEpisodeInput>};
  const sourceEpisode = supplied.episode ?? (
    Array.isArray(supplied.layers) || Array.isArray(supplied.nodes) || supplied.baseFile
      ? supplied
      : undefined
  );
  const episode = sourceEpisode ? {
    width: sourceEpisode.width ?? 1280,
    height: sourceEpisode.height ?? 720,
    fps: sourceEpisode.fps ?? 25,
    durationFrames: sourceEpisode.durationFrames ?? 1,
    ...(sourceEpisode.baseFile ? {baseFile: sourceEpisode.baseFile} : {}),
    layers: sourceEpisode.layers ?? [],
    nodes: sourceEpisode.nodes ?? [],
    transparentBackground: sourceEpisode.transparentBackground ?? false,
  } satisfies MgRuntimeEpisodeInput : undefined;
  const legacyScene = supplied.scene;
  return <>
    <Composition
      id="StoryClawMgEpisode"
      component={EpisodeComposition}
      defaultProps={{episode: episode ?? {width: 1280, height: 720, fps: 25, durationFrames: 1, layers: [], nodes: []}}}
      width={episode?.width ?? 1280}
      height={episode?.height ?? 720}
      fps={episode?.fps ?? 25}
      durationInFrames={Math.max(1, episode?.durationFrames ?? 1)}
      calculateMetadata={({props}) => ({
        width: props.episode.width,
        height: props.episode.height,
        fps: props.episode.fps,
        durationInFrames: Math.max(1, props.episode.durationFrames),
      })}
    />
    <Composition
      id="StoryClawMgScene"
      component={LegacyScene}
      defaultProps={{scene: legacyScene ?? {id: "legacy", instance: "legacy", group: "legacy", template: "raw-overlay", renderMode: "overlay", durationFrames: 1, timelineOffsetFrames: 0, background: "#111", overlays: []}}}
      width={supplied.width ?? 1280}
      height={supplied.height ?? 720}
      fps={supplied.fps ?? 25}
      durationInFrames={Math.max(1, legacyScene?.durationFrames ?? 1)}
    />
  </>;
};

registerRoot(Root);
