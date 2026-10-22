import {useMemo, type ReactNode} from "react";
import {
  AbsoluteFill,
  Composition,
  getInputProps,
  OffthreadVideo,
  registerRoot,
  Sequence,
  staticFile,
  useVideoConfig,
  useCurrentFrame,
} from "remotion";
import {RouteMapTemplate} from "../src/route-map";
import {ArchiveRailTemplate,ProgressTimelineTemplate, VerticalProgressTimelineTemplate, TimelineWindowTemplate} from "../src/progress-timeline";
import {CanvasTemplate} from "../src/mg-canvas";
import {PartWholeTemplate} from "../src/part-whole-chart";
import {DualAxisTemplate} from "../src/dual-axis-chart";
import {ArgumentTemplate} from "../src/mg-argument";
import {ImageComparisonTemplate} from "../src/image-side-by-side";
import {ImageGraphTemplate} from "../src/image-directed-graph";
import {TimedTableTemplate} from "../src/timed-table";
import {ProductionChainTemplate,DirectedGraphTemplate, RadialRelationTemplate} from "../src/directed-graph";
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
import {BrushShadowText, EmphasisTextTemplate} from "../src/emphasis";
import {NewsFlashbackTemplate} from "../src/news-flashback";
import {XYChartTemplate} from "../src/xy-chart";
import {MultiSeriesChartTemplate} from "../src/multi-series-chart";
import {ContainmentTemplate} from "../src/containment";
import {DecompositionTemplate} from "../src/decomposition";
import {EditorialScaleTemplate,BalanceComparisonTemplate, SideBySideComparisonTemplate} from "../src/weighted-comparison";
import {CollageNetworkTemplate} from "../src/collage-network";
import {ImageStackTemplate} from "../src/image-stack";
import {ImageGridTemplate} from "../src/image-grid";
import {NewsReportTemplate} from "../src/news-report";
import {WebNewsFocusTemplate} from "../src/web-news-focus";
import {WebPageFocusTemplate} from "../src/web-page-focus";
import {EraShiftTemplate} from "../src/era-shift";
import {RouteShiftTemplate} from "../src/route-shift";
import {ShowcaseTemplate} from "../src/showcase";
import {MetricTemplate} from "../src/metric";
import {TransitionTemplate} from "../src/transition";
import {RhythmTemplate} from "../src/rhythm";
import {EffectTemplate} from "../src/effect";
import {ScLongtakeTemplate} from "../src/sc-longtake";
import {VideoFootageTemplate} from "../src/video-footage/VideoFootageTemplate";
import {AiHotOpeningTemplate} from "../src/ai-hot-opening";
import {AiHotFocusStageTemplate} from "../src/ai-hot-focus-stage";
import {MgCutoutTemplate} from "../src/mg-cutout";
import {CutoutCueTemplate,CutoutCueLandscapeTemplate} from "../src/cutout-cue";
import {ImagePlateTemplate,ImagePlateLandscapeTemplate} from "../src/image-plate";
import {SpeakerQuoteTemplate,SpeakerQuoteLandscapeTemplate} from "../src/speaker-quote";
import {SubjectExpansionTemplate} from "../src/subject-expansion";
import type {
  MgCompositionBounds,
  MgRenderInput,
  MgRuntimeCompositionNode,
  MgRuntimeEpisodeInput,
  MgRuntimeLayer,
  MgRuntimeLayerPlacement,
  MgRuntimeScene,
} from "../src/runtime";
import {findInheritedCompositionBounds} from "../src/composition-layout";
import {ChildMediaContext,childMediaWindows,type ChildMediaWindow} from "../src/composition-media-context";
import {archiveVideoAmount} from "../src/progress-timeline/ArchiveRailTemplate";

