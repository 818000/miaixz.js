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
 * Asserts cookie/bearer option exclusivity and their distinct public SDK types.
 */

import type { MiaixzPersistentSessionStorage } from "../src/access/session/index.js";
import type { MiaixzEventBus, MiaixzSdkEventMap } from "../src/runtime/events/index.js";
import type { MiaixzBearerSdk, MiaixzCookieSdk, MiaixzSdkOptions } from "../src/sdk.js";
import type { MiaixzSdkConfig } from "../src/types.js";

/**
 * Constrains a compile-time contract assertion to the literal true type.
 */
type Expect<T extends true> = T;
/**
 * Checks whether one type can be assigned to another without creating a runtime value.
 */
type IsAssignable<From, To> = From extends To ? true : false;
/**
 * Checks bidirectional type identity for compile-time contract assertions.
 */
type IsExactly<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2
    ? true
    : false;

/**
 * Shared required SDK options supplied by the authentication-mode type tests.
 */
interface RequiredOptions {
  readonly appId: string;
  readonly config: MiaixzSdkConfig;
}

/**
 * Asserts that cookie authentication accepts its permitted SDK options.
 */
type CookieOptionsAreAccepted = Expect<
  IsAssignable<RequiredOptions & { readonly authMode?: "cookie" }, MiaixzSdkOptions>
>;
/**
 * Asserts that bearer authentication accepts its permitted SDK options.
 */
type BearerOptionsAreAccepted = Expect<
  IsAssignable<RequiredOptions & { readonly authMode: "bearer" }, MiaixzSdkOptions>
>;
/**
 * Asserts that cookie mode excludes bearer-session persistence settings.
 */
type CookieSessionPersistenceIsRejected = Expect<
  IsExactly<
    IsAssignable<
      RequiredOptions & {
        readonly authMode: "cookie";
        readonly sessionPersistence: MiaixzPersistentSessionStorage;
      },
      MiaixzSdkOptions
    >,
    false
  >
>;
/**
 * Asserts that cookie mode excludes bearer-session refresh settings.
 */
type ImplicitCookieSessionRefreshIsRejected = Expect<
  IsExactly<
    IsAssignable<
      RequiredOptions & { readonly refreshSession: () => Promise<never> },
      MiaixzSdkOptions
    >,
    false
  >
>;
/**
 * Asserts that bearer authentication excludes cookie-only CSRF configuration.
 */
type BearerCsrfIsRejected = Expect<
  IsExactly<
    IsAssignable<
      RequiredOptions & {
        readonly authMode: "bearer";
        readonly csrfTokenProvider: () => string;
      },
      MiaixzSdkOptions
    >,
    false
  >
>;
/**
 * Asserts that event channel and injected event source cannot both be configured.
 */
type EventSourcesAreExclusive = Expect<
  IsExactly<
    IsAssignable<
      RequiredOptions & {
        readonly eventBus: MiaixzEventBus<MiaixzSdkEventMap>;
        readonly eventChannel: true;
      },
      MiaixzSdkOptions
    >,
    false
  >
>;
/**
 * Asserts that a cookie-mode SDK exposes no bearer-session manager.
 */
type CookieHasNoSessionProperty = Expect<
  IsExactly<"session" extends keyof MiaixzCookieSdk ? true : false, false>
>;
/**
 * Asserts that a bearer-mode SDK exposes its session manager.
 */
type BearerHasSessionProperty = Expect<
  IsExactly<"session" extends keyof MiaixzBearerSdk ? true : false, true>
>;

/**
 * Union collecting the compile-time authentication-mode invariants.
 */
export type AuthModeContractAssertions =
  | CookieOptionsAreAccepted
  | BearerOptionsAreAccepted
  | CookieSessionPersistenceIsRejected
  | ImplicitCookieSessionRefreshIsRejected
  | BearerCsrfIsRejected
  | EventSourcesAreExclusive
  | CookieHasNoSessionProperty
  | BearerHasSessionProperty;
