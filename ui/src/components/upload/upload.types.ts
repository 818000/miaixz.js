import type { HTMLAttributes } from "react";

/**
 * Supplies cancellation and progress reporting to one consumer-owned upload request.
 *
 * @public
 */
export interface MiaixzUploadContext {
  /**
   * Aborts when the file is cancelled, removed, or the component unmounts.
   */
  readonly signal: AbortSignal;

  /**
   * Reports a finite upload percentage from zero through one hundred.
   *
   * @param value - Current upload percentage.
   */
  reportProgress(value: number): void;
}

/**
 * Defines the consumer-owned asynchronous request for one file.
 *
 * @public
 */
export type MiaixzUploadHandler = (file: File, context: MiaixzUploadContext) => Promise<void>;

/**
 * Defines properties owned by the Miaixz Upload contract.
 *
 * @public
 */
export interface MiaixzUploadOwnProps {
  /**
   * Supplies the HTML file accept expression used by native and runtime validation.
   */
  readonly accept?: string;

  /**
   * Allows multiple files to remain in the upload list.
   *
   * @defaultValue `false`
   */
  readonly multiple?: boolean;

  /**
   * Limits accepted files, defaulting to one for single mode and ten for multiple mode.
   */
  readonly maxFiles?: number;

  /**
   * Limits each accepted file to a positive integer byte size.
   */
  readonly maxSizeBytes?: number;

  /**
   * Prevents new file selection and upload actions.
   *
   * @defaultValue `false`
   */
  readonly disabled?: boolean;

  /**
   * Supplies the required localized group label.
   */
  readonly label: string;

  /**
   * Supplies the localized drag-and-drop instruction.
   */
  readonly dropLabel: string;

  /**
   * Supplies the localized file picker action label.
   */
  readonly browseLabel: string;

  /**
   * Performs the consumer-owned network request for each accepted file.
   */
  readonly upload: MiaixzUploadHandler;

  /**
   * Receives the current file list after acceptance, removal, cancellation, or retry.
   */
  readonly onFilesChange?: (files: readonly File[]) => void;

  /**
   * Runs once after each file completes successfully.
   */
  readonly onComplete?: (file: File) => void;

  /**
   * Receives validation and upload failures without exposing server text in the UI.
   */
  readonly onError?: (file: File, error: unknown) => void;
}

/**
 * Configures validated, concurrent, request-independent file uploads.
 *
 * @public
 */
export interface UploadProps
  extends Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzUploadOwnProps>, MiaixzUploadOwnProps {}
