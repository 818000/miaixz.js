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

import type {
  ComponentPropsWithoutRef,
  ForwardedRef,
  ForwardRefExoticComponent,
  ReactElement,
  RefAttributes,
} from "react";

import type { MiaixzIconName } from "./icon-name.generated.js";

/**
 * Defines the provider-neutral SVG properties passed to an icon implementation.
 *
 * @internal
 */
export type IconProviderProps = Omit<ComponentPropsWithoutRef<"svg">, "children">;

/**
 * Defines a provider icon component without exposing the provider's public types.
 *
 * @internal
 */
export type IconProviderSource = ForwardRefExoticComponent<
  IconProviderProps & RefAttributes<SVGSVGElement>
>;

/**
 * Defines the internal boundary implemented by the active icon provider.
 *
 * @internal
 */
export type IconProviderRenderer = (
  name: MiaixzIconName,
  props: IconProviderProps,
  ref: ForwardedRef<SVGSVGElement>,
) => ReactElement;
