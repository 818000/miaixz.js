import { cloneElement, forwardRef, useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { classNames } from "../../internal/class-names.js";
import {
  useMiaixzDismissibleLayer,
  useMiaixzFloatingPosition,
  useMiaixzManualPopover,
  useMiaixzPortalTarget,
} from "../../internal/overlay/index.js";
import { useMergedRef } from "../../internal/use-merged-ref.js";
import type { TooltipProps } from "./tooltip.types.js";

/**
 * Freezes the WAI-ARIA Tooltip show delay in milliseconds.
 */
const miaixzTooltipShowDelay = 300;

/**
 * Associates concise contextual help with an interactive or informational child.
 *
 * @public
 */
export const Tooltip = forwardRef<HTMLSpanElement, TooltipProps>(function Tooltip(
  {
    content,
    children,
    placement = "top",
    className,
    onPointerEnter,
    onPointerLeave,
    onFocus,
    onBlur,
    ...props
  },
  forwardedRef,
) {
  const tooltipId = useId();
  const describedBy = [children.props["aria-describedby"], tooltipId].filter(Boolean).join(" ");
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [wrapperElement, setWrapperElement] = useState<HTMLSpanElement | null>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const captureWrapper = useCallback((element: HTMLSpanElement | null) => {
    wrapperRef.current = element;
    setWrapperElement(element);
  }, []);
  const ref = useMergedRef(forwardedRef, captureWrapper);
  const timerRef = useRef<number | undefined>(undefined);
  const hoveredRef = useRef(false);
  const focusedRef = useRef(false);
  const [visible, setVisible] = useState(false);
  const portalTarget = useMiaixzPortalTarget(wrapperElement);

  const clearTimer = () => {
    if (timerRef.current === undefined) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = undefined;
  };
  const scheduleShow = () => {
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = undefined;
      if (hoveredRef.current || focusedRef.current) setVisible(true);
    }, miaixzTooltipShowDelay);
  };
  const hideImmediately = () => {
    clearTimer();
    if (!hoveredRef.current && !focusedRef.current) setVisible(false);
  };

  useMiaixzManualPopover(contentRef, visible, portalTarget);
  useMiaixzFloatingPosition(wrapperRef, contentRef, visible, placement, portalTarget);
  useMiaixzDismissibleLayer({
    active: visible,
    triggerRef: wrapperRef,
    contentRef,
    portalTarget,
    onDismiss: () => {
      clearTimer();
      setVisible(false);
    },
  });

  useEffect(() => clearTimer, []);

  return (
    <span
      {...props}
      ref={ref}
      data-placement={placement}
      className={classNames("miaixz-tooltip", className)}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        hoveredRef.current = true;
        scheduleShow();
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        hoveredRef.current = false;
        hideImmediately();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        focusedRef.current = true;
        scheduleShow();
      }}
      onBlur={(event) => {
        onBlur?.(event);
        if (!event.currentTarget.contains(event.relatedTarget)) focusedRef.current = false;
        hideImmediately();
      }}
    >
      {cloneElement(children, { "aria-describedby": describedBy })}
      {portalTarget !== null &&
        createPortal(
          <span
            ref={contentRef}
            id={tooltipId}
            role="tooltip"
            popover="manual"
            hidden={!visible}
            className="miaixz-tooltip-content"
          >
            {content}
          </span>,
          portalTarget,
        )}
    </span>
  );
});
