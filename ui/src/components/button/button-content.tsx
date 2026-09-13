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

import type { ReactElement, ReactNode } from "react";

import type { ButtonOwnerState, ButtonSlotProps } from "./button.types.js";
import { Icon } from "../icon/icon.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";

/**
 * Configures the one Button and ButtonLink content implementation.
 */
export interface MiaixzButtonContentProps {
  /**
   * Supplies visible label content.
   */
  readonly children: ReactNode;
  /**
   * Supplies one optional leading element.
   */
  readonly startIcon?: ReactElement | undefined;
  /**
   * Supplies one optional trailing element.
   */
  readonly endIcon?: ReactElement | undefined;
  /**
   * Supplies effective owner state.
   */
  readonly ownerState: ButtonOwnerState;
  /**
   * Supplies fixed content slot properties.
   */
  readonly slotProps?: Omit<ButtonSlotProps, "root"> | undefined;
  /**
   * Supplies Theme classes by slot.
   */
  readonly themeClassNames?:
    | Partial<Record<Exclude<keyof ButtonSlotProps, "root">, readonly (string | undefined)[]>>
    | undefined;
  /**
   * Supplies the localized loading announcement.
   */
  readonly loadingLabel?: string | undefined;
  /**
   * Identifies the stable visible label when loading status is present.
   */
  readonly labelId?: string | undefined;
}

/**
 * Renders stable Button content while progress is overlaid at its center.
 *
 * @param properties - Label, icons, state, slots, and loading announcement.
 * @returns Shared fixed Button content.
 * @internal
 */
export function MiaixzButtonContent(properties: MiaixzButtonContentProps) {
  const {
    children,
    startIcon,
    endIcon,
    ownerState,
    slotProps,
    themeClassNames,
    loadingLabel,
    labelId,
  } = properties;
  const labelProps = mergeMiaixzSlotProps({
    ownerState,
    defaultProps: { className: "miaixz-button-label" },
    themeClassNames: themeClassNames?.label,
    slotProps: slotProps?.label,
    internalProps: labelId === undefined ? undefined : { id: labelId },
    ownedProps: labelId === undefined ? undefined : ["id"],
  });
  const startIconProps = mergeMiaixzSlotProps({
    ownerState,
    defaultProps: { className: "miaixz-button-icon miaixz-button-start-icon" },
    themeClassNames: themeClassNames?.startIcon,
    slotProps: slotProps?.startIcon,
  });
  const endIconProps = mergeMiaixzSlotProps({
    ownerState,
    defaultProps: { className: "miaixz-button-icon miaixz-button-end-icon" },
    themeClassNames: themeClassNames?.endIcon,
    slotProps: slotProps?.endIcon,
  });
  const indicatorProps = mergeMiaixzSlotProps({
    ownerState,
    defaultProps: { className: "miaixz-button-loading-indicator" },
    themeClassNames: themeClassNames?.loadingIndicator,
    slotProps: slotProps?.loadingIndicator,
    internalProps: { "aria-hidden": true },
    ownedProps: ["aria-hidden"],
  });
  return (
    <>
      <span className="miaixz-button-content" data-loading={ownerState.loading || undefined}>
        {startIcon !== undefined && <span {...startIconProps}>{startIcon}</span>}
        <span {...labelProps}>{children}</span>
        {endIcon !== undefined && <span {...endIconProps}>{endIcon}</span>}
      </span>
      {ownerState.loading && (
        <>
          <span {...indicatorProps}>
            <Icon className="miaixz-button-spinner" name="LoaderCircle" size="control" />
          </span>
          <span className="miaixz-hidden" role="status" aria-live="polite">
            {loadingLabel}
          </span>
        </>
      )}
    </>
  );
}
