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
 * Implements the iconfont module icon provider integration.
 */

import type { IconFontDefinition } from "../icon-definition.js";
import { isIconName, type IconName } from "../icon-names.js";
import type { IconLoader, IconProviderModule } from "../icon-provider.js";

/**
 * Defines one dependency-owned Iconfont manifest.
 */
export interface IconfontManifest {
  readonly fontUrl: string;
  readonly glyphs: Readonly<Partial<Record<IconName, string>>>;
  readonly x?: number;
  readonly y?: number;
  readonly fontSize?: number;
}

const fontLoads = new Map<string, Promise<void>>();

/**
 * Produces a deterministic family suffix from a font URL.
 *
 * @param value - Font URL to hash.
 * @returns A stable unsigned base-36 hash.
 */
const hash = (value: string): string => {
  let result = 5381;
  for (const character of value) result = (result * 33) ^ character.codePointAt(0)!;
  return (result >>> 0).toString(36);
};

/**
 * Restricts Iconfont assets to bundled or same-origin URLs.
 *
 * @param value - Manifest URL to validate.
 * @returns The normalized local font URL.
 */
const resolveFontUrl = (value: string): string => {
  if (!value || /^(?:data|javascript):/iu.test(value) || value.startsWith("//")) {
    throw new TypeError("[miaixz] Iconfont URL must reference a bundled local font.");
  }
  if (typeof window === "undefined") {
    if (!value.startsWith("file:") && !value.startsWith("/") && !value.startsWith("./")) {
      throw new TypeError("[miaixz] Iconfont server URL must be a bundled local path.");
    }
    return value;
  }
  const url = new URL(value, window.location.href);
  if (url.origin !== window.location.origin || !/^https?:$/u.test(url.protocol)) {
    throw new TypeError("[miaixz] Iconfont URL must be same-origin.");
  }
  return url.href;
};

/**
 * Loads and registers one local font once per browser document.
 *
 * @param family - Generated isolated font family.
 * @param url - Validated local font URL.
 * @returns A promise completed after registration.
 */
const loadFont = (family: string, url: string): Promise<void> => {
  if (typeof window === "undefined" || typeof FontFace === "undefined") return Promise.resolve();
  const key = `${family}:${url}`;
  const cached = fontLoads.get(key);
  if (cached) return cached;
  const pending = new FontFace(family, `url("${url.replaceAll('"', "%22")}")`)
    .load()
    .then((face) => {
      document.fonts.add(face);
    });
  fontLoads.set(key, pending);
  return pending;
};

/**
 * Converts an Iconfont manifest into the shared provider module contract.
 *
 * @param id - Provider identity used to isolate its font family.
 * @param manifest - Dependency-owned Iconfont manifest.
 * @returns A validated provider module.
 */
export function createIconfontModule(id: string, manifest: IconfontManifest): IconProviderModule {
  const fontUrl = resolveFontUrl(manifest.fontUrl);
  const fontFamily = `miaixz-iconfont-${id.replaceAll(/[^a-z0-9-]/giu, "-")}-${hash(fontUrl)}`;
  const seenGlyphs = new Set<string>();
  const icons: Partial<Record<IconName, IconLoader>> = {};
  for (const [rawName, glyph] of Object.entries(manifest.glyphs)) {
    if (!isIconName(rawName)) {
      throw new TypeError(`[miaixz] Unknown Iconfont standard name "${rawName}".`);
    }
    if (typeof glyph !== "string" || Array.from(glyph).length !== 1) {
      throw new TypeError(`[miaixz] Iconfont glyph for "${rawName}" must be one character.`);
    }
    if (seenGlyphs.has(glyph)) {
      throw new TypeError(`[miaixz] Duplicate Iconfont glyph for "${rawName}".`);
    }
    seenGlyphs.add(glyph);
    icons[rawName] = async () => {
      await loadFont(fontFamily, fontUrl);
      const definition: IconFontDefinition = {
        kind: "font",
        viewBox: "0 0 1024 1024",
        paint: "fill",
        fontFamily,
        glyph,
        x: manifest.x ?? 512,
        y: manifest.y ?? 800,
        fontSize: manifest.fontSize ?? 1024,
      };
      return { default: definition };
    };
  }
  return Object.freeze({ id, icons: Object.freeze(icons) });
}
