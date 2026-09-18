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

import { Children, cloneElement, forwardRef, isValidElement, type CSSProperties } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";
import type {
  AvatarGroupOwnerState,
  AvatarGroupProps,
  AvatarGroupRootAttributes,
  AvatarProps,
} from "./avatar.types.js";

/**
 * Renders an overlapping avatar collection and one deterministic surplus avatar.
 *
 * @public
 */
export const AvatarGroup = withMiaixzThemeComponent(
  "AvatarGroup",
  forwardRef<HTMLDivElement, AvatarGroupProps>(function AvatarGroup(
    {
      children,
      max = 5,
      renderSurplus,
      spacing = "medium",
      total,
      variant = "circular",
      slotProps,
      ...rootNativeProps
    },
    ref,
  ) {
    const avatars = Children.toArray(children);
    validateAvatarGroup(max, total, spacing, avatars.length);
    const normalizedMax = max;
    const normalizedTotal = total ?? avatars.length;
    const visibleCount =
      normalizedTotal > normalizedMax
        ? Math.min(avatars.length, Math.max(0, normalizedMax - 1))
        : avatars.length;
    const surplus = Math.max(0, normalizedTotal - visibleCount);
    const ownerState: AvatarGroupOwnerState = { spacing, surplus, variant };
    const spacingState = typeof spacing === "number" ? "custom" : spacing;
    const customSpacing =
      typeof spacing === "number"
        ? ({ "--miaixz-avatar-group-spacing": `${-Math.max(0, spacing)}px` } as CSSProperties)
        : undefined;
    const rootProps = mergeMiaixzSlotProps<
      AvatarGroupOwnerState,
      AvatarGroupRootAttributes,
      HTMLDivElement
    >({
      ownerState,
      defaultProps: { className: "miaixz-avatar-group" },
      componentProps: rootNativeProps,
      slotProps: slotProps?.root,
      forwardedRef: ref,
      internalProps: {
        "data-spacing": spacingState,
        "data-variant": variant,
        ...(customSpacing === undefined ? {} : { style: customSpacing }),
      },
      ownedProps: ["data-spacing", "data-variant"],
    });
    const surplusProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: {
        className: `miaixz-avatar miaixz-avatar-medium miaixz-avatar-${variant} miaixz-avatar-group-surplus`,
      },
      slotProps: slotProps?.surplus,
      internalProps: {
        role: "img",
        "aria-label": `+${surplus}`,
        children: renderSurplus?.(surplus) ?? `+${surplus}`,
      },
      ownedProps: ["role", "aria-label", "children"],
    });

    return (
      <div {...rootProps}>
        {avatars.slice(0, visibleCount).map((avatar, index) =>
          isValidElement<AvatarProps>(avatar)
            ? cloneElement(avatar, {
                key: avatar.key ?? index,
                variant: avatar.props.variant ?? variant,
              })
            : avatar,
        )}
        {surplus > 0 ? <span {...surplusProps} /> : null}
      </div>
    );
  }),
);

/**
 * Validates collection limits before the group performs truncation.
 *
 * @param max - Maximum number of rendered avatar positions.
 * @param total - Optional server-provided total avatar count.
 * @param spacing - Preset or numeric overlap spacing.
 * @param childCount - Number of supplied avatar children.
 * @returns Nothing after successful validation.
 */
function validateAvatarGroup(
  max: number,
  total: number | undefined,
  spacing: AvatarGroupProps["spacing"],
  childCount: number,
): void {
  if (!Number.isInteger(max) || max <= 0) {
    throw new MiaixzUiError({ code: "UI_AVATAR_GROUP_MAX_INVALID" });
  }
  if (total !== undefined && (!Number.isInteger(total) || total < childCount)) {
    throw new MiaixzUiError({ code: "UI_AVATAR_GROUP_TOTAL_INVALID" });
  }
  if (typeof spacing === "number" && (!Number.isFinite(spacing) || spacing < 0)) {
    throw new MiaixzUiError({ code: "UI_AVATAR_GROUP_SPACING_INVALID" });
  }
}
