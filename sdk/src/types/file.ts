/**
 * Describes a file managed by a Miaixz service.
 *
 * @public
 */
export interface MiaixzFileDescriptor {
  /**
   * Unique identifier of the file.
   */
  id: string;

  /**
   * Original or display name of the file.
   */
  name: string;

  /**
   * File size in bytes.
   */
  size: number;

  /**
   * Optional media type of the file content.
   */
  contentType?: string;

  /**
   * Optional checksum used to verify file integrity.
   */
  checksum?: string;

  /**
   * Optional URL from which the file can be downloaded.
   */
  downloadUrl?: string;

  /**
   * Optional ISO 8601 creation time.
   */
  createdAt?: string;
}

/**
 * Describes the files returned by an upload operation.
 *
 * @typeParam TFile - Concrete descriptor type returned for each uploaded file.
 * @public
 */
export interface MiaixzUploadResult<TFile extends MiaixzFileDescriptor = MiaixzFileDescriptor> {
  /**
   * Immutable collection of uploaded files.
   */
  files: readonly TFile[];
}
