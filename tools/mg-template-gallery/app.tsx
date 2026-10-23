import React, {useMemo, useRef, useState} from "react";
import {createRoot} from "react-dom/client";

type Tool = {name: string; label: string; description: string; parameters: unknown};
type Item = {
  template: string;
  htmlTag: string;
  style: string;
  name: string;
  structureName: string;
  category: string;
  renderMode: string;
  description: string;
  previewKind: string;
  isDefault?: boolean;
  useWhen: string;
  previewFile: string;
  examples?: {label: string; file: string}[];
  layerRole: string;
  planningTools?: Tool[];
};

function TemplateVideo({item}: {item: Item}) {
  const [src, setSrc] = useState(item.previewFile);
  return <div className="detail-stage"><video key={src} controls playsInline src={src} />
    {item.examples?.length ? <div style={{display:'flex',gap:12,padding:16,flexWrap:'wrap'}}>
      <button onClick={()=>setSrc(item.previewFile)}>模板预览</button>
      {item.examples.map(d=><button key={d.file} onClick={()=>setSrc(d.file)}>{d.label} · 完整 demo</button>)}
    </div> : null}
  </div>;
}

const keyOf = (item: Item) => `${item.template}::${item.style}`;

async function writeClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {}
  }
  const area = document.createElement("textarea");
  area.value = value;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  const copied = document.execCommand("copy");
  area.remove();
  if (!copied) throw new Error("copy unavailable");
}

function CopyButton({value}: {value: string}) {
  const [label, setLabel] = useState("复制");
  return <button className="copy" onClick={async (event) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await writeClipboard(value);
      setLabel("已复制");
    } catch {
      setLabel("复制失败");
    }
    window.setTimeout(() => setLabel("复制"), 1200);
  }}>{label}</button>;
}

function detailJsonFor(item: Item) {
  const tools = (item.planningTools ?? []).map(({name, description, parameters}) => ({name, description, parameters}));
  return JSON.stringify({functionCalling: tools.length === 1 ? tools[0] : tools}, null, 2);
}

function HoverVideo({src}: {src: string}) {
  const ref = useRef<HTMLVideoElement>(null);
  return <video
    ref={ref}
    className="preview"
    muted
    loop
    playsInline
    preload="metadata"
    src={src}
    onMouseEnter={() => ref.current?.play().catch(() => {})}
    onMouseLeave={() => {
      if (!ref.current) return;
      ref.current.pause();
      ref.current.currentTime = 0;
    }}
  />;
}

function Gallery({catalog}: {catalog: Item[]}) {
  const [category, setCategory] = useState("全部");
  const [structure, setStructure] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Item | null>(null);
  const tree = useMemo(() => {
    const categories = new Map<string, Map<string, Item[]>>();
    catalog.forEach((item) => {
      if (!categories.has(item.category)) categories.set(item.category, new Map());
      const groups = categories.get(item.category)!;
      if (!groups.has(item.structureName)) groups.set(item.structureName, []);
      groups.get(item.structureName)!.push(item);
    });
    return [...categories];
  }, [catalog]);
  const rows = useMemo(() => catalog.filter((item) =>
    (category === "全部" || item.category === category)
    && (!structure || item.structureName === structure)
    && (!query || [item.name, item.style, item.template, item.structureName, item.category, item.description]
      .join(" ").toLowerCase().includes(query.toLowerCase())),
  ), [catalog, category, structure, query]);

  if (selected) {
    const detailJson = detailJsonFor(selected);
    return <main className="detail-main">
      <button className="back" onClick={() => setSelected(null)}>← 返回模板列表</button>
      <div className="detail-layout">
        <TemplateVideo key={keyOf(selected)} item={selected} />
        <article className="detail-panel">
          <div className="eyebrow">{selected.category} · {selected.layerRole}</div>
          <h2>{selected.name}</h2>
          <p className="detail-id">{selected.template} / {selected.style}</p>
          <p className="detail-description">{selected.description}</p>
          <div className="facts">
            <div className="fact"><small>HTML 标签</small>&lt;{selected.htmlTag}&gt;</div>
            <div className="fact"><small>结构</small>{selected.structureName}</div>
            <div className="fact"><small>预览类型</small>{selected.previewKind}</div>
            <div className="fact"><small>图层职责</small>{selected.layerRole}</div>
            <div className="fact fact-wide"><small>适用场景</small>{selected.useWhen}</div>
          </div>
          <details className="json-block">
            <summary className="json-summary">
              <span>查看 Function Calling 参数契约</span>
              <CopyButton value={detailJson} />
            </summary>
            <pre>{detailJson}</pre>
          </details>
        </article>
      </div>
    </main>;
  }

  return <>
    <aside className="sidebar">
      <div className="brand"><img src="/assets/logo.png" /><b>Story Claw</b></div>
      <nav className="nav">
        <button className={`nav-btn ${category === "全部" && !structure ? "active" : ""}`} onClick={() => {
          setCategory("全部");
          setStructure("");
        }}><span>全部样式</span><span className="count">{catalog.length}</span></button>
        {tree.map(([cat, groups]) => {
          const isOpen = open.has(cat);
          const count = [...groups.values()].reduce((total, items) => total + items.length, 0);
          return <div className="tree-root" key={cat}>
            <div className="tree-branch">
              <button className={`tree-category ${category === cat && !structure ? "active" : ""}`} onClick={() => {
                setCategory(cat);
                setStructure("");
              }}><span className="label">{cat}</span><span className="count">{count}</span></button>
              <button className="toggle" aria-expanded={isOpen} onClick={() => setOpen((previous) => {
                const next = new Set(previous);
                next.has(cat) ? next.delete(cat) : next.add(cat);
                return next;
              })}><span className={`arrow ${isOpen ? "open" : ""}`} /></button>
            </div>
            {isOpen && <div className="tree-group">{[...groups].map(([name, items]) =>
              <button className={`nav-btn ${category === cat && structure === name ? "active" : ""}`} key={name} onClick={() => {
                setCategory(cat);
                setStructure(name);
              }}><span className="label">{name}</span><span className="count">{items.length}</span></button>,
            )}</div>}
          </div>;
        })}
      </nav>
    </aside>
    <main>
      <div className="toolbar"><label className="search">⌕<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索名称、样式 ID、模板类型…" /></label></div>
      <div className="active-row"><strong>{category === "全部" ? "全部模板" : structure ? `${category} / ${structure}` : `${category}分类`}</strong><span>{rows.length} 个结果</span></div>
      <section className="gallery">{rows.map((item) => <article className="card" key={keyOf(item)} onClick={() => setSelected(item)}>
        <div className="video-wrap"><HoverVideo src={item.previewFile} /><span className="play-hint">▶</span></div>
        <div className="card-body"><div className="category">{item.category}{item.isDefault ? " · 默认" : ""}</div><h2>{item.name}</h2><div className="style-id">{item.style}</div></div>
      </article>)}</section>
    </main>
  </>;
}

async function boot() {
  const response = await fetch("/api/catalog", {cache: "no-store"});
  if (!response.ok) throw new Error("无法读取模板目录");
  createRoot(document.getElementById("root")!).render(<div className="app"><Gallery catalog={await response.json()} /></div>);
}

boot().catch((error) => {
  document.getElementById("root")!.textContent = error instanceof Error ? error.message : "预览加载失败";
});
