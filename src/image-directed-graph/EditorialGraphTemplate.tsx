import dagre from "@dagrejs/dagre";
import {useMemo} from "react";
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import type {ImageGraphSpec} from "./schema";

const ease = (n: number) => {const p = Math.max(0, Math.min(1, n)); return p * p * (3 - 2 * p);};
const url = (s: string) => /^(https?:|data:)/.test(s) ? s : staticFile(s.replace(/^public[\\/]/, ""));
const editorialGraphStructure = (spec: ImageGraphSpec) => {
  const degree = Math.max(0, ...spec.nodes.flatMap(n => [spec.edges.filter(e => e.from === n.id).length, spec.edges.filter(e => e.to === n.id).length]));
  const overview = !spec.edges.length || degree >= 3 || (degree >= 2 && spec.nodes.length >= 4);
  return {overview, height: overview ? 320 : 420, star: degree >= 3 && spec.nodes.length === degree + 1};
};
export const editorialGraphLayout = (spec: ImageGraphSpec) => {
  const {height, overview, star} = editorialGraphStructure(spec);
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({rankdir: star ? "TB" : "LR", ranksep: star ? 120 : 230, nodesep: overview ? 70 : 140, marginx: 90, marginy: 90});
  graph.setDefaultEdgeLabel(() => ({}));
  spec.nodes.forEach(n => graph.setNode(n.id, {width: 360, height}));
  spec.edges.forEach(e => graph.setEdge(e.from, e.to, {width: 200, height: 55}));
  dagre.layout(graph);
  if (!spec.edges.length) {
    spec.nodes.forEach((n, i) => Object.assign(graph.node(n.id), {x: 270 + i * 490, y: 300}));
    Object.assign(graph.graph(), {width: 540 + Math.max(0, spec.nodes.length - 1) * 490, height: 600});
  }
  return graph;
};

/** Branches retain all introduced contributors; long chains follow their latest three nodes. */
export const editorialGraphCamera = (spec: ImageGraphSpec, graph: dagre.graphlib.Graph, seconds: number) => {
  const {overview, height} = editorialGraphStructure(spec);
  const events = [...new Set([0, ...spec.nodes.map(n => n.at)])].sort((a,b) => a-b);
  const box = (at: number) => {
    const introduced = spec.nodes.filter(n => n.at <= at + .001);
    const shown = overview ? introduced : introduced.slice(-3);
    const nodes = (shown.length ? shown : spec.nodes.slice(0,1)).map(n => graph.node(n.id));
    const left = Math.min(...nodes.map(n => n.x - 210)); const right = Math.max(...nodes.map(n => n.x + 210));
    const top = Math.min(...nodes.map(n => n.y - height / 2 - 25)); const bottom = Math.max(...nodes.map(n => n.y + height / 2 + 25));
    const scale = Math.min(1.45, 1660 / (right-left+100), 700 / (bottom-top+80));
    return {scale, x: 960 - (left+right)/2 * scale, y: 535 - (top+bottom)/2 * scale};
  };
  const i = events.reduce((found, at, index) => at <= seconds ? index : found, 0);
  const current = box(events[i]); const previous = box(events[Math.max(0,i-1)]);
  const p = i ? ease((seconds-events[i])/.7) : 1;
  return {scale: previous.scale+(current.scale-previous.scale)*p, x:previous.x+(current.x-previous.x)*p, y:previous.y+(current.y-previous.y)*p};
};

