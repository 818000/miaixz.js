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
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

import { FocusScope } from "../../accessibility/focus-scope.js";
import { classNames } from "../../shared/class-names.js";
import { useMiaixzNativeModal, useMiaixzPortalTarget } from "../../shared/overlay/index.js";
import { useMiaixzLocale } from "../../i18n/index.js";
import { useMergedRef } from "../../shared/use-merged-ref.js";
import { IconButton } from "../action/index.js";
import type { DrawerProps } from "./drawer.types.js";

interface DrawerFrame {
  /**
   * Clamped left edge in viewport coordinates.
   */
  left: number;
  /**
   * Clamped top edge in viewport coordinates.
   */
  top: number;
  /**
   * Clamped right edge in viewport coordinates.
   */
  right: number;
  /**
   * Clamped bottom edge in viewport coordinates.
   */
  bottom: number;
  /**
   * Layout viewport width used to resolve logical right offsets.
   */
  viewportWidth: number;
  /**
   * Layout viewport height used to resolve logical bottom offsets.
   */
  viewportHeight: number;
}

const useDrawerLayoutEffect = typeof document === "undefined" ? useEffect : useLayoutEffect;

/**
 * Rejects dimensions that cannot produce a stable drawer frame.
 *
 * @param value - Optional numeric dimension to validate.
 * @param name - Dimension name included in the error message.
 * @param positive - Whether zero must also be rejected.
 * @returns Nothing when the dimension is valid.
 */
function validateDimension(value: number | undefined, name: string, positive = false): void {
  if (value !== undefined && (!Number.isFinite(value) || (positive ? value <= 0 : value < 0))) {
    throw new RangeError(
      `Drawer ${name} must be a finite ${positive ? "positive" : "nonnegative"} number.`,
    );
  }
}

/**
 * Renders a native modal drawer with localized dismissal and configurable side.
 *
 * @public
 */
