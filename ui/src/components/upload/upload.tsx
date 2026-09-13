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

/* eslint-disable jsdoc/require-jsdoc -- Closed upload presentation records are self-describing.
 */

import { forwardRef, useMemo, useState, type ReactElement } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { useMiaixzLocale } from "../../i18n/i18n.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { UploadFileRecord } from "../../shared/upload/types.js";
import { useUploadQueue } from "../../shared/upload/use-upload-queue.js";
import { IconButton } from "../action/icon-button.js";
import { Confirm } from "../confirm/confirm.js";
import { Dropzone, getDropzoneFileSignature, validateDropzoneFiles } from "../dropzone/dropzone.js";
import { type DropzoneRejection } from "../dropzone/dropzone.types.js";
import { Icon } from "../icon/icon.js";
import { Progress } from "../progress/progress.js";
import type { UploadOwnerState, UploadProps } from "./upload.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

const defaultRetryPolicy = Object.freeze({ maxRetries: 0, delayMs: 0 });

/**
 * Renders the file-selection surface and the sole upload queue presentation.
 */
export const Upload = withMiaixzThemeComponent(
  "Upload",
  forwardRef<HTMLDivElement, UploadProps>(function Upload(props, ref): ReactElement {
    const {
      accept,
      multiple = false,
      maxFiles,
      maxSizeBytes,
      disabled = false,
      label,
      dropLabel,
      browseLabel,
      upload,
      files,
      defaultFiles,
      onFilesChange,
      onComplete,
      onError,
      concurrency = 3,
      retryPolicy = defaultRetryPolicy,
      removePolicy = "confirm",
      getRemoveConfirmation,
      slotProps,
      ...rootNativeProps
    } = props;
    const { t } = useMiaixzLocale();
    const queue = useUploadQueue({
      ...(files === undefined ? {} : { files }),
      ...(defaultFiles === undefined ? {} : { defaultFiles }),
      ...(onFilesChange === undefined ? {} : { onFilesChange }),
      upload,
      onComplete,
      onError,
      concurrency,
      retryPolicy,
    });
    const [validationErrors, setValidationErrors] = useState<readonly MiaixzUiError[]>([]);
    const [pendingRemoval, setPendingRemoval] = useState<UploadFileRecord>();
    const effectiveMaxFiles = multiple ? (maxFiles ?? 10) : 1;
    const ownerState: UploadOwnerState = {
      disabled,
      fileCount: queue.files.length,
      hasError: validationErrors.length > 0,
    };
    const rootProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-upload" },
      componentProps: rootNativeProps,
      slotProps: slotProps?.root,
      forwardedRef: ref,
      internalProps: { ...(disabled ? { "data-disabled": true } : {}) },
      ownedProps: ["data-disabled"],
    });
    const dropzoneProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-upload-dropzone" },
      slotProps: slotProps?.dropzone,
    });
    const validationProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-upload-validation" },
      slotProps: slotProps?.validation,
      internalProps: { role: "alert" },
      ownedProps: ["role"],
    });
    const listProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-upload-list" },
      slotProps: slotProps?.list,
    });
    const itemProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-upload-item" },
      slotProps: slotProps?.item,
    });
    const statusProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-upload-status" },
      slotProps: slotProps?.status,
    });
    const actionsProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-upload-actions" },
      slotProps: slotProps?.actions,
    });
    const signatures = useMemo(
      () =>
        new Set(
          queue.files.map((record) =>
            record.source.kind === "local"
              ? getDropzoneFileSignature(record.source.file)
              : `${record.name}\u0000${record.size}\u0000${record.lastModified ?? 0}`,
          ),
        ),
      [queue.files],
    );

    const reportRejections = (rejections: readonly DropzoneRejection[]): void => {
      const errors = rejections.map(createRejectionError);
      setValidationErrors(Object.freeze(errors));
      rejections.forEach((rejection, index) => onError(rejection.file, errors[index]));
    };
    const handleFiles = (selected: readonly File[]): void => {
      const availableCount = Math.max(0, effectiveMaxFiles - queue.files.length);
      if (availableCount === 0) {
        reportRejections(selected.map((file) => ({ file, reason: "count" })));
        return;
      }
      const result = validateDropzoneFiles(
        selected,
        {
          ...(accept === undefined ? {} : { accept }),
          maxFiles: availableCount,
          ...(maxSizeBytes === undefined ? {} : { maxSizeBytes }),
        },
        signatures,
      );
      setValidationErrors([]);
      if (result.accepted.length > 0) queue.add(result.accepted);
      if (result.rejections.length > 0) reportRejections(result.rejections);
    };
    const requestRemove = (record: UploadFileRecord): void => {
      if (disabled) return;
      if (removePolicy === "immediate") queue.remove(record.id);
      else setPendingRemoval(record);
    };
    const confirmation =
      pendingRemoval === undefined || getRemoveConfirmation === undefined
        ? undefined
        : getRemoveConfirmation(pendingRemoval);

    return (
      <div {...rootProps}>
        <div {...dropzoneProps}>
          <Dropzone
            disabled={disabled}
            label={label}
            onFiles={handleFiles}
            onReject={reportRejections}
            {...(accept === undefined ? {} : { accept })}
            {...(maxSizeBytes === undefined ? {} : { maxSizeBytes })}
            {...(multiple ? { multiple: true as const, maxFiles: effectiveMaxFiles } : {})}
          >
            <span className="miaixz-upload-label">{dropLabel}</span>
            <span className="miaixz-upload-browse-label">{browseLabel}</span>
          </Dropzone>
        </div>
        {validationErrors.length > 0 ? (
          <div {...validationProps}>
            <Icon aria-hidden="true" name="CircleAlert" size="inline" />
            <ul className="miaixz-upload-validation-list">
              {[...new Set(validationErrors.map((error) => error.message))].map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {queue.files.length > 0 ? (
          <ul {...listProps}>
            {queue.files.map((record) => (
              <li {...itemProps} key={record.id} data-state={record.status}>
                <Icon
                  aria-hidden="true"
                  className="miaixz-upload-status-icon"
                  name={getStatusIcon(record.status)}
                  size="control"
                />
                <div className="miaixz-upload-details">
                  <span className="miaixz-upload-name">{record.name}</span>
                  <span {...statusProps}>{t(getStatusKey(record.status))}</span>
                  {record.source.kind === "local" && record.status === "uploading" ? (
                    <Progress label={t("ui.upload.uploading")} value={record.progress} />
                  ) : null}
                </div>
                <div {...actionsProps}>
                  {record.source.kind === "local" && record.status === "failed" ? (
                    <IconButton
                      disabled={disabled}
                      icon="RefreshCw"
                      label={t("ui.action.retry")}
                      onClick={() => queue.retry(record.id)}
                      size="small"
                    />
                  ) : null}
                  <IconButton
                    disabled={disabled}
                    icon="Trash2"
                    label={t("ui.action.remove")}
                    onClick={() => requestRemove(record)}
                    size="small"
                    tone="danger"
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        {confirmation !== undefined ? (
          <Confirm
            cancelLabel={confirmation.cancelLabel}
            confirmLabel={confirmation.confirmLabel}
            description={confirmation.description}
            onConfirm={() => {
              if (pendingRemoval !== undefined) queue.remove(pendingRemoval.id);
            }}
            onOpenChange={(open) => {
              if (!open) setPendingRemoval(undefined);
            }}
            open
            title={confirmation.title}
            tone="danger"
          />
        ) : null}
      </div>
    );
  }),
);

function createRejectionError(rejection: DropzoneRejection): MiaixzUiError {
  if (rejection.reason === "type") {
    return new MiaixzUiError({ code: "UI_FILE_TYPE_NOT_ACCEPTED" });
  }
  if (rejection.reason === "size") {
    return new MiaixzUiError({ code: "UI_FILE_TOO_LARGE" });
  }
  if (rejection.reason === "count") {
    return new MiaixzUiError({ code: "UI_FILE_COUNT_EXCEEDED" });
  }
  return new MiaixzUiError({ code: "UI_UPLOAD_DUPLICATE_FILE_ID" });
}

function getStatusKey(status: UploadFileRecord["status"]): string {
  if (status === "succeeded") return "ui.upload.success";
  if (status === "failed") return "ui.upload.error";
  return `ui.upload.${status}`;
}

function getStatusIcon(
  status: UploadFileRecord["status"],
): "File" | "LoaderCircle" | "CircleCheck" | "CircleAlert" {
  if (status === "uploading") return "LoaderCircle";
  if (status === "succeeded") return "CircleCheck";
  if (status === "failed") return "CircleAlert";
  return "File";
}
