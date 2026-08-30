import { forwardRef, useId, useRef } from "react";
import { createPortal } from "react-dom";

import { FocusScope } from "../../accessibility/focus-scope.js";
import { classNames } from "../../internal/class-names.js";
import { useMiaixzNativeModal, useMiaixzPortalTarget } from "../../internal/overlay/index.js";
import { useMiaixzLocale } from "../../i18n/index.js";
import { useMergedRef } from "../../internal/use-merged-ref.js";
import { Button } from "../button/index.js";
import { Icon } from "../icon/index.js";
import type { DrawerProps } from "./drawer.types.js";

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
    placement = "right",
    closeLabel,
    showClose = true,
    closeOnBackdrop = true,
    className,
    children,
    onCancel,
    onClose,
    onClick,
    ...props
  },
  forwardedRef,
) {
  const { t } = useMiaixzLocale();
  const resolvedCloseLabel = closeLabel ?? t("ui.drawer.close");
  const internalRef = useRef<HTMLDialogElement>(null);
  const ref = useMergedRef(internalRef, forwardedRef);
  const titleId = `miaixz-drawer-title-${useId()}`;
  const generatedDescriptionId = `miaixz-drawer-description-${useId()}`;
  const descriptionId = description ? generatedDescriptionId : undefined;
  const portalTarget = useMiaixzPortalTarget();
  const restoreFocusRef = useMiaixzNativeModal(internalRef, open, portalTarget);

  if (portalTarget === null) return null;
  return createPortal(
    <FocusScope active={open} containerRef={internalRef} restoreFocusRef={restoreFocusRef}>
      <dialog
        {...props}
        ref={ref}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        data-placement={placement}
        className={classNames(
          "miaixz-drawer",
          size !== "medium" && `miaixz-drawer-${size}`,
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
            <Button
              iconOnly
              variant="ghost"
              size="small"
              aria-label={resolvedCloseLabel}
              onClick={() => onOpenChange(false)}
            >
              <Icon name="X" size="control" />
            </Button>
          )}
        </header>
        <div className="miaixz-drawer-body">{children}</div>
        {footer !== undefined && <footer className="miaixz-drawer-footer">{footer}</footer>}
      </dialog>
    </FocusScope>,
    portalTarget,
  );
});
