import {createContext,useContext} from "react";
import type {MgRuntimeCompositionNode} from "./runtime";

/** Template-private context derived from existing composition nodes, never an FC parameter. */
export type ChildMediaWindow={start:number;end:number};
export const ChildMediaContext=createContext<readonly ChildMediaWindow[]>([]);
export const useChildMediaWindows=()=>useContext(ChildMediaContext);
export const childMediaWindows=(parent:MgRuntimeCompositionNode,nodes:readonly MgRuntimeCompositionNode[],fps:number):ChildMediaWindow[]=>nodes
 .filter(n=>n.parentNodeId===parent.nodeId&&(Boolean(n.videoPath)||["video-footage","sc-video","sc-longtake"].includes(n.render?.kind??"")))
 .map(n=>({start:(Math.max(parent.startFrame,n.startFrame)-parent.startFrame+(parent.timelineOffsetFrames??0))/fps,end:(Math.min(parent.endFrame,n.endFrame)-parent.startFrame+(parent.timelineOffsetFrames??0))/fps}))
 .filter(w=>w.end>w.start);
