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
 * Configures a page title and action region. @public
 */
export interface HeaderProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /**
   * Selects the compact, vertically centered title composition.
   */
  variant?: "default" | "compact";
  /**
   * Lets a parent layout own spacing after a composed header.
   */
  spacing?: "default" | "none";
  /**
   * Supplies the page heading.
   */
  title: ReactNode;
  /**
   * Displays short context above the heading.
   */
  eyebrow?: ReactNode;
  /**
   * Displays supporting text below the heading.
   */
  description?: ReactNode;
  /**
   * Displays page-level actions.
   */
  actions?: ReactNode;
  /**
   * Selects the semantic heading level.
   */
  headingLevel?: 1 | 2 | 3;
}
