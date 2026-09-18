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

import type { OnlyOfficeEditorConfig } from "./office-view.types.js";
import { MiaixzViewError } from "../errors/view-error.js";

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

interface OnlyOfficeApiRegistry {
  readonly apiUrl: string;
  readonly nonce: string | null;
  readonly promise: Promise<OnlyOfficeApi>;
}

let officeApiRegistry: OnlyOfficeApiRegistry | undefined;

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
  let url: URL;
  try {
    url = new URL(documentServerUrl);
  } catch {
    throw new MiaixzViewError("VIEW_OFFICE_SERVER_URL_INVALID");
  }
  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username !== "" ||
    url.password !== ""
  ) {
    throw new MiaixzViewError("VIEW_OFFICE_SERVER_URL_INVALID");
  }
  url.pathname = `${url.pathname.replace(/\/+$/u, "")}/web-apps/apps/api/documents/api.js`;
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
  let apiUrl: string;
  try {
    apiUrl = resolveApiUrl(documentServerUrl);
  } catch (error) {
    return Promise.reject(error);
  }
  const normalizedNonce = nonce ?? null;
  if (officeApiRegistry !== undefined) {
    if (officeApiRegistry.apiUrl !== apiUrl) {
      return Promise.reject(new MiaixzViewError("VIEW_OFFICE_SERVER_CONFLICT"));
    }
    if (officeApiRegistry.nonce !== normalizedNonce) {
      return Promise.reject(new MiaixzViewError("VIEW_OFFICE_NONCE_CONFLICT"));
    }
    return officeApiRegistry.promise;
  }

  const existingApi = readApi();
  if (existingApi !== undefined) {
    const promise = Promise.resolve(existingApi);
    officeApiRegistry = { apiUrl, nonce: normalizedNonce, promise };
    return promise;
  }

  let script: HTMLScriptElement;
  const loading = new Promise<OnlyOfficeApi>((resolve, reject) => {
    script = document.createElement("script");
    script.async = true;
    script.src = apiUrl;
    script.dataset.miaixzPreviewOffice = apiUrl;
    if (nonce !== undefined) script.nonce = nonce;
    script.addEventListener("load", () => {
      const api = readApi();
      if (api === undefined) {
        script.remove();
        reject(new MiaixzViewError("VIEW_OFFICE_API_MISSING"));
        return;
      }
      resolve(api);
    });
    script.addEventListener("error", () => {
      script.remove();
      reject(new MiaixzViewError("VIEW_OFFICE_API_LOAD_FAILED"));
    });
    document.head.append(script);
  });
  officeApiRegistry = { apiUrl, nonce: normalizedNonce, promise: loading };
  void loading.catch(() => {
    if (officeApiRegistry?.promise === loading) officeApiRegistry = undefined;
  });
  return loading;
}
