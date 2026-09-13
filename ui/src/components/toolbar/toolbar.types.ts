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

/* eslint-disable jsdoc/require-jsdoc -- The behavior and naming union is self-describing.
 */
import type { HTMLAttributes, ReactNode } from "react";

export type ToolbarSurface = "plain" | "filled";
export type ToolbarDensity = "compact" | "standard" | "comfortable";
export type ToolbarOrientation = "horizontal" | "vertical";
type ToolbarName =
  | { readonly "aria-label": string; readonly "aria-labelledby"?: never }
  | { readonly "aria-label"?: never; readonly "aria-labelledby": string };
type ToolbarNoName = {
  readonly "aria-label"?: never;
  readonly "aria-labelledby"?: never;
};
type ToolbarNativeProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "aria-label" | "aria-labelledby" | "aria-orientation" | "children" | "role"
> & {
  readonly children: ReactNode;
  readonly surface?: ToolbarSurface;
  readonly density?: ToolbarDensity;
  readonly orientation?: ToolbarOrientation;
  readonly wrap?: boolean;
};
type SemanticToolbarProps = ToolbarNativeProps & ToolbarName & { readonly behavior: "toolbar" };
type GroupToolbarProps = ToolbarNativeProps &
  (ToolbarName | ToolbarNoName) & { readonly behavior?: "group" };
/*
 * Configures a visual control group or a keyboard-managed ARIA toolbar. @public
 */
export type ToolbarProps = SemanticToolbarProps | GroupToolbarProps;
