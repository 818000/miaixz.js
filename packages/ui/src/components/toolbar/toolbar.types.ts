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
 * Defines the toolbar public type contracts.
 */

import type { HTMLAttributes, ReactNode } from "react";

/**
 * Toolbar surface treatments permitted by the component contract.
 */
export type ToolbarSurface = "plain" | "filled";
/**
 * Toolbar spacing densities permitted by the component contract.
 */
export type ToolbarDensity = "compact" | "standard" | "comfortable";
/**
 * Toolbar layout orientations permitted by the component contract.
 */
export type ToolbarOrientation = "horizontal" | "vertical";
/**
 * Toolbar visual variants permitted by the component contract.
 */
export type ToolbarVariant =
  | "default"
  | "actions"
  | "panel"
  | "directory"
  | "sticky"
  | "filter"
  | "inline"
  | "batch"
  | "editor"
  | "grid";
/**
 * Toolbar accessible naming alternatives permitted by the component contract.
 */
type ToolbarName =
  | { readonly "aria-label": string; readonly "aria-labelledby"?: never }
  | { readonly "aria-label"?: never; readonly "aria-labelledby": string };
/**
 * Toolbar No accessible naming alternatives permitted by the component contract.
 */
type ToolbarNoName = {
  readonly "aria-label"?: never;
  readonly "aria-labelledby"?: never;
};
/**
 * Properties accepted by the Toolbar Native renderer.
 */
type ToolbarNativeProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "aria-label" | "aria-labelledby" | "aria-orientation" | "children" | "role"
> & {
  readonly children: ReactNode;
  readonly search?: ReactNode;
  readonly filters?: ReactNode;
  readonly actions?: ReactNode;
  readonly surface?: ToolbarSurface;
  readonly density?: ToolbarDensity;
  readonly orientation?: ToolbarOrientation;
  readonly wrap?: boolean;
  readonly variant?: ToolbarVariant;
  readonly label?: string;
};
/**
 * Properties accepted by the Semantic Toolbar renderer.
 */
type SemanticToolbarProps = ToolbarNativeProps & ToolbarName & { readonly behavior: "toolbar" };
/**
 * Properties accepted by the Group Toolbar renderer.
 */
type GroupToolbarProps = ToolbarNativeProps &
  (ToolbarName | ToolbarNoName) & { readonly behavior?: "group" };
/**
 * Configures a visual control group or a keyboard-managed ARIA toolbar. @public
 */
export type ToolbarProps = SemanticToolbarProps | GroupToolbarProps;
