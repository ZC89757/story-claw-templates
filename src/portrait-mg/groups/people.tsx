import React from 'react';
import type {PortraitDemo} from '../common';
import {CommentPanels} from '../people/cards';
export const peopleRenderers:Record<string,React.FC<{spec:any}>>={V01_006:CommentPanels};
const common={group:'portrait',order:null};
const p=(id:string,name:string)=>`portrait-mg/${id}/${name}`;
export const peopleDemos:Record<string,PortraitDemo>={
 V01_006:{fps:30,durationInFrames:192,reference:'D:/MG_Work/V01_006/delivery/V01_006.mp4',referenceStart:18/30,previewBackground:p('V01_006','preview-background.mp4'),spec:{...common,panels:[{layout:'wide',at:0,comments:[{text:'这段转身跟拍太顺了，路灯一亮，后面的街景和动作也刚好对上。',author:null,avatar:null},{text:'第二个镜头是怎么拍的？',author:null,avatar:null}]},{layout:'tall',at:136/30,comments:[{text:'这段有老电影的味道。',author:'街角小馆',avatar:p('V01_006','avatar-1.jpg')},{text:'把远处的路灯也拍进去，画面就有层次了。',author:'周末拍点什么',avatar:p('V01_006','avatar-2.jpg')},{text:'室内这两个角度我更喜欢第二个，人物一转身，顶部暖光就跟着进来了。',author:'小岛映像',avatar:p('V01_006','avatar-3.jpg')},{text:'光落下来的一瞬间真好看。',author:'见山',avatar:p('V01_006','avatar-4.jpg')},{text:'等一个拍摄花絮。',author:'慢放一遍',avatar:p('V01_006','avatar-5.jpg')}]}]}},
};
