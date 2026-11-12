import React from 'react';
import type {PortraitDemo} from '../common';
import {ItemCards,CommentPanels,VerticalRelation} from '../people/cards';
import {CutoutCollage,PersonProfile} from '../people/portraits';
import {FlashCutout} from '../people/flash';
export const peopleRenderers:Record<string,React.FC<{spec:any}>>={V01_005:ItemCards,V01_006:CommentPanels,V01_007:VerticalRelation,V03_001:CutoutCollage,V04_001:PersonProfile,V11_001:FlashCutout};
const common={group:'portrait',order:null};
const p=(id:string,name:string)=>`portrait-mg/${id}/${name}`;
export const peopleDemos:Record<string,PortraitDemo>={
 V01_005:{fps:30,durationInFrames:111,reference:'D:/MG_Work/V01_005/delivery/V01_005.mp4',referenceStart:39/30,previewBackground:p('V01_005','preview-background.mp4'),spec:{...common,cards:[{image:p('V01_005','camisole.png'),text:'28元的吊带',at:0},{image:p('V01_005','shorts.png'),text:'三十元的短裤',at:22/30}]}},
 V01_006:{fps:30,durationInFrames:192,reference:'D:/MG_Work/V01_006/delivery/V01_006.mp4',referenceStart:18/30,previewBackground:p('V01_006','preview-background.mp4'),spec:{...common,panels:[{layout:'wide',at:0,comments:[{text:'这段转身跟拍太顺了，路灯一亮，后面的街景和动作也刚好对上。',author:null,avatar:null},{text:'第二个镜头是怎么拍的？',author:null,avatar:null}]},{layout:'tall',at:136/30,comments:[{text:'这段有老电影的味道。',author:'街角小馆',avatar:p('V01_006','avatar-1.jpg')},{text:'把远处的路灯也拍进去，画面就有层次了。',author:'周末拍点什么',avatar:p('V01_006','avatar-2.jpg')},{text:'室内这两个角度我更喜欢第二个，人物一转身，顶部暖光就跟着进来了。',author:'小岛映像',avatar:p('V01_006','avatar-3.jpg')},{text:'光落下来的一瞬间真好看。',author:'见山',avatar:p('V01_006','avatar-4.jpg')},{text:'等一个拍摄花絮。',author:'慢放一遍',avatar:p('V01_006','avatar-5.jpg')}]}]}},
 V01_007:{fps:30,durationInFrames:169,reference:'D:/MG_Work/V01_007/delivery/V01_007.mp4',referenceStart:1,spec:{...common,nodes:[{media:{source:p('V01_007','speaker.mp4'),sourceStart:0},label:'代表人物',at:0},{media:{source:p('V01_007','flag-texture.png'),sourceStart:null},label:'团队精神的象征',at:0}]}},
 V03_001:{fps:30,durationInFrames:71,reference:'D:/MG_Work/V03_001/versions/v003/V03_001.mp4',referenceStart:4/30,previewBackground:p('V03_001','preview-background.mp4'),spec:{...common,people:[{image:p('V03_001','violet.png'),at:0},{image:p('V03_001','red.png'),at:1/30}]}},
 V04_001:{fps:30,durationInFrames:190,reference:'D:/MG_Work/V04_001/versions/v004/V04_001.mp4',referenceStart:6/30,spec:{...common,portraitImage:p('V04_001','silver.png'),cards:[{image:p('V04_001','card-warm.jpg'),text:'洲际巡回赛',at:16/30},{image:p('V04_001','card-cool.jpg'),text:'最佳运动员',at:72/30}],headline:{text:'年度积分第一',at:146/30},_prepared:{portraitImage:p('V04_001','portrait-prepared.png')}}},
 V11_001:{fps:30,durationInFrames:56,reference:'D:/MG_Work/V11_001/versions/v014/V11_001.mp4',referenceStart:39/30,spec:{...common,image:p('V11_001','portrait.png'),background:{source:p('V11_001','background-a.mp4'),sourceStart:0},_prepared:{flashData:p('V11_001','prepared/flash.json')}}},
};
