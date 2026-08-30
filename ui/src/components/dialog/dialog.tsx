import { forwardRef, useId, useRef } from "react";
import { createPortal } from "react-dom";

import { FocusScope } from "../../accessibility/focus-scope.js";
import { classNames } from "../../internal/class-names.js";
import { useMiaixzNativeModal, useMiaixzPortalTarget } from "../../internal/overlay/index.js";
import { useMiaixzLocale } from "../../i18n/index.js";
import { useMergedRef } from "../../internal/use-merged-ref.js";
import { Button } from "../button/index.js";
import { Icon } from "../icon/index.js";
import type { DialogProps } from "./dialog.types.js";

/**
 * Controls a native modal dialog with localized dismissal and focus-safe lifecycle.
 *
 * @public
 */
export const Dialog = forwardRef<HTMLDialogElement, DialogProps>(function Dialog(
  {
    open,
    onOpenChange,
    title,
    description,
    footer,
    size = "medium",
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
  const resolvedCloseLabel = closeLabel ?? t("ui.dialog.close");
  const internalRef = useRef<HTMLDialogElement>(null);
  const ref = useMergedRef(internalRef, forwardedRef);
  const titleId = `miaixz-dialog-title-${useId()}`;
  const generatedDescriptionId = `miaixz-dialog-description-${useId()}`;
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
        className={classNames(
          "miaixz-dialog",
          size !== "medium" && `miaixz-dialog-${size}`,
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
        <header className="miaixz-dialog-header">
          <div>
            <h2 id={titleId} className="miaixz-dialog-title">
              {title}
            </h2>
            {description !== undefined && (
              <p id={descriptionId} className="miaixz-dialog-description">
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
        <div className="miaixz-dialog-body">{children}</div>
        {footer !== undefined && <footer className="miaixz-dialog-footer">{footer}</footer>}
      </dialog>
    </FocusScope>,
    portalTarget,
  );
});
