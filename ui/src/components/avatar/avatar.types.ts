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

/* eslint-disable jsdoc/require-jsdoc -- Closed Avatar slots are self-describing.
 */

import type { HTMLAttributes, ImgHTMLAttributes, RefAttributes } from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { MiaixzComponentSize } from "../shared.types.js";

export type AvatarSlot = "root" | "image" | "fallback";
export interface AvatarOwnerState {
  readonly size: MiaixzComponentSize;
  readonly state: "image" | "fallback";
  readonly decorative: boolean;
}
export type AvatarRootAttributes = HTMLAttributes<HTMLSpanElement> &
  RefAttributes<HTMLSpanElement> & {
    readonly "data-size"?: MiaixzComponentSize;
    readonly "data-state"?: "image" | "fallback";
  };
export interface AvatarSlotProps {
  readonly root?: MiaixzSlotProps<AvatarOwnerState, AvatarRootAttributes>;
  readonly image?: MiaixzSlotProps<AvatarOwnerState, ImgHTMLAttributes<HTMLImageElement>>;
  readonly fallback?: MiaixzSlotProps<AvatarOwnerState, HTMLAttributes<HTMLSpanElement>>;
}

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
  readonly size?: MiaixzComponentSize;

  /**
   * Configures the fixed Avatar nodes.
   */
  readonly slotProps?: AvatarSlotProps;
}

/**
 * Configures an accessible profile image with a deterministic name fallback.
 *
 * @public
 */
export interface AvatarProps
  extends
    Omit<
      HTMLAttributes<HTMLSpanElement>,
      | keyof MiaixzAvatarOwnProps
      | "aria-hidden"
      | "aria-label"
      | "aria-labelledby"
      | "children"
      | "role"
    >,
    MiaixzAvatarOwnProps {}
