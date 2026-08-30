import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { classNames } from "../../internal/class-names.js";
import {
  useMiaixzDismissibleLayer,
  useMiaixzFloatingPosition,
  useMiaixzManualPopover,
  useMiaixzPortalTarget,
} from "../../internal/overlay/index.js";
import { useMergedRef } from "../../internal/use-merged-ref.js";
import { MiaixzPopoverContext } from "./popover-context.js";
import type { PopoverProps } from "./popover.types.js";

/**
 * Renders a controlled or uncontrolled fixed Popover through the package Portal layer.
 *
 * @public
 */
export const Popover = forwardRef<HTMLDivElement, PopoverProps>(function Popover(
  {
    trigger,
    open,
    defaultOpen = false,
    onOpenChange,
    placement = "bottom-start",
    contentClassName,
    triggerProps,
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
  useMiaixzFloatingPosition(triggerRef, contentRef, isOpen, placement, portalTarget);
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
        className={classNames("miaixz-popover-trigger", triggerProps?.className)}
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
              className={classNames("miaixz-popover-content", contentClassName)}
            >
              {children}
            </div>
          </MiaixzPopoverContext.Provider>,
          portalTarget,
        )}
    </div>
  );
});
