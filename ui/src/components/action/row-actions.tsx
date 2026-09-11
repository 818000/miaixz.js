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
import { ActionTextView } from "./action-text.js";
import type { RowActionsProps } from "./action.types.js";
import { MoreActions } from "./more-actions.js";

/**
 * Keeps row actions readable by showing at most two safe actions on desktop.
 *
 * @param root0 - Row action properties.
 * @param root0.actions - Ordered row actions.
 * @returns The responsive row action group.
 * @public
 */
export function RowActions({ actions }: RowActionsProps) {
  const compact = useMiaixzCompactActions();
  const safe = actions.filter((action) => action.tone !== "danger");
  const visible = safe.slice(0, compact ? 1 : 2);
  const visibleIds = new Set(visible.map((action) => action.id));
  const overflow = actions.filter((action) => !visibleIds.has(action.id));

  return (
    <div className="miaixz-row-actions">
      {visible.map((action) => (
        <ActionTextView key={action.id} action={action} showIcon={false} />
      ))}
      <MoreActions actions={overflow} />
    </div>
  );
}
