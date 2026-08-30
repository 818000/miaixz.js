import type { HTMLAttributes } from "react";

/**
 * Defines properties owned by the Miaixz Dropzone contract.
 *
 * @public
 */
export interface MiaixzDropzoneOwnProps {
  /**
   * Supplies the native file input accept expression.
   */
  readonly accept?: string;

  /**
   * Allows more than one file to be selected in one operation.
   *
   * @defaultValue `false`
   */
  readonly multiple?: boolean;

  /**
   * Prevents pointer, keyboard, and drag-and-drop selection.
   *
   * @defaultValue `false`
   */
  readonly disabled?: boolean;

  /**
   * Supplies the required localized accessible selection label.
   */
  readonly label: string;

  /**
   * Receives the complete files selected by one input or drop operation.
   */
  readonly onFiles: (files: readonly File[]) => void;
}

/**
 * Configures a request-independent file selection dropzone.
 *
 * @public
 */
export interface DropzoneProps
  extends
    Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzDropzoneOwnProps>,
    MiaixzDropzoneOwnProps {}
