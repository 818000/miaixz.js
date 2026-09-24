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
 * Exposes the stable cross-layer contracts and primitives entry point.
 */

export type { DocumentEvent, ViewerCapabilities, ViewerCommand } from "./contracts/capability.js";
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
} from "./contracts/document.js";
export type {
  DriverContext,
  ProbeContext,
  ProbeResult,
  ViewerDriver,
  ViewerProgress,
} from "./contracts/driver.js";
export type {
  FormatDescriptor,
  FormatDecision,
  FormatDriverId,
  FormatEvidence,
  FormatManifestRecord,
  FormatParityRecord,
  SupportLevel,
} from "./contracts/format.js";
export type { ResourceBudget } from "./contracts/resource-budget.js";
export type {
  FileResourceProvider,
  FileViewSource,
  FileViewSourceDescriptor,
  RandomAccessResource,
  RelatedResourceRequest,
  RemoteFileSource,
} from "./contracts/source.js";
export { documentTitle, stableDocumentId } from "./document/document-identity.js";
export { MiaixzViewError } from "./errors/view-error.js";
export type { MiaixzViewErrorCode } from "./errors/view-error.js";
export { ViewerError } from "./errors/viewer-error.js";
export type {
  ViewerErrorCategory,
  ViewerErrorCode,
  ViewerErrorStage,
  ViewerRecoveryAction,
} from "./errors/viewer-error.js";
