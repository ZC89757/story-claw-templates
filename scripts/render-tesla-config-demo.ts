import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia} from '@remotion/renderer';
const serveUrl=process.argv[2]??await bundle({entryPoint:path.resolve('runtime/preview-entry.tsx'),publicDir:path.resolve('public')});
const inputProps={previewKind:'documentary-config',style:'editorial-scale'};
const composition=await selectComposition({serveUrl,id:'MgStylePreview',inputProps});
await renderMedia({composition,serveUrl,inputProps,codec:'h264',outputLocation:process.argv[3]??'D:/StoryClawRuns/tesla-mg-demos-20261022/04_配置数量对比_demo.mp4',concurrency:2,crf:20,x264Preset:'veryfast',pixelFormat:'yuv420p',logLevel:'warn'});
console.log('CONFIG_VARIANT_DEMO_READY');
