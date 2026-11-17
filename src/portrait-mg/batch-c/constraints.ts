// Fixed original text geometry: reject overflow rather than changing the font.
export const batchCTextLimits:Record<string,Record<string,{units:number;lines?:number}>>={
 V19_005:{title:{units:4},backTitle:{units:20}},V22_002:{question:{units:3},answer:{units:3}},V21_009:{title:{units:3}},V18_003:{label:{units:12,lines:2}},V28_001:{title:{units:4},subtitle:{units:4.2}},V18_002:{firstQuote:{units:14,lines:18},secondQuote:{units:14,lines:18}},V20_007:{first:{units:4},second:{units:4},third:{units:4}},V21_006:{title:{units:4}},V25_001:{title:{units:4}},V10_001:{openingTitle:{units:3}}
};
const images=new Set(['foreground','document','signature']);
export function validateBatchCSpec(id:string,s:Record<string,any>){
 for(const [key,limit]of Object.entries(batchCTextLimits[id]??{})){
  const value=s[key];if(value==null)continue;if(typeof value.text!=='string'||!value.text.trim())throw new Error(id+'.'+key+': expected nonempty text');
  const lines=value.text.split('\n');if(lines.length>(limit.lines??1))throw new Error(id+'.'+key+': too many lines for the original layout');
  if(lines.some((line:string)=>Array.from(line).reduce((sum,c)=>sum+(/^[\x00-\x7F]$/.test(c)?.56:1),0)>limit.units+.001))throw new Error(id+'.'+key+': text exceeds fixed original width; shorten the wording');
 }
 for(const[key,v]of Object.entries(s))if(v&&typeof v==='object'&&v.source){
  if(typeof v.source!=='string')throw new Error(id+'.'+key+': expected media source');
  if(images.has(key)){if(v.sourceStart!==null&&v.sourceStart!==undefined)throw new Error(id+'.'+key+': image requires null sourceStart');}
  else if(typeof v.sourceStart!=='number'||!Number.isFinite(v.sourceStart)||v.sourceStart<0)throw new Error(id+'.'+key+': video requires nonnegative sourceStart');
 }
}
