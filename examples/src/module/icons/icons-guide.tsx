"use client";

import { ICON_CATALOG, Icon, type IconName, type IconSize } from "@miaixz/icons";
import { useMemo, useState } from "react";

import { CodeBlock, GuideHeader, GuideSection, Stat } from "../../shared/guide/guide-parts";
import styles from "./icons-guide.module.css";

const semanticSizes: readonly IconSize[] = [
  "indicator",
  "inline",
  "control",
  "navigation",
  "feature",
  "display",
];
const pageSize = 120;

/**
 * Presents the complete variable-font icon catalog with live React controls.
 */
export function IconsGuide() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [fill, setFill] = useState(0);
  const [opsz, setOpsz] = useState(24);
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");
  const [visibleLimit, setVisibleLimit] = useState(pageSize);
  const [selected, setSelected] = useState<IconName>(ICON_CATALOG[0]!.name);

  const categories = useMemo(
    () => [...new Set(ICON_CATALOG.map((record) => record.category))].sort(),
    [],
  );
  const matches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return ICON_CATALOG.filter((record) => {
      const categoryMatches = category === "all" || record.category === category;
      const queryMatches =
        normalizedQuery === "" ||
        record.name.includes(normalizedQuery) ||
        (record.aliases as readonly string[]).some((alias) => alias.includes(normalizedQuery));
      return categoryMatches && queryMatches;
    });
  }, [category, query]);
  const visible = matches.slice(0, visibleLimit);
  const selectedRecord = ICON_CATALOG.find((record) => record.name === selected)!;
  const accessibility = selectedRecord.name.replaceAll("-", " ");

  return (
    <div>
      <GuideHeader
        packageName="@miaixz/icons"
        title="从目录到字形，一眼验证。"
        description="直接使用 ICON_CATALOG 与 Icon 组件。搜索名称，调整可变字体轴，并检查 RTL 与可访问标签。"
      />

      <GuideSection title="目录概览" description="数据来自包内生成目录，不维护第二份演示清单。">
        <div className={styles.stats}>
          <Stat label="图标记录" value={ICON_CATALOG.length} detail="稳定目录与扩展层" />
          <Stat label="分类" value={categories.length} detail="按使用语境分组" />
          <Stat label="渲染方式" value="WOFF2" detail="单一可变字体" />
        </div>
      </GuideSection>

      <GuideSection
        title="字形检查器"
        description="FILL 在 0 到 1 之间连续变化，opsz 由数值尺寸驱动。方向切换可核对需要镜像的图标。"
      >
        <div className={styles.inspector} dir={direction}>
          <div className={styles.preview}>
            <Icon fill={fill} label={`${accessibility} 图标预览`} name={selected} size={opsz} />
            <div>
              <strong>{selected}</strong>
              <span>{selectedRecord.category}</span>
            </div>
          </div>
          <div className={styles.controls} dir="ltr">
            <label>
              <span>FILL {fill.toFixed(2)}</span>
              <input
                max="1"
                min="0"
                onChange={(event) => setFill(Number(event.currentTarget.value))}
                step="0.05"
                type="range"
                value={fill}
              />
            </label>
            <label>
              <span>opsz {opsz}px</span>
              <input
                max="40"
                min="12"
                onChange={(event) => setOpsz(Number(event.currentTarget.value))}
                step="1"
                type="range"
                value={opsz}
              />
            </label>
            <fieldset>
              <legend>direction</legend>
              <button
                aria-pressed={direction === "ltr"}
                onClick={() => setDirection("ltr")}
                type="button"
              >
                LTR
              </button>
              <button
                aria-pressed={direction === "rtl"}
                onClick={() => setDirection("rtl")}
                type="button"
              >
                RTL
              </button>
            </fieldset>
          </div>
        </div>
        <div className={styles.semanticSizes}>
          {semanticSizes.map((size) => (
            <div key={size}>
              <Icon name={selected} size={size} />
              <code>{size}</code>
            </div>
          ))}
        </div>
        <CodeBlock>{`import { Icon } from "@miaixz/icons";

<Icon
  name="${selected}"
  size="navigation"
  fill={${fill.toFixed(2)}}
  label="${accessibility}"
/>`}</CodeBlock>
      </GuideSection>

      <GuideSection
        title="完整图标目录"
        description="搜索同时匹配规范名称与别名。选择任意字形后，上方检查器会立即更新。"
      >
        <div className={styles.filters}>
          <label>
            <span>搜索名称</span>
            <input
              onChange={(event) => {
                setQuery(event.currentTarget.value);
                setVisibleLimit(pageSize);
              }}
              placeholder="例如 arrow、file、user"
              type="search"
              value={query}
            />
          </label>
          <label>
            <span>分类</span>
            <select
              onChange={(event) => {
                setCategory(event.currentTarget.value);
                setVisibleLimit(pageSize);
              }}
              value={category}
            >
              <option value="all">全部分类</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <span aria-live="polite">{matches.length} 个结果</span>
        </div>

        {visible.length > 0 ? (
          <div className={styles.catalog} dir={direction}>
            {visible.map((record) => (
              <button
                aria-pressed={selected === record.name}
                className={styles.iconItem}
                key={record.name}
                onClick={() => setSelected(record.name)}
                type="button"
              >
                <Icon fill={fill} name={record.name} size={opsz} />
                <span>{record.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className={styles.empty} role="status">
            没有匹配的图标。请调整名称或分类。
          </div>
        )}

        {visible.length < matches.length ? (
          <button
            className={styles.more}
            onClick={() => setVisibleLimit((current) => current + pageSize)}
            type="button"
          >
            加载更多
          </button>
        ) : null}
      </GuideSection>
    </div>
  );
}
