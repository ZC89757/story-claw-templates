import {spawn} from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {CdpClient, findChromeExecutable, getFreePort, waitForPageTarget, waitForExit} from "../web-news-focus/capture";
import {requireWebSnapshot} from "../web-news-focus/snapshot";

export type CaptureRect = {x:number;y:number;width:number;height:number};
export type PreparedPortraitCapture = {source:string;width:number;height:number;focusRect?:CaptureRect;excerptRect?:CaptureRect;highlightRects?:Array<{text:string;rects:CaptureRect[]}>;fixture?:boolean};

/** Only remove a directory allocated by this module, inside the OS temporary root. */
export async function removePortraitTemporary(directory:string) {
  const root=path.resolve(os.tmpdir()); const target=path.resolve(directory); const relative=path.relative(root,target);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative) || !path.basename(target).startsWith("story-claw-portrait-")) throw new Error("Unsafe portrait temporary cleanup path");
  await fs.rm(target,{recursive:true,force:true,maxRetries:15,retryDelay:200});
}

/** Captures a saved page with no network requests and no page script execution. */
export async function preparePortraitCapture(id:string,spec:any,context:{webSnapshotDirectory?:string;resolveImage:(source:string)=>Promise<string>}):Promise<PreparedPortraitCapture> {
  const url=new URL(spec.url);
  if (!/^https?:$/.test(url.protocol)) throw new Error(`${id}: 网页地址必须为 http(s)`);
  const snapshot=await requireWebSnapshot(spec.url,context.webSnapshotDirectory);
  const temp=await fs.mkdtemp(path.join(os.tmpdir(),"story-claw-portrait-capture-"));
  let child:ReturnType<typeof spawn>|undefined; let cdp:CdpClient|undefined;
  try {
    const port=await getFreePort(); const executable=await findChromeExecutable();
    child=spawn(executable,[`--remote-debugging-port=${port}`,"--remote-debugging-address=127.0.0.1","--headless=new","--disable-gpu","--disable-extensions","--disable-background-networking","--no-sandbox","--hide-scrollbars","--no-first-run","--no-default-browser-check",`--user-data-dir=${path.join(temp,"profile")}`,"about:blank"],{windowsHide:true,stdio:"ignore"});
    child.on("error",()=>{});
    const target=await waitForPageTarget(port,child); cdp=new CdpClient(target.webSocketDebuggerUrl!); await cdp.open();
    await cdp.call("Page.enable"); await cdp.call("Runtime.enable"); await cdp.call("Network.enable");
    await cdp.call("Network.setBlockedURLs",{urls:["http://*","https://*","ws://*","wss://*"]});
    await cdp.call("Emulation.setDeviceMetricsOverride",{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
    await cdp.call("Emulation.setScriptExecutionDisabled",{value:true});
    const loaded=cdp.waitFor("Page.loadEventFired"); await cdp.call("Page.navigate",{url:pathToFileURL(snapshot).href}); await loaded;
    await cdp.call("Emulation.setScriptExecutionDisabled",{value:false});
    const texts=id==="V07_003"?[spec.excerpt.text,...spec.highlights.map((h:any)=>h.text)]:(spec.focusText===null?[]:[spec.focusText]);
    const result=await cdp.call("Runtime.evaluate",{awaitPromise:true,returnByValue:true,expression:`(async(texts)=>{
      document.querySelectorAll('script,meta[http-equiv="refresh"]').forEach(x=>x.remove());
      await document.fonts.ready;
      await Promise.all([...document.images].map(im=>im.complete?null:new Promise(r=>{im.onload=im.onerror=r;setTimeout(r,2000)})));
      const root=document.querySelector('[data-sc-web-content]')||document.querySelector('article')||document.querySelector('main')||document.body;
      const visible=n=>{const e=n.parentElement;if(!e||e.closest('script,style,noscript,template,nav,header,footer'))return false;const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&e.getClientRects().length>0};
      const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT); const nodes=[]; let n; let raw='';let previousBlock=null;
      const block=n=>{let e=n.parentElement;while(e&&e!==root&&getComputedStyle(e).display==='inline')e=e.parentElement;return e;};
      while(n=walk.nextNode()){if(visible(n)){const owner=block(n);if(previousBlock&&previousBlock!==owner&&!/\\s$/.test(raw))raw+='\\n';nodes.push({node:n,start:raw.length});raw+=n.textContent;previousBlock=owner;}}
      // Collapse whitespace while preserving a map back to exact DOM offsets.
      const map=[];let text='';for(let i=0;i<raw.length;i++){const c=/\\s/.test(raw[i])?' ':raw[i];if(c===' '&&text.endsWith(' '))continue;text+=c;map.push(i);}
      const rect=r=>({x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height});
      const union=rs=>{const x=Math.min(...rs.map(r=>r.x)),y=Math.min(...rs.map(r=>r.y));return{x,y,width:Math.max(...rs.map(r=>r.x+r.width))-x,height:Math.max(...rs.map(r=>r.y+r.height))-y}};
      const matches=texts.map(value=>{const needle=value.replace(/\\s+/g,' ').trim();if(!needle)throw Error('EMPTY_ANCHOR');const first=text.indexOf(needle);if(first<0)throw Error('ANCHOR_NOT_FOUND: '+value);if(text.indexOf(needle,first+1)>=0)throw Error('ANCHOR_AMBIGUOUS: '+value);
        const start=map[first],end=map[first+needle.length-1]+1;const a=nodes.findLast(v=>v.start<=start),b=nodes.findLast(v=>v.start<end);const range=document.createRange();range.setStart(a.node,start-a.start);range.setEnd(b.node,end-b.start);
        const boxes=[...range.getClientRects()].filter(r=>r.width>0&&r.height>0).map(rect);if(!boxes.length)throw Error('ANCHOR_NOT_VISIBLE: '+value);
        // Merge boxes on the same visual line, retaining distinct wrapped lines.
        const lines=[];for(const box of boxes){const line=lines.find(r=>Math.abs(r.y-box.y)<2&&Math.abs(r.height-box.height)<4);if(line)Object.assign(line,union([line,box]));else lines.push(box);}
        return {text:value,rects:lines,bounds:union(lines)};
      });
      return {matches,root:rect(root.getBoundingClientRect()),pageWidth:Math.max(document.documentElement.scrollWidth,1440),pageHeight:Math.max(document.documentElement.scrollHeight,1000),location:location.href};
    })(${JSON.stringify(texts)})`});
    if(result.exceptionDetails) throw new Error(`${id}: ${result.exceptionDetails.exception?.description??result.exceptionDetails.text}`);
    const data=result.result.value;
    if(data.location!==pathToFileURL(snapshot).href)throw new Error(`${id}: 快照发生意外跳转`);
    const anchors=data.matches.map((m:any)=>m.bounds) as CaptureRect[];
    const targetRect=anchors.length?bounds(anchors):{...data.root,height:Math.min(900,data.root.height)};
    // Keep every excerpt/highlight in one image. Cap extreme pages instead of silently dropping text.
    const crop=id==="V07_003"?{x:Math.max(0,Math.floor(Math.min(data.root.x,targetRect.x)-24)),y:Math.max(0,Math.floor(targetRect.y-48)),width:0,height:Math.max(512,Math.ceil(targetRect.height+96))}:{x:0,y:Math.max(0,Math.floor(targetRect.y-140)),width:1440,height:Math.max(900,Math.ceil(targetRect.height+280))};
    if(id==="V07_003")crop.width=Math.min(1440,Math.ceil(Math.max(data.root.width,targetRect.x+targetRect.width-crop.x)+48));
    crop.width=Math.min(crop.width,data.pageWidth-crop.x);crop.height=Math.min(crop.height,data.pageHeight-crop.y);
    if(crop.height>12000||targetRect.x+targetRect.width>crop.x+crop.width+1||targetRect.y+targetRect.height>crop.y+crop.height+1)throw new Error(`${id}: 定位范围过大，无法在同一裁切图中完整展示`);
    const shot=await cdp.call("Page.captureScreenshot",{format:"png",captureBeyondViewport:true,clip:{...crop,scale:1}});
    const file=path.join(temp,"capture.png");await fs.writeFile(file,Buffer.from(shot.data,"base64"));
    const source=await context.resolveImage(file);
    const local=(r:CaptureRect):CaptureRect=>({...r,x:r.x-crop.x,y:r.y-crop.y});
    return {source,width:crop.width,height:crop.height,...(id==="V07_003"?{excerptRect:local(data.matches[0].bounds),highlightRects:data.matches.slice(1).map((m:any)=>({text:m.text,rects:m.rects.map(local)}))}:{focusRect:local(targetRect)})};
  } finally {if(cdp){await cdp.call("Browser.close",{},3000).catch(()=>{});cdp.close();}if(child){child.kill();await waitForExit(child);}await removePortraitTemporary(temp);}
}
function bounds(rs:CaptureRect[]):CaptureRect {const x=Math.min(...rs.map(r=>r.x)),y=Math.min(...rs.map(r=>r.y));return{x,y,width:Math.max(...rs.map(r=>r.x+r.width))-x,height:Math.max(...rs.map(r=>r.y+r.height))-y};}
