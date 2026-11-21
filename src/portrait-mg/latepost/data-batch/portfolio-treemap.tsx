import {Img, useCurrentFrame, useVideoConfig} from "remotion";
import {asset, clamp, ease, type PortraitDemo} from "../../common";
import {portfolioTreemapContract, sumTreeShares, type PortfolioTreemapSpec} from "./portfolio-treemap-contract";

type Box = {x: number; y: number; w: number; h: number};
type Tile = Box & {
  label: string; subtitle?: string; fill: string; size: number; at: number;
  anchor?: "right" | "bottom"; wrap?: number; align?: "left";
};

const uses = {stock: "#d26f6b", alternative: "#699abe", fixedIncome: "#688770", infrastructure: "#9a849f"};
const top = 191.5;
const left = 67.5;
const width = 213.5;
const height = 243;
const gutter = 2.8;
const song = "SimSun,serif";
const sans = "'Microsoft YaHei',sans-serif";
const numerals = "'Times New Roman',serif";
const enter = (value: number) => 1 - (1 - clamp(value)) ** 2.5;
const split = (a: number, b: number) => (a + b) > 0 ? a / (a + b) : 0;

function layout(spec: PortfolioTreemapSpec) {
  const shares = spec.stock.cells.map(cell => cell.share);
  const bondShares = spec.fixedIncome.cells.map(cell => cell.share);
  const stockShare = sumTreeShares(spec.stock.cells);
  const bondShare = sumTreeShares(spec.fixedIncome.cells);
  const total = stockShare + bondShare + spec.alternative.share + spec.infrastructure.share;
  const leftShare = shares[0] + shares[1] + spec.alternative.share;
  const rightShare = total - leftShare;
  const lw = width * leftShare / total;
  const rx = left + lw;
  const rw = width - lw;
  const leftFirst = height * shares[0] / leftShare;
  const leftSecond = height * shares[1] / leftShare;
  const rightTop = height * shares[2] / rightShare;
  const stockRight = height * (stockShare - shares[0] - shares[1]) / rightShare;
  const bottomStock = stockRight - rightTop;
  const emerging = rw * shares[3] / (shares[3] + shares[4] + shares[5] + shares[6]);
  const usaHeight = bottomStock * shares[4] / (shares[4] + shares[5] + shares[6]);
  const smallStock = (rw - emerging) * split(shares[5], shares[6]);
  const bondHeight = height * bondShare / rightShare;
  const bondStart = top + stockRight;
  const corp = rw * bondShares[0] / bondShare;
  const bondUpper = bondHeight * bondShares[1] / (bondShare - bondShares[0]);
  const bondSmall = (rw - corp) * split(bondShares[2], bondShares[3]);
  const stock = spec.stock.cells.map(cell => cell.label);
  const bond = spec.fixedIncome.cells.map(cell => cell.label);
  const tiles: Tile[] = [
    {x:left,y:top,w:lw,h:leftFirst,label:stock[0],fill:uses.stock,size:14,at:.11,anchor:"right"},
    {x:rx,y:top,w:rw,h:rightTop,label:stock[2],fill:uses.stock,size:13,at:.15},
    {x:left,y:top+leftFirst,w:lw,h:leftSecond,label:stock[1],fill:uses.stock,size:13,at:.26,anchor:"right"},
    {x:rx,y:top+rightTop,w:emerging,h:bottomStock,label:stock[3],fill:uses.stock,size:9,at:.48,wrap:2},
    {x:rx+emerging,y:top+rightTop,w:rw-emerging,h:usaHeight,label:stock[4],fill:uses.stock,size:11,at:.54},
    {x:rx+emerging,y:top+rightTop+usaHeight,w:smallStock,h:bottomStock-usaHeight,label:stock[5],fill:uses.stock,size:6.5,at:.66,wrap:4,align:"left"},
    {x:rx+emerging+smallStock,y:top+rightTop+usaHeight,w:rw-emerging-smallStock,h:bottomStock-usaHeight,label:stock[6],fill:uses.stock,size:6.2,at:.71},
    {x:left,y:top+leftFirst+leftSecond,w:lw,h:height-leftFirst-leftSecond,label:spec.alternative.label,subtitle:spec.alternative.subtitle,fill:uses.alternative,size:17,at:.32,anchor:"right"},
    {x:rx,y:bondStart,w:corp,h:bondHeight,label:bond[0],fill:uses.fixedIncome,size:9,at:.43,wrap:3,align:"left"},
    {x:rx+corp,y:bondStart,w:rw-corp,h:bondUpper,label:bond[1],fill:uses.fixedIncome,size:7.3,at:.61},
    {x:rx+corp,y:bondStart+bondUpper,w:bondSmall,h:bondHeight-bondUpper,label:bond[2],fill:uses.fixedIncome,size:6,at:.70},
    {x:rx+corp+bondSmall,y:bondStart+bondUpper,w:rw-corp-bondSmall,h:bondHeight-bondUpper,label:bond[3],fill:uses.fixedIncome,size:5.5,at:.77},
    {x:rx,y:bondStart+bondHeight,w:rw,h:height-stockRight-bondHeight,label:spec.infrastructure.label,fill:uses.infrastructure,size:9,at:.39,anchor:"bottom"},
  ];
  return {tiles, stockShare, bondShare};
}

