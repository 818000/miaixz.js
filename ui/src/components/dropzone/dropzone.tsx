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

import {
  forwardRef,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactElement,
  type HTMLAttributes,
} from "react";

import { classNames } from "../../shared/class-names.js";
import { Icon } from "../icon/index.js";
import type { DropzoneProps } from "./dropzone.types.js";

/**
 * Frames an existing file-picker workflow without adding selection behavior. @public
 */
export const DropzonePanel = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  function DropzonePanel({ className, ...props }, ref) {
    return (
      <section {...props} ref={ref} className={classNames("miaixz-dropzone-panel", className)} />
    );
  },
);

/**
 * Converts one browser FileList into an immutable consumer-facing array.
 *
 * @param files - Browser file collection to normalize.
 * @returns Files in their original browser order.
 */
function toMiaixzFileArray(files: FileList | null): readonly File[] {
  return Object.freeze(files === null ? [] : Array.from(files));
}

/**
 * Renders an accessible file selection surface without performing network requests.
 *
 * @public
 */
export const Dropzone = forwardRef<HTMLDivElement, DropzoneProps>(function Dropzone(
  {
    accept,
    multiple = false,
    disabled = false,
    label,
    onFiles,
    className,
    children,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    ...props
  },
  ref,
): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const [dragActive, setDragActive] = useState(false);

  /**
   * Opens the native file picker from the keyboard-accessible trigger.
   */
  function handleBrowse(): void {
    if (!disabled) inputRef.current?.click();
  }

  /**
   * Publishes files selected by the native picker and resets its repeat-selection state.
   *
   * @param event - Native file input change event.
   */
  function handleInputChange(event: ChangeEvent<HTMLInputElement>): void {
    const files = toMiaixzFileArray(event.currentTarget.files);
    event.currentTarget.value = "";
    if (!disabled && files.length > 0) onFiles(files);
  }

  /**
   * Activates drag feedback while preserving a consumer-supplied native handler.
   *
   * @param event - Drag-enter event crossing the dropzone boundary.
   */
  function handleDragEnter(event: DragEvent<HTMLDivElement>): void {
    onDragEnter?.(event);
    if (event.defaultPrevented || disabled || !event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    dragDepthRef.current += 1;
    setDragActive(true);
  }

  /**
   * Keeps the surface eligible as a file drop target.
   *
   * @param event - Drag-over event occurring above the dropzone.
   */
  function handleDragOver(event: DragEvent<HTMLDivElement>): void {
    onDragOver?.(event);
    if (event.defaultPrevented || disabled || !event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  /**
   * Clears drag feedback after the final nested boundary is left.
   *
   * @param event - Drag-leave event crossing a nested or outer boundary.
   */
  function handleDragLeave(event: DragEvent<HTMLDivElement>): void {
    onDragLeave?.(event);
    if (event.defaultPrevented || disabled || !event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDragActive(false);
  }

  /**
   * Publishes dropped files in browser order without starting an upload.
   *
   * @param event - Drop event containing the selected files.
   */
  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    onDrop?.(event);
    if (event.defaultPrevented || disabled || !event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    dragDepthRef.current = 0;
    setDragActive(false);
    const files = toMiaixzFileArray(event.dataTransfer.files);
    if (files.length > 0) onFiles(files);
  }

  return (
    <div
      {...props}
      ref={ref}
      data-state={dragActive ? "active" : "idle"}
      data-disabled={disabled || undefined}
      className={classNames("miaixz-dropzone", className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="miaixz-dropzone-input"
        onChange={handleInputChange}
      />
      <button
        type="button"
        disabled={disabled}
        aria-label={label}
        className="miaixz-dropzone-trigger"
        onClick={handleBrowse}
      >
        <Icon name="Upload" size="feature" className="miaixz-dropzone-icon" />
        <span className="miaixz-dropzone-content">{children ?? label}</span>
      </button>
    </div>
  );
});
