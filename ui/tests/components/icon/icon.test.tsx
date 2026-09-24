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
 * Verifies icon behavior in the UI package.
 */

import "@testing-library/jest-dom/vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ICON_NAMES,
  Icon,
  IconRegistryProvider,
  composeIconProviders,
  createCustomIconProvider,
  createIconRegistry,
  createIconfontProvider,
  defineLazyIconSource,
  fontAwesomeProvider,
  lucideProvider,
  parseIconName,
  type IconDefinition,
  type IconProviderModule,
} from "../../../src/icons/index.js";
import { assertIconDefinition } from "../../../src/icons/icon-definition.js";

const miaixzSearchDefinition: IconDefinition = {
  kind: "svg",
  viewBox: "0 0 24 24",
  paint: "fill",
  nodes: [{ tag: "path", attributes: { d: "M2 2h20v20H2z" } }],
};

/**
 * Creates a representative future Miaixz-owned icon provider.
 *
 * @returns A dependency-owned provider using the public extension contract.
 */
const createMiaixzProvider = () =>
  createCustomIconProvider({
    id: "miaixz-icons",
    dependency: "@miaixz/icons",
    path: "./provider",
    load: async (): Promise<IconProviderModule> => ({
      id: "miaixz-icons",
      icons: {
        [ICON_NAMES.SEARCH]: async () => ({ default: miaixzSearchDefinition }),
      },
    }),
  });

afterEach(cleanup);

