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
 * Verifies deterministic public identifier safety before code generation.
 */

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(process.cwd(), "../..");
const moduleUrl = pathToFileURL(
  resolve(repositoryRoot, ".github/scripts/modules/icons/codegen/generate-icons.mjs"),
).href;
const { toIconIdentifier, validateIconIdentifiers, validateTypeScriptIdentifier } = (await import(
  moduleUrl
)) as {
  toIconIdentifier: (name: string) => string;
  validateIconIdentifiers: (names: readonly string[]) => ReadonlyMap<string, string>;
  validateTypeScriptIdentifier: (identifier: string) => void;
};

describe("generated icon identifiers", () => {
  it("uses a keyword-safe suffix for canonical names", () => {
    expect(toIconIdentifier("delete")).toBe("DeleteIcon");
    expect(toIconIdentifier("class")).toBe("ClassIcon");
  });

  it("rejects a direct JavaScript keyword identifier", () => {
    expect(() => validateTypeScriptIdentifier("class")).toThrow(
      /Invalid TypeScript icon identifier/u,
    );
  });

  it("rejects two names that collapse to the same identifier", () => {
    expect(() => validateIconIdentifiers(["x-1", "x1"])).toThrow(
      /collision: x-1 and x1 both become X1Icon/u,
    );
  });
});
