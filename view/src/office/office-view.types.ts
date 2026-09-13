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
 * Identifies the editor family selected by ONLYOFFICE Docs.
 *
 * @public
 */
export type OnlyOfficeDocumentType = "word" | "cell" | "slide" | "pdf" | "diagram";

/**
 * Describes an authorized document passed to ONLYOFFICE Docs.
 *
 * @public
 */
export type OnlyOfficeDocument = Readonly<Record<string, unknown>> & {
  /**
   * Supplies the document extension without a leading period.
   */
  readonly fileType: string;
  /**
   * Supplies a stable version key understood by the document server.
   */
  readonly key: string;
  /**
   * Supplies the display title.
   */
  readonly title: string;
  /**
   * Supplies the document-server-accessible file URL.
   */
  readonly url: string;
};

/**
 * Defines the browser-safe ONLYOFFICE editor configuration.
 *
 * The application or preview service must apply permissions and create the optional token.
 *
 * @public
 */
export type OnlyOfficeEditorConfig = Readonly<Record<string, unknown>> & {
  /**
   * Supplies the authorized document descriptor.
   */
  readonly document: OnlyOfficeDocument;
  /**
   * Selects the editor family.
   */
  readonly documentType: OnlyOfficeDocumentType;
  /**
   * Supplies a server-generated signature when JWT validation is enabled.
   */
  readonly token?: string;
};

/**
 * Defines localized status labels for the Office preview.
 *
 * @public
 */
export interface OfficeViewLabels {
  /** Labels the Office toolbar. */
  readonly toolbar: string;
  /**
   * Announces editor loading.
   */
  readonly loading: string;
  /**
   * Announces an unsuccessful editor initialization.
   */
  readonly error: string;
}

/** Defines native properties for stable OfficeView slots. @public */
export interface OfficeViewSlotProps {
  readonly toolbar?: Omit<
    ComponentPropsWithoutRef<"div">,
    "children" | "role" | "aria-label"
  >;
  readonly editor?: Omit<ComponentPropsWithoutRef<"div">, "children" | "id">;
  readonly status?: Omit<
    ComponentPropsWithoutRef<"div">,
    "children" | "role" | "aria-live"
  >;
}

/**
 * Configures an ONLYOFFICE Docs preview surface.
 *
 * @public
 */
export interface OfficeViewProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "children" | "onError"
> {
  /**
   * Supplies the public base URL of an existing ONLYOFFICE Docs deployment.
   */
  readonly documentServerUrl: string;
  /**
   * Supplies the externally authorized and, when required, already-signed editor configuration.
   */
  readonly config: OnlyOfficeEditorConfig;
  /**
   * Adds a Content Security Policy nonce to the dynamically loaded API script.
   */
  readonly scriptNonce?: string;
  /**
   * Overrides built-in English labels.
   */
  readonly labels?: Partial<OfficeViewLabels>;
  /**
   * Adds application-owned actions without assigning security meaning to their visibility.
   */
  readonly actions?: ReactNode;
  /** Passes native properties to stable internal slots. */
  readonly slotProps?: OfficeViewSlotProps;
  /**
   * Runs after the editor instance is created.
   */
  readonly onReady?: () => void;
  /**
   * Receives script-loading and editor initialization failures.
   */
  readonly onError?: (error: Error) => void;
}
