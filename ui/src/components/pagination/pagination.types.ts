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
 * Configures controlled page-number navigation.
 *
 * @public
 */
export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, "onChange"> {
  /**
   * Selects default navigation or an unframed compact footer with optional native children.
   */
  variant?: "default" | "plain" | "plain-inset";
  /**
   * Selects the current one-based page.
   */
  page: number;
  /**
   * Supplies the total number of pages.
   */
  pageCount: number;
  /**
   * Receives a requested one-based page.
   */
  onPageChange: (page: number) => void;
  /**
   * Controls the page count shown on either side of the current page.
   *
   * @defaultValue `1`
   */
  siblingCount?: number;
  /**
   * Overrides the localized navigation label.
   */
  label?: string;
  /**
   * Overrides the localized previous-page label.
   */
  previousLabel?: string;
  /**
   * Overrides the localized next-page label.
   */
  nextLabel?: string;
  /**
   * Displays optional pagination summary content.
   */
  summary?: ReactNode;
}
