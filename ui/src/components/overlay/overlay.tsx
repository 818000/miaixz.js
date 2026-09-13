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

import { forwardRef, useEffect, useRef } from "react";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { Spinner } from "../spinner/spinner.js";
import type { OverlayOwnerState, OverlayProps } from "./overlay.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/**
 * Renders blocking or nonblocking loading feedback without unmounting content.
 */
export const Overlay = withMiaixzThemeComponent(
  "Overlay",
  forwardRef<HTMLDivElement, OverlayProps>(function Overlay(props, ref) {
    const { active, blocking = true, label, children, slotProps, ...rootNativeProps } = props;
    const contentRef = useRef<HTMLDivElement>(null);
    const surfaceRef = useRef<HTMLDivElement>(null);
    const restoreRef = useRef<HTMLElement | undefined>(undefined);
    const movedFocusRef = useRef(false);
    useEffect(() => {
      if (!active || !blocking) return undefined;
      const content = contentRef.current;
      const surface = surfaceRef.current;
      if (content === null || surface === null) return undefined;
      const activeElement = content.ownerDocument.activeElement;
      if (activeElement instanceof HTMLElement && content.contains(activeElement)) {
        restoreRef.current = activeElement;
        movedFocusRef.current = true;
        surface.focus();
      }
      return undefined;
    }, [active, blocking]);
    useEffect(() => {
      if (active || !movedFocusRef.current) return;
      movedFocusRef.current = false;
      const target = restoreRef.current;
      restoreRef.current = undefined;
      if (isRestorable(target)) target.focus();
    }, [active]);
    const ownerState: OverlayOwnerState = { active, blocking };
    const rootProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-overlay" },
      componentProps: rootNativeProps,
      slotProps: slotProps?.root,
      forwardedRef: ref,
      internalProps: {
        ...(active ? { "aria-busy": true, "data-loading": true } : {}),
        "data-blocking": blocking,
      },
      ownedProps: ["aria-busy"],
    });
    const contentProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-overlay-content" },
      slotProps: slotProps?.content,
      internalRef: contentRef,
      internalProps: { inert: active && blocking },
      ownedProps: ["inert"],
    });
    const surfaceProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-overlay-surface" },
      slotProps: slotProps?.surface,
      internalRef: surfaceRef,
      internalProps: { tabIndex: -1 },
      ownedProps: ["tabIndex"],
    });
    const indicatorProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-overlay-indicator" },
      slotProps: slotProps?.indicator,
    });
    return (
      <div {...rootProps}>
        <div {...contentProps}>{children}</div>
        {active ? (
          <div {...surfaceProps}>
            <span {...indicatorProps}>
              <Spinner label={label} />
            </span>
          </div>
        ) : null}
      </div>
    );
  }),
);

/**
 * Checks the exact focus-restoration safety conditions.
 *
 * @param target - Previously focused content element.
 * @returns Whether focus may safely return to the target.
 */
function isRestorable(target: HTMLElement | undefined): target is HTMLElement {
  if (target === undefined || !target.isConnected || target.closest("[inert]") !== null)
    return false;
  return !("disabled" in target) || !(target as HTMLButtonElement).disabled;
}
