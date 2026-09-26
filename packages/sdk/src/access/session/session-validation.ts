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
 * Validates session data, expiry boundaries, equality, and status events.
 */

import type { MiaixzUserSummary } from "../../models/user.js";
import type { MiaixzSessionStatusEvent } from "../../runtime/events/event-types.js";
import { isRecord } from "../../shared/object.js";
import type { MiaixzSession } from "./session.types.js";

/**
 * Defines the default refresh safety window in seconds.
 */
export const DEFAULT_SESSION_EXPIRATION_LEEWAY_SECONDS = 30;

/**
 * Determines whether a value is a valid user summary for a session.
 *
 * @param value - Value to inspect.
 * @returns Whether `value` is a valid immutable user summary for a session.
 */
function isUserSummary(value: unknown): value is MiaixzUserSummary {
  if (!isRecord(value) || typeof value.id !== "string" || !value.id.trim()) return false;
  if (typeof value.displayName !== "string" || !value.displayName.trim()) return false;
  if (value.username !== undefined && typeof value.username !== "string") return false;
  if (value.avatarUrl !== undefined && typeof value.avatarUrl !== "string") return false;
  return true;
}

/**
 * Determines whether a value is a usable session.
 *
 * @param value - Value to inspect.
 * @returns Whether `value` is a usable session.
 * @public
 */
export function isMiaixzSession(value: unknown): value is MiaixzSession {
  if (!isRecord(value) || typeof value.accessToken !== "string" || !value.accessToken.trim()) {
    return false;
  }
  if (value.refreshToken !== undefined && typeof value.refreshToken !== "string") return false;
  if (value.tokenType !== undefined && typeof value.tokenType !== "string") return false;
  if (
    value.expired !== undefined &&
    (typeof value.expired !== "number" || !Number.isSafeInteger(value.expired) || value.expired < 0)
  ) {
    return false;
  }
  if (value.user !== undefined && !isUserSummary(value.user)) return false;
  return true;
}

/**
 * Checks token expiry with a configurable refresh safety window.
 *
 * @param session - Session to inspect.
 * @param now - Current Unix time in milliseconds.
 * @param leewaySeconds - Seconds before expiry that count as expired.
 * @returns Whether the session has expired within the safety window.
 * @public
 */
export function isMiaixzSessionExpired(
  session: Readonly<MiaixzSession>,
  now = Date.now(),
  leewaySeconds = DEFAULT_SESSION_EXPIRATION_LEEWAY_SECONDS,
): boolean {
  return session.expired !== undefined && session.expired <= now + leewaySeconds * 1000;
}

/**
 * Compares persisted session values to suppress duplicate event delivery.
 *
 * @param first - First session to compare.
 * @param second - Second session to compare.
 * @returns Whether both session values contain equivalent data.
 */
export function areSessionsEqual(
  first: Readonly<MiaixzSession> | undefined,
  second: Readonly<MiaixzSession> | undefined,
): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

/**
 * Determines whether an untrusted event is a supported session-status signal.
 *
 * @param value - Event payload to inspect.
 * @returns Whether the payload contains only a recognized session status.
 */
export function isSessionStatusEvent(value: unknown): value is MiaixzSessionStatusEvent {
  return (
    isRecord(value) &&
    (value.status === "authenticated" || value.status === "anonymous") &&
    Object.keys(value).length === 1
  );
}