describe("Icon provider contract", () => {
  it("loads the complete Lucide mapping through the stable standard name", async () => {
    const { container } = render(
      <Icon name={ICON_NAMES.ACCESSIBILITY} label="无障碍" size="navigation" stroke="strong" />,
    );

    await waitFor(() => {
      expect(container.querySelector('[data-miaixz-icon-paint="stroke"]')).toBeInTheDocument();
    });
    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("miaixz-icon-navigation", "miaixz-icon-strong");
    expect(icon).toHaveAttribute("aria-label", "无障碍");
  });

  it("preserves native SVG sizing, ref, and decorative accessibility defaults", async () => {
    const ref = createRef<SVGSVGElement>();
    const { container } = render(<Icon ref={ref} name={ICON_NAMES.SEARCH} size={20} />);

    await waitFor(() => expect(ref.current).toHaveAttribute("data-miaixz-icon-paint", "stroke"));
    expect(container.querySelector("svg")).toHaveAttribute("width", "20");
    expect(ref.current).toHaveAttribute("height", "20");
    expect(ref.current).toHaveAttribute("aria-hidden", "true");
    expect(ref.current).toHaveAttribute("focusable", "false");
  });

  it("parses untrusted names without weakening IconName", () => {
    const onInvalid = vi.fn();
    expect(parseIconName("not-an-icon", { onInvalid })).toBe(ICON_NAMES.HELP);
    expect(onInvalid).toHaveBeenCalledWith("not-an-icon");
    expect(parseIconName(ICON_NAMES.SEARCH)).toBe(ICON_NAMES.SEARCH);
  });

  it("selects Font Awesome while retaining Lucide as the complete fallback", async () => {
    const registry = createIconRegistry({
      defaultProvider: composeIconProviders(fontAwesomeProvider, lucideProvider),
    });
    const { container } = render(
      <IconRegistryProvider registry={registry}>
        <Icon name={ICON_NAMES.SEARCH} />
        <Icon name={ICON_NAMES.SEARCH_ALERT} />
      </IconRegistryProvider>,
    );

    await waitFor(() => {
      expect(container.querySelectorAll('[data-miaixz-icon-paint="fill"]')).toHaveLength(1);
      expect(container.querySelectorAll('[data-miaixz-icon-paint="stroke"]')).toHaveLength(1);
    });
  });

  it("supports a future Miaixz-owned library as a dependency and path provider", async () => {
    const registry = createIconRegistry({ defaultProvider: createMiaixzProvider() });
    const { container } = render(
      <IconRegistryProvider registry={registry}>
        <Icon name={ICON_NAMES.SEARCH} />
      </IconRegistryProvider>,
    );

    await waitFor(() => {
      expect(container.querySelector('[data-miaixz-icon-paint="fill"] path')).toHaveAttribute(
        "d",
        "M2 2h20v20H2z",
      );
    });
  });

  it("supports a dependency and path override for one standard icon", async () => {
    const registry = createIconRegistry({
      icons: {
        [ICON_NAMES.SEARCH]: defineLazyIconSource({
          dependency: "@miaixz/icons",
          path: "./search",
          load: async () => ({ default: miaixzSearchDefinition }),
        }),
      },
    });
    const { container } = render(
      <IconRegistryProvider registry={registry}>
        <Icon name={ICON_NAMES.SEARCH} />
      </IconRegistryProvider>,
    );

    await waitFor(() => {
      expect(container.querySelector('[data-miaixz-icon-paint="fill"]')).toBeInTheDocument();
    });
  });

  it("rejects unsafe custom dependency declarations and SVG definitions", () => {
    expect(() =>
      createCustomIconProvider({
        id: "unsafe",
        dependency: "../icons",
        path: "./provider",
        load: async () => ({ id: "unsafe", icons: {} }),
      }),
    ).toThrow("Invalid icon dependency");
    expect(() =>
      createCustomIconProvider({
        id: " ",
        dependency: "@miaixz/icons",
        path: "./provider",
        load: async () => ({ id: "unused", icons: {} }),
      }),
    ).toThrow("provider id is required");
    expect(() =>
      defineLazyIconSource({
        dependency: "@miaixz/icons",
        path: "../search",
        load: async () => ({ default: miaixzSearchDefinition }),
      }),
    ).toThrow("Invalid icon dependency path");
    expect(() => assertIconDefinition(null)).toThrow("must be an object");
    expect(() =>
      assertIconDefinition({
        kind: "svg",
        viewBox: "0 0 24 24",
        paint: "stroke",
        nodes: [{ tag: "script", attributes: { d: "M0 0" } }],
      }),
    ).toThrow("Unsupported SVG icon node");
    expect(() =>
      assertIconDefinition({
        kind: "svg",
        viewBox: "0 0 24 24",
        paint: "stroke",
        nodes: [{ tag: "path", attributes: { onClick: "alert(1)" } }],
      }),
    ).toThrow("Unsupported SVG icon attribute");
    expect(() =>
      assertIconDefinition({
        kind: "svg",
        viewBox: "0 0 24 24",
        paint: "stroke",
        nodes: [{ tag: "path", attributes: { d: "javascript:alert(1)" } }],
      }),
    ).toThrow('Invalid icon attribute "d"');
    expect(() =>
      assertIconDefinition({
        kind: "font",
        viewBox: "0 0 1024 1024",
        paint: "fill",
        fontFamily: "javascript:font",
        glyph: "\ue001",
        x: 512,
        y: 800,
        fontSize: 1024,
      }),
    ).toThrow("Invalid icon font definition");
  });

  it("accepts a custom provider module exported as default", async () => {
    const module: IconProviderModule = {
      id: "default-export-icons",
      icons: {
        [ICON_NAMES.SEARCH]: async () => ({ default: miaixzSearchDefinition }),
      },
    };
    const provider = createCustomIconProvider({
      id: module.id,
      dependency: "@miaixz/icons",
      path: "./default-provider",
      load: async () => ({ default: module }),
    });
    const registry = createIconRegistry({ defaultProvider: provider });
    await registry.preload([ICON_NAMES.SEARCH]);
    expect(registry.read(ICON_NAMES.SEARCH)).toEqual(miaixzSearchDefinition);
  });

  it("supports an Iconfont manifest from an explicit dependency path", async () => {
    const provider = createIconfontProvider({
      id: "company-iconfont",
      dependency: "@miaixz/company-icons",
      path: "./iconfont-manifest",
      load: async () => ({
        fontUrl: "/assets/company-icons.woff2",
        glyphs: { [ICON_NAMES.SEARCH]: "\ue001" },
      }),
    });
    const registry = createIconRegistry({ defaultProvider: provider });
    const { container } = render(
      <IconRegistryProvider registry={registry}>
        <Icon name={ICON_NAMES.SEARCH} />
      </IconRegistryProvider>,
    );

    await waitFor(() => {
      expect(container.querySelector('[data-miaixz-icon-paint="font"] text')).toHaveTextContent(
        "\ue001",
      );
    });
  });

  it("rejects unsafe and invalid Iconfont manifests", async () => {
    const remote = createIconfontProvider({
      id: "remote-font",
      dependency: "@miaixz/company-icons",
      path: "./remote",
      load: async () => ({
        fontUrl: "https://assets.example.com/icons.woff2",
        glyphs: { [ICON_NAMES.SEARCH]: "\ue001" },
      }),
    });
    await expect(remote.load()).rejects.toThrow("same-origin");

    const duplicate = createIconfontProvider({
      id: "duplicate-font",
      dependency: "@miaixz/company-icons",
      path: "./duplicate",
      load: async () => ({
        fontUrl: "/assets/icons.woff2",
        glyphs: {
          [ICON_NAMES.SEARCH]: "\ue001",
          [ICON_NAMES.ADD]: "\ue001",
        },
      }),
    });
    await expect(duplicate.load()).rejects.toThrow("Duplicate Iconfont glyph");
  });

  it("keeps registries isolated across React subtrees", async () => {
    const miaixzRegistry = createIconRegistry({ defaultProvider: createMiaixzProvider() });
    const lucideRegistry = createIconRegistry();
    const { container } = render(
      <>
        <IconRegistryProvider registry={miaixzRegistry}>
          <span data-testid="miaixz">
            <Icon name={ICON_NAMES.SEARCH} />
          </span>
        </IconRegistryProvider>
        <IconRegistryProvider registry={lucideRegistry}>
          <span data-testid="lucide">
            <Icon name={ICON_NAMES.SEARCH} />
          </span>
        </IconRegistryProvider>
      </>,
    );

    await waitFor(() => {
      expect(
        container.querySelector('[data-testid="miaixz"] [data-miaixz-icon-paint="fill"]'),
      ).toBeInTheDocument();
      expect(
        container.querySelector('[data-testid="lucide"] [data-miaixz-icon-paint="stroke"]'),
      ).toBeInTheDocument();
    });
  });

  it("renders a stable Suspense fallback during server rendering", () => {
    const pendingProvider = createCustomIconProvider({
      id: "pending-icons",
      dependency: "@miaixz/icons",
      path: "./pending",
      load: () => new Promise<IconProviderModule>(() => undefined),
    });
    const registry = createIconRegistry({ defaultProvider: pendingProvider });
    const html = renderToString(
      <IconRegistryProvider registry={registry}>
        <Icon name={ICON_NAMES.SEARCH} />
      </IconRegistryProvider>,
    );
    expect(html).toContain("data-miaixz-icon-loading");
    expect(html).toContain("miaixz-icon-inline");
  });
});
