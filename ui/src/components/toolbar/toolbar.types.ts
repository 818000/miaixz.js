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

import type { HTMLAttributes, ReactNode } from "react";

/**
 * Configures an accessible group of related controls.
 *
 * @public
 */
export interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Provides the required accessible toolbar label.
   */
  label: string;
  /**
   * Selects the control flow direction and keyboard metadata.
   *
   * @defaultValue `"horizontal"`
   */
  orientation?: "horizontal" | "vertical";
  /**
   * Supplies leading filters, search, or contextual content.
   */
  leading?: ReactNode;
  /**
   * Supplies trailing toolbar actions.
   */
  actions?: ReactNode;
  /**
   * Keeps the toolbar visible within its scrolling container.
   *
   * @defaultValue `false`
   */
  sticky?: boolean;
  /**
   * Selects a reusable toolbar composition without encoding filter fields or column widths.
   *
   * @defaultValue `"default"`
   */
  variant?: "default" | "panel" | "directory" | "filter" | "batch" | "editor" | "grid" | "inline";
}
