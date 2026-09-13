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

import "@testing-library/jest-dom/vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Icon, type MiaixzIconName } from "../src/index.js";

afterEach(cleanup);

describe("Icon provider contract", () => {
  it("renders core icons synchronously through the unchanged name API", () => {
    const ref = createRef<SVGSVGElement>();
    const html = renderToString(
      <Icon ref={ref} name="Blocks" size="navigation" stroke="strong" label="租户管理" />,
    );

    expect(html).toContain("lucide-blocks");
    expect(html).toContain("miaixz-icon-navigation");
    expect(html).toContain("miaixz-icon-strong");
    expect(html).toContain('aria-label="租户管理"');
  });

  it("loads non-core icons from the complete catalog on demand", async () => {
    const { container } = render(
      <>
        <Icon name="Accessibility" label="无障碍" />
        <Icon name="Grid3x2" label="网格" />
      </>,
    );

    await waitFor(() => {
      expect(container.querySelector(".lucide-accessibility")).toBeInTheDocument();
      expect(container.querySelector(".lucide-grid3x2")).toBeInTheDocument();
    });
    expect(container.querySelector('[data-miaixz-icon-loading="true"]')).not.toBeInTheDocument();
  });

  it("preserves native SVG sizing and decorative accessibility defaults", () => {
    const { container } = render(<Icon name="Search" size={20} />);
    const icon = container.querySelector("svg");

    expect(icon).toHaveAttribute("width", "20");
    expect(icon).toHaveAttribute("height", "20");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveAttribute("focusable", "false");
  });

  it("falls back safely when untyped runtime data contains an unknown name", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const invalidName = "NotAnIcon" as MiaixzIconName;
    const { container } = render(<Icon name={invalidName} />);

    expect(container.querySelector(".lucide-circle-question-mark")).toBeInTheDocument();
    expect(error).toHaveBeenCalledWith('[miaixz] Unknown icon name "NotAnIcon".');
    error.mockRestore();
  });
});
