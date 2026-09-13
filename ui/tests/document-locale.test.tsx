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

import { createMiaixzI18n, defineLocale } from "@miaixz/sdk/i18n";
import { act, cleanup, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { MiaixzDocumentLocale, MiaixzLocaleProvider, miaixzUiMessages } from "../src/i18n/index.js";

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("lang");
  document.documentElement.removeAttribute("dir");
});

const arabic = defineLocale({
  schemaVersion: 1,
  id: "ar",
  label: "العربية",
  shortLabel: "ع",
  version: "1.0.0",
  direction: "rtl",
});

/**
 * Creates an isolated locale runtime for document-owner tests.
 *
 * @returns SDK i18n runtime containing one RTL locale.
 */
function createRuntime() {
  return createMiaixzI18n({
    locale: "en-US",
    locales: [arabic],
    messages: miaixzUiMessages,
  });
}

describe("MiaixzDocumentLocale", () => {
  it("keeps ordinary locale providers isolated from the document", () => {
    document.documentElement.setAttribute("lang", "host");
    document.documentElement.setAttribute("dir", "rtl");
    render(
      <>
        <MiaixzLocaleProvider i18n={createRuntime()}>
          <span>one</span>
        </MiaixzLocaleProvider>
        <MiaixzLocaleProvider i18n={createRuntime()}>
          <span>two</span>
        </MiaixzLocaleProvider>
      </>,
    );
    expect(document.documentElement.getAttribute("lang")).toBe("host");
    expect(document.documentElement.getAttribute("dir")).toBe("rtl");
  });

  it("owns locale changes and restores only attributes it still controls", async () => {
    document.documentElement.setAttribute("lang", "host");
    document.documentElement.setAttribute("dir", "ltr");
    const i18n = createRuntime();
    const result = render(
      <MiaixzLocaleProvider i18n={i18n}>
        <MiaixzDocumentLocale />
      </MiaixzLocaleProvider>,
    );
    expect(document.documentElement.getAttribute("lang")).toBe("en-US");
    expect(document.documentElement.getAttribute("dir")).toBe("ltr");

    await act(() => i18n.changeLocale("ar"));
    expect(document.documentElement.getAttribute("lang")).toBe("ar");
    expect(document.documentElement.getAttribute("dir")).toBe("rtl");

    document.documentElement.setAttribute("lang", "external");
    result.unmount();
    expect(document.documentElement.getAttribute("lang")).toBe("external");
    expect(document.documentElement.getAttribute("dir")).toBe("ltr");
  });

  it("rejects a second document owner", () => {
    const i18n = createRuntime();
    expect(() =>
      render(
        <MiaixzLocaleProvider i18n={i18n}>
          <MiaixzDocumentLocale />
          <MiaixzDocumentLocale />
        </MiaixzLocaleProvider>,
      ),
    ).toThrow("[UI_LOCALE_GLOBAL_DUPLICATE] ui.error.locale.globalDuplicate");
  });

  it("does not read or mutate the document during server rendering", () => {
    document.documentElement.setAttribute("lang", "host");
    const output = renderToString(
      <MiaixzLocaleProvider i18n={createRuntime()}>
        <MiaixzDocumentLocale />
      </MiaixzLocaleProvider>,
    );
    expect(output).toBe("");
    expect(document.documentElement.getAttribute("lang")).toBe("host");
  });
});
