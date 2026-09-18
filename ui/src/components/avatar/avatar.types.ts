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

import type { HTMLAttributes, ImgHTMLAttributes, ReactNode, RefAttributes } from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { MiaixzComponentSize } from "../shared.types.js";

export type AvatarSlot = "root" | "image" | "fallback" | "indicator";
export type AvatarVariant = "circular" | "rounded" | "square";
export interface AvatarOwnerState {
  readonly size: MiaixzComponentSize;
  readonly state: "image" | "fallback";
  readonly decorative: boolean;
  readonly hasIndicator: boolean;
  readonly variant: AvatarVariant;
}
export type AvatarRootAttributes = HTMLAttributes<HTMLSpanElement> &
  RefAttributes<HTMLSpanElement> & {
    readonly "data-size"?: MiaixzComponentSize;
    readonly "data-state"?: "image" | "fallback";
    readonly "data-variant"?: AvatarVariant;
  };
export interface AvatarSlotProps {
  readonly root?: MiaixzSlotProps<AvatarOwnerState, AvatarRootAttributes>;
  readonly image?: MiaixzSlotProps<AvatarOwnerState, ImgHTMLAttributes<HTMLImageElement>>;
  readonly fallback?: MiaixzSlotProps<AvatarOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly indicator?: MiaixzSlotProps<AvatarOwnerState, HTMLAttributes<HTMLSpanElement>>;
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
   * Supplies responsive profile image candidates.
   */
  readonly srcSet?: string;

  /**
   * Supplies the responsive image slot sizes hint.
   */
  readonly sizes?: string;

  /**
   * Supplies the required accessible name for either image or fallback content.
   */
  readonly alt?: string;

  /**
   * Supplies the name used to derive fallback graphemes.
   */
  readonly name?: string;

  /**
   * Supplies explicit text or icon fallback content.
   */
  readonly children?: ReactNode;

  /**
   * Supplies optional status, count, or custom overlay content.
   */
  readonly indicator?: ReactNode;

  /**
   * Supplies an accessible name for meaningful indicator content.
   */
  readonly indicatorLabel?: string;

  /**
   * Selects the semantic avatar size.
   *
   * @defaultValue `"medium"`
   */
  readonly size?: MiaixzComponentSize;

  /**
   * Selects the avatar shape.
   *
   * @defaultValue `"circular"`
   */
  readonly variant?: AvatarVariant;

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
      keyof MiaixzAvatarOwnProps | "aria-hidden" | "aria-label" | "aria-labelledby" | "role"
    >,
    MiaixzAvatarOwnProps {}

export type AvatarGroupSpacing = "medium" | "small" | number;
export type AvatarGroupSlot = "root" | "surplus";

export interface AvatarGroupOwnerState {
  readonly spacing: AvatarGroupSpacing;
  readonly surplus: number;
  readonly variant: AvatarVariant;
}

export type AvatarGroupRootAttributes = HTMLAttributes<HTMLDivElement> &
  RefAttributes<HTMLDivElement> & {
    readonly "data-spacing"?: "medium" | "small" | "custom";
    readonly "data-variant"?: AvatarVariant;
  };

export interface AvatarGroupSlotProps {
  readonly root?: MiaixzSlotProps<AvatarGroupOwnerState, AvatarGroupRootAttributes>;
  readonly surplus?: MiaixzSlotProps<AvatarGroupOwnerState, HTMLAttributes<HTMLSpanElement>>;
}

/**
 * Configures a stacked collection of avatars with an optional surplus indicator.
 *
 * @public
 */
export interface AvatarGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  readonly children?: ReactNode;
  readonly max?: number;
  readonly renderSurplus?: (surplus: number) => ReactNode;
  readonly slotProps?: AvatarGroupSlotProps;
  readonly spacing?: AvatarGroupSpacing;
  readonly total?: number;
  readonly variant?: AvatarVariant;
}
