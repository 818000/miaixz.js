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

/* eslint-disable jsdoc/require-jsdoc, react-hooks/refs -- Timer and portal refs are local to the queue implementation.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
} from "react";
import { createPortal } from "react-dom";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { useMiaixzLocale } from "../../i18n/i18n.js";
import { useMiaixzPortalTarget } from "../../shared/overlay/portal-target.js";
import { useMiaixzManualPopover } from "../../shared/overlay/top-layer.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { Toast } from "../toast/toast.js";
import { type ToastCloseReason } from "../toast/toast.types.js";
import type {
  ToastContextValue,
  ToasterOwnerState,
  ToasterProps,
  ToastOptions,
  ToastRecord,
} from "./toaster.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

const ToastContext = createContext<ToastContextValue | undefined>(undefined);
let toastSequence = 0;

function createToastId(): string {
  toastSequence += 1;
  return `miaixz-toast-${Date.now()}-${toastSequence}`;
}

interface ManagedToastProps {
  readonly toast: ToastRecord;
  readonly close: (id: string, reason: ToastCloseReason) => void;
}

function ManagedToast({ toast, close }: ManagedToastProps) {
  const remainingRef = useRef(toast.duration ?? 0);
  const startedAtRef = useRef(0);
  const [pointerPaused, setPointerPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [documentPaused, setDocumentPaused] = useState(false);

  useEffect(() => {
    remainingRef.current = toast.duration ?? 0;
  }, [toast]);
  useEffect(() => {
    const ownerDocument = document;
    const update = (): void => setDocumentPaused(ownerDocument.hidden);
    update();
    ownerDocument.addEventListener("visibilitychange", update);
    return () => ownerDocument.removeEventListener("visibilitychange", update);
  }, []);
  useEffect(() => {
    if (pointerPaused || focusPaused || documentPaused || remainingRef.current <= 0) return;
    startedAtRef.current = performance.now();
    const timer = window.setTimeout(() => close(toast.id, "timeout"), remainingRef.current);
    return () => {
      window.clearTimeout(timer);
      remainingRef.current = Math.max(
        0,
        remainingRef.current - (performance.now() - startedAtRef.current),
      );
    };
  }, [close, documentPaused, focusPaused, pointerPaused, toast]);

  const handleBlur = (event: FocusEvent<HTMLDivElement>): void => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocusPaused(false);
  };
  return (
    <Toast
      {...toast}
      onClose={close}
      onPointerEnter={() => setPointerPaused(true)}
      onPointerLeave={() => setPointerPaused(false)}
      onFocusCapture={() => setFocusPaused(true)}
      onBlurCapture={handleBlur}
    />
  );
}

/*
 * Owns the single FIFO toast queue and its two announcement priorities.
 */
function Toaster({
  children,
  defaultDuration = 5000,
  maxVisible = 5,
  onClose,
  slotProps,
}: ToasterProps) {
  if (!Number.isFinite(defaultDuration)) {
    throw new MiaixzUiError({
      code: "UI_TOAST_DURATION_INVALID",
      details: { duration: defaultDuration },
    });
  }
  if (!Number.isInteger(maxVisible) || maxVisible <= 0) {
    throw new MiaixzUiError({
      code: "UI_TOASTER_MAX_VISIBLE_INVALID",
      details: { maxVisible },
    });
  }
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const queueRef = useRef(toasts);
  const regionRef = useRef<HTMLDivElement>(null);
  const portalTarget = useMiaixzPortalTarget(null, true);
  const visibleToasts = toasts.slice(0, maxVisible);
  const ownerState: ToasterOwnerState = {
    visibleCount: visibleToasts.length,
    queuedCount: Math.max(0, toasts.length - visibleToasts.length),
    maxVisible,
  };
  useMiaixzManualPopover(regionRef, visibleToasts.length > 0, portalTarget);

  const replaceQueue = useCallback((next: ToastRecord[]): void => {
    queueRef.current = next;
    setToasts(next);
  }, []);
  const closeToast = useCallback(
    (id: string, reason: ToastCloseReason): void => {
      if (!queueRef.current.some((toast) => toast.id === id)) return;
      replaceQueue(queueRef.current.filter((toast) => toast.id !== id));
      onClose?.(id, reason);
    },
    [onClose, replaceQueue],
  );
  const context = useMemo<ToastContextValue>(
    () => ({
      notify(options: ToastOptions): string {
        const duration = options.duration ?? defaultDuration;
        if (!Number.isFinite(duration)) {
          throw new MiaixzUiError({
            code: "UI_TOAST_DURATION_INVALID",
            details: { duration },
          });
        }
        const id = options.id ?? createToastId();
        const record: ToastRecord = { ...options, id, duration };
        const current = queueRef.current;
        const index = current.findIndex((toast) => toast.id === id);
        const next = [...current];
        if (index === -1) next.push(record);
        else next[index] = record;
        replaceQueue(next);
        return id;
      },
      dismiss(id: string): void {
        closeToast(id, "programmatic");
      },
      dismissAll(): void {
        for (const toast of queueRef.current) onClose?.(toast.id, "programmatic");
        replaceQueue([]);
      },
    }),
    [closeToast, defaultDuration, onClose, replaceQueue],
  );

  const politeToasts = visibleToasts.filter((toast) => toast.tone !== "danger");
  const assertiveToasts = visibleToasts.filter((toast) => toast.tone === "danger");
  return (
    <ToastContext.Provider value={context}>
      {children}
      {visibleToasts.length > 0 &&
        portalTarget !== null &&
        createPortal(
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-toaster" },
              slotProps: slotProps?.root,
              internalRef: regionRef,
              internalProps: { popover: "manual" },
              ownedProps: ["popover"],
            })}
          >
            <div
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-toaster-region" },
                slotProps: slotProps?.politeRegion,
                internalProps: {
                  "aria-live": "polite",
                  "aria-atomic": false,
                  "aria-relevant": "additions",
                },
                ownedProps: ["aria-live", "aria-atomic", "aria-relevant"],
              })}
            >
              {politeToasts.map((toast) => (
                <ManagedToast key={toast.id} toast={toast} close={closeToast} />
              ))}
            </div>
            <div
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-toaster-region" },
                slotProps: slotProps?.assertiveRegion,
                internalProps: {
                  "aria-live": "assertive",
                  "aria-atomic": false,
                  "aria-relevant": "additions",
                },
                ownedProps: ["aria-live", "aria-atomic", "aria-relevant"],
              })}
            >
              {assertiveToasts.map((toast) => (
                <ManagedToast key={toast.id} toast={toast} close={closeToast} />
              ))}
            </div>
          </div>,
          portalTarget,
        )}
    </ToastContext.Provider>
  );
}

/*
 * Returns the nearest toast queue controller.
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (context !== undefined) return context;
  throw new MiaixzUiError({ code: "UI_TOAST_PROVIDER_MISSING" });
}

const ThemedToaster = withMiaixzThemeComponent("Toaster", Toaster);
export { ThemedToaster as Toaster };
