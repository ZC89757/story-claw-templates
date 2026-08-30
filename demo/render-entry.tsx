import {Composition, registerRoot, staticFile} from "remotion";
import progressSpec from "../examples/black-swan-progress.spec.json";
import directedGraphSpecJson from "../examples/black-swan-directed-graph.spec.json";
import nvidiaGraphSpecJson from "../examples/nvidia-directed-graph.spec.json";
import tableSpecJson from "../examples/gemini-gpt-table.spec.json";
import multiSeriesChartSpecJson from "../examples/multi-series-chart.spec.json";
import containmentSpecJson from "../examples/ai-containment.spec.json";
import radialRelationSpecJson from "../examples/abstract-relations.spec.json";
import decompositionSpecJson from "../examples/product-decomposition.spec.json";
import comparisonSpecJson from "../examples/model-api-comparison.spec.json";
import aiCompanyNetworkSpecJson from "../examples/ai-company-network.spec.json";
import {ProgressTimelineTemplate, VerticalProgressTimelineTemplate} from "../src/progress-timeline";
import {assertProgressTimelineSpec} from "../src/progress-timeline/validate";
import {DirectedGraphTemplate, RadialRelationTemplate} from "../src/directed-graph";
import {assertDirectedGraphSpec} from "../src/directed-graph/validate";
import {TimedTableTemplate} from "../src/timed-table";
import {assertTimedTableSpec} from "../src/timed-table/validate";
import {MultiSeriesChartTemplate} from "../src/multi-series-chart";
import {assertMultiSeriesChartSpec} from "../src/multi-series-chart/validate";
import {ContainmentTemplate} from "../src/containment";
import {assertContainmentSpec} from "../src/containment/validate";
import {DecompositionTemplate} from "../src/decomposition";
import {assertDecompositionSpec} from "../src/decomposition/validate";
import {BalanceComparisonTemplate, SideBySideComparisonTemplate} from "../src/weighted-comparison";
import {assertWeightedComparisonSpec} from "../src/weighted-comparison/validate";
import {CollageNetworkTemplate} from "../src/collage-network";
import {assertCollageNetworkSpec} from "../src/collage-network/validate";

const spec = assertProgressTimelineSpec(progressSpec);
const directedGraphSpec = assertDirectedGraphSpec(directedGraphSpecJson);
const nvidiaGraphSpec = assertDirectedGraphSpec(nvidiaGraphSpecJson);
const tableSpec = assertTimedTableSpec(tableSpecJson);
const barChartSpec = assertMultiSeriesChartSpec(multiSeriesChartSpecJson);
const lineChartSpec = assertMultiSeriesChartSpec({...multiSeriesChartSpecJson, chartType: "line"});
const containmentSpec = assertContainmentSpec(containmentSpecJson);
const radialRelationSpec = assertDirectedGraphSpec(radialRelationSpecJson);
const decompositionSpec = assertDecompositionSpec(decompositionSpecJson);
const comparisonSpec = assertWeightedComparisonSpec(comparisonSpecJson);
const aiCompanyNetworkSpec = assertCollageNetworkSpec(aiCompanyNetworkSpecJson);

const Root = () => <>
  <Composition id="ProgressTimelineDemo" component={ProgressTimelineTemplate} defaultProps={{spec, audioSrc: staticFile("progress-narration.mp3")}} width={1920} height={1080} fps={30} durationInFrames={900} />
  <Composition id="VerticalProgressTimelineDemo" component={VerticalProgressTimelineTemplate} defaultProps={{spec, audioSrc: staticFile("progress-narration.mp3")}} width={1920} height={1080} fps={30} durationInFrames={900} />
  <Composition id="DirectedGraphDemo" component={DirectedGraphTemplate} defaultProps={{spec: directedGraphSpec, audioSrc: staticFile("progress-narration.mp3")}} width={1920} height={1080} fps={30} durationInFrames={900} />
  <Composition id="NvidiaDirectedGraphDemo" component={DirectedGraphTemplate} defaultProps={{spec: nvidiaGraphSpec, audioSrc: staticFile("nvidia-graph-narration.mp3")}} width={1920} height={1080} fps={30} durationInFrames={1200} />
  <Composition id="TimedTableDemo" component={TimedTableTemplate} defaultProps={{spec: tableSpec, audioSrc: staticFile("gemini-gpt-table-narration.mp3")}} width={1920} height={1080} fps={30} durationInFrames={1290} />
  <Composition id="MultiSeriesChartDemo" component={MultiSeriesChartTemplate} defaultProps={{spec: barChartSpec, audioSrc: staticFile("multi-series-chart-narration.mp3")}} width={1920} height={1080} fps={30} durationInFrames={930} />
  <Composition id="MultiSeriesLineChartDemo" component={MultiSeriesChartTemplate} defaultProps={{spec: lineChartSpec, audioSrc: staticFile("multi-series-chart-narration.mp3")}} width={1920} height={1080} fps={30} durationInFrames={930} />
  <Composition id="ContainmentDemo" component={ContainmentTemplate} defaultProps={{spec: containmentSpec}} width={1920} height={1080} fps={30} durationInFrames={300} />
  <Composition id="RadialRelationDemo" component={RadialRelationTemplate} defaultProps={{spec: radialRelationSpec}} width={1920} height={1080} fps={30} durationInFrames={300} />
  <Composition id="DecompositionDemo" component={DecompositionTemplate} defaultProps={{spec: decompositionSpec}} width={1920} height={1080} fps={30} durationInFrames={315} />
  <Composition id="BalanceComparisonDemo" component={BalanceComparisonTemplate} defaultProps={{spec: comparisonSpec}} width={1920} height={1080} fps={30} durationInFrames={330} />
  <Composition id="SideComparisonDemo" component={SideBySideComparisonTemplate} defaultProps={{spec: comparisonSpec}} width={1920} height={1080} fps={30} durationInFrames={330} />
  <Composition id="AiCompanyCollageNetworkDemo" component={CollageNetworkTemplate} defaultProps={{spec: aiCompanyNetworkSpec, audioSrc: staticFile("ai-company-network-narration.mp3")}} width={1920} height={1080} fps={30} durationInFrames={1530} />
</>;

registerRoot(Root);
