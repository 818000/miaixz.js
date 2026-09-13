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

/* eslint-disable jsdoc/require-jsdoc -- The renderer and landmark union is self-describing.
 */
import type { HTMLAttributes } from "react";

type PageBaseProps = { readonly fullWidth?: boolean };
type DivPageProps = PageBaseProps &
  Omit<HTMLAttributes<HTMLDivElement>, "aria-labelledby"> & {
    readonly component?: "div";
    readonly "aria-labelledby"?: never;
  };
type SectionPageProps = PageBaseProps &
  Omit<HTMLAttributes<HTMLElement>, "aria-label" | "aria-labelledby"> & {
    readonly component: "section";
    readonly "aria-label"?: never;
    readonly "aria-labelledby": string;
  };
/*
 * Configures a standard width and spacing container. @public
 */
export type PageProps = DivPageProps | SectionPageProps;
