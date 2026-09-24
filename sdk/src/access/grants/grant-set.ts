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
 * Provides immutable client-side evaluation of resolved grants and roles.
 */

import { MiaixzSdkError } from "../../errors/errors.js";
import type { MiaixzGrantSnapshot, MiaixzPermissionCode } from "./grant.types.js";
import { isMiaixzGrantSnapshot, matchesGrant } from "./grant-validation.js";

/**
 * Evaluates immutable allow, deny, and role snapshots on the client.
 *
 * @public
 */
export class MiaixzGrantSet {
  readonly #allowed: readonly MiaixzPermissionCode[];
  readonly #denied: readonly MiaixzPermissionCode[];

  /**
   * Immutable role identifiers included in the grant snapshot.
   */
  readonly roles: ReadonlySet<string>;

  /**
   * Creates an immutable grant evaluator.
   *
   * @param snapshot - Permission grants and roles supplied by the backend.
   */
  constructor(snapshot: MiaixzGrantSnapshot) {
    if (!isMiaixzGrantSnapshot(snapshot)) {
      throw new MiaixzSdkError({ code: "GRANTS_INVALID" });
    }
    this.#allowed = [...new Set(snapshot.allowed)];
    this.#denied = [...new Set(snapshot.denied ?? [])];
    this.roles = new Set(snapshot.roles ?? []);
  }

  /**
   * Determines whether one permission is allowed.
   *
   * @param permission - Permission code to evaluate.
   * @returns Whether one permission is allowed; explicit deny always wins.
   */
  can(permission: MiaixzPermissionCode): boolean {
    if (this.#denied.some((grant) => matchesGrant(grant, permission))) return false;
    return this.#allowed.some((grant) => matchesGrant(grant, permission));
  }

  /**
   * Determines whether any requested permission is allowed.
   *
   * @param permissions - Permission codes to evaluate.
   * @returns Whether at least one requested permission is allowed.
   */
  canAny(permissions: readonly MiaixzPermissionCode[]): boolean {
    return permissions.some((permission) => this.can(permission));
  }

  /**
   * Determines whether all requested permissions are allowed.
   *
   * @param permissions - Permission codes to evaluate.
   * @returns Whether every requested permission is allowed.
   */
  canAll(permissions: readonly MiaixzPermissionCode[]): boolean {
    return permissions.every((permission) => this.can(permission));
  }

  /**
   * Determines whether a role is present in the snapshot.
   *
   * @param role - Role identifier to evaluate.
   * @returns Whether the snapshot includes the specified role.
   */
  hasRole(role: string): boolean {
    return this.roles.has(role);
  }
}

/**
 * Creates an immutable grant evaluator from a backend snapshot.
 *
 * @param snapshot - Permission grants and roles supplied by the backend.
 * @returns Immutable grant evaluator.
 * @public
 */
export function createMiaixzGrantSet(snapshot: MiaixzGrantSnapshot): MiaixzGrantSet {
  return new MiaixzGrantSet(snapshot);
}
