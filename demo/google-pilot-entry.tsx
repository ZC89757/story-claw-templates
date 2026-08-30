import {ReactNode} from "react";
import {
  AbsoluteFill,
  Composition,
  OffthreadVideo,
  registerRoot,
  Sequence,
  staticFile,
} from "remotion";
import generated from "../examples/google-optimized.generated.json";
import {ProgressTimelineTemplate} from "../src/progress-timeline";
import {TimedTableTemplate} from "../src/timed-table";
import {DirectedGraphTemplate} from "../src/directed-graph";
import {FadeTitleTemplate} from "../src/title";
import {EmphasisTextTemplate} from "../src/emphasis";
import {XYChartTemplate} from "../src/xy-chart";
import {MultiSeriesChartTemplate} from "../src/multi-series-chart";
import {ContainmentTemplate} from "../src/containment";
import {DecompositionTemplate} from "../src/decomposition";
import {BalanceComparisonTemplate, SideBySideComparisonTemplate} from "../src/weighted-comparison";
import {CollageNetworkTemplate} from "../src/collage-network";

type Scene = (typeof generated.scenes)[number];

const SAFE_SCALE = 5 / 9;
const FULL_SCALE = 2 / 3;

const SafeCanvas = ({children}: {children: ReactNode}) => <div style={{
  position: "absolute",
  left: (1280 - 1920 * SAFE_SCALE) / 2,
  top: 0,
  width: 1920,
  height: 1080,
  transform: `scale(${SAFE_SCALE})`,
  transformOrigin: "top left",
}}>{children}</div>;

const FullCanvas = ({children}: {children: ReactNode}) => <div style={{
  position: "absolute",
  left: 0,
  top: 0,
  width: 1920,
  height: 1080,
  transform: `scale(${FULL_SCALE})`,
  transformOrigin: "top left",
}}>{children}</div>;

const Template = ({scene}: {scene: Scene}) => {
  const spec = scene.spec as any;
  switch (scene.template) {
    case "progress-timeline": return <ProgressTimelineTemplate spec={spec} />;
    case "timed-table": return <TimedTableTemplate spec={spec} />;
    case "directed-graph": return <DirectedGraphTemplate spec={spec} />;
    case "title": return <FadeTitleTemplate spec={spec} />;
    case "xy-chart": return <XYChartTemplate spec={spec} />;
    case "multi-series-chart": return <MultiSeriesChartTemplate spec={spec} />;
    case "containment": return <ContainmentTemplate spec={spec} />;
    case "decomposition": return <DecompositionTemplate spec={spec} />;
    case "weighted-comparison": return <BalanceComparisonTemplate spec={spec} />;
    case "side-by-side-comparison": return <SideBySideComparisonTemplate spec={spec} />;
    case "collage-network": return <CollageNetworkTemplate spec={spec} />;
    default: throw new Error(`Unsupported template: ${scene.template}`);
  }
};

const EmphasisOverlay = ({spec}: {spec: unknown}) => <AbsoluteFill style={{background: "rgba(8, 12, 14, 0.28)"}}>
  <FullCanvas><EmphasisTextTemplate spec={spec as any} /></FullCanvas>
</AbsoluteFill>;

const GeneratedScene = ({scene}: {scene: Scene}) => {
  if (scene.renderMode === "overlay") {
    if (!scene.baseFile) throw new Error(`Overlay scene ${scene.id} is missing baseFile`);
    return <AbsoluteFill style={{background: "#111"}}>
      <OffthreadVideo src={staticFile(scene.baseFile)} muted style={{width: "100%", height: "100%", objectFit: "cover"}} />
      <EmphasisOverlay spec={scene.spec} />
    </AbsoluteFill>;
  }

  return <AbsoluteFill style={{background: scene.background, overflow: "hidden"}}>
    <SafeCanvas>
      <Sequence from={-scene.timelineOffsetFrames} layout="none">
        <Template scene={scene} />
      </Sequence>
    </SafeCanvas>
    {scene.overlays.map((overlay) => <Sequence
      key={overlay.group}
      from={overlay.fromFrame}
      durationInFrames={overlay.durationFrames}
      premountFor={Math.min(15, overlay.fromFrame)}
    >
      <EmphasisOverlay spec={overlay.spec} />
    </Sequence>)}
  </AbsoluteFill>;
};

const Root = () => <>
  {generated.scenes.map((scene) => <Composition
    key={scene.compositionId}
    id={scene.compositionId}
    component={GeneratedScene}
    defaultProps={{scene}}
    width={generated.width}
    height={generated.height}
    fps={generated.fps}
    durationInFrames={scene.durationFrames}
  />)}
</>;

registerRoot(Root);
