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

import { forwardRef, useId, useRef } from "react";
import { createPortal } from "react-dom";

import { FocusScope } from "../../accessibility/focus-scope.js";
import { classNames } from "../../shared/class-names.js";
import { useMiaixzNativeModal, useMiaixzPortalTarget } from "../../shared/overlay/index.js";
import { useMiaixzLocale } from "../../i18n/index.js";
import { useMergedRef } from "../../shared/use-merged-ref.js";
import { IconButton } from "../action/index.js";
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
  const restoreFocusRef = useMiaixzNativeModal(internalRef, open, portalTarget, () =>
    onOpenChange(false),
  );

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
            <IconButton
              action={{
                id: "close-dialog",
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
        <div className="miaixz-dialog-body">{children}</div>
        {footer !== undefined && <footer className="miaixz-dialog-footer">{footer}</footer>}
      </dialog>
    </FocusScope>,
    portalTarget,
  );
});