export const Drawer = forwardRef<HTMLDialogElement, DrawerProps>(function Drawer(
  {
    open,
    onOpenChange,
    title,
    description,
    footer,
    size = "medium",
    density = "default",
    width,
    boundary,
    inset,
    floating = false,
    bodyProps,
    placement = "right",
    closeLabel,
    showClose = true,
    closeOnBackdrop = true,
    className,
    children,
    onCancel,
    onClose,
    onClick,
    style,
    ...props
  },
  forwardedRef,
) {
  const blockInset = typeof inset === "number" ? inset : (inset?.block ?? 0);
  const inlineInset = typeof inset === "number" ? inset : (inset?.inline ?? 0);
  validateDimension(width, "width", true);
  validateDimension(blockInset, "block inset");
  validateDimension(inlineInset, "inline inset");
  const positioned = boundary !== undefined || inset !== undefined;
  const [frame, setFrame] = useState<DrawerFrame | null>(null);
  const requestOpenChange = useRef(onOpenChange);
  requestOpenChange.current = onOpenChange;
  useDrawerLayoutEffect(() => {
    if (!open || !positioned || boundary === null) {
      setFrame(null);
      return;
    }
    const ownerDocument = boundary?.ownerDocument ?? document;
    const view = ownerDocument.defaultView;
    if (!view) return;
    let removed = false;
    const update = () => {
      if (boundary && !boundary.isConnected) {
        setFrame(null);
        if (!removed) requestOpenChange.current(false);
        removed = true;
        return;
      }
      const visual = view.visualViewport;
      const viewportWidth = view.innerWidth;
      const viewportHeight = view.innerHeight;
      const left = visual?.offsetLeft ?? 0;
      const top = visual?.offsetTop ?? 0;
      const right = left + (visual?.width ?? viewportWidth);
      const bottom = top + (visual?.height ?? viewportHeight);
      const rect = boundary?.getBoundingClientRect();
      const next = {
        left: Math.min(right, Math.max(left, rect?.left ?? left)),
        top: Math.min(bottom, Math.max(top, rect?.top ?? top)),
        right: Math.max(left, Math.min(right, rect?.right ?? right)),
        bottom: Math.max(top, Math.min(bottom, rect?.bottom ?? bottom)),
        viewportWidth,
        viewportHeight,
      };
      setFrame((previous) =>
        previous &&
        (Object.keys(next) as (keyof DrawerFrame)[]).every((key) => previous[key] === next[key])
          ? previous
          : next,
      );
    };
    update();
    const resize = new ResizeObserver(update);
    resize.observe(boundary ?? ownerDocument.documentElement);
    const removal = new MutationObserver(update);
    removal.observe(ownerDocument.body, { childList: true, subtree: true });
    view.addEventListener("resize", update);
    ownerDocument.addEventListener("scroll", update, true);
    view.visualViewport?.addEventListener("resize", update);
    view.visualViewport?.addEventListener("scroll", update);
    return () => {
      resize.disconnect();
      removal.disconnect();
      view.removeEventListener("resize", update);
      ownerDocument.removeEventListener("scroll", update, true);
      view.visualViewport?.removeEventListener("resize", update);
      view.visualViewport?.removeEventListener("scroll", update);
    };
  }, [open, positioned, boundary]);
  const active = open && (!positioned || (boundary !== null && frame !== null));
  const { t } = useMiaixzLocale();
  const resolvedCloseLabel = closeLabel ?? t("ui.drawer.close");
  const internalRef = useRef<HTMLDialogElement>(null);
  const ref = useMergedRef(internalRef, forwardedRef);
  const titleId = `miaixz-drawer-title-${useId()}`;
  const generatedDescriptionId = `miaixz-drawer-description-${useId()}`;
  const descriptionId = description ? generatedDescriptionId : undefined;
  const portalTarget = useMiaixzPortalTarget();
  const restoreFocusRef = useMiaixzNativeModal(internalRef, active, portalTarget, () =>
    onOpenChange(false),
  );

  const geometry: CSSProperties & Record<`--${string}`, string | number> = {};
  if (width !== undefined && placement !== "bottom") {
    geometry["--miaixz-drawer-width"] = `${width}px`;
  }
  if (positioned && frame) {
    const availableWidth = Math.max(0, frame.right - frame.left - inlineInset * 2);
    const availableHeight = Math.max(0, frame.bottom - frame.top - blockInset * 2);
    const desiredWidth = width === undefined ? "var(--miaixz-drawer-width)" : `${width}px`;
    Object.assign(geometry, {
      top: placement === "bottom" ? "auto" : frame.top + blockInset,
      bottom: frame.viewportHeight - frame.bottom + blockInset,
      left: placement === "right" ? "auto" : frame.left + inlineInset,
      right: placement === "left" ? "auto" : frame.viewportWidth - frame.right + inlineInset,
      inlineSize:
        placement === "bottom" ? availableWidth : `min(${desiredWidth}, ${availableWidth}px)`,
      blockSize: placement === "bottom" ? "auto" : availableHeight,
      maxBlockSize: availableHeight,
      "--miaixz-drawer-backdrop-top": `${frame.top}px`,
      "--miaixz-drawer-backdrop-right": `${Math.max(0, frame.viewportWidth - frame.right)}px`,
      "--miaixz-drawer-backdrop-bottom": `${Math.max(0, frame.viewportHeight - frame.bottom)}px`,
      "--miaixz-drawer-backdrop-left": `${frame.left}px`,
    });
  }

  if (portalTarget === null || (positioned && frame === null)) return null;
  return createPortal(
    <FocusScope active={active} containerRef={internalRef} restoreFocusRef={restoreFocusRef}>
      <dialog
        {...props}
        ref={ref}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        data-placement={placement}
        style={{ ...style, ...geometry }}
        className={classNames(
          "miaixz-drawer",
          size !== "medium" && `miaixz-drawer-${size}`,
          density === "compact" && "miaixz-drawer-compact",
          density === "content" && "miaixz-drawer-content",
          floating && "miaixz-drawer-floating",
          positioned && "miaixz-drawer-positioned",
          placement !== "right" && `miaixz-drawer-${placement}`,
          className,
        )}
        onCancel={(event) => {
          onCancel?.(event);
          if (!event.defaultPrevented) {
            event.preventDefault();
            onOpenChange(false);
          }
        }}
        onClose={(event) => {
          onClose?.(event);
          if (open) onOpenChange(false);
        }}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented && closeOnBackdrop && event.target === event.currentTarget) {
            onOpenChange(false);
          }
        }}
      >
        <header className="miaixz-drawer-header">
          <div>
            <h2 id={titleId} className="miaixz-drawer-title">
              {title}
            </h2>
            {description !== undefined && (
              <p id={descriptionId} className="miaixz-drawer-description">
                {description}
              </p>
            )}
          </div>
          {showClose && (
            <IconButton
              action={{
                id: "close-drawer",
                intent: "close",
                label: resolvedCloseLabel,
                icon: "X",
                tone: "neutral",
                size: "compact",
                confirm: "none",
                placement: "icon",
                onAction: () => onOpenChange(false),
              }}
            />
          )}
        </header>
        <div {...bodyProps} className={classNames("miaixz-drawer-body", bodyProps?.className)}>
          {children}
        </div>
        {footer !== undefined && <footer className="miaixz-drawer-footer">{footer}</footer>}
      </dialog>
    </FocusScope>,
    portalTarget,
  );
});
