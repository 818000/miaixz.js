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

import { useEffect, useRef, useState } from "react";

import { useMiaixzLocale } from "../../i18n/index.js";
import { Button } from "../button/index.js";
import { Dialog } from "../dialog/index.js";
import { Notice } from "../notice/index.js";
import { Input } from "../input/index.js";
import type { ConfirmProps } from "./confirm.types.js";

/**
 * Renders a focus-safe confirmation flow by composing the shared modal dialog.
 *
 * @param props - Controlled confirmation state, content, actions, and optional safety controls.
 * @returns A confirmation dialog that keeps cancellation as the initial focus target.
 * @public
 */
export function Confirm(props: ConfirmProps) {
  const {
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
    onConfirm,
  } = props;
  const { t } = useMiaixzLocale();
  const confirmationInputRef = useRef<HTMLInputElement>(null);
  const previousOpenRef = useRef(open);
  const internalPendingRef = useRef(false);
  const [internalPending, setInternalPending] = useState(false);
  const [confirmationMatches, setConfirmationMatches] = useState(confirmationText === undefined);
  const isPending = pending || internalPending;
  const canConfirm = confirmationText === undefined || confirmationMatches;

  useEffect(() => {
    const opened = open && !previousOpenRef.current;
    previousOpenRef.current = open;
    if (opened) {
      if (confirmationInputRef.current !== null) confirmationInputRef.current.value = "";
      setConfirmationMatches(confirmationText === undefined);
      return;
    }
    if (open && confirmationText !== undefined) {
      setConfirmationMatches(confirmationInputRef.current?.value === confirmationText);
    }
  }, [confirmationText, open]);

  /**
   * Forwards dismissal requests only while no confirmation operation is pending.
   *
   * @param nextOpen - Requested controlled open state.
   */
  const handleOpenChange = (nextOpen: boolean): void => {
    if (!nextOpen && (pending || internalPendingRef.current)) return;
    onOpenChange(nextOpen);
  };

  /**
   * Runs the confirmation action exactly once and contains synchronous or asynchronous failures.
   */
  const handleConfirm = async (): Promise<void> => {
    if (pending || internalPendingRef.current || !canConfirm) return;
    internalPendingRef.current = true;
    setInternalPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      /*
       * Consumers own localized error presentation through the explicit error property.
       */
    } finally {
      internalPendingRef.current = false;
      setInternalPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={description}
      size="small"
      showClose={false}
      aria-busy={isPending || undefined}
      className="miaixz-confirm"
    >
      <div className="miaixz-confirm-content">
        <Button
          className="miaixz-confirm-cancel"
          disabled={isPending}
          onClick={() => handleOpenChange(false)}
        >
          {cancelLabel}
        </Button>
        {confirmationText !== undefined && (
          <div className="miaixz-confirm-input">
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
        {error !== undefined && (
          <Notice tone="danger" className="miaixz-confirm-error">
            {error}
          </Notice>
        )}
        <Button
          className="miaixz-confirm-confirm"
          variant={tone === "danger" ? "danger" : "primary"}
          disabled={!canConfirm || isPending}
          loading={isPending}
          onClick={() => void handleConfirm()}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
