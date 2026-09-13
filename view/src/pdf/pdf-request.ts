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

import { useRef } from "react";
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
  const current = useRef<PdfRequest | undefined>(undefined);
  if (
    current.current === undefined ||
    !sameSource(current.current.source, source) ||
    current.current.withCredentials !== withCredentials ||
    !sameHeaders(current.current.httpHeaders, httpHeaders)
  ) {
    const sortedHeaders =
      httpHeaders === undefined
        ? undefined
        : Object.freeze(
            Object.fromEntries(
              Object.entries(httpHeaders).sort(([left], [right]) => left.localeCompare(right, "en")),
            ),
          );
    current.current = {
      source,
      withCredentials,
      ...(sortedHeaders === undefined ? {} : { httpHeaders: sortedHeaders }),
    };
  }
  return current.current;
}

/** Compares source values using the public request identity contract. */
function sameSource(left: PdfViewSource, right: PdfViewSource): boolean {
  if (typeof left === "string" || left instanceof URL) {
    return (typeof right === "string" || right instanceof URL) && left.toString() === right.toString();
  }
  return left === right;
}

/**
 * Compares header maps without serializing or exposing their values.
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
