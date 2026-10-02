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
 * Verifies codepoint ranges, uniqueness, and priority tiers.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(process.cwd(), "../..");
const moduleUrl = pathToFileURL(
  resolve(repositoryRoot, ".github/scripts/modules/icons/fonts/validate-icon-font.mjs"),
).href;
const { validateCodepoints } = (await import(moduleUrl)) as {
  validateCodepoints: (releasePlan: unknown, codepoints: unknown) => void;
};
const releasePlan = JSON.parse(
  await readFile(resolve(process.cwd(), "src/assets/release-plan.json"), "utf8"),
) as Record<string, unknown>;
const codepoints = JSON.parse(
  await readFile(resolve(process.cwd(), "src/assets/fonts/codepoints.json"), "utf8"),
) as {
  schemaVersion: number;
  rangeStart: number;
  icons: Record<string, unknown>[];
};

/**
 * Creates an independently mutable ledger for one rejection case.
 *
 * @returns Mutable copy of the frozen fixture.
 */
function cloneCodepoints() {
  return structuredClone(codepoints);
}

describe("codepoint schema", () => {
  it("accepts the frozen contiguous ledger", () => {
    expect(() => validateCodepoints(releasePlan, codepoints)).not.toThrow();
  });

  it("rejects an invalid range start", () => {
    expect(() =>
      validateCodepoints(releasePlan, {
        ...cloneCodepoints(),
        rangeStart: 0xe000,
      }),
    ).toThrow(/start at U\+F0000/u);
  });

  it("rejects a duplicate codepoint", () => {
    const invalid = cloneCodepoints();
    const first = invalid.icons.at(0);
    const second = invalid.icons.at(1);
    if (first === undefined || second === undefined)
      throw new Error("Codepoint fixture is unexpectedly empty.");
    second.codepoint = first.codepoint;
    expect(() => validateCodepoints(releasePlan, invalid)).toThrow(
      /Invalid codepoint entry|Duplicate codepoint entry/u,
    );
  });

  it("rejects a wrong priority tier", () => {
    const invalid = cloneCodepoints();
    const firstExtended = invalid.icons.at(64);
    if (firstExtended === undefined)
      throw new Error("Extended codepoint fixture is unexpectedly empty.");
    firstExtended.tier = "core";
    expect(() => validateCodepoints(releasePlan, invalid)).toThrow(/Invalid codepoint entry/u);
  });
});
