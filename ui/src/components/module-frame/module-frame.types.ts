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
 * Defines one route-level navigation item rendered by ModuleFrame. @public
 */
export interface MiaixzModuleFrameNavigationItem {
  /**
   * Uniquely identifies the route-level item.
   */
  readonly id: string;
  /**
   * Supplies the visible route-level label.
   */
  readonly label: ReactNode;
  /**
   * Prevents route selection.
   */
  readonly disabled?: boolean;
}

/**
 * Defines the controlled navigation rendered by ModuleFrame. @public
 */
export interface MiaixzModuleFrameNavigation {
  /**
   * Provides the navigation's accessible name.
   */
  readonly label: string;
  /**
   * Supplies the available route-level items.
   */
  readonly items: readonly MiaixzModuleFrameNavigationItem[];
  /**
   * Controls the selected route-level item.
   */
  readonly value: string;
  /**
   * Runs when a route-level item is selected.
   */
  readonly onValueChange: (value: string) => void;
}

/**
 * Configures the shared route-level page frame. @public
 */
export interface ModuleFrameProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /**
   * Selects default, compact, or workspace frame composition.
   *
   * @defaultValue `"default"`
   */
  readonly variant?: "default" | "compact" | "workspace";
  /**
   * Supplies a fully composed identity header; workspace preserves native three-row structure.
   */
  readonly headerContent?: ReactNode;
  /**
   * Supplies already composed navigation; `null` intentionally renders no navigation.
   */
  readonly navigationContent?: ReactNode;
  /**
   * Supplies consumer attributes and surface styling to the masthead slot.
   */
  readonly mastheadProps?: HTMLAttributes<HTMLDivElement> & {
    readonly [key: `data-${string}`]: string | number | boolean | undefined;
  };
  /**
   * Supplies consumer attributes to the content slot.
   */
  readonly contentProps?: HTMLAttributes<HTMLDivElement> & {
    readonly [key: `data-${string}`]: string | number | boolean | undefined;
  };
  /**
   * Provides the frame's accessible name.
   */
  readonly "aria-label": string;
  /**
   * Supplies the page heading.
   */
  readonly title: ReactNode;
  /**
   * Displays supporting text below the heading.
   */
  readonly description?: ReactNode;
  /**
   * Displays page-level actions.
   */
  readonly actions?: ReactNode;
  /**
   * Selects the semantic heading level.
   */
  readonly headingLevel?: 1 | 2 | 3;
  /**
   * Supplies optional controlled route-level navigation.
   */
  readonly navigation?: MiaixzModuleFrameNavigation;
  /**
   * Marks the frame and its navigation unavailable.
   */
  readonly disabled?: boolean;
  /**
   * Supplies page content.
   */
  readonly children: ReactNode;
}
