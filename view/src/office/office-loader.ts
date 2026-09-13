/**
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

import type { OnlyOfficeEditorConfig } from "./office-view.types.js";

/**
 * Represents the small lifecycle surface used from an ONLYOFFICE editor instance.
 */
export interface OnlyOfficeEditorInstance {
  /**
   * Releases the embedded editor and its browser resources.
   */
  destroyEditor(): void;
}

/**
 * Represents the ONLYOFFICE global API consumed by this package.
 */
export interface OnlyOfficeApi {
  /**
   * Creates an editor in a target element.
   */
  readonly DocEditor: new (
    targetId: string,
    config: OnlyOfficeEditorConfig,
  ) => OnlyOfficeEditorInstance;
}

const loadingScripts = new Map<string, Promise<OnlyOfficeApi>>();

/**
 * Reads the optional global API installed by the document-server script.
 *
 * @returns Available ONLYOFFICE API, if loaded.
 */
function readApi(): OnlyOfficeApi | undefined {
  return (
    window as Window & {
      /**
       * Contains the API installed by ONLYOFFICE Docs.
       */
      DocsAPI?: OnlyOfficeApi;
    }
  ).DocsAPI;
}

/**
 * Resolves the fixed ONLYOFFICE browser API path from a server base URL.
 *
 * @param documentServerUrl - Public ONLYOFFICE Docs base URL.
 * @returns Normalized browser API URL.
 */
function resolveApiUrl(documentServerUrl: string): string {
  const url = new URL(documentServerUrl, window.location.href);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("ONLYOFFICE documentServerUrl must use HTTP or HTTPS.");
  }
  url.pathname = `${url.pathname.replace(/\/$/u, "")}/web-apps/apps/api/documents/api.js`;
  url.search = "";
  url.hash = "";
  return url.toString();
}

/**
 * Loads one ONLYOFFICE browser API per normalized document-server URL.
 *
 * @param documentServerUrl - Public ONLYOFFICE Docs base URL.
 * @param nonce - Optional Content Security Policy nonce.
 * @returns Resolved ONLYOFFICE global API.
 */
export function loadOnlyOfficeApi(
  documentServerUrl: string,
  nonce?: string,
): Promise<OnlyOfficeApi> {
  const existingApi = readApi();
  if (existingApi !== undefined) return Promise.resolve(existingApi);
  const apiUrl = resolveApiUrl(documentServerUrl);
  const pending = loadingScripts.get(apiUrl);
  if (pending !== undefined) return pending;

  const loading = new Promise<OnlyOfficeApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.src = apiUrl;
    script.dataset.miaixzViewOffice = apiUrl;
    if (nonce !== undefined) script.nonce = nonce;
    script.addEventListener("load", () => {
      const api = readApi();
      if (api === undefined) {
        reject(new Error("ONLYOFFICE loaded without exposing window.DocsAPI."));
        return;
      }
      resolve(api);
    });
    script.addEventListener("error", () => {
      reject(new Error(`Unable to load the ONLYOFFICE browser API from ${apiUrl}.`));
    });
    document.head.append(script);
  });
  loadingScripts.set(apiUrl, loading);
  void loading.catch(() => loadingScripts.delete(apiUrl));
  return loading;
}
