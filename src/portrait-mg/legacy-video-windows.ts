/** Legacy portrait scenes now expose only real video ranges, never a media-type switch. */
export const replaceableBackgroundVideos = new Set(["V01_007", "V10_004", "V10_005", "V21_005"]);

export function legacyVideoWindows(id:string,args:any,start:number,end:number) {
 const out:{value:any;label:string;duration:number}[]=[];
 const add=(value:any,label:string,from=start,to=end)=>out.push({value,label,duration:to-from});
 const playlist=(items:any[],label:string)=>{if(Array.isArray(items))items.forEach((item,i)=>add(item?.media,label+"["+i+"].media",item?.at,items[i+1]?.at??end));};
 if (replaceableBackgroundVideos.has(id) && args?.background) add(args.background, "background");
 switch(id){
  case "V01_001":playlist(args?.upper,"upper");add(args?.lower,"lower");break;
  case "V01_002":add(args?.background,"background");playlist(args?.clips,"clips");break;
  case "V01_003":for(const key of ["upper","lower"])add(args?.[key]?.media,key+".media",args?.[key]?.at);break;
  case "V01_007":if(Array.isArray(args?.nodes))args.nodes.forEach((n:any,i:number)=>add(n?.media,"nodes["+i+"].media",n?.at));break;
  case "V05_001":add(args?.background,"background");add(args?.archive,"archive");break;
  case "V05_002":playlist(args?.clips,"clips");break;
  case "V11_001":add(args?.background,"background");break;
 }
 return out;
}
export function normalizeLegacyVideoRanges(id:string,input:unknown,start:number,end:number) {
 if(!input||typeof input!=="object"||Array.isArray(input))return input;
 const args=structuredClone(input);
 for(const {value,duration} of legacyVideoWindows(id,args,start,end))if(value&&typeof value==="object"&&value.sourceEnd===undefined&&typeof value.sourceStart==="number")value.sourceEnd=value.sourceStart+duration;
 return args;
}
export function validateLegacyVideoRanges(id:string,args:any,start:number,end:number) {
 for(const {value,label,duration} of legacyVideoWindows(id,args,start,end)){
  if(!Number.isFinite(duration)||duration<=0)throw new Error(id+"."+label+": video window must be positive");
  if(Math.abs(value.sourceEnd-value.sourceStart-duration)>.001)throw new Error(id+"."+label+": source range must equal the video slot duration");
 }
}
