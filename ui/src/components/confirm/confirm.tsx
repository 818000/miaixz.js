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

/* eslint-disable jsdoc/require-jsdoc, react-hooks/refs -- Slot ref composition is render-safe.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

import { useMiaixzLocale } from "../../i18n/i18n.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { Button } from "../button/button.js";
import { Dialog } from "../dialog/dialog.js";
import { type DialogCloseReason } from "../dialog/dialog.types.js";
import { Input } from "../input/input.js";
import { Notice } from "../notice/notice.js";
import type { ConfirmCloseReason, ConfirmOwnerState, ConfirmProps } from "./confirm.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/*
 * Renders a confirmation state machine with visible asynchronous failure handling.
 */
function Confirm({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = "normal",
  confirmationText,
  pending = false,
  error,
  errorFormatter,
  onError,
  onConfirm,
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

  useEffect(() => {
    const opened = open && !previousOpenRef.current;
    previousOpenRef.current = open;
    if (!opened) return;
    if (confirmationInputRef.current !== null) confirmationInputRef.current.value = "";
    setConfirmationMatches(confirmationText === undefined);
    setInternalError(undefined);
  }, [confirmationText, open]);

  const requestClose = (reason: ConfirmCloseReason): void => {
    if (isPending) return;
    onOpenChange(false, reason);
  };

  const handleDialogClose = (_nextOpen: boolean, reason: DialogCloseReason): void => {
    if (reason === "escape" || reason === "backdrop") requestClose(reason);
  };

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

  const displayedError = error ?? internalError;
  return (
    <Dialog
      open={open}
      onOpenChange={handleDialogClose}
      title={title}
      description={description}
      size="small"
      showClose={false}
      initialFocusRef={cancelButtonRef}
      slotProps={{
        root: {
          "aria-busy": isPending || undefined,
          role: tone === "danger" ? "alertdialog" : "dialog",
        },
      }}
    >
      <div
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-confirm-content" },
          slotProps: slotProps?.root,
        })}
      >
        {confirmationRequired && (
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-confirm-input" },
              slotProps: slotProps?.confirmationInput,
            })}
          >
            <Input
              ref={confirmationInputRef}
              aria-label={t("ui.confirm.confirmationInputLabel")}
              autoComplete="off"
              disabled={isPending}
              spellCheck={false}
              onChange={(event) =>
                setConfirmationMatches(event.currentTarget.value === confirmationText)
              }
            />
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
        <Button
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-confirm-cancel" },
            slotProps: slotProps?.cancelButton,
            internalRef: cancelButtonRef,
            internalProps: {
              disabled: isPending,
              onClick: () => requestClose("cancel"),
            },
            ownedProps: ["disabled"],
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
      </div>
    </Dialog>
  );
}

const ThemedConfirm = withMiaixzThemeComponent("Confirm", Confirm);
export { ThemedConfirm as Confirm };
