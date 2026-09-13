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
