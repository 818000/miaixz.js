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

import { useSyncExternalStore } from "react";

const compactActionQuery = "(max-width: 767px)";
const subscribers = new Set<() => void>();
let mediaQuery: MediaQueryList | undefined;

/**
 * Returns the lazily created shared media query.
 *
 * @returns The shared media query in browser environments.
 */
function getMediaQuery(): MediaQueryList | undefined {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
  mediaQuery ??= window.matchMedia(compactActionQuery);
  return mediaQuery;
}

/**
 * Notifies every action layout subscribed to the shared breakpoint.
 */
function notifySubscribers(): void {
  for (const subscriber of subscribers) subscriber();
}

/**
 * Subscribes one React store consumer.
 *
 * @param subscriber - Store change callback.
 * @returns Cleanup callback.
 */
function subscribe(subscriber: () => void): () => void {
  const query = getMediaQuery();
  subscribers.add(subscriber);
  if (subscribers.size === 1) query?.addEventListener("change", notifySubscribers);
  return () => {
    subscribers.delete(subscriber);
    if (subscribers.size === 0) query?.removeEventListener("change", notifySubscribers);
  };
}

/**
 * Returns the current client breakpoint state.
 *
 * @returns Whether the shared query currently matches.
 */
function getSnapshot(): boolean {
  return getMediaQuery()?.matches ?? false;
}

/**
 * Returns the deterministic server breakpoint state.
 *
 * @returns False during server rendering.
 */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Shares one viewport breakpoint listener across every action layout.
 *
 * @returns Whether compact action density is active.
 * @internal
 */
export function useMiaixzCompactActions(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
