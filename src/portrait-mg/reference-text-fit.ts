// Unkerned Times New Roman Italic ASCII metrics (C:/Windows/Fonts/timesi.ttf, units/em 2048).
// Validate content against the fixed card style; never resize text to fit.
const glyphs: readonly (readonly number[])[] = [[512,0,0],[682,154,650],[860,294,926],[1024,37,987],[1024,86,1001],[1706,144,1673],[1593,98,1501],[438,269,535],[682,140,906],[682,-223,543],[1024,145,880],[1382,37,1115],[512,-21,272],[682,54,613],[512,69,272],[569,-69,781],[1024,122,1011],[1024,125,855],[1024,32,960],[1024,68,929],[1024,64,997],[1024,73,981],[1024,129,1076],[1024,232,1072],[1024,78,1001],[1024,59,1005],[682,122,537],[682,36,540],[1382,39,1115],[1382,37,1116],[1382,37,1113],[1024,198,939],[1884,97,1836],[1251,-100,1120],[1251,-47,1209],[1366,138,1441],[1479,-61,1443],[1251,-46,1295],[1251,-50,1369],[1479,142,1484],[1479,-54,1661],[682,-64,840],[909,-70,1120],[1366,-55,1492],[1139,-66,1071],[1706,-67,1892],[1366,-57,1560],[1479,122,1470],[1251,-49,1272],[1479,97,1469],[1251,-47,1186],[1024,14,1110],[1139,143,1330],[1479,218,1667],[1251,256,1481],[1706,249,1933],[1251,-137,1517],[1139,184,1366],[1139,-4,1251],[797,13,965],[569,218,474],[797,-205,747],[864,56,942],[1024,-17,1042],[682,360,690],[1024,48,961],[1024,54,961],[909,60,876],[1024,39,1108],[909,64,881],[569,-357,965],[1024,-55,1067],[1024,41,940],[569,88,558],[569,-348,574],[909,20,999],[569,79,609],[1479,35,1390],[1024,39,941],[1024,60,947],[1024,-226,968],[1024,45,971],[797,42,829],[797,-19,743],[569,84,611],[1024,60,964],[909,44,906],[1366,35,1355],[909,-72,896],[909,-160,902],[797,-57,807],[819,224,1055],[563,161,244],[819,-70,761],[1108,44,1111]];
const rows: Record<string, {size:number; spacing:number; width:number}> = {
  titleSubtitle:{size:14,spacing:1.22,width:239},
  leftSubtitle:{size:10,spacing:.88,width:153},
  rightSubtitle:{size:10,spacing:.75,width:153},
};
export function validateFixedCardSubtitle(key:string,text:string) {
  const row=rows[key];if(!row)return;
  let advance=0,left=0,right=0;
  for(const char of text) {
    const metric=glyphs[char.charCodeAt(0)-32];
    if(!metric)throw new Error('V21_008.'+key+': expected printable ASCII subtitle');
    left=Math.min(left,advance+metric[1]*row.size/2048);
    right=Math.max(right,advance+metric[2]*row.size/2048);
    advance+=metric[0]*row.size/2048+row.spacing;
  }
  // Centered text may overhang its advance box; reserve the original soft shadow.
  const extent=advance+2*Math.max(0,-left,right-advance)+4;
  if(extent>row.width)throw new Error('V21_008.'+key+': text exceeds the fixed subtitle width; shorten the wording');
}
