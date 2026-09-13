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

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/styles/components/metrics.css", "utf8");

describe("metric styling contract", () => {
  it("uses the final data dimensions and low card elevation", () => {
    expect(css).toContain('.miaixz-metric[data-variant="summary"]');
    expect(css).toContain('.miaixz-metric[data-variant="strip"]');
    expect(css).toContain('.miaixz-metric[data-variant="card"]');
    expect(css).toContain("box-shadow: var(--miaixz-shadow-low);");
  });

  it("maps semantic tones through one component-owned token", () => {
    expect(css).toContain("--miaixz-metric-tone: var(--miaixz-color-brand);");
    expect(css).toContain("--miaixz-metric-tone: var(--miaixz-color-danger);");
    expect(css).not.toContain("miaixz-metric-summary");
  });
});
