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
 * Resolves bounded Host bridge resource limits.
 */

import type { MiaixzPostMessageHostLimits } from "../contracts/post-message.js";
import { MiaixzSdkError } from "../../errors/errors.js";

/**
 * Safe defaults used when a Host does not provide explicit limits.
 */
export const defaultPostMessageHostLimits: Readonly<MiaixzPostMessageHostLimits> = Object.freeze({
  maxInFlightRequests: 64,
  maxSubscriptions: 128,
  maxPayloadBytes: 1024 * 1024,
  maxPayloadDepth: 16,
  maxPayloadNodes: 10_000,
  maxCatalogLocales: 32,
  maxCatalogMessagesPerLocale: 5_000,
  maxCatalogStringLength: 16 * 1024,
  requestTimeoutMilliseconds: 30_000,
});

/**
 * Absolute limits which configuration cannot exceed.
 */
export const hardPostMessageHostLimits: Readonly<MiaixzPostMessageHostLimits> = Object.freeze({
  maxInFlightRequests: 256,
  maxSubscriptions: 512,
  maxPayloadBytes: 4 * 1024 * 1024,
  maxPayloadDepth: 32,
  maxPayloadNodes: 50_000,
  maxCatalogLocales: 64,
  maxCatalogMessagesPerLocale: 20_000,
  maxCatalogStringLength: 64 * 1024,
  requestTimeoutMilliseconds: 60_000,
});

/**
 * Validates optional Host limits against fixed hard caps.
 *
 * @param overrides - Optional per-Host values.
 * @returns Complete frozen limits.
 */
export function resolvePostMessageHostLimits(
  overrides?: Partial<MiaixzPostMessageHostLimits>,
): Readonly<MiaixzPostMessageHostLimits> {
  const value = (field: keyof MiaixzPostMessageHostLimits): number => {
    const candidate = overrides?.[field] ?? defaultPostMessageHostLimits[field];
    if (
      !Number.isSafeInteger(candidate) ||
      candidate <= 0 ||
      candidate > hardPostMessageHostLimits[field]
    ) {
      throw new MiaixzSdkError({ code: "BRIDGE_MESSAGE_INVALID" });
    }
    return candidate;
  };
  return Object.freeze({
    maxInFlightRequests: value("maxInFlightRequests"),
    maxSubscriptions: value("maxSubscriptions"),
    maxPayloadBytes: value("maxPayloadBytes"),
    maxPayloadDepth: value("maxPayloadDepth"),
    maxPayloadNodes: value("maxPayloadNodes"),
    maxCatalogLocales: value("maxCatalogLocales"),
    maxCatalogMessagesPerLocale: value("maxCatalogMessagesPerLocale"),
    maxCatalogStringLength: value("maxCatalogStringLength"),
    requestTimeoutMilliseconds: value("requestTimeoutMilliseconds"),
  });
}
