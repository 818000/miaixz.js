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
 * Measures arbitrary structured-clone payloads with bounded, getter-free traversal.
 */

import type { MiaixzPostMessageHostLimits } from "../contracts/post-message.js";
import { MiaixzSdkError } from "../../errors/errors.js";

/**
 * Throws a sanitized bridge payload validation error.
 *
 * @param code - Stable invalid-message or resource-limit code.
 * @returns This function never returns.
 */
function payloadError(code: "BRIDGE_MESSAGE_INVALID" | "BRIDGE_RESOURCE_LIMIT_EXCEEDED"): never {
  throw new MiaixzSdkError({ code });
}

const textEncoder = new TextEncoder();

/**
 * Rejects a value when its graph, depth, or directly observable byte size exceeds Host limits.
 *
 * @param value - Structured-clone payload to inspect.
 * @param limits - Resolved Host limits.
 */
export function assertBridgePayloadWithinLimits(
  value: unknown,
  limits: Readonly<MiaixzPostMessageHostLimits>,
): void {
  const pending: Array<{ readonly depth: number; readonly value: unknown }> = [{ depth: 0, value }];
  const seen = new WeakSet<object>();
  let nodes = 0;
  let bytes = 0;
  const enqueue = (item: unknown, depth: number): void => {
    if (depth > limits.maxPayloadDepth || nodes + pending.length + 1 > limits.maxPayloadNodes) {
      payloadError("BRIDGE_RESOURCE_LIMIT_EXCEEDED");
    }
    pending.push({ depth, value: item });
  };
  const consume = (count: number): void => {
    bytes += count;
    if (!Number.isSafeInteger(bytes) || bytes > limits.maxPayloadBytes) {
      payloadError("BRIDGE_RESOURCE_LIMIT_EXCEEDED");
    }
  };
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === undefined) break;
    nodes += 1;
    if (nodes > limits.maxPayloadNodes || current.depth > limits.maxPayloadDepth) {
      payloadError("BRIDGE_RESOURCE_LIMIT_EXCEEDED");
    }
    const item = current.value;
    if (typeof item === "string") {
      consume(textEncoder.encode(item).byteLength);
      continue;
    }
    if (
      item === null ||
      typeof item === "undefined" ||
      typeof item === "boolean" ||
      typeof item === "number" ||
      typeof item === "bigint"
    ) {
      consume(8);
      continue;
    }
    if (typeof item !== "object") payloadError("BRIDGE_MESSAGE_INVALID");
    if (seen.has(item)) continue;
    seen.add(item);
    let prototype: object | null;
    try {
      prototype = Object.getPrototypeOf(item);
    } catch {
      payloadError("BRIDGE_MESSAGE_INVALID");
    }
    if (prototype === ArrayBuffer.prototype) {
      consume((item as ArrayBuffer).byteLength);
      continue;
    }
    if (ArrayBuffer.isView(item)) {
      consume(item.byteLength);
      continue;
    }
    if (typeof Blob !== "undefined" && item instanceof Blob) {
      consume(item.size);
      continue;
    }
    if (prototype === Date.prototype) {
      consume(8);
      continue;
    }
    if (prototype === RegExp.prototype) {
      consume(textEncoder.encode(RegExp.prototype.toString.call(item)).byteLength);
      continue;
    }
    if (prototype === Map.prototype) {
      const size = Reflect.getOwnPropertyDescriptor(Map.prototype, "size")?.get?.call(item);
      if (
        typeof size !== "number" ||
        !Number.isSafeInteger(size) ||
        nodes + pending.length + size * 2 > limits.maxPayloadNodes
      ) {
        payloadError("BRIDGE_RESOURCE_LIMIT_EXCEEDED");
      }
      for (const [key, entry] of Map.prototype.entries.call(item) as Iterable<[unknown, unknown]>) {
        enqueue(entry, current.depth + 1);
        enqueue(key, current.depth + 1);
      }
      continue;
    }
    if (prototype === Set.prototype) {
      const size = Reflect.getOwnPropertyDescriptor(Set.prototype, "size")?.get?.call(item);
      if (
        typeof size !== "number" ||
        !Number.isSafeInteger(size) ||
        nodes + pending.length + size > limits.maxPayloadNodes
      ) {
        payloadError("BRIDGE_RESOURCE_LIMIT_EXCEEDED");
      }
      for (const entry of Set.prototype.values.call(item) as Iterable<unknown>) {
        enqueue(entry, current.depth + 1);
      }
      continue;
    }
    if (prototype !== Object.prototype && prototype !== null && !Array.isArray(item)) {
      payloadError("BRIDGE_MESSAGE_INVALID");
    }
    let descriptors: Record<string, PropertyDescriptor>;
    try {
      descriptors = Object.getOwnPropertyDescriptors(item);
    } catch {
      payloadError("BRIDGE_MESSAGE_INVALID");
    }
    const entries = Object.entries(descriptors);
    if (nodes + pending.length + entries.length > limits.maxPayloadNodes) {
      payloadError("BRIDGE_RESOURCE_LIMIT_EXCEEDED");
    }
    for (const [key, descriptor] of entries) {
      if (!descriptor.enumerable) continue;
      consume(textEncoder.encode(key).byteLength);
      if (!("value" in descriptor)) payloadError("BRIDGE_MESSAGE_INVALID");
      enqueue(descriptor.value, current.depth + 1);
    }
  }
}
