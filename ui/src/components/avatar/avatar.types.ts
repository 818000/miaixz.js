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

import type { HTMLAttributes } from "react";

import type { MiaixzComponentSize } from "../shared.types.js";

/**
 * Defines properties owned by the Miaixz Avatar contract.
 *
 * @public
 */
export interface MiaixzAvatarOwnProps {
  /**
   * Supplies the optional profile image source.
   */
  readonly src?: string;

  /**
   * Supplies the required accessible name for either image or fallback content.
   */
  readonly alt: string;

  /**
   * Supplies the name used to derive fallback graphemes.
   */
  readonly name: string;

  /**
   * Selects the semantic avatar size.
   *
   * @defaultValue `"medium"`
   */
  readonly size?: MiaixzComponentSize | "account" | "profile" | "fill";
}

/**
 * Configures an accessible profile image with a deterministic name fallback.
 *
 * @public
 */
export interface AvatarProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, keyof MiaixzAvatarOwnProps>, MiaixzAvatarOwnProps {}
