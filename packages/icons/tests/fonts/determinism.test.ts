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
 * Verifies the two-round font build rejects nondeterministic bytes.
 */

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

type CompareFontBuildHashes = (
  first: Readonly<Record<string, string>>,
  second: Readonly<Record<string, string>>,
) => void;

const moduleUrl = pathToFileURL(
  resolve(process.cwd(), "../../.github/scripts/modules/icons/fonts/build.mjs"),
).href;
const { compareFontBuildHashes } = (await import(moduleUrl)) as {
  compareFontBuildHashes: CompareFontBuildHashes;
};
const deterministic = Object.freeze({
  "miaixz-icons.woff2": "fixed-bytes",
});

describe("font build determinism", () => {
  it("accepts two byte-identical WOFF2 rounds", () => {
    expect(() => compareFontBuildHashes(deterministic, deterministic)).not.toThrow();
  });

  it("rejects a timestamp injected into the WOFF2", () => {
    const timestamped = {
      ...deterministic,
      "miaixz-icons.woff2": `${deterministic["miaixz-icons.woff2"]}:timestamp=1`,
    };
    expect(() => compareFontBuildHashes(deterministic, timestamped)).toThrow(
      /not byte deterministic/u,
    );
  });

  it("rejects missing or additional font outputs", () => {
    expect(() =>
      compareFontBuildHashes(deterministic, {
        ...deterministic,
        "unexpected.woff2": "unexpected",
      }),
    ).toThrow(/output set mismatch/u);
  });
});
