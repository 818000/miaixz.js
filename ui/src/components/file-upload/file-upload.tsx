import { forwardRef, useCallback, useEffect, useRef, useState, type ReactElement } from "react";

import { createMiaixzUiError, type MiaixzUiError } from "../../errors/index.js";
import { classNames } from "../../internal/class-names.js";
import { useMiaixzLocale } from "../../i18n/index.js";
import { Button } from "../button/index.js";
import { Dropzone } from "../dropzone/index.js";
import { Icon } from "../icon/index.js";
import { Progress } from "../progress/index.js";
import type { FileUploadProps, MiaixzUploadContext } from "./file-upload.types.js";

const miaixzUploadConcurrency = 3;

/**
 * Defines the complete internal upload state machine.
 */
type MiaixzUploadStatus = "queued" | "uploading" | "success" | "error" | "cancelled";

/**
 * Stores one accepted file and its request-independent presentation state.
 */
interface MiaixzUploadItem {
  /**
   * Identifies this selection occurrence within one component instance.
   */
  readonly id: string;

  /**
   * Retains the original browser File object across cancellation and retry.
   */
  readonly file: File;

  /**
   * Indicates the current upload lifecycle state.
   */
  readonly status: MiaixzUploadStatus;

  /**
   * Contains the most recently accepted progress percentage.
   */
  readonly progress: number;

  /**
   * Prevents duplicate completion callbacks for one accepted item.
   */
  readonly completed: boolean;
}

/**
 * Represents one recognized runtime accept rule.
 */
interface MiaixzAcceptRule {
  /**
   * Identifies the extension, exact MIME, or MIME family matcher.
   */
  readonly kind: "extension" | "mime" | "mime-family";

  /**
   * Contains the normalized comparison value.
   */
  readonly value: string;
}

/**
 * Parses recognized HTML accept segments while leaving unknown segments to the browser.
 *
 * @param accept - Comma-separated native accept expression.
 * @returns Runtime rules used for deterministic drag-and-drop validation.
 */