const ScaledCanvas = ({children, full = false, viewport}: {children: ReactNode; full?: boolean; viewport?: {width: number; height: number}}) => {
  const config = useVideoConfig();
  const {width, height} = viewport ?? config;
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
    case "image-plate": return layer.group==="company-landscape"?<ImagePlateLandscapeTemplate spec={spec}/>:<ImagePlateTemplate spec={spec} />;
    case "cutout-cue": return layer.group.endsWith("-landscape")?<CutoutCueLandscapeTemplate spec={spec} group={layer.group}/>:<CutoutCueTemplate spec={spec} group={layer.group} />;
    case "speaker-quote": return layer.group==="landscape"?<SpeakerQuoteLandscapeTemplate spec={spec}/>:<SpeakerQuoteTemplate spec={spec} />;
    case "mg-canvas": return <CanvasTemplate spec={spec} group={layer.group} />;
    case "part-whole-chart": return <PartWholeTemplate spec={spec} />;
    case "dual-axis-chart": return <DualAxisTemplate spec={spec} group={layer.group} />;
    case "mg-argument": return <ArgumentTemplate spec={spec} />;
    case "image-side-by-side": return <ImageComparisonTemplate spec={spec} group={layer.group} />;
    case "image-directed-graph": return <ImageGraphTemplate spec={spec} group={layer.group} />;
    case "route-map": return <RouteMapTemplate spec={spec} />;
    case "progress-timeline": return layer.group === "archive-rail" ? <ArchiveRailTemplate spec={spec} /> : layer.group === "content-window" ? <TimelineWindowTemplate spec={spec} /> : layer.group === "vertical" ? <VerticalProgressTimelineTemplate spec={spec} /> : <ProgressTimelineTemplate spec={spec} />;
    case "timed-table": return <TimedTableTemplate spec={spec} />;
    case "directed-graph": return layer.group === "production-chain" ? <ProductionChainTemplate spec={spec} /> : layer.group === "radial" ? <RadialRelationTemplate spec={spec} /> : <DirectedGraphTemplate spec={spec} />;
    case "xy-chart": return <XYChartTemplate spec={spec} />;
    case "multi-series-chart": return <MultiSeriesChartTemplate spec={spec} group={layer.group as "bar" | "line"} />;
    case "containment": return <ContainmentTemplate spec={spec} />;
    case "decomposition": return <DecompositionTemplate spec={spec} />;
    case "weighted-comparison": return <BalanceComparisonTemplate spec={spec} />;
    case "side-by-side-comparison": return layer.group === "editorial-scale" ? <EditorialScaleTemplate spec={spec} /> : <SideBySideComparisonTemplate spec={spec} />;
    case "collage-network": return <CollageNetworkTemplate spec={spec} />;
    case "image-stack": return <ImageStackTemplate spec={spec} group={layer.group} />;
    case "image-grid": return <ImageGridTemplate spec={spec} />;
    case "news-report": return <NewsReportTemplate spec={spec} />;
    case "web-news-focus": return <WebNewsFocusTemplate spec={spec} />;
    case "web-page-focus": return <WebPageFocusTemplate spec={spec} />;
    case "era-shift": return <EraShiftTemplate spec={spec} />;
    case "route-shift": return <RouteShiftTemplate spec={spec} />;
    case "showcase": return <ShowcaseTemplate spec={spec} style={layer.group} />;
    case "metric": return <MetricTemplate spec={spec} style={layer.group} />;
    case "transition": return <TransitionTemplate spec={spec} style={layer.group} />;
    case "rhythm": return <RhythmTemplate spec={spec} style={layer.group} />;
    case "effect": return <EffectTemplate spec={spec} style={layer.group} />;
    case "sc-longtake": return <ScLongtakeTemplate spec={spec} />;
    case "video-footage": return <VideoFootageTemplate spec={spec} durationInFrames={durationInFrames} />;
    case "ai-hot-opening": return <AiHotOpeningTemplate spec={spec} />;
    case "ai-hot-focus-stage": return <AiHotFocusStageTemplate spec={spec} />;
    case "mg-cutout": return <MgCutoutTemplate spec={spec} />;
    case "subject-expansion": return <SubjectExpansionTemplate spec={spec} group={layer.group as "progressive" | "impact"} />;
    case "title": {
      if (layer.group === "brush-shadow") return <BrushShadowText spec={spec} description />;
      if (layer.group === "blur-slide") return <BlurSlideTitleTemplate spec={spec} />;
      if (layer.group === "scramble") return <ScrambleTitleTemplate spec={spec} />;
      if (layer.group === "split-flap") return <SplitFlapTitleTemplate spec={spec} />;
      if (layer.group === "slide") return <SlideTitleTemplate spec={spec} />;
      if (layer.group === "typewriter") return <TypewriterTitleTemplate spec={spec} />;
      if (layer.group === "random-reveal") return <RandomRevealTitleTemplate spec={spec} />;
      if (["fade", "slide", "typewriter", "random-reveal", "blur-slide", "scramble", "split-flap"].includes(layer.group)) return <FadeTitleTemplate spec={spec} />;
      return <ShotcraftTitleTemplate spec={spec} style={layer.group} transparentBackground />;
    }
    case "emphasis": return <EmphasisTextTemplate spec={spec} group={layer.group} />;
    case "news-flashback": return <NewsFlashbackTemplate spec={spec} />;
    default: throw new Error(`Unsupported template runtime kind: ${layer.kind}`);
  }
};

