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
 * Configures an empty, missing, or filtered state.
 *
 * @public
 */
export interface EmptyProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /**
   * Selects the composed empty state or a plain text-only message.
   */
  variant?: "default" | "plain";
  /**
   * Supplies the empty heading.
   */
  title: ReactNode;
  /**
   * Supplies supporting explanatory content.
   */
  description?: ReactNode;
  /**
   * Displays optional illustrative icon content.
   */
  icon?: ReactNode;
  /**
   * Displays optional recovery or creation actions.
   */
  actions?: ReactNode;
  /**
   * Reduces the component spacing for constrained regions.
   *
   * @defaultValue `false`
   */
  compact?: boolean;
  /**
   * Selects the semantic heading level.
   *
   * @defaultValue `3`
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}
