import fs from "node:fs/promises";
const runtime="D:/StoryClawByteDancePreview";
const rows=JSON.parse(await fs.readFile(`${runtime}/byte-offline-inputs.json`,"utf8"));
const output=`${runtime}/workspace/字节跳动的发展与决策_20261015/ep01/mg/codex_parameters.json`;
const context=JSON.parse(await fs.readFile(`${runtime}/workspace/字节跳动的发展与决策_20261015/ep01/mg_production_context_preview.json`,"utf8"));
const assets=`${runtime}/workspace/字节跳动的发展与决策_20261015/ep01/assets/illustrations`;
const image=(name:string)=>`${assets}/${name}.png`;
const source=(name:string)=>({mode:"transparent",prompt:null,image:image(name)});
const at=(row:any,index:number)=>row.anchors[index]?.start??row.start;
const tableRows:Record<number,Array<[string,string]>>={
  8:[["报刊","刊物品牌聚集读者"],["门户网站","首页安排阅读次序"],["推荐产品","面向不同用户排序"],["分发系统","影响接触读者的机会"]],
  23:[["美国用户","超过1.7亿"],["全球用户","超过10亿"],["内容统计年份","2023年"],["美国用户上传","超过55亿条视频"],["全球观看","超过13万亿次"],["日均上传（按365天折算）","超过1500万条"]],
  25:[["企业投入","研发、服务器、审核与商业服务"],["创作者投入","拍摄与表演劳动"],["观看者投入","时间与反馈"],["创作者收入","能否取得可持续收入"],["规则稳定性","平台规则是否稳定"],["触达机会","平台能否单方面改变"]],
  32:[["成交额","商家销售的交易规模"],["平台收入","广告、技术服务等收费"],["净利润","收入扣除成本费用后的结果"]],
  40:[["创作者收入分布","不同创作者实际获得多少"],["劳动报酬","研发与运营劳动的报酬"],["股权收益","权益持有者的所得"],["平台成本","形成收益所需的投入"]],
  50:[["产品要求","可靠性、集成和迁移成本"],["经营投入","销售与服务仍需要投入"],["盈利判断","须核对收入与成本，产品名单不足为证"]],
  62:[["统计范围","2023年美国TikTok用户"],["全年上传量","超过55亿条视频"]],
};
const canvasLabels:Record<number,string[]>={
  0:["今日头条","抖音与TikTok","豆包","信息推荐","短视频","海外平台","电商、企业服务与AI"],
  11:["研发与扩张投入","等待商业收入","承担失败风险","取得未来收益权利"],
  14:["观看者与视频","反馈与推荐","曝光与时间价值"],
  24:["多方参与的内容平台"],
  30:["商业交易","交易责任"],
  37:["收益分配的参与者","不同贡献共同形成价值","判断分配所需证据"],
  47:["企业协作产品"],
  53:["内容工具","生成式AI的成本条件"],
  63:["业务盈利","收益分配","财务与分配证据","扣除成本后的收益","可持续收入","选择权与经营条件"],
};
const canvasImages:Record<number,string[]>={
  0:["content-cards","platform-phone","compute","content-cards","creator","users","merchant"],
  11:["compute","merchant","content-cards","users"],14:["platform-phone","compute","users"],24:["platform-phone"],30:["merchant","merchant"],
  37:["users","creator","content-cards"],47:["compute"],53:["content-cards","compute"],63:["merchant","users","content-cards","compute","creator","platform-phone"],
};
const timelineNodes:Record<number,Array<[string,string]>>={
  4:[["2012年3月","字节跳动成立"],["2012年8月","今日头条上线"]],
  13:[["2016年9月","抖音上线"],["2017年6月","头条视频升级为西瓜视频"]],
  21:[["2017年5月","TikTok上线"],["2017年11月","收购Musical.ly"],["2018年8月","产品合并"]],
  42:[["2020年","行政行动"],["2021—2022年","相关谈判"],["2024年","相关法律通过"],["2025年1月","最高法院判决"]],
  48:[["2019年3月","Lark在日本和新加坡推出"],["2019年8月","飞书上线"]],
  58:[["2012年","手机网民与进入时机"],["2017年","补贴与内容供给"],["2020年","国内日活规模"],["2023年","全球内容参与"]],
};
const calls:any[]=[];
const add=(row:any,name:string,args:any)=>calls.push({id:`codex-${row.index}`,name,arguments:{group:row.group,order:row.order,...args}});
for(const row of rows){
  if(row.tag==="part-whole-chart")add(row,"create_part_whole_chart",{title:"2012年底：中国网民",total:{label:"全体网民",value:5.64,unit:"亿人"},parts:[{label:"非手机上网者",value:1.44,at:row.anchors[0].start},{label:"手机上网者",value:4.2,at:row.anchors[1].start}]});
  if(row.tag==="mg-title")add(row,"create_title_cue",{text:row.text});
  if(row.tag==="video-footage"){
    const {source,sourceStart,sourceEnd}=context.registeredFootage[row.key];
    add(row,"use_video_footage",{source,sourceStart,sourceEnd});
  }
  // CNNIC 2011 baseline, verified in CNTV's 2012-01-17 report:
  // https://news.cntv.cn/20120117/120419.shtml . The two 2012 values retain their reviewed anchors.
  if(row.tag==="multi-series-chart")add(row,"create_multi_series_chart",{title:"上网设备使用率 · CNNIC",xAxis:{label:"设备（使用人群可重叠）",categories:["台式电脑","手机"]},yAxis:{label:"使用比例",unit:"%"},series:[
    {name:"2011年底",data:[{category:"台式电脑",value:73.4,at:row.start},{category:"手机",value:69.3,at:row.start}]},
    {name:"2012年底",data:row.anchors.map((a:any,index:number)=>({category:index?"手机":"台式电脑",value:index?74.5:70.6,at:a.start}))},
  ]});
  if(row.tag==="dual-axis-chart")add(row,"create_dual_axis_chart",{title:"手机上网：规模与占比 · CNNIC",categories:["2011年底","2012年底"],leftAxis:{label:"手机网民",unit:"亿人"},rightAxis:{label:"占全体网民",unit:"%"},series:[
    {name:"手机网民人数",axis:"left",data:[{category:"2011年底",value:3.56,at:row.start},{category:"2012年底",value:4.2,at:row.start+0.6}]},
    {name:"手机上网占比",axis:"right",data:[{category:"2011年底",value:69.3,at:row.start},{category:"2012年底",value:74.5,at:at(row,1)}]},
  ]});
  if(row.tag==="progress-timeline"){
    const entries=timelineNodes[row.index];
    const nodes=entries.map(([year,title],index)=>({year,title,at:at(row,index)}));
    if(nodes[0].at>row.start+0.001)nodes.unshift({year:entries[0][0].slice(0,4)+"年",title:"发展节点",at:row.start});
    add(row,"create_progress_timeline",{title:row.index===58?"进入时机、供给投入与参与规模":"字节跳动发展节点",nodes});
  }
  if(row.tag==="mg-canvas"){
    const labels=canvasLabels[row.index],images=canvasImages[row.index];
    const nodes=labels.map((label,index)=>({id:`n${index}`,label,source:source(images[index])}));
    const steps=[{nodeId:"n0",at:row.start},...row.anchors.filter((a:any)=>a.start>row.start+0.35).map((a:any)=>({nodeId:`n${Math.min(a.value-1,nodes.length-1)}`,at:a.start}))];
    add(row,"create_continuous_canvas",{title:row.index===0?"字节跳动的产品与业务延伸":row.index===63?"规模、盈利与长期分配":labels[0],nodes,steps});
  }
  if(row.tag==="timed-table"){
    const entries=tableRows[row.index];
    const cells=[{row:1,column:1,text:row.index===23?"统计口径":"对象",at:row.start},{row:1,column:2,text:row.index===23?"判决书记录":"含义 / 判断依据",at:row.start},
      ...entries.flatMap(([label,text],index)=>[{row:index+2,column:1,text:label,at:at(row,index)},{row:index+2,column:2,text,at:at(row,index)}])];
    add(row,"create_timed_table",{rows:entries.length+1,columns:2,cells});
  }
  if(row.tag==="decomposition"){
    const labels:Record<number,string[]>={9:["软件、推荐系统与用户获取","内容版权、质量审核与来源合作"],33:["商品质量","退款","商家治理"],56:["训练的前期投入","调用产生的推理成本","付费、广告或其他收入","训练推理支出、分部收入与利润"]};
    add(row,"create_decomposition_timeline",{title:row.index===56?"使用增长与成本条件":row.index===33?"交易业务需要的能力":"进入内容市场的投入",whole:row.index===56?"AI业务的盈利条件":row.index===33?"交易业务责任":"初创平台投入",parts:labels[row.index].map((part,index)=>({part,at:at(row,index)})),highlights:[]});
  }
  if(row.tag==="image-grid"){
    const labels=row.index===38?["员工 · 研发与运营","创作者 · 内容","商家 · 经营风险","股东 · 企业权益"]:["剪辑","写作","图像生成"];
    const images=row.index===38?["users","creator","merchant","users"]:["content-cards","creator","compute"];
    add(row,"create_image_grid",{title:row.index===38?"共同参与价值形成（示意）":"生成工具的使用场景（示意）",images:labels.map((label,index)=>({label,image:image(images[index]),at:at(row,index)}))});
  }
  if(row.tag==="image-side-by-side"){
    const defs:Record<number,any>={
      17:{title:"平台目标与用户体验",left:["平台目标","platform-phone"],right:["用户体验","users"],items:[["left","曝光次数更多",0],["right","找到感兴趣的内容",1],["left","提高停留与互动",2],["right","时间是否花得值得",3]]},
      22:{title:"自建与收购：形成社区的两种路径",left:["自建产品","platform-phone"],right:["收购平台","users"],items:[["left","从头获得用户与创作者",0],["right","取得已运行的平台",1],["right","承担整合成本",2],["right","创作者、观看者与互动习惯",3],["right","支付社区与增长时间的价值",4]]},
      54:{title:"分发与制作",left:["推荐系统","content-cards"],right:["生成工具","creator"],items:[["left","组织和分发现有内容",0],["right","参与内容制作",1]]},
    };
    const d=defs[row.index];
    add(row,"create_image_comparison",{title:d.title,left:{label:d.left[0],source:source(d.left[1])},right:{label:d.right[0],source:source(d.right[1])},items:d.items.map(([side,text,index]:any)=>({side,text,at:at(row,index)})),highlights:[]});
  }
  if(row.tag==="mg-argument")add(row,"create_evidence_gap",{title:"增长与控制权不能替代分配证据",claims:[
    {premise:"企业增长很快",conclusion:"所有参与者收入同步提高",missingEvidence:["各方收入变化","收入分布与平台成本"],at:at(row,0)},
    {premise:"平台掌握规则",conclusion:"全部收入都是不合理租金",missingEvidence:["成本与劳动贡献","权益收益与收费结构"],at:at(row,1)},
  ]});
  if(row.tag==="side-by-side-comparison")add(row,"create_side_by_side_comparison",{title:"累积优势及其边界",leftLabel:"可能形成的累积优势",rightLabel:"约束与待检验条件",items:[
    {side:"left",text:"研发审核投入与潜在观众",at:at(row,0)},{side:"right",text:"数据增长不保证无限改善推荐",at:at(row,1)},{side:"right",text:"用户可以同时使用多个平台",at:at(row,2)},
  ],highlights:[]});
  if(row.tag==="sc-video"){
    const reference=context.scVideoReferences.find((entry:any)=>entry.instanceOrders.includes(row.order));
    add(row,"create_sc_video",{reference_image_state:"existing",reference_image_path:reference.image,video_prompt:row.order===2?"A steady medium-wide view of the same person naturally filming food in this kitchen. Small realistic hand movements and subtle screen light. Preserve all people, objects, framing and setting. No text, speech or music.":"A steady wide view of the same subway commuters quietly using their phones. Natural small finger, hand and eye movements, subtle carriage movement. Preserve the camera, faces, clothing, seats and space. No text, logos, speech or music."});
  }
  if(row.tag==="web-page-focus"){
    const page=context.webSources.find((p:any)=>p.order===row.order);
    add(row,"create_web_page_focus",{url:page.url,focus:page.focusText.map((text:string,index:number)=>({text,at:row.start+index*Math.min(2,(row.end-row.start)/3)})),entrance:"fade"});
  }
  if(row.tag==="subject-expansion"){
    if(row.order===1)add(row,"create_subject_expansion",{subject:{label:"内容平台",source:source("platform-phone")},items:[
      {id:"users",label:"使用者",relation:"使用产品",source:source("users"),at:at(row,0)},
      {id:"business",label:"商业服务",relation:"连接商业需求",source:source("merchant"),at:406.3},
    ],highlights:[{targets:["users"],note:"形成用户基础",at:at(row,1)}]});
    else add(row,"create_subject_expansion",{subject:{label:"海外业务",source:source("platform-phone")},items:[
      {id:"opportunity",label:"潜在收益",relation:"市场机会",source:source("merchant"),at:640.05},
      {id:"conditions",label:"合规、争议与调整成本",relation:"经营条件",source:source("content-cards"),at:at(row,1)},
      {id:"users",label:"用户规模",relation:"社会影响",source:source("users"),at:647.1},
    ],highlights:[{targets:["users","conditions"],note:"规模扩大不能证明制度风险降低",at:648.2},{targets:["subject","conditions"],note:"平台影响力进入监管讨论",at:652.2}]});
  }
  if(row.tag==="image-directed-graph"){
    const imageNames:Record<number,string[]>={7:["content-cards","users","compute"],16:["users","platform-phone","users","compute"],19:["creator","content-cards","users","creator","merchant","merchant"],31:["content-cards","merchant","compute"],35:["creator","content-cards","platform-phone","compute","users","users"]};
    const times=row.index===7?[row.start,at(row,0),at(row,2)]:row.index===35?[at(row,0),at(row,0)+0.4,at(row,1),at(row,1)+0.4,at(row,2),at(row,4)]:row.graph.nodes.map((_:any,index:number)=>index<row.anchors.length?at(row,index):row.end-2);
    const nodes=row.graph.nodes.map((label:string,index:number)=>({id:`n${index}`,label,source:source(imageNames[row.index][index]),at:times[index]}));
    const relations:Record<number,string[]>={7:["产生反馈","更新推荐","重新组织"],16:["反馈信号","反馈信号","反馈信号"],19:["投入供给","吸引观看","促进继续创作","内容反馈","影响收入持续性"],31:["缩短转化路径","观察交易结果"],35:["拥有作品","掌握排序","影响实际触达","内容到达观众","关注关系"]};
    let previousEdge=-1;
    const edges=row.graph.edges.map(([from,to]:number[],index:number)=>{
      const time=Math.max(row.index===7&&index===0?at(row,1):row.index===35&&index===2?at(row,3):Math.max(times[from],times[to])+0.25,previousEdge+0.15);
      previousEdge=time;
      return {from:`n${from}`,to:`n${to}`,relation:relations[row.index][index],at:time};
    });
    add(row,"create_image_directed_graph",{title:row.index===19?"供给培育与可持续收入条件":row.index===35?"作品、分发与触达权利":"内容、行为与平台关系（示意）",nodes,edges});
  }
  if(row.tag==="directed-graph"){
    const times=row.index===29?[at(row,0),at(row,1),at(row,2),at(row,3),at(row,3)+0.45,at(row,4),at(row,5),at(row,6)]:[at(row,0),at(row,1),at(row,1)+1,at(row,1)+2.5,at(row,2),at(row,2)+1.2,at(row,5)];
    const relations=row.index===29?["影响展示量","影响展示量","影响展示量","影响收入","影响收入","可能损害体验","影响使用时长","影响价格"]:["运营联系","运营联系","涉及合作","涉及共享","约束运营联系","约束经营选择"];
    const extraTimes=row.index===43?[620.5,621.1,at(row,3),at(row,3)+0.3,at(row,4),at(row,5)]:null;
    let previousEdge=-1;
    const edges=row.graph.edges.map(([from,to]:number[],index:number)=>{
      const time=Math.max(extraTimes?.[index]??Math.max(times[from],times[to])+0.25,previousEdge+0.15);
      previousEdge=time;
      return {from:`n${from}`,to:`n${to}`,relation:relations[index],at:time};
    });
    add(row,"create_directed_graph_timeline",{title:row.index===29?"广告收入的影响因素":"法律条件与经营约束",nodes:row.graph.nodes.map((label:string,index:number)=>({id:`n${index}`,label,at:times[index]})),edges});
  }
}
if(calls.length!==64)throw new Error(`Expected 64 authored calls, got ${calls.length}`);
await fs.mkdir(output.slice(0,output.lastIndexOf("/")),{recursive:true});
await fs.writeFile(output,JSON.stringify(calls,null,2));
console.log(`${calls.length} authored calls`);