export const EditorialGraphTemplate = ({spec, paper = false}: {spec: ImageGraphSpec; paper?: boolean}) => {
  const seconds = useCurrentFrame()/useVideoConfig().fps;
  const graph = useMemo(() => editorialGraphLayout(spec), [spec]);
  const camera = editorialGraphCamera(spec, graph, seconds);
  const {height} = editorialGraphStructure(spec);
  const bg = paper ? "#e8e5dc" : "#10272b"; const ink = paper ? "#182a2d" : "#f5f2df";
  const accent = paper ? "#bd4737" : "#e2e56d";
  const last = [...spec.nodes].reverse().find(n => n.at <= seconds)?.id;
  return <AbsoluteFill style={{background:bg,color:ink,fontFamily:'"Microsoft YaHei", sans-serif',overflow:"hidden"}}>
    <AbsoluteFill style={{opacity:paper?.13:.24, backgroundImage:paper ? "repeating-linear-gradient(113deg,transparent 0 4px,#9a927f22 4px 5px),radial-gradient(#45575866 .8px, transparent .8px)" : "radial-gradient(#8fb7b944 1px, transparent 1px),radial-gradient(ellipse at 15% 0%,#31715e,transparent 65%)",backgroundSize:paper?"auto,7px 7px":"10px 10px,auto"}}/>
    <div style={{position:"absolute",left:95,top:65,fontSize:27,letterSpacing:2,borderLeft:`5px solid ${accent}`,paddingLeft:20}}>{spec.title}</div>
    <div style={{position:"absolute",inset:0,clipPath:"inset(135px 0 155px 0)"}}><div style={{position:"absolute",inset:0,transform:`translate(${camera.x}px,${camera.y}px) scale(${camera.scale})`,transformOrigin:"0 0"}}>
      <svg width={graph.graph().width} height={graph.graph().height} style={{position:"absolute",left:0,top:0,overflow:"visible"}}>
        <defs><marker id="editorial-arrow" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="8" markerHeight="8" orient="auto"><path d="M1 1L11 6L1 11" fill="none" stroke={accent} strokeWidth="2"/></marker></defs>
        {spec.edges.map((edge,i) => {
          const e = graph.edge(edge.from,edge.to); const p = ease((seconds-edge.at)/.6);
          const points=e.points as {x:number;y:number}[];
          const from=graph.node(edge.from),to=graph.node(edge.to);const backward=graph.graph().rankdir==="LR"&&from.x>to.x;
          const rail=Math.max(from.y,to.y)+height/2+65;
          const path=backward?`M${from.x},${from.y+height/2} V${rail} H${to.x} V${to.y+height/2}`:points.map((n,j)=>`${j?"L":"M"}${n.x},${n.y}`).join(" ");
          const labelX=backward?(from.x+to.x)/2:e.x,labelY=backward?rail+30:e.y;
          const visible=[edge.from,edge.to].every(id=>{const n=graph.node(id);const x=n.x*camera.scale+camera.x;return x>65&&x<1855;});
          return <g key={i} opacity={p>0&&visible?1:0}>
            <path d={path} stroke={accent} strokeWidth={4} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1-p} markerEnd={p>.98?"url(#editorial-arrow)":undefined}/>
            <g transform={`translate(${labelX},${labelY})`} opacity={ease((seconds-edge.at-.3)/.35)}><rect x={-115} y={-28} width={230} height={56} fill={bg}/><text textAnchor="middle" y={10} fill={accent} fontSize={edge.relation.length>10?23:28} fontWeight={600}>{edge.relation}</text></g>
          </g>;
        })}
      </svg>
      {spec.nodes.map((node,i)=>{
        const n=graph.node(node.id);const p=ease((seconds-node.at)/.48);const focused=last===node.id;
        return <div key={node.id} style={{position:"absolute",left:n.x-180,top:n.y-height/2,width:360,height,opacity:p,transform:`perspective(1000px) rotateX(${(1-p)*-18}deg) rotate(${(i%2?1:-1)*(1-p)*5}deg) translateY(${(1-p)*-38}px)`,filter:`drop-shadow(0 14px 12px ${paper?"#1a251e22":"#0006"})`}}>
          <div style={{position:"absolute",inset:0,background:paper?"#fbfaf2":"#1c3c40",border:`${focused?3:1.5}px solid ${focused?accent:paper?"#b5b4a6":"#6e9291"}`,borderRadius:paper?3:12}}/>
          <div style={{position:"absolute",top:20,left:24,fontSize:16,letterSpacing:3,opacity:.45,fontFamily:"Arial"}}>{String(i+1).padStart(2,"0")}</div>
          {node.image?<Img src={url(node.image)} style={{position:"absolute",left:30,top:height===320?40:65,width:300,height:height===320?185:240,objectFit:"contain"}}/>:<div style={{position:"absolute",left:125,top:height===320?70:125,width:110,height:110,border:`3px solid ${accent}`,borderRadius:i%2?"50%":10,transform:"rotate(-6deg)",boxShadow:`12px 12px 0 ${paper?"#bd47371a":"#e2e56d18"}`}}/>}
          <div style={{position:"absolute",left:15,right:15,bottom:height===320?25:38,textAlign:"center",fontSize:node.label.length>13?28:node.label.length>8?32:38,fontWeight:700,lineHeight:1.3}}>{node.label}</div>
        </div>;
      })}
    </div></div>
    <div style={{position:"absolute",left:95,right:95,bottom:105,height:1,background:paper?"#9d9f9380":"#6d929466"}}/>
    <div style={{position:"absolute",right:100,bottom:126,display:"flex",gap:12}}>{spec.nodes.map(n=><div key={n.id} style={{height:5,width:32,background:n.at<=seconds?accent:paper?"#b8bbaf":"#35595b"}}/>)}</div>
  </AbsoluteFill>;
};
