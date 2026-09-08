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
 * Configures a local sidebar and content layout. @public
 */
export interface SidebarProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Supplies the sidebar content.
   */
  sidebar: ReactNode;
  /**
   * Provides an accessible label for the sidebar.
   */
  sidebarLabel?: string;
  /**
   * Keeps the sidebar visible while its content scrolls.
   */
  stickySidebar?: boolean;
  /**
   * Collapses this sidebar when the viewport enters the selected range or a
   * narrower range. Omitting the property preserves the default tablet collapse.
   */
  collapseAt?: "compactDesktop";
  /**
   * Selects the public local-sidebar width preset.
   */
  size?: "default" | "wide";
  /**
   * Adds a class to the main content region.
   */
  contentClassName?: string;
}
