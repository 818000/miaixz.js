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

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { format } from "prettier";
import prettierConfiguration from "../../../ui/prettier.config.js";
import { repositoryRoot } from "../miaixz.mjs";

const packageDirectory = resolve(repositoryRoot, "ui");
const checkOnly = process.argv.slice(2).includes("--check");
const sourceHeader = (await readFile(resolve(repositoryRoot, ".github/scripts/miaixz.org"), "utf8"))
  .replaceAll("\r\n", "\n")
  .trim();
const builtTokensPath = resolve(packageDirectory, "dist/design/breakpoints.js");
const outputPath = resolve(packageDirectory, "src/styles/foundation/responsive.css");
const { miaixzBreakpoints, miaixzContainerQueries, miaixzMediaQueries } = await import(
  pathToFileURL(builtTokensPath).href
);

assertBreakpointContract(miaixzBreakpoints, miaixzMediaQueries, miaixzContainerQueries);
const expected = await format(
  serializeResponsive(miaixzBreakpoints, miaixzMediaQueries, miaixzContainerQueries),
  {
    ...prettierConfiguration,
    parser: "css",
  },
);
const current = await readFile(outputPath, "utf8").catch(() => undefined);

if (current !== expected) {
  if (checkOnly) process.exitCode = 1;
  else {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, expected, "utf8");
  }
}

/**
 * Verifies that compiled responsive tokens preserve the frozen public breakpoint contract.
 *
 * @param {Record<string, number>} breakpoints Compiled viewport breakpoints.
 * @param {Record<string, string>} mediaQueries Compiled viewport media queries.
 * @param {Record<string, { name: string, maxWidth: number }>} containers Compiled container queries.
 * @returns {void}
 * @throws {Error} If a compiled responsive token differs from the required contract.
 */
function assertBreakpointContract(breakpoints, mediaQueries, containers) {
  const expectedBreakpoints = {
    mobile: 0,
    tablet: 768,
    compactDesktop: 1024,
    desktop: 1280,
    wide: 1440,
  };
  const expectedQueries = {
    mobile: "(width < 768px)",
    tablet: "(768px <= width < 1024px)",
    compactDesktop: "(1024px <= width < 1280px)",
    desktop: "(1280px <= width < 1440px)",
    wide: "(width >= 1440px)",
  };
  if (JSON.stringify(breakpoints) !== JSON.stringify(expectedBreakpoints)) {
    throw new Error("Viewport breakpoint contract has drifted.");
  }
  if (JSON.stringify(mediaQueries) !== JSON.stringify(expectedQueries)) {
    throw new Error("Viewport media-query contract has drifted.");
  }
  if (Object.keys(containers).length !== 9) {
    throw new Error("Container-query contract must contain exactly nine entries.");
  }
}

/**
 * Serializes compiled responsive tokens into the generated foundation stylesheet.
 *
 * @param {Record<string, number>} breakpoints Compiled viewport breakpoints.
 * @param {Record<string, string>} mediaQueries Compiled viewport media queries.
 * @param {Record<string, { name: string, maxWidth: number }>} containers Compiled container queries.
 * @returns {string} Complete responsive CSS source.
 */
