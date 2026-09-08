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

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { createMiaixzUiError } from "../../errors/index.js";
import { useMiaixzLocale } from "../../i18n/index.js";
import { useMiaixzManualPopover, useMiaixzPortalTarget } from "../../shared/overlay/index.js";
import { Toast } from "../toast/index.js";
import type {
  ToastContextValue,
  ToastOptions,
  ToasterProps,
  ToastRecord,
} from "./toaster.types.js";

const ToastContext = createContext<ToastContextValue | undefined>(undefined);
const maximumVisibleToasts = 5;
let toastSequence = 0;

/**
 * Creates a unique toast identifier.
 *
 * @returns The generated identifier.
 * @internal
 */
function createToastId(): string {
  toastSequence += 1;
  return `miaixz-toast-${Date.now()}-${toastSequence}`;
}

interface ManagedToastProps {
  /**
   * Supplies the queued toast record.
   */
  readonly toast: ToastRecord;
  /**
   * Removes the toast from its queue.
   */
  readonly dismiss: (id: string) => void;
}

/**
 * Manages automatic dismissal for one toast.
 *
 * @param properties - Managed toast properties.
 * @returns The rendered toast.
 * @internal
 */
function ManagedToast(properties: ManagedToastProps) {
  const { toast, dismiss } = properties;
  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;
    const timer = window.setTimeout(() => dismiss(toast.id), toast.duration);
    return () => window.clearTimeout(timer);
  }, [dismiss, toast.duration, toast.id]);
  return <Toast {...toast} onDismiss={dismiss} />;
}

/**
 * Owns the application toast queue and renders its portal.
 *
 * @param properties - Toaster properties.
 * @returns The provider subtree and notification portal.
 * @public
 */
export function Toaster(properties: ToasterProps) {
  const { children, defaultDuration = 5000 } = properties;
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const regionRef = useRef<HTMLDivElement>(null);
  const portalTarget = useMiaixzPortalTarget(null, true);
  const hasVisibleToasts = toasts.length > 0;
  const visibleToasts = toasts.slice(0, maximumVisibleToasts);
  useMiaixzManualPopover(regionRef, hasVisibleToasts, portalTarget);
  const context = useMemo<ToastContextValue>(
    () => ({
      /**
       * Adds or replaces a toast notification.
       *
       * @param options - Toast content and display options.
       * @returns The toast identifier.
       */
      notify(options) {
        const id = options.id ?? createToastId();
        setToasts((current) => [
          ...current.filter((toast) => toast.id !== id),
          { ...options, id, duration: options.duration ?? defaultDuration },
        ]);
        return id;
      },
      /**
       * Removes one toast notification.
       *
       * @param id - Identifier of the toast to remove.
       */
      dismiss(id) {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      },
      /**
       * Removes every toast notification.
       */
      dismissAll() {
        setToasts([]);
      },
    }),
    [defaultDuration],
  );

  return (
    <ToastContext.Provider value={context}>
      {children}
      {hasVisibleToasts &&
        portalTarget !== null &&
        createPortal(
          <div
            ref={regionRef}
            popover="manual"
            className="miaixz-toaster"
            aria-live="polite"
            aria-relevant="additions removals"
          >
            {visibleToasts.map((toast) => (
              <ManagedToast key={toast.id} toast={toast} dismiss={context.dismiss} />
            ))}
          </div>,
          portalTarget,
        )}
    </ToastContext.Provider>
  );
}

/**
 * Returns the nearest toast controller.
 *
 * @returns The nearest toast queue controller.
 * @public
 */
export function useToast(): ToastContextValue {
  const { t } = useMiaixzLocale();
  const context = useContext(ToastContext);
  if (!context) {
    throw createMiaixzUiError(t, {
      code: "UI_TOAST_PROVIDER_MISSING",
      messageKey: "ui.error.toast.providerMissing",
    });
  }
  return context;
}
