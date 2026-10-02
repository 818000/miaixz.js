"use client";

import {
  FileView,
  ImageView,
  OfficeView,
  defaultResourceBudget,
  detectBrowserSupport,
  detectFormat,
  getFormatDescriptors,
  getFormatParityRecords,
  type BrowserSupport,
  type ViewerProgress,
} from "@miaixz/view";
import { useEffect, useMemo, useState } from "react";

import { CodeBlock, GuideHeader, GuideSection, Stat } from "../../shared/guide/guide-parts";
import styles from "./view-guide.module.css";

type PreviewMode = "office" | "image" | "file";

const modes: readonly { id: PreviewMode; label: string }[] = [
  { id: "office", label: "OfficeView" },
  { id: "image", label: "ImageView" },
  { id: "file", label: "FileView" },
];

function progressLabel(progress: ViewerProgress | null): string {
  if (!progress) return "等待预览";
  if (progress.indeterminate || progress.total === undefined) return progress.stage;
  return `${progress.stage} ${String(progress.completed ?? 0)}/${String(progress.total)}`;
}

/**
 * Compares the focused viewers with the automatic FileView integration.
 */
export function ViewGuide() {
  const [mode, setMode] = useState<PreviewMode>("office");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<ViewerProgress | null>(null);
  const [browser, setBrowser] = useState<BrowserSupport | null>(null);
  const descriptors = useMemo(() => getFormatDescriptors(), []);
  const parity = useMemo(() => getFormatParityRecords(), []);
  const spreadsheetDecision = useMemo(
    () => detectFormat("system-flow.xlsx", undefined, new Uint8Array()),
    [],
  );

  useEffect(() => {
    setBrowser(detectBrowserSupport());
  }, []);

  const supportedFeatures = browser ? Object.values(browser).filter(Boolean).length : 0;
  const completeFormats = parity.filter(
    (record) => record.currentLevel === record.targetLevel,
  ).length;

  return (
    <div>
      <GuideHeader
        packageName="@miaixz/view"
        title="先识别，再解析，最后交给用户控制。"
        description="在同一预览区域切换 Office、图片和任意本地文件，观察格式识别、进度与资源限制的实际行为。"
      />

      <GuideSection
        title="能力基线"
        description="格式矩阵和资源预算来自包内运行时，示例不复制识别规则。"
      >
        <div className={styles.stats}>
          <Stat label="格式描述" value={descriptors.length} detail="内置与可注册驱动" />
          <Stat label="达到目标" value={completeFormats} detail="当前 parity 等级" />
          <Stat label="浏览器能力" value={`${supportedFeatures}/6`} detail="基于特征检测" />
        </div>
      </GuideSection>

      <GuideSection
        title="预览工作台"
        description="Office 示例来自仓库测试夹具，图片来自本地品牌素材，上传文件不会离开浏览器。"
      >
        <div className={styles.toolbar} role="toolbar" aria-label="预览类型">
          {modes.map((item) => (
            <button
              aria-pressed={mode === item.id}
              key={item.id}
              onClick={() => {
                setMode(item.id);
                setProgress(null);
              }}
              type="button"
            >
              {item.label}
            </button>
          ))}
          <span aria-live="polite">{progressLabel(progress)}</span>
        </div>

        <div className={styles.viewerStage}>
          {mode === "office" ? (
            <OfficeView
              name="system-flow.xlsx"
              onProgress={setProgress}
              source="/fixtures/system-flow.xlsx"
            />
          ) : null}
          {mode === "image" ? (
            <ImageView
              alt="Miaixz 深色品牌标志"
              initialScale={0.55}
              src="/fixtures/miaixz-logo-dark.png"
            />
          ) : null}
          {mode === "file" ? (
            file ? (
              <FileView name={file.name} onProgress={setProgress} source={file} />
            ) : (
              <label className={styles.dropTarget}>
                <span>选择一个本地文件</span>
                <small>FileView 会根据扩展名、MIME 和文件签名选择驱动。</small>
                <input
                  onChange={(event) => setFile(event.currentTarget.files?.[0] ?? null)}
                  type="file"
                />
              </label>
            )
          ) : null}
        </div>
      </GuideSection>

      <GuideSection title="识别与预算" description="宿主可以收紧资源上限，但不能越过包内硬限制。">
        <div className={styles.diagnostics}>
          <div>
            <span>system-flow.xlsx</span>
            <strong>{spreadsheetDecision.driver ?? "unknown"}</strong>
            <code>confidence: {spreadsheetDecision.confidence}</code>
          </div>
          <div>
            <span>默认源文件上限</span>
            <strong>{Math.round(defaultResourceBudget.maxSourceBytes / 1024 / 1024)} MB</strong>
            <code>defaultResourceBudget.maxSourceBytes</code>
          </div>
          <div>
            <span>默认工作表上限</span>
            <strong>{defaultResourceBudget.maxSpreadsheetSheets}</strong>
            <code>maxSpreadsheetSheets</code>
          </div>
        </div>
        <CodeBlock>{`import { FileView, OfficeView } from "@miaixz/view";
import "@miaixz/view/styles.css";

<OfficeView name="report.xlsx" source="/report.xlsx" />
<FileView source={selectedFile} />`}</CodeBlock>
      </GuideSection>

      <GuideSection
        title="接入选择"
        description="优先选最窄的组件边界，需要自动判断格式时再使用 FileView。"
      >
        <div className={styles.choices}>
          <article>
            <h3>ImageView</h3>
            <p>已知来源是图片，需要缩放、旋转和替换工具栏动作。</p>
          </article>
          <article>
            <h3>OfficeView</h3>
            <p>已知来源是 Office 文件，需要本地解析并保留原始文件名。</p>
          </article>
          <article>
            <h3>FileView</h3>
            <p>来源类型不固定，需要统一处理识别、进度、错误和恢复动作。</p>
          </article>
        </div>
      </GuideSection>
    </div>
  );
}