function TreeTile({tile, time}: {tile: Tile; time: number}) {
  const d = ease((time - tile.at) / .43);
  const w = (tile.w - gutter) * d;
  const h = (tile.h - gutter) * d;
  const x = tile.x + (tile.anchor === "right" ? tile.w - gutter - w : 0);
  const y = tile.y + (tile.anchor === "bottom" ? tile.h - gutter - h : 0);
  const textOpacity = ease((time - tile.at - .14) / .31);
  const chunks = tile.wrap ? Array.from(tile.label).reduce<string[]>((lines, char, index) => {
    if (index % tile.wrap! === 0) lines.push(char);
    else lines[lines.length - 1] += char;
    return lines;
  }, []) : [tile.label];
  const tx = tile.align === "left" ? tile.x + Math.min(6, tile.w / 10) : tile.x + (tile.w - gutter) / 2;
  const ty = tile.y + (tile.h - gutter) / 2 + (tile.subtitle ? 0 : tile.size * .34) - (chunks.length - 1) * tile.size * .51;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={2.8 * d} fill={tile.fill} opacity={.48 * d}/>
      <text x={tx} y={ty} textAnchor={tile.align === "left" ? "start" : "middle"} opacity={textOpacity} fill="#fffefa" fontFamily={song} fontWeight={700} fontSize={tile.size}>
        {chunks.map((chunk,index) => <tspan key={index} x={tx} dy={index ? tile.size * 1.08 : 0}>{chunk}</tspan>)}
      </text>
      {tile.subtitle && <text x={tx} y={ty + 13} textAnchor="middle" opacity={textOpacity} fill="#fffefa" fontFamily={song} fontSize={8.3} fontWeight={600}>{tile.subtitle}</text>}
    </g>
  );
}

const notes = [
  {x:36,y:180,w:95,h:29,size:20},
  {x:17,y:312,w:127,h:39,size:26},
  {x:239,y:237,w:91,h:24,size:17},
];

function Percent({x, y, label, value, fill, time, delay, above}: {
  x: number; y: number; label: string; value: number; fill: string; time: number; delay: number; above?: boolean;
}) {
  const progress = enter((time - delay) / 2.34);
  const number = progress === 1 ? Number(value.toFixed(1)) : Math.round(value * progress);
  const labelWidth = Array.from(label).length * 9.5;
  const chunks = above && label.length > 5 ? [label.slice(0, 4), label.slice(4)] : [label];
  return (
    <g opacity={ease((time - delay + .03) / .47)}>
      {chunks.map((chunk,index) => <text key={index} x={x} y={above ? y - 40 + index * 12 : y} fontFamily={sans} fontSize={9.3} fill="#a59d96" opacity={.55}>{chunk}</text>)}
      <text x={x + (above ? 0 : labelWidth + 3)} y={y} fill={fill} fontFamily={numerals} fontWeight={700} fontSize={27}>
        {number}<tspan dx={1} fontSize={15} fontWeight={500}>%</tspan>
      </text>
    </g>
  );
}

