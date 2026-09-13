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
} from "react";
import { createPortal } from "react-dom";
import { MiaixzUiError } from "../../errors/ui-error.js";
import { useMiaixzDismissibleLayer } from "../../shared/overlay/dismissible-layer.js";
import { useMiaixzFloatingPosition } from "../../shared/overlay/floating-position.js";
import { useMiaixzPortalTarget } from "../../shared/overlay/portal-target.js";
import { useMiaixzManualPopover } from "../../shared/overlay/top-layer.js";
import type { MiaixzOverlayChangeReason } from "../../shared/overlay/types.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { useControlled } from "../../shared/use-controlled.js";
import { MiaixzPopoverContext } from "./context.js";
import type { PopoverOwnerState, PopoverProps } from "./popover.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/**
 * Renders a controlled or uncontrolled button disclosure through the shared Portal layer.
 */
export const Popover = withMiaixzThemeComponent(
  "Popover",
  forwardRef<HTMLButtonElement, PopoverProps>(function Popover(props, forwardedRef) {
    const {
      trigger,
      children,
      placement = "bottom-start",
      offset = 8,
      popupRole,
      slotProps,
    } = props;
    if (!Number.isFinite(offset) || offset < 0) {
      throw new MiaixzUiError({
        code: "UI_POPOVER_OFFSET_INVALID",
        details: { offset },
      });
    }
    const pendingReasonRef = useRef<MiaixzOverlayChangeReason>("trigger");
    const state = useControlled({
      controlled: props.open !== undefined,
      value: props.open,
      defaultValue: props.defaultOpen ?? false,
      hasDefaultValue: props.open !== undefined && props.defaultOpen !== undefined,
      ...(props.onOpenChange === undefined
        ? {}
        : {
            onValueChange: (open: boolean) =>
              (props.onOpenChange as (open: boolean, reason: MiaixzOverlayChangeReason) => void)(
                open,
                pendingReasonRef.current,
              ),
          }),
    });
    const isOpen = state.value;
    const triggerRef = useRef<HTMLButtonElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const restoreFocusRef = useRef(false);
    const previousOpenRef = useRef(isOpen);
    const [triggerElement, setTriggerElement] = useState<HTMLButtonElement | null>(null);
    const portalTarget = useMiaixzPortalTarget(triggerElement);
    const contentId = useId();
    const generatedTriggerId = useId();
    const triggerId = trigger.props.id ?? generatedTriggerId;
    const ownerState: PopoverOwnerState = {
      open: isOpen,
      placement,
      ...(popupRole === undefined ? {} : { popupRole }),
    };
    const requestOpenChange = (nextOpen: boolean, reason: MiaixzOverlayChangeReason): void => {
      if (nextOpen === isOpen) return;
      pendingReasonRef.current = reason;
      restoreFocusRef.current = !nextOpen && reason !== "trigger";
      state.setValue(nextOpen);
    };
    const mergedTriggerProps = mergeMiaixzSlotProps({
      ownerState,
      componentProps: trigger.props,
      slotProps: slotProps?.trigger,
      internalRef: (element: HTMLButtonElement | null) => {
        triggerRef.current = element;
        setTriggerElement(element);
      },
      forwardedRef,
      internalProps: {
        id: triggerId,
        "aria-controls": contentId,
        "aria-expanded": isOpen,
        ...(popupRole === undefined ? {} : { "aria-haspopup": popupRole }),
        onClick: () => requestOpenChange(!isOpen, "trigger"),
      },
      ownedProps: ["id", "aria-controls", "aria-expanded", "aria-haspopup"],
    });
    const resolvedContentSlot =
      typeof slotProps?.content === "function" ? slotProps.content(ownerState) : slotProps?.content;
    const hasExplicitContentLabel =
      typeof resolvedContentSlot?.["aria-label"] === "string" &&
      resolvedContentSlot["aria-label"].trim() !== "";
    const contentProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-popover-content" },
      slotProps: resolvedContentSlot,
      internalRef: contentRef,
      internalProps: {
        id: contentId,
        ...(hasExplicitContentLabel ? {} : { "aria-labelledby": triggerId }),
        popover: "manual",
        ...(popupRole === undefined ? {} : { role: popupRole }),
      },
      ownedProps: ["id", "aria-labelledby", "role"],
    });
    useMiaixzManualPopover(contentRef, isOpen, portalTarget);
    useMiaixzFloatingPosition(triggerRef, contentRef, isOpen, placement, portalTarget, offset);
    useMiaixzDismissibleLayer({
      active: isOpen,
      triggerRef,
      contentRef,
      portalTarget,
      onDismiss: (reason) => requestOpenChange(false, reason),
    });
    useLayoutEffect(() => {
      const candidate = triggerRef.current;
      if (candidate === null || !(candidate instanceof HTMLButtonElement)) {
        throw new MiaixzUiError({
          code: "UI_POPOVER_TRIGGER_INVALID",
        });
      }
    }, [trigger]);
    useEffect(() => {
      const wasOpen = previousOpenRef.current;
      previousOpenRef.current = isOpen;
      if (!wasOpen || isOpen || !restoreFocusRef.current) return;
      restoreFocusRef.current = false;
      queueMicrotask(() => triggerRef.current?.focus({ preventScroll: true }));
    }, [isOpen]);
    const context = {
      open: isOpen,
      triggerRef,
      contentRef,
      requestClose: (reason: MiaixzOverlayChangeReason = "selection") =>
        requestOpenChange(false, reason),
    };
    return (
      <>
        {cloneElement(trigger, mergedTriggerProps)}
        {isOpen && portalTarget !== null
          ? createPortal(
              <MiaixzPopoverContext.Provider value={context}>
                <div {...contentProps}>{children}</div>
              </MiaixzPopoverContext.Provider>,
              portalTarget,
            )
          : null}
      </>
    );
  }),
);
