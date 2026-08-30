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
