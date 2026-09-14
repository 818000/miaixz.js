import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { vi } from "vitest";

const pdf = vi.hoisted(() => ({
  cancel: vi.fn(),
  destroy: vi.fn(),
  getDocument: vi.fn(),
  getPage: vi.fn(),
  render: vi.fn(),
  workerOptions: { workerSrc: "" },
}));

vi.mock("pdfjs-dist", () => ({
  getDocument: pdf.getDocument,
  GlobalWorkerOptions: pdf.workerOptions,
}));

vi.mock("pdfjs-dist/build/pdf.worker.min.mjs", () => ({
  WorkerMessageHandler: {},
}));

import { FileView } from "../src/file/file-view.js";
import { PdfView } from "../src/pdf/pdf-view.js";

/**
 * Configures the PDF.js test double with a successful two-page document.
 *
 * @returns Nothing after configuring the test double.
 */
function configureSuccessfulDocument(): void {
  pdf.render.mockReturnValue({ promise: Promise.resolve(), cancel: pdf.cancel });
  pdf.getPage.mockResolvedValue({
    getViewport: ({ scale }: { scale: number }) => ({ width: 600 * scale, height: 800 * scale }),
    render: pdf.render,
  });
  pdf.getDocument.mockReturnValue({
    promise: Promise.resolve({
      numPages: 2,
      fingerprints: ["fingerprint", null],
      getPage: pdf.getPage,
      destroy: pdf.destroy,
    }),
    destroy: pdf.destroy,
  });
}

describe("PdfView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configureSuccessfulDocument();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      {} as CanvasRenderingContext2D,
    );
  });

  it("loads, renders, pages, and scales an authorized remote PDF", async () => {
    const user = userEvent.setup();
    const onDocumentLoad = vi.fn();
    render(
      <PdfView
        httpHeaders={{ Authorization: "Bearer opaque" }}
        initialPage={8}
        onDocumentLoad={onDocumentLoad}
        src="https://files.example/report.pdf"
        withCredentials
      />,
    );

    await waitFor(() =>
      expect(onDocumentLoad).toHaveBeenCalledWith({ pages: 2, fingerprints: ["fingerprint"] }),
    );
    await waitFor(() => expect(pdf.render).toHaveBeenCalled());
    expect(pdf.workerOptions.workerSrc).toContain("pdf.worker.min.mjs");
    expect(pdf.getDocument).toHaveBeenCalledWith({
      url: "https://files.example/report.pdf",
      withCredentials: true,
      httpHeaders: { Authorization: "Bearer opaque" },
    });
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Previous page" }));
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    await waitFor(() => expect(screen.getByText("1 / 2")).toBeInTheDocument());
    expect(screen.getByText("125%")).toBeInTheDocument();
  });

  it("keeps resource identity stable across callback, page, and equivalent header changes", async () => {
    const firstLoad = vi.fn();
    const { rerender } = render(
      <PdfView httpHeaders={{ Authorization: "opaque" }} onDocumentLoad={firstLoad} src="a.pdf" />,
    );
    await waitFor(() => expect(firstLoad).toHaveBeenCalledOnce());
    const replacement = vi.fn();
    rerender(
      <PdfView
        httpHeaders={{ Authorization: "opaque" }}
        initialPage={2}
        onDocumentLoad={replacement}
        src={new URL("a.pdf", "https://example.test")}
      />,
    );
    await waitFor(() => expect(pdf.getDocument).toHaveBeenCalledTimes(2));
  });

  it("does not reload for equivalent URL values or callback identity changes", async () => {
    const firstLoad = vi.fn();
    const source = new URL("https://files.example/a.pdf");
    const { rerender } = render(
      <PdfView httpHeaders={{ X: "one" }} onDocumentLoad={firstLoad} src={source} />,
    );
    await waitFor(() => expect(firstLoad).toHaveBeenCalledOnce());
    pdf.getDocument.mockClear();
    const replacement = vi.fn();
    rerender(
      <PdfView
        httpHeaders={{ X: "one" }}
        initialPage={2}
        onDocumentLoad={replacement}
        src={new URL(source.toString())}
      />,
    );
    expect(pdf.getDocument).not.toHaveBeenCalled();
  });

  it("validates navigation inputs and merges public canvas slot props", async () => {
    expect(() => render(<PdfView initialPage={0} src="invalid.pdf" />)).toThrow(
      "[VIEW_PDF_PAGE_INVALID]",
    );
    expect(() => render(<PdfView initialScale={0} src="invalid.pdf" />)).toThrow(
      "[VIEW_PDF_SCALE_INVALID]",
    );
    render(
      <PdfView
        labels={{ toolbar: "Document commands" }}
        slotProps={{ canvas: { className: "canvas-slot", title: "Rendered page" } }}
        src="valid.pdf"
      />,
    );
    expect(screen.getByRole("toolbar", { name: "Document commands" })).toBeInTheDocument();
    expect(await screen.findByRole("img", { name: /\/ 2/u })).toHaveClass("canvas-slot");
    expect(screen.getByRole("img", { name: /\/ 2/u })).toHaveAttribute("title", "Rendered page");
  });

  it("copies in-memory data and routes PDF requests through FileView", async () => {
    render(<FileView kind="pdf" src={new Uint8Array([1, 2, 3])} />);
    await waitFor(() => expect(pdf.getDocument).toHaveBeenCalled());
    const source = pdf.getDocument.mock.calls.at(-1)?.[0] as { data: Uint8Array };
    expect(Array.from(source.data)).toEqual([1, 2, 3]);
  });

  it("announces loading failures", async () => {
    pdf.getDocument.mockReturnValue({
      promise: Promise.reject(new Error("corrupt")),
      destroy: pdf.destroy,
    });
    const onError = vi.fn();
    render(
      <PdfView labels={{ error: "Broken document" }} onError={onError} src={new ArrayBuffer(2)} />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Broken document");
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: "corrupt" }));
  });
});
