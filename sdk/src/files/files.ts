import type { MiaixzApiClient } from "../api/index.js";
import { MiaixzSdkError, isMiaixzSdkError } from "../api/errors.js";
import { miaixzDefaultI18n, type MiaixzTranslator } from "../i18n/index.js";
import type { MiaixzFileDescriptor, MiaixzUploadResult } from "../types/index.js";

/**
 * Configures a multipart file upload.
 *
 * @public
 */
export interface MiaixzUploadOptions {
  /**
   * Optional multipart field name used for uploaded files.
   */
  fieldName?: string;

  /**
   * Optional scalar metadata appended to the multipart body.
   */
  metadata?: Readonly<Record<string, string | number | boolean>>;

  /**
   * Optional signal used to cancel the upload.
   */
  signal?: AbortSignal;

  /**
   * Optional request-specific HTTP headers.
   */
  headers?: HeadersInit;
}

/**
 * Configures a file download.
 *
 * @public
 */
export interface MiaixzDownloadOptions {
  /**
   * Optional signal used to cancel the download.
   */
  signal?: AbortSignal;

  /**
   * Optional request-specific HTTP headers.
   */
  headers?: HeadersInit;

  /**
   * Optional filename that overrides response metadata.
   */
  filename?: string;
}

/**
 * Describes a file downloaded into memory.
 *
 * @public
 */
export interface MiaixzDownloadedFile {
  /**
   * Downloaded binary content.
   */
  blob: Blob;

  /**
   * Optional decoded or caller-provided filename.
   */
  filename?: string;

  /**
   * Optional media type returned by the server.
   */
  contentType?: string;
}

/**
 * Configures a high-level Miaixz file client.
 *
 * @public
 */
export interface MiaixzFileClientOptions {
  /**
   * Optional translator used for file-operation errors.
   */
  translate?: MiaixzTranslator;
}

/**
 * Normalizes a single upload blob to the multi-file representation.
 *
 * @param files - Single blob or immutable blob collection.
 * @returns Immutable blob collection.
 */
function normalizeFiles(files: Blob | readonly Blob[]): readonly Blob[] {
  return files instanceof Blob ? [files] : files;
}

/**
 * Extracts and decodes a filename from an HTTP Content-Disposition header.
 *
 * @param headers - Response headers to inspect.
 * @returns Decoded filename when one is present.
 * @public
 */
export function getMiaixzDownloadFilename(headers: Headers): string | undefined {
  const disposition = headers.get("content-disposition");
  if (!disposition) return undefined;
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded.replace(/^"|"$/g, ""));
    } catch {
      return encoded;
    }
  }
  return disposition.match(/filename="?([^";]+)"?/i)?.[1]?.trim();
}

/**
 * High-level file upload and download operations built on a Miaixz API client.
 *
 * @public
 */
export class MiaixzFileClient {
  readonly #translate: MiaixzTranslator;

  /**
   * Configured API client used for file requests.
   */
  readonly api: MiaixzApiClient;

  /**
   * Creates a high-level file client.
   *
   * @param api - Configured API client.
   * @param options - File-specific adapters.
   */
  constructor(api: MiaixzApiClient, options: MiaixzFileClientOptions = {}) {
    this.api = api;
    this.#translate = options.translate ?? miaixzDefaultI18n.t;
  }

  /**
   * Uploads one or more files as multipart form data.
   *
   * @param path - API path that accepts the upload.
   * @param files - Single blob or immutable blob collection to upload.
   * @param options - Optional multipart metadata and request controls.
   * @returns The backend's unwrapped upload result.
   */
  async upload<TFile extends MiaixzFileDescriptor = MiaixzFileDescriptor>(
    path: string,
    files: Blob | readonly Blob[],
    options: MiaixzUploadOptions = {},
  ): Promise<MiaixzUploadResult<TFile>> {
    const formData = new FormData();
    const fieldName = options.fieldName ?? "files";
    for (const file of normalizeFiles(files)) {
      const filename = typeof File !== "undefined" && file instanceof File ? file.name : "file";
      formData.append(fieldName, file, filename);
    }
    for (const [key, value] of Object.entries(options.metadata ?? {})) {
      formData.append(key, String(value));
    }
    const response = await this.api.post<MiaixzUploadResult<TFile>, FormData>(path, formData, {
      responseType: "json",
      ...(options.signal === undefined ? {} : { signal: options.signal }),
      ...(options.headers === undefined ? {} : { headers: options.headers }),
    });
    return response.data;
  }

  /**
   * Downloads a binary response and derives its filename and content type.
   *
   * @param path - API path of the file to download.
   * @param options - Optional filename and request controls.
   * @returns Downloaded binary content and response metadata.
   */
  async download(path: string, options: MiaixzDownloadOptions = {}): Promise<MiaixzDownloadedFile> {
    try {
      const response = await this.api.get<Blob>(path, {
        responseType: "blob",
        ...(options.signal === undefined ? {} : { signal: options.signal }),
        ...(options.headers === undefined ? {} : { headers: options.headers }),
      });
      const filename = options.filename ?? getMiaixzDownloadFilename(response.headers);
      const contentType = response.headers.get("content-type") ?? undefined;
      return {
        blob: response.data,
        ...(filename === undefined ? {} : { filename }),
        ...(contentType === undefined ? {} : { contentType }),
      };
    } catch (cause) {
      if (isMiaixzSdkError(cause)) throw cause;
      throw new MiaixzSdkError(this.#translate("sdk.error.file.download"), {
        code: "FILE_DOWNLOAD_FAILED",
        cause,
      });
    }
  }
}

/**
 * Creates a high-level file client around an existing API client.
 *
 * @param api - Configured API client used for file requests.
 * @param options - Optional file-client adapters.
 * @returns Configured high-level file client.
 * @public
 */
export function createMiaixzFileClient(
  api: MiaixzApiClient,
  options?: MiaixzFileClientOptions,
): MiaixzFileClient {
  return new MiaixzFileClient(api, options);
}

/**
 * Triggers a browser download for an in-memory blob; no-ops during SSR.
 *
 * @param blob - Binary content to download.
 * @param filename - Filename presented to the browser.
 * @param targetDocument - Optional document used to create the download link.
 * @public
 */
export function saveMiaixzBlob(
  blob: Blob,
  filename: string,
  targetDocument: Document | undefined = typeof document === "undefined" ? undefined : document,
): void {
  if (!targetDocument || typeof URL === "undefined") return;
  const url = URL.createObjectURL(blob);
  const anchor = targetDocument.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  targetDocument.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
