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
 * Describes one non-native control participating in native form validation.
 */
export interface MiaixzFormValidationControl {
  /**
   * Supplies the control's DOM position and focus target.
   */
  readonly element: HTMLElement;
  /**
   * Validates current state and applies the component's invalid UI.
   */
  readonly validate: () => boolean;
  /**
   * Restores component validation state after native form reset.
   */
  readonly reset: () => void;
  /**
   * Focuses the control after an invalid submission.
   */
  readonly focus?: () => void;
}

interface MiaixzFormValidationRegistry {
  /**
   * Contains currently mounted controls.
   */
  readonly controls: Set<MiaixzFormValidationControl>;
  /**
   * Validates controls during captured submission.
   */
  readonly onSubmit: (event: SubmitEvent) => void;
  /**
   * Restores controls after native reset.
   */
  readonly onReset: () => void;
}

/**
 * Stores the one validation registry owned by each form.
 */
const registries = new WeakMap<HTMLFormElement, MiaixzFormValidationRegistry>();

/**
 * Orders registered controls by their actual current document position.
 *
 * @param controls - Registered controls to order.
 * @returns Controls in current DOM order.
 */
function orderControls(
  controls: ReadonlySet<MiaixzFormValidationControl>,
): MiaixzFormValidationControl[] {
  return [...controls].sort((left, right) => {
    if (left.element === right.element) return 0;
    const position = left.element.compareDocumentPosition(right.element);
    if ((position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0) return -1;
    if ((position & Node.DOCUMENT_POSITION_PRECEDING) !== 0) return 1;
    return 0;
  });
}

/**
 * Creates the sole submit/reset listener pair for one form.
 *
 * @param form - Form receiving the listener pair.
 * @returns The new per-form registry.
 */
function createRegistry(form: HTMLFormElement): MiaixzFormValidationRegistry {
  const controls = new Set<MiaixzFormValidationControl>();
  const onSubmit = (event: SubmitEvent) => {
    let firstInvalid: MiaixzFormValidationControl | undefined;
    for (const control of orderControls(controls)) {
      if (!control.validate() && firstInvalid === undefined) firstInvalid = control;
    }
    if (firstInvalid === undefined) return;
    event.preventDefault();
    const invalidControl = firstInvalid;
    (invalidControl.focus ?? (() => invalidControl.element.focus({ preventScroll: true })))();
  };
  const onReset = () => {
    queueMicrotask(() => {
      for (const control of controls) control.reset();
    });
  };
  form.addEventListener("submit", onSubmit, true);
  form.addEventListener("reset", onReset, true);
  return { controls, onSubmit, onReset };
}

/**
 * Registers one non-native control with its native form owner.
 *
 * @param form - Native form receiving the control's submission.
 * @param control - Validation, reset, focus, and DOM-order adapter.
 * @returns An idempotent unregister callback.
 * @internal
 */
export function registerMiaixzFormValidationControl(
  form: HTMLFormElement,
  control: MiaixzFormValidationControl,
): () => void {
  let registry = registries.get(form);
  if (registry === undefined) {
    registry = createRegistry(form);
    registries.set(form, registry);
  }
  registry.controls.add(control);
  let registered = true;
  return () => {
    if (!registered) return;
    registered = false;
    const current = registries.get(form);
    if (current === undefined) return;
    current.controls.delete(control);
    if (current.controls.size !== 0) return;
    form.removeEventListener("submit", current.onSubmit, true);
    form.removeEventListener("reset", current.onReset, true);
    registries.delete(form);
  };
}

/**
 * Resolves a non-native control's form owner with native `form` attribute precedence.
 *
 * @param element - Mounted control root.
 * @param formId - Optional explicit native form identifier.
 * @returns The matching form, nearest ancestor form, or null.
 * @internal
 */
export function resolveMiaixzFormOwner(
  element: HTMLElement,
  formId: string | undefined,
): HTMLFormElement | null {
  if (formId !== undefined) {
    const candidate = element.ownerDocument.getElementById(formId);
    return candidate instanceof HTMLFormElement ? candidate : null;
  }
  return element.closest("form");
}
