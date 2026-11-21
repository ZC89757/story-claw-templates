import {useCurrentFrame, useVideoConfig} from "remotion";
import {clamp, ease, type PortraitDemo} from "../../common";
import {tierColumnFocusContract, type TierColumnFocusSpec} from "./tier-column-focus-contract";

const axes = {left: 26.5, right: 333.5, top: 171.5, bottom: 430};
const spans = [axes.left, 122, 213, axes.right];
const tiers = ["第一梯队", "第二梯队", "第三梯队"];
const focusPositions = [{x: 155, y: 295}, {x: 104, y: 288}, {x: 192, y: 367}];
const sans = "'Microsoft YaHei',sans-serif";
const song = "SimSun,serif";
const displayFont = "'Times New Roman',serif";
const centerAt = (index: number) => 29 + 7.54 * index;

function TierColumnFocus({spec}: {spec: TierColumnFocusSpec}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  const activeIndex = spec.focus.reduce((current, phase, index) => time >= phase.at ? index : current, -1);
  const phase = spec.focus[activeIndex];
  const since = phase ? time - phase.at : 0;
  const nextAt = spec.focus[activeIndex + 1]?.at ?? Infinity;
  const focusOut = ease((nextAt - time) / .15);
  const largest = spec.columns[0].value;
  const headline = clamp((time + .09) / .25);
  const width = axes.right - axes.left;
  const chartIn = clamp((time + .24) / .49);
  const chartLift = 10 * (1 - ease((time + .08) / .28));
  const mark = phase?.valueText.slice(0, -1) ?? "";
  const pop = ease((since - .29) / .15);
  const position = focusPositions[activeIndex];
  return (
    <div style={{position:"absolute", inset:0, background:"linear-gradient(#020003 22%,#161218 37%,#3d3a3e 67%,#545155 82%,#706d71 100%)"}}>
      <svg width={360} height={640} viewBox="0 0 360 640" style={{position:"absolute", inset:0}}>
        <defs>
          <clipPath id="latepost-tier-enter"><rect x={axes.left - 2} y={axes.top - 2} width={(width + 4) * chartIn} height={302}/></clipPath>
          <linearGradient id="latepost-tier-base" x2="0" y2="1"><stop stopColor="#980f0b"/><stop offset="1" stopColor="#b51910"/></linearGradient>
        </defs>
        <text x={28 + 21 * (1 - ease((time + .015) / .26))} y={135} transform="translate(28 0) scale(.935 1) translate(-28 0)" fill="#fafafa" fontFamily={sans} fontSize={18.4} fontWeight={800}>
          {Array.from(spec.title).map((char,index,list) => <tspan key={index} opacity={clamp(headline * (list.length + 1) - index)}>{char}</tspan>)}
        </text>
        <text x={28} y={156} fontFamily={sans} fontStyle="italic" fill="#a49e9e" fontSize={10.75}>{spec.sourceLine}</text>
        <g clipPath="url(#latepost-tier-enter)">
          {tiers.map((label,index) => (
            <g key={label}>
              <rect x={spans[index]} y={axes.top} width={spans[index + 1] - spans[index]} height={axes.bottom - axes.top} fill="#dad5db" opacity={[.22,.15,.09][index]}/>
              <text x={(spans[index] + spans[index + 1]) / 2} y={193} fontFamily={song} fontSize={11} textAnchor="middle" fill="#c3bdc3">{label}</text>
            </g>
          ))}
          {spec.columns.map(({label, value}, index) => {
            const x = centerAt(index);
            const h = value / largest * 220 * chartIn;
            const flagged = phase && index + 1 >= phase.firstColumn && index + 1 <= phase.lastColumn;
            return (
              <g key={index}>
                <rect x={x - 2.1} y={axes.bottom - h + chartLift} width={4.2} height={h} fill="url(#latepost-tier-base)" opacity={.69} />
                {flagged && <rect x={x - 2.1} y={axes.bottom - h} width={4.2} height={h} fill="#f31810" opacity={ease(since / .14) * focusOut}/>}
                <text x={x} y={438} textAnchor="middle" fill="#d3cfd2" fontFamily={song} fontSize={6.4}>
                  {Array.from(label.replace(/ /g, "")).map((char, charIndex) => <tspan key={charIndex} x={x} dy={charIndex ? 6.1 : 0}>{char}</tspan>)}
                </text>
              </g>
            );
          })}
        </g>
        {phase && position && <g opacity={focusOut} transform={`translate(0 ${7 * (1 - pop)})`}>
          <text x={position.x} y={position.y + 20} transform={`translate(${position.x} 0) scale(.81 1) translate(${-position.x} 0)`} fill="#fff" fontSize={14.2} fontFamily={song} fontWeight={800}>
            {Array.from(phase.label).map((char,index,list) => <tspan key={index} opacity={clamp(since / .28 * (list.length + 1) - index)}>{char}</tspan>)}
          </text>
          <text x={position.x + [-3, -17, 17][activeIndex]} y={position.y} opacity={pop} fill="#ef1710" fontFamily={displayFont} fontWeight={700} fontSize={88} letterSpacing={-4}>
            {mark.startsWith(">") || mark.startsWith("<") ? <><tspan fontSize={65} fontWeight={400}>{mark[0]}</tspan>{mark.slice(1)}</> : mark}
            <tspan fontSize={64}>%</tspan>
          </text>
        </g>}
      </svg>
    </div>
  );
}

const labels = ["荷兰","瑞士","西班牙","葡萄牙","德国","英国","比利时","澳大利亚","丹麦","法国","匈牙利","奥地利","波兰","意大利","瑞典","土耳其","捷克","美国","芬兰","挪威","希腊","爱尔兰","斯洛文尼亚","加拿大","阿根廷","冰岛","新西兰","印度","日本","智利","印度尼西亚","俄罗斯","泰国","中国","菲律宾","新加坡","韩国","乌克兰","墨西哥","巴西","马来西亚"];
// Preview-only measurements from the vertical length of the bars. Runtime takes the caller's own numbers.
const values = [55,51.5,51.5,47.5,43.5,43.5,40.5,38.5,35.5,35.5,35.5,34.5,33.5,31,27.5,27,26,26,24.5,23.5,22.5,21.5,21.5,17.5,17,13.5,13,11.5,11.5,10,10,10,9,8,7,7,6.5,5.5,3.5,1,1];
const demo: PortraitDemo = {
  fps: 30, durationInFrames: 357, reference: "晚点LatePost · BV18ZeB62Eas · 377.3025–389.202625（底柱仅为视觉量取样例）",
  spec: {
    title: "2025年全球主要市场的自有品牌渗透率",
    sourceLine: "数据来源: Euromonitor;自有品牌制造商协会(PLMA);尼尔森IQ",
    columns: labels.map((label,index) => ({label, value:values[index]})),
    focus: [
      {label:"美国商超自有品牌渗透率", valueText:"26%", firstColumn:18,lastColumn:18, at:1.62},
      {label:"西欧国家商超自有品牌渗透率", valueText:">40%", firstColumn:1,lastColumn:7, at:4.28},
      {label:"中国商超自有品牌渗透率", valueText:"8%", firstColumn:34,lastColumn:34, at:6.71},
    ],
  } satisfies TierColumnFocusSpec,
};

export const tierColumnFocus = {...tierColumnFocusContract, Component: TierColumnFocus, demo} as const;
