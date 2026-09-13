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

import { useEffect, useRef, type RefObject } from "react";

/**
 * Lists native form-associated controls supported by the reset observer.
 */
export type MiaixzFormControl =
  HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/**
 * Runs a stable callback after the owning native form completes a reset.
 *
 * @param controlRef - Native control whose live form owner is observed.
 * @param onReset - Callback invoked in a microtask after native reset state commits.
 * @internal
 */
export function useFormReset(
  controlRef: RefObject<MiaixzFormControl | null>,
  onReset: () => void,
): void {
  const callbackRef = useRef(onReset);
  useEffect(() => {
    callbackRef.current = onReset;
  }, [onReset]);
  useEffect(() => {
    const form = controlRef.current?.form;
    if (form === null || form === undefined) return undefined;
    const handleReset = () => queueMicrotask(() => callbackRef.current());
    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, [controlRef]);
}
