import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

const office = vi.hoisted(() => ({
  destroyEditor: vi.fn(),
  loadOnlyOfficeApi: vi.fn(),
}));

vi.mock("../src/office/office-loader.js", () => ({
  loadOnlyOfficeApi: office.loadOnlyOfficeApi,
}));

import { OfficeView } from "../src/office/office-view.js";

const config = {
  documentType: "word" as const,
  document: {
    fileType: "docx",
    key: "document-v1",
    title: "Report",
    url: "https://files.example/report.docx",
  },
  token: "signed-by-the-server",
};

describe("OfficeView", () => {
  it("creates and destroys an editor with the caller-supplied configuration", async () => {
    const DocEditor = vi.fn(function Editor() {
      return { destroyEditor: office.destroyEditor };
    });
    office.loadOnlyOfficeApi.mockResolvedValue({ DocEditor });
    const onReady = vi.fn();
    render(
      <OfficeView
        actions={<button type="button">Details</button>}
        config={config}
        documentServerUrl="https://office.example"
        onReady={onReady}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Loading Office document");
    await waitFor(() => expect(onReady).toHaveBeenCalledOnce());
    expect(DocEditor).toHaveBeenCalledWith(expect.stringMatching(/^miaixz-view-office-/u), config);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    cleanup();
    expect(office.destroyEditor).toHaveBeenCalledOnce();
  });

  it("reports initialization errors with a customizable message", async () => {
    office.loadOnlyOfficeApi.mockRejectedValue("offline");
    const onError = vi.fn();
    render(
      <OfficeView
        config={config}
        documentServerUrl="https://office.example"
        labels={{ error: "Preview unavailable" }}
        onError={onError}
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Preview unavailable");
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: "offline" }));
  });
});
