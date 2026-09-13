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

/* eslint-disable jsdoc/require-jsdoc -- The closed validation records are self-describing.
 */

import {
  forwardRef,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactElement,
} from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { Icon } from "../icon/icon.js";
import type { DropzoneOwnerState, DropzoneProps, DropzoneRejection } from "./dropzone.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/*
 * Describes one deterministic file-validation result.
 */
export interface DropzoneValidationResult {
  /*
   * Contains accepted files in original order.
   */
  readonly accepted: readonly File[];
  /*
   * Contains one highest-priority rejection per rejected file.
   */
  readonly rejections: readonly DropzoneRejection[];
}

/**
 * Applies the sole accept, duplicate, size, and count validation algorithm.
 *
 * @param files - Candidate files in browser order.
 * @param options - Effective validation limits.
 * @param options.accept - Optional native accept expression.
 * @param options.maxFiles - Maximum eligible file count.
 * @param options.maxSizeBytes - Optional maximum file size.
 * @param existingSignatures - Signatures already owned by an Upload queue.
 * @returns Accepted files and structured rejections in input order.
 */
export function validateDropzoneFiles(
  files: readonly File[],
  options: {
    readonly accept?: string;
    readonly maxFiles: number;
    readonly maxSizeBytes?: number;
  },
  existingSignatures: ReadonlySet<string> = new Set(),
): DropzoneValidationResult {
  validateLimits(options.maxFiles, options.maxSizeBytes);
  const acceptTokens = parseAccept(options.accept);
  const seen = new Set(existingSignatures);
  const eligible: File[] = [];
  const rejectionByFile = new Map<File, DropzoneRejection>();
  for (const file of files) {
    const signature = getDropzoneFileSignature(file);
    let reason: DropzoneRejection["reason"] | undefined;
    if (seen.has(signature)) reason = "duplicate";
    else if (!matchesAccept(file, acceptTokens)) reason = "type";
    else if (options.maxSizeBytes !== undefined && file.size > options.maxSizeBytes)
      reason = "size";
    seen.add(signature);
    if (reason === undefined) eligible.push(file);
    else rejectionByFile.set(file, { file, reason });
  }
  for (const file of eligible.slice(options.maxFiles)) {
    rejectionByFile.set(file, { file, reason: "count" });
  }
  return {
    accepted: Object.freeze(eligible.slice(0, options.maxFiles)),
    rejections: Object.freeze(
      files.flatMap((file) => {
        const rejection = rejectionByFile.get(file);
        return rejection === undefined ? [] : [rejection];
      }),
    ),
  };
}

/**
 * Creates the fixed duplicate identity shared with Upload.
 *
 * @param file - Browser file to identify.
 * @returns Stable metadata signature.
 */
export function getDropzoneFileSignature(file: File): string {
  return `${file.name}\u0000${file.size}\u0000${file.lastModified}`;
}

/**
 * Renders an accessible file selection surface without performing network requests.
 *
 * @public
 */
