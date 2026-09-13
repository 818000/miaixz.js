import { loadOnlyOfficeApi, type OnlyOfficeApi } from "../src/office/office-loader.js";

describe("loadOnlyOfficeApi", () => {
  afterEach(() => {
    delete (window as Window & { DocsAPI?: OnlyOfficeApi }).DocsAPI;
    for (const script of document.querySelectorAll("script[data-miaixz-view-office]")) {
      script.remove();
    }
  });

  it("loads and reuses the ONLYOFFICE global browser API", async () => {
    const loading = loadOnlyOfficeApi("https://office.example/docs/");
    const script = document.querySelector<HTMLScriptElement>("script[data-miaixz-view-office]");
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
    await expect(loadOnlyOfficeApi("https://another.example")).resolves.toBe(api);
  });

  it("rejects unsupported protocols and script failures", async () => {
    expect(() => loadOnlyOfficeApi("file:///office")).toThrow("HTTP or HTTPS");
    const loading = loadOnlyOfficeApi("https://offline.example");
    document
      .querySelector<HTMLScriptElement>("script[data-miaixz-view-office]")
      ?.dispatchEvent(new Event("error"));
    await expect(loading).rejects.toThrow("Unable to load");
  });

  it("rejects a script that does not expose the expected global", async () => {
    const loading = loadOnlyOfficeApi("https://invalid.example");
    document
      .querySelector<HTMLScriptElement>("script[data-miaixz-view-office]")
      ?.dispatchEvent(new Event("load"));
    await expect(loading).rejects.toThrow("window.DocsAPI");
  });
});
