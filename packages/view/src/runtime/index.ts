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

/**
 * Exposes the framework-neutral runtime entry point.
 */

export { browserBaseline, detectBrowserSupport } from "./browser-support.js";
export type { BrowserSupport } from "./browser-support.js";
export type {
  DocumentEvent,
  ViewerCapabilities,
  ViewerCommand,
} from "../shared/contracts/capability.js";
export { ViewerController, openViewerDocument } from "./viewer-controller.js";
export type {
  OpenDocumentOptions,
  OpenedDocument,
  ViewerControllerState,
} from "./viewer-controller.js";
export {
  detectFormat,
  getFormatDescriptors,
  getFormatManifest,
  getFormatParityRecords,
} from "./detect-format.js";
export type {
  FormatDescriptor,
  FormatDecision,
  FormatDriverId,
  FormatEvidence,
  FormatManifestRecord,
  FormatParityRecord,
  SupportLevel,
} from "../shared/contracts/format.js";
export type { DriverContext, ViewerDriver, ViewerProgress } from "../shared/contracts/driver.js";
export { MiaixzViewError } from "../shared/errors/view-error.js";
export type { MiaixzViewErrorCode } from "../shared/errors/view-error.js";
export { ViewerError } from "../shared/errors/viewer-error.js";
export type {
  ViewerErrorCategory,
  ViewerErrorCode,
  ViewerErrorStage,
  ViewerRecoveryAction,
} from "../shared/errors/viewer-error.js";
export type {
  ArchiveDocument,
  BinaryDocument,
  DiagramEdge,
  DiagramGraph,
  DiagramNode,
  DiagramWarning,
  DrawingScene,
  DrawingShape,
  FlowDocument,
  MediaDocument,
  PagedDocument,
  ParseOutcome,
  Rectangle,
  SceneDocument,
  SceneMesh,
  SceneNode,
  SpreadsheetDocument,
  TextDocument,
  ViewerDocument,
} from "../shared/contracts/document.js";
export { DriverRegistry } from "./driver-registry.js";
export { createDefaultRegistry } from "./default-registry.js";
export {
  defaultResourceBudget,
  hardResourceBudget,
  resolveResourceBudget,
} from "./resource-budget.js";
export type { ResourceBudget } from "../shared/contracts/resource-budget.js";
export { DefaultFileResourceProvider } from "./file-source.js";
export type {
  FileResourceProvider,
  FileViewSource,
  FileViewSourceDescriptor,
  RandomAccessResource,
  RelatedResourceRequest,
  RemoteFileSource,
} from "../shared/contracts/source.js";
