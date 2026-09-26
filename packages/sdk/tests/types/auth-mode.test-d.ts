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
 * Implements the auth mode test d module.
 */

import type { MiaixzPersistentSessionStorage } from "../../src/access/session/index.js";
import type { MiaixzEventBus, MiaixzSdkEventMap } from "../../src/runtime/events/index.js";
import type { MiaixzBearerSdk, MiaixzCookieSdk, MiaixzSdkOptions } from "../../src/sdk.js";
import type { MiaixzSdkConfig } from "../../src/types.js";

type Expect<T extends true> = T;
type IsAssignable<From, To> = From extends To ? true : false;
type IsExactly<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2
    ? true
    : false;

interface RequiredOptions {
  readonly appId: string;
  readonly config: MiaixzSdkConfig;
}

type CookieOptionsAreAccepted = Expect<
  IsAssignable<RequiredOptions & { readonly authMode?: "cookie" }, MiaixzSdkOptions>
>;
type BearerOptionsAreAccepted = Expect<
  IsAssignable<RequiredOptions & { readonly authMode: "bearer" }, MiaixzSdkOptions>
>;
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
type ImplicitCookieSessionRefreshIsRejected = Expect<
  IsExactly<
    IsAssignable<
      RequiredOptions & { readonly refreshSession: () => Promise<never> },
      MiaixzSdkOptions
    >,
    false
  >
>;
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
type CookieHasNoSessionProperty = Expect<
  IsExactly<"session" extends keyof MiaixzCookieSdk ? true : false, false>
>;
type BearerHasSessionProperty = Expect<
  IsExactly<"session" extends keyof MiaixzBearerSdk ? true : false, true>
>;

export type AuthModeContractAssertions =
  | CookieOptionsAreAccepted
  | BearerOptionsAreAccepted
  | CookieSessionPersistenceIsRejected
  | ImplicitCookieSessionRefreshIsRejected
  | BearerCsrfIsRejected
  | EventSourcesAreExclusive
  | CookieHasNoSessionProperty
  | BearerHasSessionProperty;
