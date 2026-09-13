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

import { useCallback } from "react";
import type { ForwardedRef, MutableRefObject, RefCallback } from "react";

/**
 * Assigns a value to either a callback ref or a mutable object ref.
 *
 * @typeParam T - Value stored by the React ref.
 * @param ref - React ref that receives the value.
 * @param value - Value assigned to the ref.
 */
function assignRef<T>(ref: ForwardedRef<T>, value: T): void {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    (ref as MutableRefObject<T>).current = value;
  }
}

/**
 * Merges two callback or object refs into one stable React ref callback.
 *
 * @typeParam T - Value stored by the React refs.
 * @param firstRef - First React ref that receives the value.
 * @param secondRef - Second React ref that receives the value.
 * @returns A ref callback that updates both source refs.
 */
export function useMergedRef<T>(
  firstRef: ForwardedRef<T>,
  secondRef: ForwardedRef<T>,
): RefCallback<T> {
  return useCallback(
    (value: T) => {
      assignRef(firstRef, value);
      assignRef(secondRef, value);
    },
    [firstRef, secondRef],
  );
}
