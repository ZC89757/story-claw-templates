import type React from 'react';
import {PagePerspective,DocumentHighlight} from '../graphics/web';
import {InkTitle} from '../graphics/ink';
import {ProcessCorrection,GradientDualCard} from '../graphics/cards-process';
import {RotatingDocument} from '../graphics/document';
export const graphicsRenderers:Record<string,React.FC<{spec:any}>>={V04_002:PagePerspective,V07_003:DocumentHighlight,V10_004:InkTitle,V10_005:ProcessCorrection,V11_002:GradientDualCard,V12_001:RotatingDocument};
export const graphicsDemos:Record<string,{spec:any;durationInFrames:number;fps:30;reference:string;referenceStart?:number;previewBackground?:string}>={
 V04_002:{spec:{group:'portrait',order:null,url:'https://example.invalid/local-generated-sport-fixture',focusText:null,capture:{source:'portrait-mg/V04_002/fixture-page.png',width:1100,height:1554,fixture:true}},durationInFrames:105,fps:30,reference:'D:/MG_Work/V04_002/versions/v002/V04_002.mp4',referenceStart:4/30},
 V07_003:{spec:{group:'portrait',order:null,url:'https://example.invalid/local-generated-report-fixture',excerpt:{text:'2024年全国结婚登记数为610.6万对，',at:37/30},highlights:[{text:'相较前一年，全国结婚登记数减少了157.4万对，',at:87/30}],capture:{source:'portrait-mg/V07_003/fixture-paper.png',width:1440,height:512,excerptRect:{x:580,y:24,width:364,height:22.8},highlightRects:[{text:'相较前一年，全国结婚登记数减少了157.4万对，',rects:[{x:1028,y:144,width:412,height:36},{x:0,y:196,width:152,height:36}]}],fixture:true}},durationInFrames:172,fps:30,reference:'D:/MG_V07_003_20261109_01a1c069/delivery/V07_003.mp4',referenceStart:38/30,previewBackground:'portrait-mg/V07_003/demo-background.png'},
 V10_004:{spec:{group:'portrait',order:null,text:'转卖'},durationInFrames:90,fps:30,reference:'D:/MG_Work/V10_004/delivery/V10_004_recreation.mp4',referenceStart:20/30},
 V10_005:{spec:{group:'portrait',order:null,subject:{image:'portrait-mg/V10_005/subject.png',label:'跨境黑产'},rejected:{text:'简单绑架',at:38/30},replacement:{text:'完整产业链',at:71/30}},durationInFrames:100,fps:30,reference:'D:/MG_V10_005_Codex_01a1c069/versions/v002/V10_005-remake.mp4',referenceStart:20/30},
 V11_002:{spec:{group:'portrait',order:null,cards:[{text:'缺钱',at:0},{text:'不缺',at:24/30}]},durationInFrames:43,fps:30,reference:'D:/MG_Work/V11_002-01a1c069/versions/v004/animation.mp4',referenceStart:0},
 V12_001:{spec:{group:'portrait',order:null,coverImage:'portrait-mg/V12_001/cover.png',body:{image:'portrait-mg/V12_001/body.png',at:158/30}},durationInFrames:180,fps:30,reference:'D:/MG_Work/V12_001/versions/v005/recreation.mp4',referenceStart:21/30},
};
