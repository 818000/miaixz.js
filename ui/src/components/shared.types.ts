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
 * Defines semantic feedback tones shared by Miaixz components.
 *
 * @public
 */
export type MiaixzFeedbackTone = "neutral" | "info" | "success" | "warning" | "danger";

/**
 * Defines semantic and categorical visual tones shared by data components.
 *
 * @public
 */
export type MiaixzVisualTone =
  | "brand"
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "data-1"
  | "data-2"
  | "data-3"
  | "data-4"
  | "data-5"
  | "data-6"
  | "data-7"
  | "data-8";

/**
 * Defines semantic component sizes shared by Miaixz components.
 *
 * @public
 */
export type MiaixzComponentSize = "small" | "medium" | "large";

/**
 * Defines the form-control state rendered by component previews and visual
 * regression fixtures. Runtime semantics continue to come from native control
 * properties such as `disabled`, `readOnly`, and `aria-invalid`.
 *
 * @public
 */
export type MiaixzFormPreviewState =
  "default" | "filled" | "hover" | "focus" | "invalid" | "readonly" | "disabled";

/**
 * Adds a non-semantic state override for documentation and visual testing.
 * Products should normally omit this property and rely on real interaction.
 *
 * @public
 */
export interface MiaixzFormPreviewProps {
  /**
   * Renders one form state without changing native semantics.
   */
  previewState?: MiaixzFormPreviewState;
}
