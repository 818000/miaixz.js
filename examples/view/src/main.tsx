import "@miaixz/icons/styles.css";
import "@miaixz/view/styles.css";
import "./styles.css";

import { FileView, ImageView, OfficeView, type ViewerProgress } from "@miaixz/view";
import { useState, type ChangeEvent } from "react";
import { createRoot } from "react-dom/client";

import sampleImageUrl from "./sample-preview.svg?url";
import sampleImageMarkup from "./sample-preview.svg?raw";
import systemFlowUrl from "../../../packages/view/tests/fixtures/xlsx/system-flow.xlsx?url";

type ExampleMode = "automatic" | "image" | "office" | "upload";

const modes: readonly {
  readonly id: ExampleMode;
  readonly label: string;
  readonly copy: string;
}[] = [
  { id: "automatic", label: "自动检测", copy: "FileView 根据来源证据选择 SVG 驱动。" },
  { id: "image", label: "图片组件", copy: "ImageView 提供缩放、旋转和应用动作插槽。" },
  { id: "office", label: "Office", copy: "OfficeView 在本地打开真实 XLSX 夹具。" },
  { id: "upload", label: "本地文件", copy: "选择的文件直接在当前浏览器标签页中解析。" },
];

const sampleFile = new File([sampleImageMarkup], "sample-preview.svg", { type: "image/svg+xml" });

function describeProgress(progress: ViewerProgress): string {
  if (progress.indeterminate || progress.completed === undefined || progress.total === undefined) {
    return `${progress.stage} 中`;
  }
  return `${progress.stage} ${String(progress.completed)} / ${String(progress.total)} ${progress.unit ?? "items"}`;
}

function App() {
  const [mode, setMode] = useState<ExampleMode>("automatic");
  const [uploadedFile, setUploadedFile] = useState<File>();
  const [runtimeStatus, setRuntimeStatus] = useState("等待打开来源");
  const activeMode = modes.find((entry) => entry.id === mode) ?? modes[0];

  const handleFile = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.currentTarget.files?.[0];
    if (file === undefined) return;
    setUploadedFile(file);
    setRuntimeStatus(`已选择 ${file.name}`);
  };

  const commonCallbacks = {
    onProgress: (progress: ViewerProgress): void => setRuntimeStatus(describeProgress(progress)),
    onLoad: (): void => setRuntimeStatus("预览已就绪"),
    onError: (error: { readonly code: string }): void => setRuntimeStatus(`错误 ${error.code}`),
  };

  return (
    <main>
      <header className="hero">
        <div>
          <p className="package-name">@miaixz/view</p>
          <h1>文件留在本地，预览自动选择。</h1>
          <p>一个 React 外壳统一处理格式检测、资源限制、加载进度和安全错误。</p>
        </div>
        <dl className="capabilities" aria-label="预览器特性">
          <div>
            <dt>运行时</dt>
            <dd>浏览器本地</dd>
          </div>
          <div>
            <dt>选择方式</dt>
            <dd>证据评分</dd>
          </div>
          <div>
            <dt>来源</dt>
            <dd>URL / Blob / File</dd>
          </div>
        </dl>
      </header>

      <section className="viewer-layout" aria-label="文件预览示例">
        <aside className="mode-sidebar">
          <div>
            <p className="section-label">Public components</p>
            <h2>选择示例</h2>
          </div>
          <nav aria-label="预览示例">
            {modes.map((entry) => (
              <button
                aria-current={mode === entry.id ? "page" : undefined}
                key={entry.id}
                type="button"
                onClick={() => {
                  setMode(entry.id);
                  setRuntimeStatus("等待打开来源");
                }}
              >
                <strong>{entry.label}</strong>
                <span>{entry.copy}</span>
              </button>
            ))}
          </nav>

          <div className="format-list">
            <span>PDF</span>
            <span>DOCX</span>
            <span>XLSX</span>
            <span>PPTX</span>
            <span>SVG</span>
            <span>PNG</span>
            <span>EPUB</span>
            <span>ZIP</span>
          </div>
        </aside>

        <div className="preview-column">
          <div className="preview-heading">
            <div>
              <p className="section-label">{activeMode?.label}</p>
              <h2>{activeMode?.copy}</h2>
            </div>
            <span className="runtime-status" aria-live="polite">
              {runtimeStatus}
            </span>
          </div>

          {mode === "automatic" && (
            <FileView
              className="viewer-surface"
              key="automatic"
              labels={{ loading: "正在读取示例", error: "无法打开示例" }}
              source={sampleFile}
              {...commonCallbacks}
            />
          )}

          {mode === "image" && (
            <ImageView
              actions={
                <a className="viewer-action" download href={sampleImageUrl}>
                  下载示例
                </a>
              }
              alt="Miaixz View 格式检测能力示例图"
              className="viewer-surface"
              labels={{
                toolbar: "图片工具栏",
                zoomIn: "放大",
                zoomOut: "缩小",
                rotateLeft: "向左旋转",
                rotateRight: "向右旋转",
              }}
              src={sampleImageUrl}
            />
          )}

          {mode === "office" && (
            <OfficeView
              className="viewer-surface"
              key="office"
              name="system-flow.xlsx"
              source={systemFlowUrl}
              {...commonCallbacks}
            />
          )}

          {mode === "upload" && (
            <div className="upload-example">
              <label className="drop-field">
                <input type="file" onChange={handleFile} />
                <strong>{uploadedFile === undefined ? "选择本地文件" : uploadedFile.name}</strong>
                <span>文件仅在当前浏览器标签页中读取，不会上传。</span>
              </label>
              {uploadedFile === undefined ? (
                <div className="empty-preview">
                  <span>File / Blob</span>
                  <p>选择文件后，FileView 会自动检测格式并渲染结果。</p>
                </div>
              ) : (
                <FileView
                  className="viewer-surface"
                  key={`${uploadedFile.name}-${String(uploadedFile.lastModified)}`}
                  source={uploadedFile}
                  {...commonCallbacks}
                />
              )}
            </div>
          )}
        </div>
      </section>

      <section className="integration-note" aria-labelledby="integration-title">
        <div>
          <p className="section-label">Integration boundary</p>
          <h2 id="integration-title">应用负责授权，View 负责预览。</h2>
        </div>
        <p>
          私有存储可以通过带请求头的远程来源或自定义 resourceProvider
          接入。解析器不会执行宏、脚本或远程转换。
        </p>
      </section>
    </main>
  );
}

const root = document.querySelector<HTMLDivElement>("#root");
if (root === null) throw new Error("App root is missing.");

createRoot(root).render(<App />);
