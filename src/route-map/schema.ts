import {assertFunctionEnvelope,functionAtSchema,functionGroupSchema,functionOrderSchema,toLocalAt,type FunctionCallEnvelope,type FunctionCallTiming} from "../function-call";

export type MapStop={id:string;label:string;detail:string;longitude:number;latitude:number;at:number};
export type MapRoute={from:string;to:string;at:number;waypoints:Array<{longitude:number;latitude:number}>};
export type RouteMapSpec={title:string;stops:MapStop[];routes:MapRoute[]};
export type RouteMapFunctionArgs=FunctionCallEnvelope&RouteMapSpec;
const longitude={type:"number",minimum:-180,maximum:180} as const;
const latitude={type:"number",minimum:-85,maximum:85} as const;
const id={type:"string",minLength:1,maxLength:40,pattern:"^[A-Za-z0-9_-]+$"} as const;
export const routeMapFunctionDefinition={
 type:"function",name:"create_route_map",strict:true,
 description:"Draw a geographic supply-chain route on an offline real-world land map. Use approximate truthful geographic coordinates. Preserve actual branches: a supplier branch is not an invented serial shipment. at is an absolute episode timestamp for each stop and route. waypoints are geographic bends, not precise navigation. The fixed camera follows the latest route; no camera or color parameters are needed.",
 parameters:{type:"object",additionalProperties:false,required:["group","order","title","stops","routes"],properties:{
  group:functionGroupSchema,order:functionOrderSchema,title:{type:"string",minLength:1,maxLength:80},
  stops:{type:"array",minItems:2,maxItems:24,items:{type:"object",additionalProperties:false,required:["id","label","detail","longitude","latitude","at"],properties:{id,label:{type:"string",minLength:1,maxLength:32},detail:{type:"string",maxLength:80},longitude,latitude,at:functionAtSchema}}},
  routes:{type:"array",minItems:1,maxItems:30,items:{type:"object",additionalProperties:false,required:["from","to","at","waypoints"],properties:{from:id,to:id,at:functionAtSchema,waypoints:{type:"array",maxItems:12,items:{type:"object",additionalProperties:false,required:["longitude","latitude"],properties:{longitude,latitude}}}}}},
 }}
} as const;
export const resolveRouteMapFunctionArgs=(input:RouteMapFunctionArgs,timing:FunctionCallTiming)=>{
 const envelope=assertFunctionEnvelope(input,timing);
 if(input.group!=="supply-chain")throw new Error("route-map group must be supply-chain");
 if(!input.title?.trim()||input.title.length>80||!Array.isArray(input.stops)||input.stops.length<2||input.stops.length>24||!Array.isArray(input.routes)||!input.routes.length||input.routes.length>30)throw new Error("Invalid route-map title/stops/routes");
 const ids=new Set<string>();
 const position=(p:{longitude:number;latitude:number})=>{if(!Number.isFinite(p.longitude)||Math.abs(p.longitude)>180||!Number.isFinite(p.latitude)||Math.abs(p.latitude)>85)throw new Error("Invalid map coordinates")};
 const localAt=(at:number)=>{if(at>=timing.end)throw new Error("Map event cannot follow host window");return toLocalAt(at,envelope.at)};
 const stops=input.stops.map(s=>{if(!/^[A-Za-z0-9_-]{1,40}$/.test(s.id)||ids.has(s.id)||!s.label?.trim()||s.label.length>32||typeof s.detail!=="string"||s.detail.length>80)throw new Error("Invalid or duplicate map stop");ids.add(s.id);position(s);return {...s,at:localAt(s.at)}});
 const routes=input.routes.map(r=>{if(!ids.has(r.from)||!ids.has(r.to)||r.from===r.to||!Array.isArray(r.waypoints)||r.waypoints.length>12)throw new Error("Invalid map route endpoints/waypoints");r.waypoints.forEach(position);return {...r,at:localAt(r.at)}}).sort((a,b)=>a.at-b.at);
 return {...envelope,spec:{title:input.title,stops,routes}};
};
