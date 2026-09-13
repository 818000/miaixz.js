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

import type { MiaixzAppearanceSettings } from "./appearance.js";

/**
 * Represents an execution environment recognized by the SDK.
 *
 * @public
 */
export type MiaixzEnvironment = "development" | "test" | "staging" | "production";

/**
 * Represents a serializable feature-flag value.
 *
 * @public
 */
export type MiaixzFeatureValue = boolean | string | number;

/**
 * Configures a Miaixz SDK instance.
 *
 * @public
 */
export interface MiaixzSdkConfig {
  /**
   * Base URL used for API requests.
   */
  apiBaseUrl: string;

  /**
   * Environment in which the SDK is running.
   */
  environment: MiaixzEnvironment;

  /**
   * Optional application release identifier included in diagnostics.
   */
  release?: string;

  /**
   * Optional service names mapped to service base URLs.
   */
  services?: Readonly<Record<string, string>>;

  /**
   * Optional feature flags supplied by the host application.
   */
  features?: Readonly<Record<string, MiaixzFeatureValue>>;

  /**
   * Optional global appearance preferences.
   */
  appearance?: MiaixzAppearanceSettings;

  /**
   * Optional default request timeout in milliseconds.
   */
  requestTimeoutMs?: number;
}
