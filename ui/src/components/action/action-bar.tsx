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

import { useMiaixzCompactActions } from "../../shared/responsive/index.js";
import { Button, ButtonLink } from "../button/index.js";
import { ActionText } from "./action-text.js";
import type { ActionBarProps, PrimaryActionDescriptor } from "./action.types.js";
import { MoreActions } from "./more-actions.js";

interface PrimaryActionProps {
  /**
   * Resolved primary action contract.
   */
  readonly action: PrimaryActionDescriptor;
}

/**
 * Renders the single primary action permitted in an action bar.
 *
 * @param root0 - Primary action properties.
 * @param root0.action - Resolved primary action contract.
 * @returns The primary command or navigation control.
 */
function PrimaryAction({ action }: PrimaryActionProps) {
  if ("href" in action && action.href !== undefined) {
    return (
      <ButtonLink
        href={action.href}
        rel={action.rel}
        startIcon={action.icon}
        target={action.target}
        variant="primary"
      >
        {action.label}
      </ButtonLink>
    );
  }
  return (
    <Button
      {...(action.disabled === undefined ? {} : { disabled: action.disabled })}
      {...(action.loading === undefined ? {} : { loading: action.loading })}
      onClick={action.onAction}
      startIcon={action.icon}
      variant="primary"
    >
      {action.label}
    </Button>
  );
}

/**
 * Organizes one primary action and a restrained set of ordinary actions.
 *
 * @param root0 - Action bar properties.
 * @param root0.primary - Optional single primary action.
 * @param root0.actions - Ordered ordinary actions.
 * @returns The responsive action bar.
 * @public
 */
export function ActionBar({ primary, actions }: ActionBarProps) {
  const compact = useMiaixzCompactActions();
  const visibleLimit = compact ? (primary === undefined ? 1 : 0) : 2;
  const safe = actions.filter((action) => action.tone !== "danger");
  const visible = safe.slice(0, visibleLimit);
  const visibleIds = new Set(visible.map((action) => action.id));
  const overflow = actions.filter((action) => !visibleIds.has(action.id));

  return (
    <div className="miaixz-action-bar">
      {visible.map((action) => (
        <ActionText key={action.id} action={action} />
      ))}
      <MoreActions actions={overflow} />
      {primary !== undefined && <PrimaryAction action={primary} />}
    </div>
  );
}
