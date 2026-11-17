import type {ComponentType} from 'react';
import type {PortraitDemo} from './common';
import {validateBatchCSpec} from './batch-c/constraints';
import {BatchCScene} from './batch-c/scenes';
const city='portrait-mg/restored-titles/city-demo.mp4';
const office='portrait-mg/batch-c/office-demo.mp4';
const paper='portrait-mg/batch-c/documents-demo.mp4';
const v=(source:string,at?:number)=>({source,sourceStart:0,...(at===undefined?{}:{at})});
const txt=(text:string,at=0)=>({text,at});
const cases:Record<string,{frames:number;spec:any}>={
 V19_005:{frames:48,spec:{background:v(office),title:txt('安静',0),backTitle:txt('QUIETNESS',.1)}},
 V22_002:{frames:166,spec:{background:v(city),circle:v(office),question:txt('凋萎？',2.6),answer:txt('下沉！',4),drop:{at:5}}},
 V21_009:{frames:120,spec:{title:txt('过时',0)}},
 V20_003:{frames:360,spec:{upper:v(office),lower:v(city),lowerNext:v(paper,1.5),upperNext:v(city,8.1),closeLower:{at:11.9666667}}},
 V18_003:{frames:242,spec:{background:v(office),strips:v(paper,0),label:txt('印度公婆签证办好\n马上就能来中国了！',1.1),inset:v(city,3.5),next:v(paper,6.4)}},
 V28_001:{frames:66,spec:{background:v(city),title:txt('全民节俭',.25),subtitle:txt('thrifty',.35)}},
 V18_002:{frames:68,spec:{firstBackground:v(paper),secondBackground:v(office,1.15),firstQuote:txt('中国女性与外国男性结婚后，\n应即刻注销其中国国籍\n与中国护照，\n不允许其在国内长期居留。\n若回国探亲，\n签证期限最多为7天，\n期满必须离境。\n同时严禁其外籍丈夫\n在中国非法就业，\n外籍丈夫及其家人，\n亲戚均不得在中国\n非法获得停留、居住和就业。',0),secondQuote:txt('签证期限最多为7天，\n期满必须离境。\n同时严禁其外籍丈夫\n在中国非法就业，\n外籍丈夫及其家人，\n亲戚均不得在中国\n非法获得停留、居住和就业。\n外嫁女性若加入\n其外籍丈夫所在国国籍，',1.15)}},
 V20_007:{frames:88,spec:{background:{...v('portrait-mg/batch-c/social-feed-demo.mp4'),sourceEnd:88/30},first:txt('冲热榜',0),second:txt('刷评论',1.05),third:txt('买流量',1.95)}},
 V21_006:{frames:56,spec:{background:v(office),title:txt('最低谷',0)}},
 V25_001:{frames:111,spec:{background:v(city),title:txt('护学岗',0)}},
 V10_001:{frames:330,spec:{background:v(office),foreground:{source:'portrait-mg/batch-c/skyline.png',sourceStart:null},openingTitle:txt('泰国',0),firstClip:v(office,.9),secondClip:v(paper,2.4),document:{source:'portrait-mg/strict-demo/photo-middle.jpg',sourceStart:null,at:4.3},finalClip:v(city,8.7)}}
};
export const batchCRenderers:Record<string,ComponentType<{spec:any}>>=Object.fromEntries(Object.keys(cases).map(id=>[id,({spec}:{spec:any})=>{validateBatchCSpec(id,spec);return <BatchCScene id={id} spec={spec}/>}]));
export const batchCDemos:Record<string,PortraitDemo>=Object.fromEntries(Object.entries(cases).map(([id,c])=>[id,{spec:{...c.spec,_duration:c.frames/30},durationInFrames:c.frames,fps:30 as const,reference:'D:/MG_Reference_Library/creators/eshuocaijing/effects/'+id+'/reference.mp4',referenceStart:0}]));