function PortfolioTreemap({spec}: {spec: PortfolioTreemapSpec}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  const {tiles, stockShare, bondShare} = layout(spec);
  return (
    <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 75% 27% at 49% 106%,#fce4e1 0%,transparent 100%),radial-gradient(ellipse 72% 48% at 44% 55%,#f8f1e8,transparent 99%),linear-gradient(#fbf7f3,#fff8f2)"}}>
      <Img src={asset(spec.portraitImage)} style={{position:"absolute",left:33,top:184,width:294,height:285,objectFit:"contain",opacity:.2,filter:"grayscale(1)"}}/>
      <svg width={360} height={640} viewBox="0 0 360 640" style={{position:"absolute",inset:0}}>
        <text x={27} y={141} transform="translate(27 0) scale(.945 1) translate(-27 0)" fontFamily={sans} fontWeight={800} fontSize={20.5} fill="#141210">{spec.title}</text>
        {tiles.map((tile,index) => <TreeTile key={index} tile={tile} time={time}/>)}
        <Percent x={183} y={183} label={spec.stock.label} value={stockShare} fill="#b12618" time={time} delay={.19}/>
        <Percent x={68} y={459} label={spec.alternative.label} value={spec.alternative.share} fill="#075375" time={time} delay={.23}/>
        <Percent x={285} y={379} label={spec.fixedIncome.label} value={bondShare} fill="#166046" time={time} delay={-.04} above/>
        <Percent x={186} y={459} label={spec.infrastructure.label} value={spec.infrastructure.share} fill="#64446e" time={time} delay={.16}/>
        {spec.principles.map(({text, at},index) => {
          const box = notes[index];
          const slide = ease((time - at) / .18);
          const textSlide = ease((time - at - .11) / .20);
          const visibleText = box.y + box.h / 2 + box.size * .36 + (1 - textSlide) * 12;
          return (
            <g key={index}>
              <defs><clipPath id={`latepost-portfolio-note-${index}`}><rect x={box.x} y={box.y} width={box.w*slide} height={box.h}/></clipPath></defs>
              <rect x={box.x} y={box.y} width={box.w*slide} height={box.h} fill="#fffefd"/>
              <text x={box.x+box.w/2} y={visibleText} clipPath={`url(#latepost-portfolio-note-${index})`} opacity={textSlide}
                textAnchor="middle" fontFamily={song} fontWeight={900} fontSize={box.size} fill="#090805">{text}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Leaf areas are measured from the source frame for this preview. The caller fills the real allocation.
const demo: PortraitDemo = {
  fps: 30, durationInFrames: 224, reference: "晚点LatePost · BV1rmWqzEEVU · 91.467063–98.933687（资产叶节点仅为视觉量取样例）",
  spec: {
    title:"诺贝尔基金会2024 年资产配置情况",
    portraitImage:"portrait-mg/latepost/data-batch/treemap-watermark.png",
    stock:{label:"股票类资产",cells:[
      {label:"全球股票",share:18.2},{label:"私募股权",share:12.8},{label:"瑞典市场",share:11},
      {label:"新兴市场",share:5.4},{label:"美国市场",share:4.9},{label:"其他发达国家",share:2.4},{label:"其他",share:1.3},
    ]},
    alternative:{label:"另类资产",share:24,subtitle:"（主要是对冲基金）"},
    fixedIncome:{label:"固定收益与现金",cells:[
      {label:"海外公司债",share:4.3},{label:"瑞典永续债",share:3.4},{label:"瑞士短期债务",share:2.6},{label:"其他",share:.7},
    ]},
    infrastructure:{label:"房地产与基础设施",share:9},
    principles:[{text:"全球化",at:4.0},{text:"分散化",at:4.59},{text:"低相关性",at:4.92}],
  } satisfies PortfolioTreemapSpec,
};

export const portfolioTreemap = {...portfolioTreemapContract, Component: PortfolioTreemap, demo} as const;
