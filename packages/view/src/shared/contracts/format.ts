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
 * Defines format support, evidence, and detection decision contracts.
 */

/**
 * Describes the stable support levels used by the public format matrix.
 */
export type SupportLevel = "R0" | "R1" | "R2" | "R3" | "R4" | "R5";

/**
 * Identifies a built-in or application-provided format driver.
 *
 * String identifiers intentionally remain open so consumers can register custom formats without
 * modifying this package's type declarations.
 */
export type FormatDriverId = string;

/**
 * Describes one independently installable format module.
 */
export interface FormatDescriptor {
  readonly schemaVersion: 1;
  readonly id: FormatDriverId;
  readonly label: string;
  readonly category: string;
  readonly family?: string;
  readonly extensions: readonly string[];
  readonly mimeTypes: readonly string[];
  readonly implementation: "ready" | "recognized";
  readonly entry?: string;
}

/**
 * Provides the single machine-readable source of truth for one extension.
 */
export interface FormatManifestRecord {
  readonly extension: string;
  readonly mimeTypes: readonly string[];
  readonly driver: FormatDriverId;
  readonly upstreamLevel: SupportLevel;
  readonly targetLevel: SupportLevel;
  readonly milestone: `P${number}`;
}

/**
 * Describes audited reference, target, and current support for one extension.
 */
export interface FormatParityRecord {
  readonly formatId: string;
  readonly extension: string;
  readonly driver: FormatDriverId;
  readonly referenceLevel: SupportLevel;
  readonly targetLevel: SupportLevel;
  readonly currentLevel: SupportLevel;
  readonly implementation: "browser-native" | "local-parser" | "recognized";
  readonly milestone: `P${number}`;
}

/**
 * Captures one independently scored format-identification signal.
 */
export interface FormatEvidence {
  readonly kind: "extension" | "mime" | "signature" | "container";
  readonly value: string;
  readonly score: number;
}

/**
 * Reports a deterministic format-selection result.
 */
export interface FormatDecision {
  readonly extension?: string;
  readonly mimeType?: string;
  readonly driver?: FormatDriverId;
  readonly confidence: number;
  readonly evidence: readonly FormatEvidence[];
  readonly conflicts: readonly FormatDriverId[];
}
