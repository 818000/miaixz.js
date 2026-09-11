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

import { Button } from "../button/index.js";
import type {
  ActionCommandTarget,
  ActionDescriptor,
  FormActionsProps,
  PrimaryActionDescriptor,
} from "./action.types.js";

/**
 * Defines a resolved command action accepted by form footers.
 */
type FormCommandAction = ActionDescriptor & ActionCommandTarget;

/**
 * Defines the resolved primary command accepted by form footers.
 */
type PrimaryFormCommandAction = PrimaryActionDescriptor & ActionCommandTarget;

/**
 * Rejects navigation targets in form footers.
 *
 * @param action - Candidate form action.
 */
function requireCommand(action: ActionDescriptor): asserts action is FormCommandAction {
  if ("href" in action && action.href !== undefined) {
    throw new TypeError("FormActions only accepts command actions");
  }
}

/**
 * Renders the standard cancel and submit footer for forms and overlays.
 *
 * @param root0 - Form action properties.
 * @param root0.cancel - Secondary cancel command.
 * @param root0.submit - Primary submit command.
 * @param root0.dirty - Whether the form has changes to save.
 * @param root0.fixed - Whether the footer remains sticky.
 * @param root0.danger - Whether the final submission is destructive.
 * @returns The standardized form footer.
 * @public
 */
export function FormActions({
  cancel,
  submit,
  dirty = true,
  fixed = false,
  danger = false,
}: FormActionsProps) {
  requireCommand(cancel);
  requireCommand(submit);
  const loading = submit.loading === true;
  const submitAction = submit as PrimaryFormCommandAction;

  return (
    <div className="miaixz-form-actions" data-fixed={fixed || undefined}>
      <Button
        disabled={cancel.disabled === true || loading}
        onClick={cancel.onAction}
        startIcon={cancel.icon}
        variant="secondary"
      >
        {cancel.label}
      </Button>
      <Button
        disabled={submitAction.disabled === true || !dirty}
        loading={loading}
        onClick={submitAction.onAction}
        startIcon={submitAction.icon}
        variant={danger ? "danger" : "primary"}
      >
        {submitAction.label}
      </Button>
    </div>
  );
}
