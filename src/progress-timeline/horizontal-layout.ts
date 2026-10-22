import type {ProgressTimelineSpec} from "./types";

const WIDTH = 1920;
const TRACK_LEFT = 250;
const MAX_TRACK_WIDTH = 4300;
const LABEL_SAFE_MARGIN = 180;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const smooth = (value: number) => value * value * (3 - 2 * value);

/** Frame adjacent major dates together, including their labels, for short timelines. */
export const horizontalTimelineLayout = (spec: ProgressTimelineSpec) => {
  const majors = spec.nodes.filter((node) => node.kind === "major");
  const largestGap = majors.slice(1).reduce((gap, node, index) =>
    Math.max(gap, node.progress - majors[index].progress), 0);
  const span = spec.followViewport && largestGap > 0
    ? Math.min(MAX_TRACK_WIDTH - TRACK_LEFT * 2, (WIDTH - LABEL_SAFE_MARGIN * 2) * 100 / largestGap)
    : MAX_TRACK_WIDTH - TRACK_LEFT * 2;
  const trackWidth = TRACK_LEFT * 2 + span;
  const nodeX = (progress: number) => TRACK_LEFT + progress / 100 * span;
  const viewportOffset = (progress: number) => {
    if (!spec.followViewport || majors.length < 2) return 0;
    const nextIndex = majors.findIndex((node) => node.progress >= progress);
    const rightIndex = nextIndex < 0 ? majors.length - 1 : Math.max(1, nextIndex);
    const leftIndex = rightIndex - 1;
    const left = majors[leftIndex];
    const right = majors[rightIndex];
    const pairOffset = (a: number, b: number) => clamp(
      (nodeX(a) + nodeX(b)) / 2 - WIDTH / 2, 0, Math.max(0, trackWidth - WIDTH));
    const previousOffset = leftIndex > 0
      ? pairOffset(majors[leftIndex - 1].progress, left.progress)
      : pairOffset(left.progress, right.progress);
    const nextOffset = pairOffset(left.progress, right.progress);
    const ratio = right.progress === left.progress ? 1
      : clamp((progress - left.progress) / (right.progress - left.progress), 0, 1);
    return previousOffset + (nextOffset - previousOffset) * smooth(ratio);
  };
  return {trackLeft: TRACK_LEFT, trackWidth, nodeX, viewportOffset};
};
