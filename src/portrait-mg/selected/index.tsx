import type {ComponentType} from "react";
import type {PortraitDemo} from "../common";
import {CalloutObjects, EchoCollapse, InteractionsPanorama, PriorityCardShift, SourcePie, StreakBadge} from "./sequence";
import {CircleRatio, CutoutDiagonalPair, ImageList, OrnateList, PosterComparison, TiltedPhotos, TwoVideoProfiles} from "./cards";
import {ChromaticBreak, DocumentHighlight, PresenterDiagonal, SideTearsObject, TornCircleShatter,
  WindowPercentRoll, YearDataWindows, YearSilhouette} from "./transitions";
import {LayeredOpening} from "./opening";
import {selectedProfiles, selectedVideoWindow} from "./profiles";
import {SelectedFonts, type SceneProps} from "./stage";

const components = {
  V07_001: PosterComparison, V07_002: CircleRatio, V09_001: TiltedPhotos,
  V10_002: ImageList, V10_003: OrnateList, V11_005: TwoVideoProfiles, V18_001: CutoutDiagonalPair,
  V19_002: CalloutObjects, V19_003: PriorityCardShift, V19_004: SourcePie, V20_002: InteractionsPanorama,
  V20_005: EchoCollapse, V21_001: StreakBadge, V21_003: ChromaticBreak, V22_001: WindowPercentRoll,
  V27_001: YearSilhouette, V27_003: YearDataWindows, V28_004: DocumentHighlight, V29_001: TornCircleShatter,
  V30_001: SideTearsObject, V31_001: PresenterDiagonal, opening_layered: LayeredOpening,
} satisfies Record<keyof typeof selectedProfiles, ComponentType<SceneProps>>;

export const selectedRenderers = Object.fromEntries(Object.entries(components).map(([id, Scene]) => [
  id, ({spec}: SceneProps) => <><SelectedFonts/><Scene spec={spec}/></>,
]));

const publicAsset = (file: string) => "portrait-mg/" + file;
const local = (file: string) => publicAsset("selected/" + file);
const [top, mid, bottom] = ["photo-top.png","photo-middle.jpg","photo-bottom.jpg"].map(file => publicAsset("strict-demo/" + file));
const office = publicAsset("batch-c/office-demo.mp4");
const paper = publicAsset("batch-c/documents-demo.mp4");
const city = publicAsset("restored-titles/city-demo.mp4");
const motion = publicAsset("V01_006/preview-background.mp4");
const player = publicAsset("V01_003/portrait.mp4");
const arena = publicAsset("V01_003/arena.mp4");
const speaker = publicAsset("V01_007/speaker.mp4");
const modern = publicAsset("V05_001/modern.mp4");
const playerCut = publicAsset("V04_001/portrait-prepared.png");
const person = publicAsset("V11_001/portrait.png");

const fixtures: Record<keyof typeof selectedProfiles, Record<string,string>> = {
  V07_001: {background:office, poster:local("poster.jpg"), left:local("presenter.jpg"), right:local("interview.jpg")},
  V07_002: {background:city, detail:mid},
  V09_001: {background:mid, top, lower:bottom, center:mid},
  V10_002: {background:office, image1:top,image2:local("dessert.jpg"),image3:mid,image4:bottom},
  V10_003: {background:office},
  V11_005: {background:office,first:local("interview.mp4"),second:speaker},
  V18_001: {background:publicAsset("batch-b/relation-background.mp4"), nextBackground:office, person, upper:player,lower:paper},
  V19_002: {lead:office, background:motion, subject:person,left:local("bottle-left.png"),middle:local("bottle-middle.png"),right:local("bottle-right.png")},
  V19_003: {background:office, first:top,second:local("dessert.jpg"),third:bottom},
  V19_004: {background:speaker},
  V20_002: {upper:local("event.mp4"),lower:local("panorama.mp4")},
  V20_005: {background:local("interview.mp4"),subject:person},
  V21_001: {background:local("road-demo.mp4"),object:local("vehicle.png")},
  V21_003: {background:local("road-demo.mp4"),picture:local("vehicle.jpg")},
  V22_001: {background:city,clip:local("city.jpg"),subject:publicAsset("batch-c/skyline.png")},
  V27_001: {background:city,person,left:mid,right:bottom},
  V27_003: {background:city,upper:speaker,lower:arena},
  V28_004: {background:city,document:publicAsset("strict-demo/report-long.png")},
  V29_001: {background:motion,circle:paper,top:arena,right:speaker,bottom:modern,finalClip:city},
  V30_001: {background:local("cafe.mp4"),side:local("cafe.mp4"),object:local("dessert.png")},
  V31_001: {background:city,presenter:playerCut,backing:office,upper:paper,lower:player,focus:office},
  opening_layered: {background:publicAsset("layered-opening/capitol.mp4"), first:publicAsset("layered-opening/us-politics.mp4"), second:publicAsset("layered-opening/ai-servers.mp4")},
};

function makeDemo(id: keyof typeof selectedProfiles): PortraitDemo {
  const profile = selectedProfiles[id];
  const {duration} = profile;
  const spec: Record<string, {at?:number; text?:string | number; source?:string; sourceStart?:number | null; sourceEnd?:number}> = Object.fromEntries(Object.entries(profile.slots).map(([key, slot]) => {
    const timing = slot.at === undefined ? {} : {at:slot.at};
    if (slot.type === "cue") return [key,timing];
    if (slot.type === "text") return [key,{...timing,text:slot.demo}];
    const source = fixtures[id][key];
    if (!source) throw new Error("Missing selected preview asset " + id + "." + key);
    return [key,{...timing,source,sourceStart:slot.type === "video" ? 0 : null}];
  }));
  for (const [key,slot] of Object.entries(profile.slots)) {
    if (slot.type === "video") {
      const interval = selectedVideoWindow(id,key,spec,0,duration);
      spec[key].sourceEnd=interval.end-interval.start;
    }
  }
  return {
    spec: {...spec, _duration: duration, ...(id==="V28_004" ? {target:{x:.16,y:.225,width:.225,height:.008}} : {})},
    durationInFrames: Math.round(duration*30),
    fps:30,
    reference:"D:/MG_Reference_Library/creators/eshuocaijing/effects/"+id+"/reference.mp4",
    referenceStart:0,
  };
}

export const selectedDemos = Object.fromEntries(
  (Object.keys(components) as (keyof typeof selectedProfiles)[]).map(id=>[id,makeDemo(id)]),
);
