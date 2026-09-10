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

/*
 * @vitest-environment node
 */

import { build } from "esbuild";
import { describe, expect, it } from "vitest";

describe("Icon bundle boundary", () => {
  it("keeps the full catalog split away from the consumer entry", async () => {
    const result = await build({
      stdin: {
        contents:
          'import React from "react"; import { Icon } from "./src/icons/index.ts"; export const Example = () => React.createElement(Icon, { name: "Blocks" });',
        resolveDir: process.cwd(),
        sourcefile: "icon-consumer.mjs",
      },
      bundle: true,
      external: ["react", "react/*"],
      format: "esm",
      metafile: true,
      minify: true,
      outdir: "virtual-output",
      splitting: true,
      write: false,
    });
    const outputs = Object.entries(result.metafile.outputs).map(([path, output]) => ({
      path,
      bytes: output.bytes,
      entryPoint: output.entryPoint,
    }));
    const entry = outputs.find((output) => output.entryPoint === "icon-consumer.mjs");
    const lazyChunks = outputs.filter((output) => output.path !== entry?.path);

    expect(entry).toBeDefined();
    expect(entry!.bytes).toBeLessThan(180_000);
    expect(lazyChunks.length).toBeGreaterThan(2_000);
    expect(Math.max(...lazyChunks.map((chunk) => chunk.bytes))).toBeLessThan(5_000);
  });
});
