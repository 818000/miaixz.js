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

/**
 * Implements the confirm UI component.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@miaixz/icons";

import { useMiaixzLocale } from "../../i18n/i18n.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { Button } from "../button/button.js";
import { Dialog } from "../dialog/dialog.js";
import { type DialogCloseReason } from "../dialog/dialog.types.js";
import { Field } from "../field/field.js";
import { Input } from "../input/input.js";
import { Notice } from "../notice/notice.js";
import type {
  ConfirmCloseReason,
  ConfirmOwnerState,
  ConfirmProps,
  ConfirmTone,
} from "./confirm.types.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";

const toneIcons: Readonly<Record<ConfirmTone, IconName>> = Object.freeze({
  normal: "info",
  info: "info",
  success: "confirm",
  warning: "warning",
  danger: "circle-alert",
});

/**
 * Renders a confirmation state machine with visible asynchronous failure handling.
 *
 * @param props - Confirmation behavior, content, and slot configuration.
 * @returns Controlled confirmation dialog.
 */
function Confirm({
  open,
  onOpenChange,
  title,
  subject,
  description,
  detail,
  children,
  icon,
  confirmLabel,
  cancelLabel,
  tone = "normal",
  confirmationText,
  confirmationLabel,
  confirmationHelperText,
  pending = false,
  error,
  errorFormatter,
  onError,
  onConfirm,
  showClose = false,
  closeOnEscape = true,
  closeOnBackdrop = false,
  slotProps,
}: ConfirmProps) {
  const { t } = useMiaixzLocale();
  const confirmationInputRef = useRef<HTMLInputElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previousOpenRef = useRef(open);
  const internalPendingRef = useRef(false);
  const [internalPending, setInternalPending] = useState(false);
  const [internalError, setInternalError] = useState<ReactNode>();
  const [confirmationMatches, setConfirmationMatches] = useState(confirmationText === undefined);
  const isPending = pending || internalPending;
  const confirmationRequired = confirmationText !== undefined;
  const canConfirm = !confirmationRequired || confirmationMatches;
  const ownerState: ConfirmOwnerState = {
    open,
    tone,
    pending: isPending,
    confirmationRequired,
    confirmationMatches,
  };
  const displayedError = error ?? internalError;
  const resolvedIcon = icon === undefined ? <Icon name={toneIcons[tone]} size="control" /> : icon;
  const dialogDescription =
    subject !== undefined || description !== undefined ? (
      <div
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-confirm-description" },
          slotProps: slotProps?.description,
        })}
      >
        {subject !== undefined && (
          <span
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-confirm-subject" },
              slotProps: slotProps?.subject,
            })}
          >
            {subject}
          </span>
        )}
        {description !== undefined && (
          <div className="miaixz-confirm-description-text">{description}</div>
        )}
      </div>
    ) : undefined;

  useEffect(() => {
    const opened = open && !previousOpenRef.current;
    previousOpenRef.current = open;
    if (!opened) return;
    if (confirmationInputRef.current !== null) confirmationInputRef.current.value = "";
    setConfirmationMatches(confirmationText === undefined);
    setInternalError(undefined);
  }, [confirmationText, open]);

  /**
   * Requests confirmation dismissal only when no confirmation operation is pending.
   *
   * @param reason - User action that requested dismissal.
   * @returns No return value; pending operations keep the confirmation open.
   */
  const requestClose = (reason: ConfirmCloseReason): void => {
    if (isPending) return;
    onOpenChange(false, reason);
  };

  /**
   * Forwards only escape and backdrop dismissal reasons from the underlying dialog.
   *
   * @param _nextOpen - Underlying dialog open-state proposal, intentionally unused.
   * @param reason - Underlying dialog dismissal reason.
   * @returns No return value; other dialog reasons are ignored.
   */
  const handleDialogClose = (_nextOpen: boolean, reason: DialogCloseReason): void => {
    if (reason === "escape" && closeOnEscape) requestClose(reason);
    if (reason === "backdrop" && closeOnBackdrop) requestClose(reason);
    if (reason === "closeButton") requestClose(reason);
  };

  /**
   * Runs one confirmation operation, closes on success, and displays a formatted failure.
   *
   * @returns Promise resolving after success or controlled error handling and pending-state cleanup.
   */
  const handleConfirm = async (): Promise<void> => {
    if (pending || internalPendingRef.current || !canConfirm) return;
    internalPendingRef.current = true;
    setInternalPending(true);
    setInternalError(undefined);
    try {
      await onConfirm();
      onOpenChange(false, "confirm");
    } catch (caught) {
      setInternalError(errorFormatter?.(caught) ?? t("ui.confirm.failed"));
      onError?.(caught);
    } finally {
      internalPendingRef.current = false;
      setInternalPending(false);
    }
  };

  return (
    <Dialog
      closeOnBackdrop={closeOnBackdrop}
      open={open}
      onOpenChange={handleDialogClose}
      title={
        <span className="miaixz-confirm-heading">
          {resolvedIcon !== null && (
            <span
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-confirm-icon" },
                slotProps: slotProps?.icon,
              })}
            >
              {resolvedIcon}
            </span>
          )}
          <span className="miaixz-confirm-title-text">{title}</span>
        </span>
      }
      description={dialogDescription}
      footer={
        <>
          <Button
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-confirm-cancel" },
              slotProps: slotProps?.cancelButton,
              internalRef: cancelButtonRef,
              internalProps: {
                disabled: isPending,
                onClick: () => requestClose("cancel"),
                tone: "neutral",
                variant: "outlined",
              },
              ownedProps: ["disabled", "tone", "variant"],
            })}
          >
            {cancelLabel}
          </Button>
          <Button
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-confirm-confirm" },
              slotProps: slotProps?.confirmButton,
              internalProps: {
                disabled: !canConfirm || isPending,
                loading: isPending,
                onClick: () => void handleConfirm(),
                tone: tone === "danger" ? "danger" : "brand",
                variant: "solid",
              },
              ownedProps: ["disabled", "loading", "tone", "variant"],
            })}
          >
            {confirmLabel}
          </Button>
        </>
      }
      size="small"
      showClose={showClose}
      initialFocusRef={cancelButtonRef}
      slotProps={{
        root: {
          "aria-busy": isPending || undefined,
          className: `miaixz-confirm-dialog miaixz-confirm-${tone} ${
            resolvedIcon === null ? "miaixz-confirm-without-icon" : "miaixz-confirm-with-icon"
          }`,
          role: tone === "danger" ? "alertdialog" : "dialog",
        },
        closeButton: { disabled: isPending },
      }}
    >
      <div
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-confirm-content" },
          slotProps: slotProps?.root,
        })}
      >
        {children}
        {detail !== undefined && (
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-confirm-detail" },
              slotProps: slotProps?.detail,
            })}
          >
            {detail}
          </div>
        )}
        {confirmationRequired && (
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-confirm-input" },
              slotProps: slotProps?.confirmationInput,
            })}
          >
            <Field
              disabled={isPending}
              helperText={confirmationHelperText}
              label={confirmationLabel ?? t("ui.confirm.confirmationInputLabel")}
              required
            >
              <Input
                ref={confirmationInputRef}
                autoComplete="off"
                disabled={isPending}
                spellCheck={false}
                onChange={(event) =>
                  setConfirmationMatches(event.currentTarget.value === confirmationText)
                }
              />
            </Field>
          </div>
        )}
        {displayedError !== undefined && (
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-confirm-error" },
              slotProps: slotProps?.error,
            })}
          >
            <Notice tone="danger">{displayedError}</Notice>
          </div>
        )}
      </div>
    </Dialog>
  );
}

const ThemedConfirm = withMiaixzThemeComponent("Confirm", Confirm);
export { ThemedConfirm as Confirm };
