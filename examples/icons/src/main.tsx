import "@miaixz/icons/styles.css";
import "./styles.css";
import coreFontUrl from "@miaixz/icons/font.woff2?url";

import { Icon } from "@miaixz/icons";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const preload = document.createElement("link");
preload.rel = "preload";
preload.as = "font";
preload.type = "font/woff2";
preload.crossOrigin = "anonymous";
preload.href = coreFontUrl;
document.head.append(preload);

type CatalogEntry = (typeof import("@miaixz/icons/catalog").ICON_CATALOG)[number];
const namedSizes = ["indicator", "inline", "control", "navigation", "feature", "display"] as const;

function App() {
  const [canonicalCatalog, setCanonicalCatalog] = useState<readonly CatalogEntry[]>([]);
  const [query, setQuery] = useState("");
  const [fill, setFill] = useState(0);
  const [opticalSize, setOpticalSize] = useState(24);
  const [rtl, setRtl] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const visible = canonicalCatalog
    .filter((entry) =>
      `${entry.name} ${entry.category} ${entry.tier}`.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 160);
  useEffect(() => {
    let active = true;
    void import("@miaixz/icons/catalog").then(({ ICON_CATALOG }) => {
      if (active) {
        setCanonicalCatalog(
          ICON_CATALOG.filter((entry) => entry.source === "miaixz" && entry.status === "stable"),
        );
      }
    });
    return () => {
      active = false;
    };
  }, []);
  return (
    <main className={reducedMotion ? "reduce-motion" : undefined} dir={rtl ? "rtl" : "ltr"}>
      <header className="hero">
        <p className="eyebrow">@miaixz/icons · 0.6.5</p>
        <h1>一套字形，连续控制轮廓、填充与光学尺寸。</h1>
        <p>1024 个原创可变字体图标，64 个 Core 首屏字形，960 个 Extended 按需加载。</p>
      </header>

      <section className="controls" aria-label="图标参数">
        <label>
          搜索 name、category、tier
          <input value={query} onChange={(event) => setQuery(event.currentTarget.value)} />
        </label>
        <label>
          FILL {fill.toFixed(2)}
          <input
            max="1"
            min="0"
            step="0.01"
            type="range"
            value={fill}
            onChange={(event) => setFill(Number(event.currentTarget.value))}
          />
        </label>
        <label>
          opsz {opticalSize}
          <input
            max="40"
            min="12"
            step="1"
            type="range"
            value={opticalSize}
            onChange={(event) => setOpticalSize(Number(event.currentTarget.value))}
          />
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={rtl}
            onChange={(event) => setRtl(event.currentTarget.checked)}
          />
          RTL 对照
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(event) => setReducedMotion(event.currentTarget.checked)}
          />
          reduced-motion
        </label>
      </section>

      <section className="panel" aria-labelledby="catalog-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Miaixz variable font</p>
            <h2 id="catalog-title">目录 · {visible.length} / 1024 当前展示</h2>
          </div>
          <button type="button" onClick={() => setSimulateFailure((value) => !value)}>
            {simulateFailure ? "恢复字体" : "模拟 help 加载失败"}
          </button>
        </div>
        <div className="catalog">
          {visible.map((entry) => (
            <figure key={entry.name}>
              {entry.name === "help" && simulateFailure ? (
                <span
                  aria-label="help 图标加载失败"
                  className="miaixz-icon example-failed-icon"
                  data-state="failed"
                  role="img"
                />
              ) : (
                <Icon
                  fill={fill}
                  label={`${entry.name} 图标`}
                  motion={reducedMotion ? "none" : "auto"}
                  name={entry.name}
                  size={opticalSize}
                />
              )}
              <figcaption>{entry.name}</figcaption>
              <small>
                {entry.category} · {entry.tier}
              </small>
            </figure>
          ))}
        </div>
      </section>

      <section className="panel" aria-labelledby="sizes-title">
        <p className="eyebrow">Named instances</p>
        <h2 id="sizes-title">六个语义尺寸</h2>
        <div className="sizes">
          {namedSizes.map((size) => (
            <figure key={size}>
              <Icon fill={fill} name="rocket" size={size} />
              <figcaption>{size}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="panel metrics" aria-labelledby="metrics-title">
        <p className="eyebrow">交付预算</p>
        <h2 id="metrics-title">加载与包边界</h2>
        <dl>
          <div>
            <dt>Core</dt>
            <dd>64 glyphs · U+F0000–U+F003F</dd>
          </div>
          <div>
            <dt>Extended</dt>
            <dd>960 glyphs · U+F0040–U+F03FF</dd>
          </div>
          <div>
            <dt>动画</dt>
            <dd>180ms continuous FILL</dd>
          </div>
          <div>
            <dt>字体状态</dt>
            <dd>{document.fonts.status}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}

createRoot(document.querySelector("#root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
