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

import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * Defines the accepted in-memory and remote PDF sources.
 *
 * @public
 */
export type PdfViewSource = string | URL | ArrayBuffer | Uint8Array;

/**
 * Describes a successfully loaded PDF document without exposing PDF.js objects.
 *
 * @public
 */
export interface PdfDocumentInfo {
  /**
   * Reports the number of pages in the document.
   */
  readonly pages: number;
  /**
   * Reports the PDF.js document fingerprints.
   */
  readonly fingerprints: readonly string[];
}

/**
 * Defines localized labels used by the PDF preview.
 *
 * @public
 */
export interface PdfViewLabels {
  /** Labels the PDF toolbar. */
  readonly toolbar: string;
  /**
   * Announces document loading.
   */
  readonly loading: string;
  /**
   * Announces an unsuccessful preview.
   */
  readonly error: string;
  /**
   * Labels the previous-page command.
   */
  readonly previousPage: string;
  /**
   * Labels the next-page command.
   */
  readonly nextPage: string;
  /**
   * Labels the zoom-in command.
   */
  readonly zoomIn: string;
  /**
   * Labels the zoom-out command.
   */
  readonly zoomOut: string;
  /**
   * Formats the current and total page values.
   *
   * @param current - Current one-based page number.
   * @param total - Total document page count.
   * @returns Localized page status.
   */
  readonly page: (current: number, total: number) => string;
}

/** Defines native properties for stable PdfView slots. @public */
export interface PdfViewSlotProps {
  readonly toolbar?: Omit<
    ComponentPropsWithoutRef<"div">,
    "children" | "role" | "aria-label"
  >;
  readonly stage?: Omit<ComponentPropsWithoutRef<"div">, "children">;
  readonly canvas?: Omit<
    ComponentPropsWithoutRef<"canvas">,
    "children" | "role" | "aria-label"
  >;
  readonly status?: Omit<
    ComponentPropsWithoutRef<"div">,
    "children" | "role" | "aria-live"
  >;
}

/**
 * Configures a PDF.js preview surface.
 *
 * @public
 */
export interface PdfViewProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "children" | "onError"
> {
  /**
   * Supplies an authorized URL or an in-memory PDF.
   */
  readonly src: PdfViewSource;
  /**
   * Selects the first page rendered after loading.
   *
   * @defaultValue `1`
   */
  readonly initialPage?: number;
  /**
   * Sets the initial PDF scale.
   *
   * @defaultValue `1`
   */
  readonly initialScale?: number;
  /**
   * Passes request headers to PDF.js for remote URLs.
   */
  readonly httpHeaders?: Readonly<Record<string, string>>;
  /**
   * Enables credentialed PDF.js URL requests.
   *
   * @defaultValue `false`
   */
  readonly withCredentials?: boolean;
  /**
   * Overrides built-in English labels.
   */
  readonly labels?: Partial<PdfViewLabels>;
  /**
   * Adds application-owned actions without assigning security meaning to their visibility.
   */
  readonly actions?: ReactNode;
  /** Passes native properties to stable internal slots. */
  readonly slotProps?: PdfViewSlotProps;
  /**
   * Receives serializable document metadata after loading.
   */
  readonly onDocumentLoad?: (document: PdfDocumentInfo) => void;
  /**
   * Receives loading or rendering failures.
   */
  readonly onError?: (error: Error) => void;
}
