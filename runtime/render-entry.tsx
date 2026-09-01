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
import type {MgRenderInput, MgRuntimeEpisodeInput, MgRuntimeLayer, MgRuntimeLayerPlacement, MgRuntimeScene} from "../src/runtime";

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
const RuntimeTemplate = ({layer, baseFile, baseTrimBeforeFrames}: {
  layer: MgRuntimeLayer;
  baseFile?: string;
  baseTrimBeforeFrames: number;
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
    case "showcase": return <ShowcaseTemplate spec={spec} style={layer.group} />;
    case "metric": return <MetricTemplate spec={spec} style={layer.group} />;
    case "transition": return <TransitionTemplate spec={spec} style={layer.group} />;
    case "rhythm": return <RhythmTemplate spec={spec} style={layer.group} />;
    case "effect": return <EffectTemplate spec={spec} style={layer.group} />;
    case "camera": return <CameraTemplate spec={spec} style={layer.group} baseFile={baseFile} baseTrimBeforeFrames={baseTrimBeforeFrames} />;
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
    default: throw new Error(`Unsupported template runtime kind: ${layer.kind}`);
  }
};

const Layer = ({layer, baseFile}: {layer: MgRuntimeLayerPlacement; baseFile: string}) => <Sequence
  from={layer.startFrame}
  durationInFrames={layer.durationFrames}
  premountFor={Math.min(15, layer.startFrame)}
>
  <AbsoluteFill style={{
    background: layer.render.layerRole === "scene" ? layer.render.background : layer.render.overlayBackdrop ?? "transparent",
    overflow: "hidden",
    pointerEvents: "none",
  }}>
    <ScaledCanvas full={layer.render.canvas === "full"}>
      <Sequence from={-layer.timelineOffsetFrames} layout="none">
        <RuntimeTemplate
          layer={layer.render}
          // Runtime-specific components decide whether they consume the raw
          // plate. Story Claw only transports this opaque Provider payload.
          baseFile={baseFile}
          // For a split window, startFrame - timelineOffsetFrames is the
          // instance-root source frame. Camera consumes it; other templates
          // simply ignore the value.
          baseTrimBeforeFrames={layer.startFrame - layer.timelineOffsetFrames}
        />
      </Sequence>
    </ScaledCanvas>
  </AbsoluteFill>
</Sequence>;

/**
 * One composition owns the raw master and every MG layer. Overlay placements
 * never become H.264 intermediates, so their CSS transparency is real.
 */
const EpisodeComposition = ({episode}: {episode: MgRuntimeEpisodeInput}) => <AbsoluteFill style={{background: "#000", overflow: "hidden"}}>
  <OffthreadVideo src={staticFile(episode.baseFile)} muted style={{width: "100%", height: "100%", objectFit: "cover"}} />
  {episode.layers.map((layer) => <Layer key={layer.id} layer={layer} baseFile={episode.baseFile} />)}
</AbsoluteFill>;

/* Retained for any standalone template-package consumer using the old scene prop. */
const LegacyScene = ({scene}: {scene: MgRuntimeScene}) => <AbsoluteFill style={{background: scene.background}} />;

const Root = () => {
  const supplied = getInputProps() as Partial<MgRuntimeEpisodeInput & MgRenderInput> & {episode?: Partial<MgRuntimeEpisodeInput>};
  const sourceEpisode = supplied.episode ?? (Array.isArray(supplied.layers) ? supplied : undefined);
  const episode = sourceEpisode ? {
    width: sourceEpisode.width ?? 1280,
    height: sourceEpisode.height ?? 720,
    fps: sourceEpisode.fps ?? 25,
    durationFrames: sourceEpisode.durationFrames ?? 1,
    baseFile: sourceEpisode.baseFile ?? "base/raw-master.mp4",
    layers: sourceEpisode.layers ?? [],
  } satisfies MgRuntimeEpisodeInput : undefined;
  const legacyScene = supplied.scene;
  return <>
    <Composition
      id="StoryClawMgEpisode"
      component={EpisodeComposition}
      defaultProps={{episode: episode ?? {width: 1280, height: 720, fps: 25, durationFrames: 1, baseFile: "base/raw-master.mp4", layers: []}}}
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
