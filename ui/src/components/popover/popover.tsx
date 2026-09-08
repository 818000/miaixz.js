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

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { classNames } from "../../shared/class-names.js";
import {
  useMiaixzDismissibleLayer,
  useMiaixzFloatingPosition,
  useMiaixzManualPopover,
  useMiaixzPortalTarget,
} from "../../shared/overlay/index.js";
import { calculateMiaixzFloatingPosition } from "../../shared/overlay/floating-position.js";
import { useMergedRef } from "../../shared/use-merged-ref.js";
import { useTheme } from "../../theme/context.js";
import { getButtonClassName } from "../button/index.js";
import { MiaixzPopoverContext } from "./context.js";
import type { PopoverProps } from "./popover.types.js";

/**
 * Renders a controlled or uncontrolled fixed Popover through the package Portal layer.
 *
 * @public
 */
export const Popover = forwardRef<HTMLDivElement, PopoverProps>(function Popover(
  {
    trigger,
    surface = "default",
    open,
    defaultOpen = false,
    onOpenChange,
    placement = "bottom-start",
    offset = 8,
    contentClassName,
    triggerProps,
    triggerVariant = "default",
    disabled = false,
    className,
    children,
    ...props
  },
  forwardedRef,
) {
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const ref = useMergedRef(forwardedRef, setRootElement);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = open ?? internalOpen;
  const contentId = useId();
  const generatedTriggerId = useId();
  const triggerId = triggerProps?.id ?? generatedTriggerId;
  const restoreFocusRef = useRef(false);
  const previousOpenRef = useRef(isOpen);
  const portalTarget = useMiaixzPortalTarget(rootElement);
  const themeRevision = useOptionalThemeRevision();
  if (!Number.isFinite(offset) || offset < 0) {
    throw new RangeError("Popover offset must be a finite non-negative number");
  }

  const requestOpenChange = useCallback(
    (nextOpen: boolean, restoreFocus: boolean) => {
      restoreFocusRef.current = !nextOpen && restoreFocus;
      if (open === undefined) setInternalOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [onOpenChange, open],
  );
  const requestClose = useCallback(
    (restoreFocus: boolean) => requestOpenChange(false, restoreFocus),
    [requestOpenChange],
  );

  useMiaixzManualPopover(contentRef, isOpen, portalTarget);
  useMiaixzFloatingPosition(triggerRef, contentRef, isOpen, placement, portalTarget, offset);
  useLayoutEffect(() => {
    const trigger = triggerRef.current;
    const content = contentRef.current;
    const viewport = trigger?.ownerDocument.defaultView;
    if (!isOpen || trigger === null || content === null || viewport == null) return;
    const position = calculateMiaixzFloatingPosition(
      trigger.getBoundingClientRect(),
      content.getBoundingClientRect(),
      placement,
      viewport.innerWidth,
      viewport.innerHeight,
      viewport.getComputedStyle(trigger).direction === "rtl",
      offset,
    );
    content.style.left = `${position.x}px`;
    content.style.top = `${position.y}px`;
    content.dataset.placement = position.placement;
    content.dataset.miaixzPositioned = "true";
  }, [isOpen, placement, portalTarget, themeRevision, offset]);
  useMiaixzDismissibleLayer({
    active: isOpen,
    triggerRef,
    contentRef,
    portalTarget,
    onDismiss: () => requestClose(true),
  });

  useEffect(() => {
    const wasOpen = previousOpenRef.current;
    previousOpenRef.current = isOpen;
    if (!wasOpen || isOpen || !restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    queueMicrotask(() => triggerRef.current?.focus({ preventScroll: true }));
  }, [isOpen]);

  const context = useMemo(
    () => ({ open: isOpen, triggerRef, requestClose }),
    [isOpen, requestClose],
  );

  return (
    <div
      {...props}
      ref={ref}
      data-placement={placement}
      className={classNames("miaixz-popover", className)}
    >
      <button
        {...triggerProps}
        ref={triggerRef}
        id={triggerId}
        type={triggerProps?.type ?? "button"}
        aria-controls={contentId}
        aria-expanded={isOpen}
        disabled={disabled || triggerProps?.disabled}
        className={classNames(
          triggerVariant === "plain" || triggerVariant === "text" || triggerVariant === "action"
            ? getButtonClassName({ variant: triggerVariant })
            : "miaixz-popover-trigger",
          triggerVariant === "avatar" && "miaixz-popover-trigger-avatar",
          triggerProps?.className,
        )}
        onClick={(event) => {
          triggerProps?.onClick?.(event);
          if (!event.defaultPrevented && !disabled && !triggerProps?.disabled) {
            requestOpenChange(!isOpen, false);
          }
        }}
      >
        {trigger}
      </button>
      {isOpen &&
        portalTarget !== null &&
        createPortal(
          <MiaixzPopoverContext.Provider value={context}>
            <div
              ref={contentRef}
              id={contentId}
              role="region"
              aria-labelledby={triggerId}
              popover="manual"
              className={classNames(
                "miaixz-popover-content",
                surface === "picker" && "miaixz-popover-picker",
                contentClassName,
              )}
            >
              {children}
            </div>
          </MiaixzPopoverContext.Provider>,
          portalTarget,
        )}
    </div>
  );
});

/**
 * Reads Theme geometry revision while preserving standalone Popover use.
 *
 * @returns The active Theme revision, or zero outside a Theme provider.
 */
function useOptionalThemeRevision(): number {
  try {
    return useTheme().revision;
  } catch {
    return 0;
  }
}