export const Dropzone = withMiaixzThemeComponent(
  "Dropzone",
  forwardRef<HTMLDivElement, DropzoneProps>(function Dropzone(props, ref): ReactElement {
    const {
      accept,
      multiple = false,
      maxFiles,
      maxSizeBytes,
      disabled = false,
      label,
      children,
      onFiles,
      onReject,
      slotProps,
      ...rootNativeProps
    } = props;
    const effectiveMaxFiles = multiple ? (maxFiles ?? 10) : 1;
    validateLimits(effectiveMaxFiles, maxSizeBytes);
    const inputRef = useRef<HTMLInputElement>(null);
    const dragDepthRef = useRef(0);
    const [dragActive, setDragActive] = useState(false);
    const [rejections, setRejections] = useState<readonly DropzoneRejection[]>([]);
    const ownerState: DropzoneOwnerState = {
      disabled,
      dragActive,
      hasError: rejections.length > 0,
    };

    const processFiles = (files: readonly File[]) => {
      if (disabled || files.length === 0) return;
      const result = validateDropzoneFiles(files, {
        ...(accept === undefined ? {} : { accept }),
        maxFiles: effectiveMaxFiles,
        ...(maxSizeBytes === undefined ? {} : { maxSizeBytes }),
      });
      setRejections(result.rejections);
      if (result.accepted.length > 0) onFiles(result.accepted);
      if (result.rejections.length > 0) onReject?.(result.rejections);
    };
    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.currentTarget.files === null ? [] : Array.from(event.currentTarget.files);
      event.currentTarget.value = "";
      processFiles(files);
    };
    const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
      if (disabled || !event.dataTransfer.types.includes("Files")) return;
      event.preventDefault();
      dragDepthRef.current += 1;
      setDragActive(true);
    };
    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
      if (disabled || !event.dataTransfer.types.includes("Files")) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    };
    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
      if (disabled || !event.dataTransfer.types.includes("Files")) return;
      event.preventDefault();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) setDragActive(false);
    };
    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
      if (disabled || !event.dataTransfer.types.includes("Files")) return;
      event.preventDefault();
      dragDepthRef.current = 0;
      setDragActive(false);
      processFiles(Array.from(event.dataTransfer.files));
    };

    const rootProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-dropzone" },
      componentProps: rootNativeProps,
      slotProps: slotProps?.root,
      forwardedRef: ref,
      internalProps: {
        "data-state": dragActive ? "active" : "idle",
        ...(disabled ? { "data-disabled": true } : {}),
        onDragEnter: handleDragEnter,
        onDragLeave: handleDragLeave,
        onDragOver: handleDragOver,
        onDrop: handleDrop,
      },
      ownedProps: ["data-state", "data-disabled"],
    });
    const inputProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-dropzone-input" },
      slotProps: slotProps?.input,
      internalRef: inputRef,
      internalProps: {
        type: "file",
        ...(accept === undefined ? {} : { accept }),
        multiple,
        disabled,
        tabIndex: -1,
        "aria-hidden": true,
        onChange: handleInputChange,
      },
      ownedProps: ["type", "accept", "multiple", "disabled", "tabIndex", "aria-hidden"],
    });
    const triggerProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-dropzone-trigger" },
      slotProps: slotProps?.trigger,
      internalProps: {
        type: "button",
        disabled,
        "aria-label": label,
        onClick: () => inputRef.current?.click(),
      },
      ownedProps: ["type", "disabled", "aria-label"],
    });
    const contentProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-dropzone-content" },
      slotProps: slotProps?.content,
    });
    return (
      <div {...rootProps}>
        <input {...inputProps} />
        <button {...triggerProps}>
          <Icon name="Upload" size="feature" className="miaixz-dropzone-icon" />
          <span {...contentProps}>{children}</span>
        </button>
      </div>
    );
  }),
);

/*
 * Validates the two positive integer limits.
 */
function validateLimits(maxFiles: number, maxSizeBytes: number | undefined): void {
  if (!Number.isInteger(maxFiles) || maxFiles <= 0) {
    throw new MiaixzUiError({
      code: "UI_FILE_MAX_FILES_INVALID",
    });
  }
  if (maxSizeBytes !== undefined && (!Number.isInteger(maxSizeBytes) || maxSizeBytes <= 0)) {
    throw new MiaixzUiError({
      code: "UI_FILE_MAX_SIZE_INVALID",
    });
  }
}

/*
 * Parses one accept expression into normalized non-empty tokens.
 */
function parseAccept(accept: string | undefined): readonly string[] {
  return (accept ?? "")
    .split(",")
    .map((token) => token.trim().toLocaleLowerCase())
    .filter(Boolean);
}

/*
 * Applies extension, MIME wildcard, and exact MIME accept rules.
 */
function matchesAccept(file: File, tokens: readonly string[]): boolean {
  if (tokens.length === 0) return true;
  const name = file.name.toLocaleLowerCase();
  const type = file.type.toLocaleLowerCase();
  return tokens.some((token) => {
    if (token.startsWith(".")) return name.endsWith(token);
    if (/^[^/]+\/\*$/u.test(token)) return type.startsWith(`${token.slice(0, -1)}`);
    if (/^[^/]+\/[^/]+$/u.test(token)) return type === token;
    return false;
  });
}
