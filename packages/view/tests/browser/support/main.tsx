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

/**
 * Mounts the packed viewer against the frozen production workbook.
 */

import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { OfficeView } from "../../../dist/index.js";
import "@miaixz/icons/styles.css";
import "../../../dist/styles.css";

declare global {
  interface Window {
    __XLSX_PREVIEW_RESULT__?: string;
  }
}

const workbookUrl = new URL("../../fixtures/xlsx/system-flow.xlsx", import.meta.url).href;
const root = document.querySelector("#root");
if (root === null) throw new Error("Missing browser acceptance root");

createRoot(root).render(
  createElement(OfficeView, {
    source: workbookUrl,
    name: "system-flow.xlsx",
    /**
     * Publishes successful readiness for the Playwright contract.
     *
     * @param outcome - Complete or explicitly partial viewer result.
     */
    onLoad(outcome) {
      window.__XLSX_PREVIEW_RESULT__ = outcome.status;
      document.documentElement.dataset.xlsxReady = outcome.status;
    },
    /**
     * Publishes a sanitized failure code for deterministic diagnostics.
     *
     * @param error - Sanitized public viewer error.
     */
    onError(error) {
      window.__XLSX_PREVIEW_RESULT__ = error.code;
      document.documentElement.dataset.xlsxReady = `error:${error.code}`;
    },
  }),
);
