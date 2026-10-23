const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(process.argv[2]);
const allowed=new Set(['index.html','automotive.mp4','semiconductor.mp4','coffee.mp4',...['automotive','semiconductor','coffee'].flatMap(s=>['intro','flow','compare'].map(k=>`review/${s}-${k}.png`))]);
const server=http.createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
  let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';}catch{res.writeHead(400);return res.end();}
  if(!allowed.has(name)){res.writeHead(404);return res.end();}
  const file=path.join(root,name);if(!fs.existsSync(file)){res.writeHead(404);return res.end();}
  const size=fs.statSync(file).size,type=name.endsWith('.mp4')?'video/mp4':name.endsWith('.png')?'image/png':'text/html; charset=utf-8';
  let start=0,end=size-1,status=200;
  if(req.headers.range){const m=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!m||+m[1]>=size){res.writeHead(416,{'Content-Range':`bytes */${size}`});return res.end();}start=+m[1];end=m[2]?Math.min(+m[2],end):end;if(end<start){res.writeHead(416);return res.end();}status=206;}
  res.writeHead(status,{'Content-Type':type,'Content-Length':end-start+1,'Accept-Ranges':'bytes','Cache-Control':'no-cache',...(status===206?{'Content-Range':`bytes ${start}-${end}/${size}`}:{})});
  if(req.method==='HEAD')return res.end();const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>res.destroy());stream.pipe(res);
});
server.listen(0,'127.0.0.1',()=>{const url=`http://127.0.0.1:${server.address().port}/`;fs.writeFileSync(path.join(root,'review/server.json'),JSON.stringify({url,pid:process.pid}));console.log(url);});
