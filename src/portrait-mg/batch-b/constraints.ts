/** Fixed lettering geometry. Reject overflow instead of silently changing the design. */
export function validateBatchBSpec(id:string,s:any){
  const units=(text:string)=>Array.from(text).reduce((n,c)=>n+(/[\x00-\x7f]/.test(c)?.55:1),0);
  const label=(text:unknown,limit:number,key:string)=>{if(typeof text!=='string'||!text.trim()||units(text)>limit+1e-6)throw new Error(`${id}.${key}: fixed lettering supports at most ${limit} full-width units; shorten the copy`);};
  const count=(items:any[],n:number,key:string)=>{if(!Array.isArray(items)||items.length!==n)throw new Error(`${id}.${key}: original layout requires ${n} items`);};
  switch(id){
    case 'V01_005':count(s.cards,2,'cards');s.cards.forEach((x:any,i:number)=>label(x.text,6,`cards[${i}].text`));break;
    case 'V01_006':count(s.panels,2,'panels');s.panels.forEach((p:any,i:number)=>{count(p.comments,i?5:2,`panels[${i}].comments`);p.comments.forEach((c:any,j:number)=>label(c.text,i?[36,48,72,36,36][j]:j?16:40,`panels[${i}].comments[${j}]`));});break;
    case 'V01_007':count(s.nodes,2,'nodes');s.nodes.forEach((n:any,i:number)=>label(n.label,i?7:4,`nodes[${i}].label`));break;
    case 'V03_001':count(s.people,2,'people');break;
    case 'V04_001':count(s.cards,2,'cards');s.cards.forEach((x:any,i:number)=>label(x.text,5,`cards[${i}].text`));label(s.headline.text,6,'headline');break;
    case 'V19_006':for(const p of ['first','second']){label(s[p+'Title'].text,3,p+'Title');for(const i of [1,2,3])label(s[p+'Row'+i].text,7,p+'Row'+i);}break;
    case 'V19_001':for(const k of ['leftLabel','rightLabel'])label(s[k].text,4,k);break;
    case 'V31_003':for(const k of ['left','right'])label(s[k].text,2,k);break;
    case 'V21_002':for(const k of ['first','second'])label(s[k].text,3,k);break;
  }
  if(s._duration){
    const limit=id==='V01_007'&&!s.background?169/30:id==='V21_002'?88/30:id==='V21_005'&&!s.background?6:Infinity;
    if(s._duration>limit+1e-6)throw new Error(`${id}: fixed video decoration is ${limit}s; do not freeze or loop it`);
  }
}
