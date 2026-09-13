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

import { forwardRef } from "react";

import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { Icon } from "../icon/icon.js";
import type { IconSize } from "../icon/icon.types.js";
import type { MiaixzComponentSize } from "../shared.types.js";
import { Hidden } from "../hidden/hidden.js";
import type { SpinnerOwnerState, SpinnerProps, SpinnerRootAttributes } from "./spinner.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

const miaixzSpinnerIconSizes: Record<MiaixzComponentSize, IconSize> = {
  small: "inline",
  medium: "navigation",
  large: "feature",
};

/**
 * Renders an accessible indeterminate loading indicator with reduced-motion fallback.
 *
 * @public
 */
export const Spinner = withMiaixzThemeComponent(
  "Spinner",
  forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
    { size = "medium", label, slotProps, ...rootNativeProps },
    ref,
  ) {
    const ownerState: SpinnerOwnerState = { size };
    const rootProps = mergeMiaixzSlotProps<
      SpinnerOwnerState,
      SpinnerRootAttributes,
      HTMLSpanElement
    >({
      ownerState,
      defaultProps: { className: `miaixz-spinner miaixz-spinner-${size}` },
      componentProps: rootNativeProps,
      slotProps: slotProps?.root,
      forwardedRef: ref,
      internalProps: { role: "status", "data-size": size },
      ownedProps: ["role", "data-size"],
    });
    const indicatorProps = mergeMiaixzSlotProps({
      ownerState,
      slotProps: slotProps?.indicator,
      internalProps: { name: "LoaderCircle" as const, size: miaixzSpinnerIconSizes[size] },
      ownedProps: ["name", "size"],
    });
    const labelProps = mergeMiaixzSlotProps({
      ownerState,
      slotProps: slotProps?.label,
      internalProps: { children: label },
      ownedProps: ["children"],
    });
    return (
      <span {...rootProps}>
        <Icon {...indicatorProps} />
        <Hidden {...labelProps} />
      </span>
    );
  }),
);
