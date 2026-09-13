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

/* eslint-disable jsdoc/require-jsdoc -- The closed progress-state union is self-describing.
 */
import type { HTMLAttributes } from "react";

type BarNativeProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  | "aria-hidden"
  | "aria-label"
  | "aria-labelledby"
  | "aria-valuemax"
  | "aria-valuemin"
  | "aria-valuenow"
  | "aria-valuetext"
  | "children"
  | "role"
>;

type BarAccessibleName =
  | { readonly decorative: true; readonly label?: never }
  | { readonly decorative?: false; readonly label: string };

type BarProgress =
  | { readonly value?: never; readonly max?: never }
  | { readonly value: number; readonly max: number };

type ActiveBarProps = BarNativeProps &
  BarAccessibleName &
  BarProgress & {
    readonly active: true;
  };

type InactiveBarProps = BarNativeProps & {
  readonly active: false;
  readonly decorative?: never;
  readonly label?: never;
  readonly value?: never;
  readonly max?: never;
};

/*
 * Configures fixed page-level loading progress. @public
 */
export type BarProps = ActiveBarProps | InactiveBarProps;
