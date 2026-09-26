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
 * Provides safe document titles and deterministic model identifiers.
 */

/**
 * Produces deterministic model identifiers from bounded source facts.
 *
 * @param name - Optional source name included in the stable hash.
 * @param bytes - Bounded source bytes sampled by the stable hash.
 * @returns Deterministic document identifier for the supplied source facts.
 */
export function stableDocumentId(name: string | undefined, bytes: Uint8Array): string {
  let hash = 0x811c9dc5;
  const update = (value: number): void => {
    hash ^= value;
    hash = Math.imul(hash, 0x01000193);
  };
  for (const character of name ?? "untitled") update(character.codePointAt(0) ?? 0);
  const sampleLength = Math.min(bytes.length, 64 * 1024);
  for (let index = 0; index < sampleLength; index += 1) update(bytes[index] ?? 0);
  update(bytes.length & 0xff);
  update((bytes.length >>> 8) & 0xff);
  return `document-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

/**
 * Returns a safe display title without exposing an entire remote URL.
 *
 * @param name - Optional source name supplied by the resource provider.
 * @returns Trimmed display title or the stable untitled fallback.
 */
export function documentTitle(name: string | undefined): string {
  return name?.trim() || "Untitled document";
}
