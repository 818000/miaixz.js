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
  cloneElement,
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { MiaixzUiError } from "../../errors/ui-error.js";
import { useMiaixzDismissibleLayer } from "../../shared/overlay/dismissible-layer.js";
import { useMiaixzFloatingPosition } from "../../shared/overlay/floating-position.js";
import { useMiaixzPortalTarget } from "../../shared/overlay/portal-target.js";
import { useMiaixzManualPopover } from "../../shared/overlay/top-layer.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { useControlled } from "../../shared/use-controlled.js";
import type { TooltipOwnerState, TooltipProps } from "./tooltip.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/**
 * Associates concise help directly with one ref-capable trigger element.
 */
export const Tooltip = withMiaixzThemeComponent(
  "Tooltip",
  forwardRef<HTMLElement, TooltipProps>(function Tooltip(props, forwardedRef) {
    const {
      content,
      children,
      placement = "top",
      enterDelay = 300,
      leaveDelay = 0,
      enterTouchDelay = 700,
      leaveTouchDelay = 1500,
      disableTouch = false,
      slotProps,
    } = props;
    validateDelays([enterDelay, leaveDelay, enterTouchDelay, leaveTouchDelay]);
    const state = useControlled({
      controlled: props.open !== undefined,
      value: props.open,
      defaultValue: props.defaultOpen ?? false,
      hasDefaultValue: props.open !== undefined && props.defaultOpen !== undefined,
      ...(props.onOpenChange === undefined ? {} : { onValueChange: props.onOpenChange }),
    });
    const open = state.value;
    const tooltipId = useId();
    const childRef = useRef<HTMLElement>(null);
    const contentRef = useRef<HTMLSpanElement>(null);
    const positionRef = useRef<HTMLElement>(null);
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const timerRef = useRef<number | undefined>(undefined);
    const hoveredRef = useRef(false);
    const focusedRef = useRef(false);
    const disabledTrigger = children.type === "button" && children.props.disabled === true;
    const portalTarget = useMiaixzPortalTarget(anchor);
    const ownerState: TooltipOwnerState = { open, placement, disabledTrigger };
    const request = (next: boolean): void => {
      if (next !== open) state.setValue(next);
    };
    const clearTimer = (): void => {
      if (timerRef.current === undefined) return;
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    };
    const schedule = (next: boolean, delay: number): void => {
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        timerRef.current = undefined;
        const valid = next
          ? hoveredRef.current || focusedRef.current
          : !hoveredRef.current && !focusedRef.current;
        if (valid) request(next);
      }, delay);
    };
    const describedBy = [children.props["aria-describedby"], tooltipId].filter(Boolean).join(" ");
    const triggerProps = mergeMiaixzSlotProps({
      ownerState,
      componentProps: children.props,
      slotProps: slotProps?.trigger,
      internalRef: (element: HTMLElement | null) => {
        childRef.current = element;
        if (!disabledTrigger) {
          positionRef.current = element;
          setAnchor(element);
        }
      },
      forwardedRef,
      internalProps: {
        "aria-describedby": describedBy,
        onPointerEnter: (event: ReactPointerEvent<HTMLElement>) => {
          if (event.pointerType === "touch") return;
          hoveredRef.current = true;
          schedule(true, enterDelay);
        },
        onPointerLeave: (event: ReactPointerEvent<HTMLElement>) => {
          if (event.pointerType === "touch") return;
          hoveredRef.current = false;
          schedule(false, leaveDelay);
        },
        onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
          if (event.pointerType !== "touch" || disableTouch) return;
          hoveredRef.current = true;
          schedule(true, enterTouchDelay);
        },
        onPointerUp: (event: ReactPointerEvent<HTMLElement>) => {
          if (event.pointerType !== "touch" || disableTouch) return;
          hoveredRef.current = false;
          schedule(false, open ? leaveTouchDelay : 0);
        },
        onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => {
          if (event.pointerType !== "touch" || disableTouch) return;
          hoveredRef.current = false;
          schedule(false, open ? leaveTouchDelay : 0);
        },
        onFocus: () => {
          focusedRef.current = true;
          schedule(true, enterDelay);
        },
        onBlur: () => {
          focusedRef.current = false;
          schedule(false, leaveDelay);
        },
        onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => {
          if (event.key === "Escape") {
            clearTimer();
            request(false);
          }
        },
      },
      ownedProps: ["aria-describedby"],
    });
    const contentProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-tooltip-content" },
      slotProps: slotProps?.content,
      internalRef: contentRef,
      internalProps: { id: tooltipId, role: "tooltip", popover: "manual", hidden: !open },
      ownedProps: ["id", "role"],
    });
    useMiaixzManualPopover(contentRef, open, portalTarget);
    useMiaixzFloatingPosition(positionRef, contentRef, open, placement, portalTarget);
    useMiaixzDismissibleLayer({
      active: open,
      triggerRef: positionRef,
      contentRef,
      portalTarget,
      onDismiss: () => {
        clearTimer();
        request(false);
      },
    });
    useEffect(() => clearTimer, []);
    useLayoutEffect(() => {
      const element = childRef.current;
      if (element === null || !(element instanceof HTMLElement)) {
        throw new MiaixzUiError({
          code: "UI_TOOLTIP_TRIGGER_INVALID",
        });
      }
    }, [children]);
    const child = cloneElement(children, triggerProps);
    return (
      <>
        {disabledTrigger ? (
          <span
            ref={(element) => {
              positionRef.current = element;
              setAnchor(element);
            }}
            data-miaixz-tooltip-disabled-trigger="true"
            style={{ display: "inline-flex" }}
            onPointerEnter={() => {
              hoveredRef.current = true;
              schedule(true, enterDelay);
            }}
            onPointerLeave={() => {
              hoveredRef.current = false;
              schedule(false, leaveDelay);
            }}
          >
            {cloneElement(child, { style: { ...child.props.style, pointerEvents: "none" } })}
          </span>
        ) : (
          child
        )}
        {portalTarget === null
          ? null
          : createPortal(<span {...contentProps}>{content}</span>, portalTarget)}
      </>
    );
  }),
);

/**
 * Validates all public tooltip delays.
 *
 * @param delays - Effective mouse and touch delays.
 */
function validateDelays(delays: readonly number[]): void {
  if (delays.some((delay) => !Number.isFinite(delay) || delay < 0)) {
    throw new MiaixzUiError({
      code: "UI_TOOLTIP_DELAY_INVALID",
    });
  }
}
