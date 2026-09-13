import { vi } from "vitest";
import type { OnlyOfficeApi } from "../src/office/office-loader.js";

async function getLoader() {
  return import("../src/office/office-loader.js");
}

describe("loadOnlyOfficeApi", () => {
  beforeEach(() => vi.resetModules());

  afterEach(() => {
    delete (window as Window & { DocsAPI?: OnlyOfficeApi }).DocsAPI;
    for (const script of document.querySelectorAll("script[data-miaixz-preview-office]")) {
      script.remove();
    }
  });

  it("loads and reuses the ONLYOFFICE global browser API", async () => {
    const { loadOnlyOfficeApi } = await getLoader();
    const loading = loadOnlyOfficeApi("https://office.example/docs/");
    const script = document.querySelector<HTMLScriptElement>("script[data-miaixz-preview-office]");
    expect(script?.src).toBe("https://office.example/docs/web-apps/apps/api/documents/api.js");
    const api = {
      DocEditor: class {
        /**
         * Implements the editor cleanup method required by the ONLYOFFICE test double.
         *
         * @returns Nothing after cleanup.
         */
        destroyEditor() {}
      },
    } satisfies OnlyOfficeApi;
    (window as Window & { DocsAPI?: OnlyOfficeApi }).DocsAPI = api;
    script?.dispatchEvent(new Event("load"));

    await expect(loading).resolves.toBe(api);
    await expect(loadOnlyOfficeApi("https://office.example/docs/?ignored=yes#hash")).resolves.toBe(
      api,
    );
    await expect(loadOnlyOfficeApi("https://another.example")).rejects.toMatchObject({
      code: "VIEW_OFFICE_SERVER_CONFLICT",
    });
  });

  it("rejects invalid server URLs and nonce conflicts", async () => {
    const { loadOnlyOfficeApi } = await getLoader();
    for (const url of ["/relative", "file:///office", "https://user:secret@office.example"]) {
      await expect(loadOnlyOfficeApi(url)).rejects.toMatchObject({
        code: "VIEW_OFFICE_SERVER_URL_INVALID",
      });
    }
    const loading = loadOnlyOfficeApi("https://office.example", "one");
    await expect(loadOnlyOfficeApi("https://office.example", "two")).rejects.toMatchObject({
      code: "VIEW_OFFICE_NONCE_CONFLICT",
    });
    document
      .querySelector<HTMLScriptElement>("script[data-miaixz-preview-office]")
      ?.dispatchEvent(new Event("error"));
    await expect(loading).rejects.toMatchObject({ code: "VIEW_OFFICE_API_LOAD_FAILED" });
  });

  it("rejects script failures and permits a clean retry", async () => {
    const { loadOnlyOfficeApi } = await getLoader();
    const loading = loadOnlyOfficeApi("https://offline.example");
    document
      .querySelector<HTMLScriptElement>("script[data-miaixz-preview-office]")
      ?.dispatchEvent(new Event("error"));
    await expect(loading).rejects.toMatchObject({ code: "VIEW_OFFICE_API_LOAD_FAILED" });
    const retry = loadOnlyOfficeApi("https://offline.example");
    expect(document.querySelector("script[data-miaixz-preview-office]")).not.toBeNull();
    document
      .querySelector<HTMLScriptElement>("script[data-miaixz-preview-office]")
      ?.dispatchEvent(new Event("error"));
    await expect(retry).rejects.toMatchObject({ code: "VIEW_OFFICE_API_LOAD_FAILED" });
  });

  it("rejects a script that does not expose the expected global", async () => {
    const { loadOnlyOfficeApi } = await getLoader();
    const loading = loadOnlyOfficeApi("https://invalid.example");
    document
      .querySelector<HTMLScriptElement>("script[data-miaixz-preview-office]")
      ?.dispatchEvent(new Event("load"));
    await expect(loading).rejects.toMatchObject({ code: "VIEW_OFFICE_API_MISSING" });
  });
});