function parseMiaixzAcceptRules(accept: string | undefined): readonly MiaixzAcceptRule[] {
  if (accept === undefined) return [];
  const rules: MiaixzAcceptRule[] = [];
  for (const rawSegment of accept.split(",")) {
    const segment = rawSegment.trim().toLowerCase();
    if (/^\.[^./,\s]+$/.test(segment)) {
      rules.push({ kind: "extension", value: segment });
    } else if (/^[a-z0-9!#$&^_.+-]+\/\*$/.test(segment)) {
      rules.push({ kind: "mime-family", value: segment.slice(0, -1) });
    } else if (/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/.test(segment)) {
      rules.push({ kind: "mime", value: segment });
    }
  }
  return Object.freeze(rules);
}

/**
 * Reports whether one file matches at least one recognized runtime accept rule.
 *
 * @param file - Browser File selected through input or drag-and-drop.
 * @param rules - Parsed recognized accept rules.
 * @returns Whether the file is accepted, including permissive behavior when no rule is recognized.
 */
function isMiaixzFileAccepted(file: File, rules: readonly MiaixzAcceptRule[]): boolean {
  if (rules.length === 0) return true;
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();
  return rules.some((rule) => {
    if (rule.kind === "extension") return fileName.endsWith(rule.value);
    if (rule.kind === "mime-family") return mimeType.startsWith(rule.value);
    return mimeType === rule.value;
  });
}

/**
 * Resolves and validates the frozen maximum-file contract.
 *
 * @param multiple - Whether multiple files are permitted.
 * @param maxFiles - Optional consumer-supplied maximum.
 * @param createError - Localized UI error factory.
 * @returns Effective maximum number of retained files.
 */
function resolveMiaixzMaximumFiles(
  multiple: boolean,
  maxFiles: number | undefined,
  createError: (details: Readonly<Record<string, unknown>>) => MiaixzUiError,
): number {
  if (!multiple) {
    if (maxFiles !== undefined && maxFiles !== 1) throw createError({ maxFiles, multiple });
    return 1;
  }
  const resolved = maxFiles ?? 10;
  if (!Number.isInteger(resolved) || resolved <= 0)
    throw createError({ maxFiles: resolved, multiple });
  return resolved;
}

/**
 * Maps an upload state to its frozen built-in translation key.
 *
 * @param status - Current upload lifecycle state.
 * @returns Built-in UI message key for the visible and announced status.
 */
function getMiaixzUploadStatusKey(status: MiaixzUploadStatus): string {
  return `ui.upload.${status}`;
}

/**
 * Maps an upload state to a frozen Lucide icon name.
 *
 * @param status - Current upload lifecycle state.
 * @returns Registered icon representing the state without relying on color alone.
 */
function getMiaixzUploadStatusIcon(
  status: MiaixzUploadStatus,
): "File" | "LoaderCircle" | "CircleCheck" | "CircleAlert" | "X" {
  if (status === "uploading") return "LoaderCircle";
  if (status === "success") return "CircleCheck";
  if (status === "error") return "CircleAlert";
  if (status === "cancelled") return "X";
  return "File";
}

/**
 * Renders validated uploads with FIFO scheduling and consumer-owned requests.
 *
 * @public
 */
export const FileUpload = forwardRef<HTMLDivElement, FileUploadProps>(function FileUpload(
  {
    accept,
    multiple = false,
    maxFiles,
    maxSizeBytes,
    disabled = false,
    label,
    dropLabel,
    browseLabel,
    upload,
    onFilesChange,
    onComplete,
    onError,
    className,
    ...props
  },
  ref,
): ReactElement {
  const { t } = useMiaixzLocale();
  const [items, setItems] = useState<readonly MiaixzUploadItem[]>([]);
  const [validationMessages, setValidationMessages] = useState<readonly string[]>([]);
  const itemsRef = useRef(items);
  const nextIdRef = useRef(0);
  const mountedRef = useRef(true);
  const activeIdsRef = useRef(new Set<string>());
  const controllersRef = useRef(new Map<string, AbortController>());
  const acceptRules = parseMiaixzAcceptRules(accept);

  /**
   * Creates the frozen invalid maximum-file error with sanitized details.
   *
   * @param details - Non-sensitive configuration values that caused the failure.
   * @returns Localized UI contract error.
   */
  function createMaximumFilesError(details: Readonly<Record<string, unknown>>): MiaixzUiError {
    return createMiaixzUiError(t, {
      code: "UI_FILE_MAX_FILES_INVALID",
      messageKey: "ui.error.file.maxFilesInvalid",
      details,
    });
  }

  const resolvedMaximumFiles = resolveMiaixzMaximumFiles(
    multiple,
    maxFiles,
    createMaximumFilesError,
  );
  if (maxSizeBytes !== undefined && (!Number.isInteger(maxSizeBytes) || maxSizeBytes <= 0)) {
    throw createMiaixzUiError(t, {
      code: "UI_FILE_MAX_SIZE_INVALID",
      messageKey: "ui.error.file.maxSizeInvalid",
      details: { maxSizeBytes },
    });
  }

  /**
   * Commits an immutable item list and optionally publishes its File objects.
   *
   * @param nextItems - Complete replacement item list.
   * @param notify - Whether the frozen onFilesChange condition was met.
   */
  const replaceItems = useCallback(
    (nextItems: readonly MiaixzUploadItem[], notify: boolean): void => {
      const frozenItems = Object.freeze([...nextItems]);
      itemsRef.current = frozenItems;
      setItems(frozenItems);
      if (notify) onFilesChange?.(Object.freeze(frozenItems.map((item) => item.file)));
    },
    [onFilesChange],
  );

  /**
   * Replaces one item by ID while preserving the current list order.
   *
   * @param id - Internal accepted-item identifier.
   * @param update - Pure item transformation.
   * @param notify - Whether to publish the unchanged or changed File list.
   */
  const updateItem = useCallback(
    (
      id: string,
      update: (item: Readonly<MiaixzUploadItem>) => MiaixzUploadItem,
      notify = false,
    ): void => {
      replaceItems(
        itemsRef.current.map((item) => (item.id === id ? update(item) : item)),
        notify,
      );
    },
    [replaceItems],
  );

  /**
   * Runs one upload attempt and settles only the matching active item.
   *
   * @param item - Queued item captured when its FIFO slot became available.
   */
  const runUpload = useCallback(
    async (item: Readonly<MiaixzUploadItem>): Promise<void> => {
      const controller = new AbortController();
      controllersRef.current.set(item.id, controller);
      let invalidProgressError: MiaixzUiError | undefined;

      /**
       * Validates and commits one upload progress report.
       *
       * @param value - Consumer-reported upload percentage.
       */
      function reportProgress(value: number): void {
        if (!Number.isFinite(value) || value < 0 || value > 100) {
          invalidProgressError = createMiaixzUiError(t, {
            code: "UI_UPLOAD_PROGRESS_INVALID",
            messageKey: "ui.error.upload.progressInvalid",
            details: { value },
          });
          throw invalidProgressError;
        }
        if (!mountedRef.current || controller.signal.aborted) return;
        updateItem(item.id, (current) =>
          current.status === "uploading" ? { ...current, progress: value } : current,
        );
      }

      const context: MiaixzUploadContext = Object.freeze({
        signal: controller.signal,
        reportProgress,
      });
      let shouldComplete = false;
      try {
        await upload(item.file, context);
        if (invalidProgressError !== undefined) throw invalidProgressError;
        if (!mountedRef.current || controller.signal.aborted) return;
        const current = itemsRef.current.find((candidate) => candidate.id === item.id);
        if (current?.status !== "uploading") return;
        updateItem(item.id, (candidate) => ({
          ...candidate,
          status: "success",
          progress: 100,
          completed: true,
        }));
        shouldComplete = !current.completed;
      } catch (error) {
        if (!mountedRef.current || controller.signal.aborted) return;
        const current = itemsRef.current.find((candidate) => candidate.id === item.id);
        if (current?.status !== "uploading") return;
        const resolvedError = invalidProgressError ?? error;
        updateItem(item.id, (candidate) => ({ ...candidate, status: "error" }));
        onError?.(item.file, resolvedError);
      } finally {
        if (controllersRef.current.get(item.id) === controller) {
          controllersRef.current.delete(item.id);
          activeIdsRef.current.delete(item.id);
        }
      }
      if (shouldComplete && mountedRef.current) onComplete?.(item.file);
    },
    [onComplete, onError, t, updateItem, upload],
  );

  useEffect(() => {
    const availableSlots = miaixzUploadConcurrency - activeIdsRef.current.size;
    if (availableSlots <= 0) return;
    const queuedItems = itemsRef.current
      .filter((item) => item.status === "queued" && !activeIdsRef.current.has(item.id))
      .slice(0, availableSlots);
    if (queuedItems.length === 0) return;
    for (const item of queuedItems) activeIdsRef.current.add(item.id);
    const queuedIds = new Set(queuedItems.map((item) => item.id));
    replaceItems(
      itemsRef.current.map((item) =>
        queuedIds.has(item.id) ? { ...item, status: "uploading" } : item,
      ),
      false,
    );
    for (const item of queuedItems) void runUpload(item).catch(() => undefined);
  }, [items, replaceItems, runUpload]);

  useEffect(() => {
    const controllers = controllersRef.current;
    const activeIds = activeIdsRef.current;
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      for (const controller of controllers.values()) controller.abort();
      controllers.clear();
      activeIds.clear();
    };
  }, []);

  /**
   * Creates a localized validation error without retaining file names or content.
   *
   * @param code - Frozen file validation machine code.
   * @param messageKey - Frozen built-in translation key.
   * @param details - Safe size, MIME, or count diagnostics.
   * @returns Localized and sanitized UI error.
   */
  function createValidationError(
    code: "UI_FILE_TYPE_NOT_ACCEPTED" | "UI_FILE_TOO_LARGE" | "UI_FILE_COUNT_EXCEEDED",
    messageKey:
      "ui.error.file.typeNotAccepted" | "ui.error.file.tooLarge" | "ui.error.file.countExceeded",
    details: Readonly<Record<string, unknown>>,
  ): MiaixzUiError {
    return createMiaixzUiError(t, { code, messageKey, details });
  }

  /**
   * Validates one selection operation, accepts available files, and reports rejections.
   *
   * @param files - Files selected through the public Dropzone primitive.
   */
  function handleFiles(files: readonly File[]): void {
    if (disabled) return;
    const acceptedItems: MiaixzUploadItem[] = [];
    const errors: MiaixzUiError[] = [];
    for (const file of files) {
      let error: MiaixzUiError | undefined;
      if (!isMiaixzFileAccepted(file, acceptRules)) {
        error = createValidationError(
          "UI_FILE_TYPE_NOT_ACCEPTED",
          "ui.error.file.typeNotAccepted",
          { accept, mimeType: file.type },
        );
      } else if (maxSizeBytes !== undefined && file.size > maxSizeBytes) {
        error = createValidationError("UI_FILE_TOO_LARGE", "ui.error.file.tooLarge", {
          maxSizeBytes,
          sizeBytes: file.size,
        });
      } else if (itemsRef.current.length + acceptedItems.length >= resolvedMaximumFiles) {
        error = createValidationError("UI_FILE_COUNT_EXCEEDED", "ui.error.file.countExceeded", {
          maxFiles: resolvedMaximumFiles,
        });
      }
      if (error !== undefined) {
        errors.push(error);
        onError?.(file, error);
        continue;
      }
      nextIdRef.current += 1;
      acceptedItems.push({
        id: `upload-${nextIdRef.current}`,
        file,
        status: "queued",
        progress: 0,
        completed: false,
      });
    }
    setValidationMessages(Object.freeze([...new Set(errors.map((error) => error.message))]));
    if (acceptedItems.length > 0) {
      replaceItems([...itemsRef.current, ...acceptedItems], true);
    }
  }

  /**
   * Cancels one queued or active item while retaining its original File for retry.
   *
   * @param id - Internal accepted-item identifier.
   */
  function handleCancel(id: string): void {
    if (disabled) return;
    controllersRef.current.get(id)?.abort();
    controllersRef.current.delete(id);
    activeIdsRef.current.delete(id);
    updateItem(
      id,
      (item) =>
        item.status === "queued" || item.status === "uploading"
          ? { ...item, status: "cancelled" }
          : item,
      true,
    );
  }

  /**
   * Returns one failed or cancelled item to the FIFO queue.
   *
   * @param id - Internal accepted-item identifier.
   */
  function handleRetry(id: string): void {
    if (disabled) return;
    setValidationMessages([]);
    updateItem(
      id,
      (item) =>
        item.status === "error" || item.status === "cancelled"
          ? { ...item, status: "queued", progress: 0, completed: false }
          : item,
      true,
    );
  }

  /**
   * Removes one item and aborts any request still associated with it.
   *
   * @param id - Internal accepted-item identifier.
   */
  function handleRemove(id: string): void {
    if (disabled) return;
    controllersRef.current.get(id)?.abort();
    controllersRef.current.delete(id);
    activeIdsRef.current.delete(id);
    replaceItems(
      itemsRef.current.filter((item) => item.id !== id),
      true,
    );
  }

  return (
    <div
      {...props}
      ref={ref}
      role="group"
      aria-label={label}
      data-disabled={disabled || undefined}
      className={classNames("miaixz-file-upload", className)}
    >
      <span className="miaixz-file-upload-label">{label}</span>
      <Dropzone
        {...(accept === undefined ? {} : { accept })}
        multiple={multiple}
        disabled={disabled}
        label={dropLabel}
        onFiles={handleFiles}
      >
        <span className="miaixz-file-upload-drop-label">{dropLabel}</span>
        <span className="miaixz-file-upload-browse-label">{browseLabel}</span>
      </Dropzone>

      {validationMessages.length > 0 && (
        <div className="miaixz-file-upload-validation" role="alert">
          <Icon name="CircleAlert" size="inline" />
          <ul className="miaixz-file-upload-validation-list">
            {validationMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      {items.length > 0 && (
        <ul className="miaixz-file-upload-list">
          {items.map((item) => {
            const statusLabel = t(getMiaixzUploadStatusKey(item.status));
            return (
              <li key={item.id} data-state={item.status} className="miaixz-file-upload-item">
                <Icon
                  name={getMiaixzUploadStatusIcon(item.status)}
                  size="control"
                  className="miaixz-file-upload-status-icon"
                />
                <div className="miaixz-file-upload-details">
                  <span className="miaixz-file-upload-name">{item.file.name}</span>
                  <span className="miaixz-file-upload-status" role="status">
                    {statusLabel}
                  </span>
                  {item.status === "uploading" && (
                    <Progress
                      value={item.progress}
                      label={`${item.file.name}: ${statusLabel}`}
                      showValue
                    />
                  )}
                </div>
                <div className="miaixz-file-upload-actions">
                  {(item.status === "queued" || item.status === "uploading") && (
                    <Button
                      variant="ghost"
                      size="small"
                      disabled={disabled}
                      startIcon={<Icon name="X" />}
                      onClick={() => handleCancel(item.id)}
                    >
                      {t("ui.action.cancel")}
                    </Button>
                  )}
                  {(item.status === "error" || item.status === "cancelled") && (
                    <Button
                      variant="ghost"
                      size="small"
                      disabled={disabled}
                      startIcon={<Icon name="RotateCcw" />}
                      onClick={() => handleRetry(item.id)}
                    >
                      {t("ui.action.retry")}
                    </Button>
                  )}
                  {(item.status === "success" ||
                    item.status === "error" ||
                    item.status === "cancelled") && (
                    <Button
                      variant="ghost"
                      size="small"
                      disabled={disabled}
                      startIcon={<Icon name="Trash2" />}
                      onClick={() => handleRemove(item.id)}
                    >
                      {t("ui.action.remove")}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});
