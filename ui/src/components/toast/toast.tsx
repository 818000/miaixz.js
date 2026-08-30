import { createContext, forwardRef, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { createMiaixzUiError } from "../../errors/index.js";
import { classNames } from "../../internal/class-names.js";
import { useMiaixzManualPopover, useMiaixzPortalTarget } from "../../internal/overlay/index.js";
import { useMiaixzLocale } from "../../i18n/index.js";
import { Button } from "../button/index.js";
import { Icon } from "../icon/index.js";
import type {
  ToastContextValue,
  ToastOptions,
  ToastProps,
  ToastProviderProps,
  ToastRecord,
  ToastTone,
} from "./toast.types.js";

const ToastContext = createContext<ToastContextValue | undefined>(undefined);
let toastSequence = 0;

/**
 * Freezes the maximum number of simultaneously visible notifications.
 */
const miaixzMaximumVisibleToasts = 5;

/**
 * Creates a collision-resistant identifier for an in-memory notification.
 *
 * @returns A process-local toast identifier.
 */
function createToastId(): string {
  toastSequence += 1;
  return `miaixz-toast-${Date.now()}-${toastSequence}`;
}

const toneIcons: Record<ToastTone, "Info" | "CircleCheck" | "TriangleAlert" | "CircleAlert"> = {
  neutral: "Info",
  success: "CircleCheck",
  warning: "TriangleAlert",
  danger: "CircleAlert",
  info: "Info",
};

interface ManagedToastProps {
  /**
   * Supplies the toast record to render and schedule.
   */
  toast: ToastRecord;
  /**
   * Supplies the queue operation used to dismiss the toast.
   */
  dismiss: (id: string) => void;
}

/**
 * Renders one localized live-region notification with optional action and dismissal.
 *
 * @public
 */
export const Toast = forwardRef<HTMLDivElement, ToastProps>(function Toast(
  { id, title, message, action, tone = "neutral", dismissLabel, onDismiss, className, ...props },
  ref,
) {
  const { t } = useMiaixzLocale();
  const resolvedDismissLabel = dismissLabel ?? t("ui.notification.dismiss");
  return (
    <div
      {...props}
      ref={ref}
      role={tone === "danger" ? "alert" : "status"}
      className={classNames(
        "miaixz-toast",
        tone !== "neutral" && `miaixz-toast-${tone}`,
        className,
      )}
    >
      <Icon name={toneIcons[tone]} size="control" className="miaixz-toast-icon" />
      <div className="miaixz-toast-content">
        <p className="miaixz-toast-title">{title}</p>
        {message !== undefined && <p className="miaixz-toast-message">{message}</p>}
        {action !== undefined && <div className="miaixz-toast-actions">{action}</div>}
      </div>
      {onDismiss && (
        <Button
          iconOnly
          variant="ghost"
          size="small"
          aria-label={resolvedDismissLabel}
          className="miaixz-toast-dismiss"
          onClick={() => onDismiss(id)}
        >
          <Icon name="X" size="control" />
        </Button>
      )}
    </div>
  );
});

/* eslint-disable jsdoc/check-param-names, jsdoc/require-param -- TSDoc documents the typed properties instead of dotted parameter names. */
/**
 * Applies auto-dismiss lifecycle behavior to one toast record.
 *
 * @param props - Managed toast configuration.
 * @returns The managed toast element.
 */
function ManagedToast({ toast, dismiss }: ManagedToastProps) {
  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;
    const timer = window.setTimeout(() => dismiss(toast.id), toast.duration);
    return () => window.clearTimeout(timer);
  }, [dismiss, toast.duration, toast.id]);

  return <Toast {...toast} onDismiss={dismiss} />;
}

/**
 * Owns the application toast queue and renders it into the document portal.
 *
 * @param props - Toast provider configuration.
 * @returns The provider subtree and client-side toast portal.
 * @public
 */
export function ToastProvider({ children, defaultDuration = 5000 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const regionRef = useRef<HTMLDivElement>(null);
  const portalTarget = useMiaixzPortalTarget(null, true);
  const hasVisibleToasts = toasts.length > 0;
  const visibleToasts = toasts.slice(0, miaixzMaximumVisibleToasts);
  useMiaixzManualPopover(regionRef, hasVisibleToasts, portalTarget);

  const context = useMemo<ToastContextValue>(
    () => ({
      notify(options: ToastOptions) {
        const id = options.id ?? createToastId();
        setToasts((current) => [
          ...current.filter((toast) => toast.id !== id),
          { ...options, id, duration: options.duration ?? defaultDuration },
        ]);
        return id;
      },
      dismiss(id: string) {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      },
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
            className="miaixz-toast-region"
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
/* eslint-enable jsdoc/check-param-names, jsdoc/require-param */

/**
 * Returns the nearest toast controller.
 *
 * @returns The nearest toast queue controller.
 * @throws A localized error when called outside {@link ToastProvider}.
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
