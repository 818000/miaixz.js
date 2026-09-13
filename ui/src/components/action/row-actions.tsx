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

import { createRef, useMemo, useRef, type HTMLAttributes } from "react";

import {
  assertUniqueActionIds,
  partitionActions,
  useActionCapacity,
} from "../../shared/responsive/action-capacity.js";
import { useMergedSlotProps } from "../../shared/slots.js";
import { Icon } from "../icon/icon.js";
import { ActionText } from "./action-text.js";
import type { RowActionsOwnerState, RowActionsProps } from "./action.types.js";
import { MoreActionsView } from "./more-actions.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/**
 * Keeps row actions readable using the shared measured-capacity algorithm.
 *
 * @param properties - Row action properties.
 * @returns The responsive row action group.
 * @public
 */
function RowActions(properties: RowActionsProps) {
  const { actions, overflowLabel, slotProps } = properties;
  assertUniqueActionIds(actions);
  const rootRef = useRef<HTMLDivElement>(null);
  const overflowMeasureRef = useRef<HTMLSpanElement>(null);
  const actionMeasureRefs = useMemo(
    () => actions.map(() => createRef<HTMLSpanElement>()),
    [actions],
  );
  const capacity = useActionCapacity({ rootRef, actionMeasureRefs, overflowMeasureRef });
  const partition = partitionActions(actions, capacity);
  const ownerState: RowActionsOwnerState = { overflow: partition.overflow.length > 0 };
  const rootProps = useMergedSlotProps<
    RowActionsOwnerState,
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >({
    ownerState,
    defaultProps: { className: "miaixz-row-actions" },
    slotProps: slotProps?.root,
    internalRef: (element) => {
      rootRef.current = element;
    },
  });

  return (
    <div {...rootProps}>
      <span className="miaixz-action-measurements" aria-hidden="true" inert>
        {actions.map((action, index) => (
          <span key={action.id} ref={actionMeasureRefs[index]} className="miaixz-action-text">
            {action.icon !== undefined && (
              <span className="miaixz-button-icon">
                <Icon name={action.icon} size="control" />
              </span>
            )}
            <span className="miaixz-button-label">{action.label}</span>
          </span>
        ))}
        <span ref={overflowMeasureRef} className="miaixz-icon-button" />
      </span>
      {partition.visible.map((action) => (
        <ActionText key={action.id} action={action} />
      ))}
      <MoreActionsView
        actions={partition.overflow}
        {...(overflowLabel === undefined ? {} : { label: overflowLabel })}
      />
    </div>
  );
}

const ThemedRowActions = withMiaixzThemeComponent("RowActions", RowActions);
export { ThemedRowActions as RowActions };
