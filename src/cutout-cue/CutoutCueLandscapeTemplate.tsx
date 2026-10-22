import {CutoutCueTemplate} from "./CutoutCueTemplate";
import type {CutoutCueSpec} from "./schema";

/** 16:9 layout; source preparation, cue times, audio and motion stay shared. */
export const CutoutCueLandscapeTemplate=({spec,group,viewport}:{spec:CutoutCueSpec;group:string;viewport?:{width:number;height:number}})=>
  <CutoutCueTemplate spec={spec} group={group} viewport={viewport} landscapeLayout/>;
