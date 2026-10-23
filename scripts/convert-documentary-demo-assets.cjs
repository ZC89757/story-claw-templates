const sharp=require('../../story-claw/node_modules/sharp'); const fs=require('fs');
(async()=>{for(const dir of ['public/generic-documentary','public/documentary-design-v3'])for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.svg'))) {if(dir.endsWith('documentary-design-v3')&&!['factory.svg','cells.svg','fastback.svg','battery-pack.svg','sedan.svg'].includes(f))continue; await sharp(dir+'/'+f).png().toFile('public/generic-documentary/'+f.replace('.svg','.png'));}})().catch(e=>{console.error(e);process.exit(1)});

