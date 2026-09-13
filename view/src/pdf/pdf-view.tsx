/*
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~                                                                           ~
 ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~
 ~                                                                           ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");           ~
 ~ you may not use this file except in compliance with the License.          ~
 ~ You may obtain a copy of the License at                                   ~
 ~                                                                           ~
 ~      https://www.apache.org/licenses/LICENSE-2.0                          ~
 ~                                                                           ~
 ~ Unless required by applicable law or agreed to in writing, software       ~
 ~ distributed under the License is distributed on an "AS IS" BASIS,         ~
 ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  ~
 ~ See the License for the specific language governing permissions and       ~
 ~ limitations under the License.                                            ~
 ~                                                                           ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
*/

import { forwardRef, useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";

import { MiaixzViewError } from "../errors/view-error.js";
import { clamp, classNames } from "../shared/class-names.js";
import { useLatestRef } from "../shared/use-latest-ref.js";
import { usePdfRequest } from "./pdf-request.js";
import type {
  PdfDocumentInfo,
  PdfViewLabels,
  PdfViewProps,
  PdfViewSource,
} from "./pdf-view.types.js";

const defaultLabels: PdfViewLabels = {
  toolbar: "PDF preview controls",
  loading: "Loading PDF",
  error: "Unable to preview this PDF",
  previousPage: "Previous page",
  nextPage: "Next page",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  page: (current, total) => `${current} / ${total}`,
};

/**
 * Converts the public PDF source contract into isolated PDF.js loading parameters.
 *
 * @param source - Remote or in-memory PDF source.
 * @param httpHeaders - Optional remote request headers.
 * @param withCredentials - Whether remote requests include credentials.
 * @returns PDF.js document-loading parameters.
 */
function toDocumentSource(
  source: PdfViewSource,
  httpHeaders: Readonly<Record<string, string>> | undefined,
  withCredentials: boolean,
): Parameters<(typeof import("pdfjs-dist"))["getDocument"]>[0] {
  if (typeof source === "string" || source instanceof URL) {
    return {
      url: source.toString(),
      withCredentials,
      ...(httpHeaders === undefined ? {} : { httpHeaders: { ...httpHeaders } }),
    };
  }
  const data = source instanceof ArrayBuffer ? new Uint8Array(source.slice(0)) : source.slice();
  return { data };
}

/**
 * Rejects invalid public PDF navigation values on every render.
 *
 * @param initialPage - Requested initial one-based page number.
 * @param initialScale - Requested initial positive scale.
 * @returns Nothing after both values are validated.
 */
function validatePdfConfiguration(initialPage: number, initialScale: number): void {
  if (!Number.isInteger(initialPage) || initialPage <= 0) {
    throw new MiaixzViewError("VIEW_PDF_PAGE_INVALID");
  }
  if (!Number.isFinite(initialScale) || initialScale <= 0) {
    throw new MiaixzViewError("VIEW_PDF_SCALE_INVALID");
  }
}

/**
 * Normalizes values caught at the PDF.js boundary.
 *
 * @param value - Unknown caught value.
 * @returns Error instance suitable for the component callback.
 */
function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

/**
 * Renders one PDF page at a time through a lazily loaded PDF.js runtime.
 *
 * @public
 */
export const PdfView = forwardRef<HTMLDivElement, PdfViewProps>(function PdfView(
  {
    src,
    initialPage = 1,
    initialScale = 1,
    httpHeaders,
    withCredentials = false,
    labels: labelOverrides,
    actions,
    slotProps,
    onDocumentLoad,
    onError,
    className,
    ...rootProps
  },
  ref,
) {
  validatePdfConfiguration(initialPage, initialScale);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [document, setDocument] = useState<PDFDocumentProxy>();
  const [page, setPage] = useState(initialPage);
  const [scale, setScale] = useState(() => clamp(initialScale, 0.25, 4));
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const labels = { ...defaultLabels, ...labelOverrides };
  const request = usePdfRequest(src, httpHeaders, withCredentials);
  const initialPageRef = useLatestRef(initialPage);
  const onDocumentLoadRef = useLatestRef(onDocumentLoad);
  const onErrorRef = useLatestRef(onError);

  useEffect(() => {
    let active = true;
    let loadingTask: PDFDocumentLoadingTask | undefined;
    let loadedDocument: PDFDocumentProxy | undefined;
    setDocument(undefined);
    setStatus("loading");

    void import("pdfjs-dist")
      .then(async (pdfjs) => {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "./pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
        loadingTask = pdfjs.getDocument(
          toDocumentSource(request.source, request.httpHeaders, request.withCredentials),
        );
        const nextDocument = await loadingTask.promise;
        if (!active) {
          await nextDocument.destroy();
          return;
        }
        loadedDocument = nextDocument;
        const selectedPage = clamp(initialPageRef.current, 1, nextDocument.numPages);
        setPage(selectedPage);
        setDocument(nextDocument);
        onDocumentLoadRef.current?.({
          pages: nextDocument.numPages,
          fingerprints: nextDocument.fingerprints.filter(
            (fingerprint): fingerprint is string => fingerprint !== null,
          ),
        });
      })
      .catch((value: unknown) => {
        if (!active) return;
        const error = toError(value);
        setStatus("error");
        onErrorRef.current?.(error);
      });

    return () => {
      active = false;
      if (loadedDocument === undefined) void loadingTask?.destroy();
      else void loadedDocument.destroy();
    };
  }, [initialPageRef, onDocumentLoadRef, onErrorRef, request]);

  useEffect(() => {
    if (document === undefined || canvasRef.current === null) return;
    let active = true;
    let renderTask: RenderTask | undefined;

    void document
      .getPage(page)
      .then((pdfPage) => {
        if (!active || canvasRef.current === null) return;
        const canvas = canvasRef.current;
        const viewport = pdfPage.getViewport({ scale });
        const outputScale = window.devicePixelRatio || 1;
        const context = canvas.getContext("2d", { alpha: false });
        if (context === null) throw new Error("The browser does not provide a canvas context.");
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.inlineSize = `${Math.floor(viewport.width)}px`;
        canvas.style.blockSize = `${Math.floor(viewport.height)}px`;
        renderTask = pdfPage.render({
          canvas,
          canvasContext: context,
          viewport,
          transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
        });
        return renderTask.promise;
      })
      .then(() => {
        if (active) setStatus("ready");
      })
      .catch((value: unknown) => {
        const error = toError(value);
        if (!active || error.name === "RenderingCancelledException") return;
        setStatus("error");
        onErrorRef.current?.(error);
      });

    return () => {
      active = false;
      renderTask?.cancel();
    };
  }, [document, onErrorRef, page, scale]);

  const totalPages = document?.numPages ?? 0;
  return (
    <div
      {...rootProps}
      className={classNames("miaixz-preview", "miaixz-preview-pdf", className)}
      ref={ref}
    >
      <div
        {...slotProps?.toolbar}
        aria-label={labels.toolbar}
        className={classNames("miaixz-preview-toolbar", slotProps?.toolbar?.className)}
        role="toolbar"
      >
        <button
          aria-label={labels.previousPage}
          className="miaixz-preview-command"
          disabled={document === undefined || page <= 1}
          onClick={() => setPage((value) => Math.max(1, value - 1))}
          title={labels.previousPage}
          type="button"
        >
          ‹
        </button>
        <output aria-live="polite" className="miaixz-preview-value">
          {labels.page(page, totalPages)}
        </output>
        <button
          aria-label={labels.nextPage}
          className="miaixz-preview-command"
          disabled={document === undefined || page >= totalPages}
          onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          title={labels.nextPage}
          type="button"
        >
          ›
        </button>
        <button
          aria-label={labels.zoomOut}
          className="miaixz-preview-command"
          disabled={scale <= 0.25}
          onClick={() => setScale((value) => clamp(value - 0.25, 0.25, 4))}
          title={labels.zoomOut}
          type="button"
        >
          −
        </button>
        <output aria-live="polite" className="miaixz-preview-value">
          {Math.round(scale * 100)}%
        </output>
        <button
          aria-label={labels.zoomIn}
          className="miaixz-preview-command"
          disabled={scale >= 4}
          onClick={() => setScale((value) => clamp(value + 0.25, 0.25, 4))}
          title={labels.zoomIn}
          type="button"
        >
          +
        </button>
        {actions}
      </div>
      <div
        {...slotProps?.stage}
        className={classNames("miaixz-preview-stage", slotProps?.stage?.className)}
      >
        <canvas
          {...slotProps?.canvas}
          aria-label={labels.page(page, totalPages)}
          className={classNames("miaixz-preview-pdf-canvas", slotProps?.canvas?.className)}
          ref={canvasRef}
          role="img"
        />
        {status !== "ready" && (
          <div
            {...slotProps?.status}
            aria-live="polite"
            className={classNames("miaixz-preview-status", slotProps?.status?.className)}
            role={status === "error" ? "alert" : "status"}
          >
            {status === "error" ? labels.error : labels.loading}
          </div>
        )}
      </div>
    </div>
  );
});
