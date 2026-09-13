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

import { forwardRef, useState } from "react";

import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { AvatarOwnerState, AvatarProps, AvatarRootAttributes } from "./avatar.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/**
 * Derives the first two visible Unicode graphemes from a display name.
 *
 * @param name - Display name used to generate the fallback.
 * @returns Uppercase graphemes or a question mark when the name is empty.
 */
function createAvatarFallback(name: string): string {
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const fallback = Array.from(segmenter.segment(name.trim()), ({ segment }) => segment)
    .filter((segment) => segment.trim().length > 0)
    .slice(0, 2)
    .join("")
    .toLocaleUpperCase();

  return fallback || "?";
}

/**
 * Renders an accessible avatar image with a Unicode-safe name fallback.
 *
 * @public
 */
export const Avatar = withMiaixzThemeComponent(
  "Avatar",
  forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
    { src, alt, name, size = "medium", slotProps, ...rootNativeProps },
    ref,
  ) {
    const [failedSource, setFailedSource] = useState<string>();
    const displaysImage = src !== undefined && src.length > 0 && failedSource !== src;
    const ownerState: AvatarOwnerState = {
      size,
      state: displaysImage ? "image" : "fallback",
      decorative: alt.length === 0,
    };
    const rootProps = mergeMiaixzSlotProps<AvatarOwnerState, AvatarRootAttributes, HTMLSpanElement>(
      {
        ownerState,
        defaultProps: { className: `miaixz-avatar miaixz-avatar-${size}` },
        componentProps: rootNativeProps,
        slotProps: slotProps?.root,
        forwardedRef: ref,
        internalProps: { "data-size": size, "data-state": ownerState.state },
        ownedProps: ["data-size", "data-state"],
      },
    );
    const imageProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-avatar-image" },
      slotProps: slotProps?.image,
      internalProps: {
        src,
        alt,
        onError: () => setFailedSource(src),
      },
      ownedProps: ["src", "alt"],
    });
    const fallbackProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-avatar-fallback" },
      slotProps: slotProps?.fallback,
      internalProps: {
        children: createAvatarFallback(name),
        ...(alt.length === 0 ? { "aria-hidden": true } : { role: "img", "aria-label": alt }),
      },
      ownedProps: ["children", "role", "aria-label", "aria-hidden"],
    });

    return (
      <span {...rootProps}>
        {displaysImage ? <img {...imageProps} /> : <span {...fallbackProps} />}
      </span>
    );
  }),
);
