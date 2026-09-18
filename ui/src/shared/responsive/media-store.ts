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

export interface UseMediaOptions {
  readonly defaultMatches?: boolean;
}

interface MediaStore {
  readonly getSnapshot: () => boolean;
  readonly subscribe: (listener: () => void) => () => void;
}

const stores = new Map<string, MediaStore>();

/**
 * Returns the shared browser subscription for one media query.
 *
 * @param query - Media query string.
 * @param options - Server fallback options.
 * @returns Shared subscription store.
 */
export function getMediaStore(query: string, options: UseMediaOptions): MediaStore {
  const fallback = options.defaultMatches ?? false;
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return { getSnapshot: () => fallback, subscribe: () => () => undefined };
  }
  const existing = stores.get(query);
  if (existing !== undefined) return existing;
  const media = window.matchMedia(query);
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  const store: MediaStore = {
    getSnapshot: () => media.matches,
    subscribe: (listener) => {
      if (listeners.size === 0) media.addEventListener("change", notify);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          media.removeEventListener("change", notify);
          stores.delete(query);
        }
      };
    },
  };
  stores.set(query, store);
  return store;
}
