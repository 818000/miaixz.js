import type { MiaixzIdentifier } from "./api.js";

/**
 * Describes identity fields commonly used when displaying a user.
 *
 * @public
 */
export interface MiaixzUserSummary {
  /**
   * Unique identifier of the user.
   */
  id: MiaixzIdentifier;

  /**
   * Name presented in the user interface.
   */
  displayName: string;

  /**
   * Optional account name used for sign-in or lookup.
   */
  username?: string;

  /**
   * Optional URL of the user's avatar image.
   */
  avatarUrl?: string;
}

/**
 * Describes a user and their account preferences.
 *
 * @public
 */
export interface MiaixzUser extends MiaixzUserSummary {
  /**
   * Optional email address associated with the user.
   */
  email?: string;

  /**
   * Optional locale preferred by the user.
   */
  locale?: string;

  /**
   * Optional IANA timezone preferred by the user.
   */
  timezone?: string;

  /**
   * Indicates whether the user account is active.
   */
  active: boolean;
}
