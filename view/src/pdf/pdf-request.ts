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

import { useState } from "react";
import type { PdfViewSource } from "./pdf-view.types.js";

/**
 * Stable PDF resource request consumed by the loading effect.
 */
export interface PdfRequest {
  readonly source: PdfViewSource;
  readonly httpHeaders?: Readonly<Record<string, string>>;
  readonly withCredentials: boolean;
}

/**
 * Retains a PDF request while all contract-defined identity fields remain equal.
 *
 * @param source - Remote or in-memory PDF source.
 * @param httpHeaders - Optional request headers compared by shallow key/value equality.
 * @param withCredentials - Whether remote requests include credentials.
 * @returns Stable request identity with a sorted immutable header snapshot.
 */
export function usePdfRequest(
  source: PdfViewSource,
  httpHeaders: Readonly<Record<string, string>> | undefined,
  withCredentials: boolean,
): PdfRequest {
  const [request, setRequest] = useState<PdfRequest>(() =>
    createRequest(source, httpHeaders, withCredentials),
  );
  if (
    !sameSource(request.source, source) ||
    request.withCredentials !== withCredentials ||
    !sameHeaders(request.httpHeaders, httpHeaders)
  ) {
    const nextRequest = createRequest(source, httpHeaders, withCredentials);
    setRequest(nextRequest);
    return nextRequest;
  }
  return request;
}

/**
 * Creates an immutable PDF request without serializing sensitive header values.
 *
 * @param source - Remote or in-memory PDF source.
 * @param httpHeaders - Optional request headers copied in stable key order.
 * @param withCredentials - Whether remote requests include credentials.
 * @returns Immutable request snapshot.
 */
function createRequest(
  source: PdfViewSource,
  httpHeaders: Readonly<Record<string, string>> | undefined,
  withCredentials: boolean,
): PdfRequest {
  const normalizedSource =
    typeof source === "string" || source instanceof URL ? source.toString() : source;
  const normalizedHeaders =
    httpHeaders === undefined
      ? undefined
      : Object.freeze(
          Object.fromEntries(
            Object.entries(httpHeaders).sort(([left], [right]) => left.localeCompare(right, "en")),
          ),
        );
  return {
    source: normalizedSource,
    withCredentials,
    ...(normalizedHeaders === undefined ? {} : { httpHeaders: normalizedHeaders }),
  };
}

/**
 * Compares source values using the public request identity contract.
 *
 * @param left - Existing source identity.
 * @param right - Candidate source identity.
 * @returns Whether both values identify the same source.
 */
function sameSource(left: PdfViewSource, right: PdfViewSource): boolean {
  if (typeof left === "string" || left instanceof URL) {
    return (
      (typeof right === "string" || right instanceof URL) && left.toString() === right.toString()
    );
  }
  return left === right;
}

/**
 * Compares header maps without serializing or exposing their values.
 *
 * @param left - Existing immutable header map.
 * @param right - Candidate header map.
 * @returns Whether both maps contain the same keys and values.
 */
function sameHeaders(
  left: Readonly<Record<string, string>> | undefined,
  right: Readonly<Record<string, string>> | undefined,
): boolean {
  if (left === undefined || right === undefined) return left === right;
  const leftEntries = Object.entries(left);
  const rightEntries = Object.entries(right);
  return (
    leftEntries.length === rightEntries.length &&
    leftEntries.every(([key, value]) => right[key] === value)
  );
}