const RuntimeLayerCanvas = ({layer, timelineOffsetFrames, durationInFrames, viewport}: {
  layer: MgRuntimeLayer;
  timelineOffsetFrames: number;
  durationInFrames: number;
  viewport?: {width: number; height: number};
}) => {
  const content = <Sequence from={-timelineOffsetFrames} layout="none">
    <RuntimeTemplate layer={layer} durationInFrames={durationInFrames} />
  </Sequence>;
  if (["video-footage", "image-plate", "cutout-cue", "speaker-quote"].includes(layer.kind)) return content;
  return <ScaledCanvas full={layer.canvas === "full"} viewport={viewport}>{content}</ScaledCanvas>;
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

const CompositionVideo = ({videoPath, muted = false, transparent = false, fit = "cover"}: {
  videoPath: string;
  muted?: boolean;
  transparent?: boolean;
  fit?: "contain" | "cover";
}) => <OffthreadVideo
  src={staticFile(videoPath)}
  muted={muted}
  transparent={transparent}
  style={{width: "100%", height: "100%", objectFit: fit}}
/>;

const isTransparentVideo = (node: MgRuntimeCompositionNode): boolean =>
  node.layerRole === "overlay" || /\.mov(?:$|[?#])/i.test(node.videoPath);

type LocalFrameWindow = {startFrame: number; endFrame: number};

const normalizeWindows = (windows: readonly LocalFrameWindow[] | undefined, durationInFrames: number): LocalFrameWindow[] | undefined => {
  if (!windows) return undefined;
  return windows.map((window) => ({
    startFrame: Math.max(0, Math.min(durationInFrames, Math.trunc(window.startFrame))),
    endFrame: Math.max(0, Math.min(durationInFrames, Math.trunc(window.endFrame))),
  })).filter((window) => window.endFrame > window.startFrame);
};

const CompositionVisibility = ({windows, children}: {
  windows?: readonly LocalFrameWindow[];
  children: ReactNode;
}) => {
  const frame = useCurrentFrame();
  const visible = !windows || windows.some((window) => frame >= window.startFrame && frame < window.endFrame);
  return <div style={{
    position: "absolute",
    inset: 0,
    opacity: visible ? 1 : 0,
    pointerEvents: "none",
  }}>{children}</div>;
};

const NodeContent = ({node, durationInFrames, bounds, archiveChild=false}: {
  node: MgRuntimeCompositionNode;
  durationInFrames: number;
  bounds?: MgCompositionBounds;
  archiveChild?: boolean;
}) => {
  const {width, height,fps} = useVideoConfig();
  const localFrame=useCurrentFrame();
  const reveal=archiveChild?archiveVideoAmount(localFrame/fps,{start:0,end:durationInFrames/fps}):1;
  const timelineOffsetFrames = node.timelineOffsetFrames ?? 0;
  const content = node.videoPath
    ? <CompositionVideo
      videoPath={node.videoPath}
      transparent={isTransparentVideo(node)}
      fit={bounds ? "contain" : "cover"}
    />
    : node.render
      ? <AbsoluteFill style={{
        background: node.render.layerRole === "scene" ? node.render.background : node.render.overlayBackdrop ?? "transparent",
        overflow: "hidden",
        pointerEvents: "none",
      }}>
        <RuntimeLayerCanvas
          layer={node.render}
          timelineOffsetFrames={timelineOffsetFrames}
          durationInFrames={durationInFrames}
          viewport={bounds ? {width: width * bounds.width, height: height * bounds.height} : undefined}
        />
      </AbsoluteFill>
      : null;

  if (!content || !bounds) return content;
  return <div style={{
    position: "absolute",
    left: `${bounds.x * 100}%`,
    top: `${bounds.y * 100}%`,
    width: `${bounds.width * 100}%`,
    height: `${bounds.height * 100}%`,
    overflow: "hidden",
    pointerEvents: "none",
    opacity:reveal,
    clipPath:archiveChild?`inset(0 0 0 ${(1-reveal)*100}% round 12px)`:undefined,
  }}>{content}</div>;
};

const Node = ({node, bounds,mediaWindows=[],archiveChild=false}: {
  node: MgRuntimeCompositionNode;
  bounds?: MgCompositionBounds;
  mediaWindows?:readonly ChildMediaWindow[];
  archiveChild?:boolean;
}) => {
  const durationInFrames = Math.max(1, node.endFrame - node.startFrame);
  const rawActiveWindows = normalizeWindows(node.activeWindows, durationInFrames);
  const compositionWindows = normalizeWindows(node.compositionWindows, durationInFrames);
  const content = rawActiveWindows?.length
    ? rawActiveWindows.map((window, index) => <Sequence
      key={`${node.nodeId}-active-${index}`}
      from={window.startFrame}
      durationInFrames={window.endFrame - window.startFrame}
      layout="none"
    >
      <Sequence from={-window.startFrame} layout="none">
        <NodeContent node={node} durationInFrames={durationInFrames} bounds={bounds} archiveChild={archiveChild}/>
      </Sequence>
    </Sequence>)
    : rawActiveWindows
      ? null
      : <NodeContent node={node} durationInFrames={durationInFrames} bounds={bounds} archiveChild={archiveChild}/>;
  return <Sequence
    from={node.startFrame}
    durationInFrames={durationInFrames}
    premountFor={Math.min(15, node.startFrame)}
    style={{zIndex: node.zIndex}}
  >
    <AbsoluteFill style={{overflow: "hidden", pointerEvents: "none"}}>
      <ChildMediaContext.Provider value={mediaWindows}><CompositionVisibility windows={compositionWindows}>{content}</CompositionVisibility></ChildMediaContext.Provider>
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
  const placedNodes = useMemo(() => {
    const nodes = stableNodes(episode.nodes ?? []);
    const nodesById = new Map<string, MgRuntimeCompositionNode>(
      nodes.map((node): [string, MgRuntimeCompositionNode] => [node.nodeId, node]),
    );
    if (nodesById.size !== nodes.length) throw new Error("MG 合成节点 nodeId 重复");
    return nodes.map((node) => ({node, bounds: findInheritedCompositionBounds(node, nodesById),mediaWindows:childMediaWindows(node,nodes,episode.fps),archiveChild:nodesById.get(node.parentNodeId??"")?.group==="archive-rail"||node.parentNodeId?.startsWith("progress-timeline::archive-rail::")}));
  }, [episode.nodes,episode.fps]);
  return <AbsoluteFill style={{
    background: episode.transparentBackground ? "transparent" : "#000",
    overflow: "hidden",
  }}>
    {episode.baseFile ? <CompositionVideo videoPath={episode.baseFile} muted /> : null}
    {(episode.layers ?? []).map((layer) => <Layer key={layer.id} layer={layer} />)}
    {placedNodes.map(({node, bounds,mediaWindows,archiveChild}) => <Node
      key={node.nodeId}
      node={node}
      bounds={bounds}
      mediaWindows={mediaWindows}
      archiveChild={archiveChild}
    />)}
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
