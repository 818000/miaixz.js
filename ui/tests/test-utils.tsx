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

/* eslint-disable jsdoc/require-jsdoc --
 * Test-only rendering helpers are intentionally compact.
 */
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import type { ReactNode } from "react";

import { MiaixzLocaleProvider, miaixzUiMessages } from "../src/i18n/index.js";

export function renderWithLocale(
  children: ReactNode,
  options?: Omit<RenderOptions, "wrapper">,
): RenderResult {
  const i18n = createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages });
  return render(<MiaixzLocaleProvider i18n={i18n}>{children}</MiaixzLocaleProvider>, options);
}