function serializeResponsive(breakpoints, mediaQueries, containers) {
  const containerRules = Object.values(containers)
    .map(
      ({ name, maxWidth }) =>
        `[container-name="${name}"] {\n  --${name}-collapse-width: ${maxWidth}px;\n}`,
    )
    .join("\n\n");
  return [
    sourceHeader,
    "",
    "/**\n * Generated from ui/src/design/breakpoints.ts; do not edit.\n */",
    "",
    "[data-miaixz-theme] {",
    `  --miaixz-breakpoint-tablet: ${breakpoints.tablet}px;`,
    `  --miaixz-breakpoint-compact-desktop: ${breakpoints.compactDesktop}px;`,
    `  --miaixz-breakpoint-desktop: ${breakpoints.desktop}px;`,
    `  --miaixz-breakpoint-wide: ${breakpoints.wide}px;`,
    "  --miaixz-page-gutter: clamp(var(--miaixz-layout-page-gutter-min), 2.2vw, var(--miaixz-layout-page-gutter-max));",
    "  --miaixz-responsive-section-gap: var(--miaixz-density-section-gap);",
    "  --miaixz-responsive-panel-min: min(100%, var(--miaixz-layout-card-min-width));",
    "  --miaixz-responsive-reading-width: var(--miaixz-layout-reading-width-ch);",
    "  --miaixz-hover-capable: 1;",
    "  --miaixz-safe-area-block-start: env(safe-area-inset-top, 0px);",
    "  --miaixz-safe-area-block-end: env(safe-area-inset-bottom, 0px);",
    "  --miaixz-viewport-block: 100vh;",
    "  --miaixz-responsive-dialog-inline-size: min(var(--miaixz-layout-dialog-width), calc(100vi - 32px));",
    "  --miaixz-responsive-popover-inline-size: min(var(--miaixz-layout-popover-max-width), calc(100vi - 16px));",
    "  --miaixz-responsive-overlay-block-size: calc(var(--miaixz-viewport-block) - 16px);",
    "}",
    "",
    "@supports (height: 100dvh) {",
    "  [data-miaixz-theme] {",
    "    --miaixz-viewport-block: 100dvh;",
    "  }",
    "}",
    "",
    "[data-miaixz-theme]:dir(ltr) {",
    "  --miaixz-safe-area-inline-start: env(safe-area-inset-left, 0px);",
    "  --miaixz-safe-area-inline-end: env(safe-area-inset-right, 0px);",
    "}",
    "",
    "[data-miaixz-theme]:dir(rtl) {",
    "  --miaixz-safe-area-inline-start: env(safe-area-inset-right, 0px);",
    "  --miaixz-safe-area-inline-end: env(safe-area-inset-left, 0px);",
    "}",
    "",
    containerRules,
    "",
    `@media ${mediaQueries.mobile} {`,
    "  .miaixz-dialog {",
    "    inline-size: calc(100vi - 16px);",
    "    margin-block-start: max(8px, var(--miaixz-safe-area-block-start));",
    "    margin-block-end: max(8px, var(--miaixz-safe-area-block-end));",
    "    margin-inline-start: max(8px, var(--miaixz-safe-area-inline-start));",
    "    margin-inline-end: max(8px, var(--miaixz-safe-area-inline-end));",
    "  }",
    "",
    "  .miaixz-dialog-footer {",
    "    flex-direction: column-reverse;",
    "    align-items: stretch;",
    "  }",
    "",
    "  .miaixz-dialog-footer > .miaixz-control {",
    "    inline-size: 100%;",
    "  }",
    "",
    "  dialog.miaixz-drawer:not(.miaixz-drawer-bottom) {",
    "    inline-size: 100%;",
    "  }",
    "",
    "  .miaixz-toaster {",
    "    inset-block-start: max(8px, var(--miaixz-safe-area-block-start));",
    "    inset-inline: max(8px, var(--miaixz-safe-area-inline-start)) max(8px, var(--miaixz-safe-area-inline-end));",
    "    inline-size: auto;",
    "  }",
    "}",
    "",
    "@media (width < 1024px) {",
    "  .miaixz-sidebar {",
    "    grid-template-columns: minmax(0, 1fr);",
    "  }",
    "",
    "  .miaixz-sidebar > .miaixz-sidebar-aside[data-sticky] {",
    "    position: static;",
    "  }",
    "}",
    "",
    "@media (pointer: coarse) {",
    "  :is(.miaixz-control, .miaixz-pressable, .miaixz-button) {",
    "    min-inline-size: 44px;",
    "    min-block-size: 44px;",
    "  }",
    "}",
    "",
    "@media (hover: none) {",
    "  [data-miaixz-theme] {",
    "    --miaixz-hover-capable: 0;",
    "  }",
    "}",
    "",
    "@media (orientation: landscape) {",
    "  :is(.miaixz-dialog, .miaixz-drawer) {",
    "    max-block-size: calc(var(--miaixz-viewport-block) - var(--miaixz-safe-area-block-start) - var(--miaixz-safe-area-block-end));",
    "  }",
    "}",
    "",
    "@media (prefers-reduced-motion: reduce) {",
    "  [data-miaixz-theme] {",
    "    --miaixz-motion-interaction-duration: 0.01ms;",
    "    --miaixz-motion-state-duration: 0.01ms;",
    "    --miaixz-motion-overlay-duration: 0.01ms;",
    "  }",
    "",
    "  [data-miaixz-theme],",
    "  [data-miaixz-theme] *,",
    "  [data-miaixz-theme] *::before,",
    "  [data-miaixz-theme] *::after {",
    "    scroll-behavior: auto !important;",
    "    transition-duration: 0.01ms !important;",
    "    animation-duration: 0.01ms !important;",
    "    animation-iteration-count: 1 !important;",
    "  }",
    "}",
    "",
    "@media (forced-colors: active) {",
    "  [data-miaixz-theme] {",
    "    forced-color-adjust: auto;",
    "  }",
    "}",
    "",
    "@media print {",
    "  [data-miaixz-theme] * {",
    "    text-shadow: none !important;",
    "    box-shadow: none !important;",
    "  }",
    "}",
    "",
  ].join("\n");
}
