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

import { useMiaixzLocale } from "../../i18n/index.js";
import { Dropdown, type DropdownEntry } from "../dropdown/index.js";
import { Icon } from "../icon/index.js";
import { actionCatalog } from "./action-catalog.js";
import type { ActionDescriptor, MoreActionsProps } from "./action.types.js";
import { IconButton } from "./icon-button.js";

/**
 * Converts one action descriptor to a semantic dropdown entry.
 *
 * @param action - Resolved action contract.
 * @returns One navigation or command menu item.
 */
function createMenuEntry(action: ActionDescriptor): DropdownEntry {
  const common = {
    danger: action.tone === "danger",
    ...(action.description === undefined ? {} : { description: action.description }),
    icon: <Icon name={action.icon} size="control" />,
    label: action.label,
    ...(action.selected === undefined ? {} : { selected: action.selected }),
  };
  if ("href" in action && action.href !== undefined) {
    return {
      ...common,
      href: action.href,
      ...(action.rel === undefined ? {} : { rel: action.rel }),
      ...(action.target === undefined ? {} : { target: action.target }),
    };
  }
  return {
    ...common,
    disabled: action.disabled === true || action.loading === true,
    onClick: action.onAction,
  };
}

/**
 * Renders low-frequency actions in one consistent overflow menu.
 *
 * @param root0 - More-actions properties.
 * @param root0.actions - Ordered actions placed in the menu.
 * @returns The overflow menu, or nothing when no actions exist.
 * @public
 */
export function MoreActions({ actions }: MoreActionsProps) {
  const { t } = useMiaixzLocale();
  if (actions.length === 0) return null;
  const regular = actions.filter((action) => action.tone !== "danger");
  const danger = actions.filter((action) => action.tone === "danger");
  const items: DropdownEntry[] = regular.map(createMenuEntry);
  if (regular.length > 0 && danger.length > 0) items.push({ kind: "divider" });
  items.push(...danger.map(createMenuEntry));
  const catalog = actionCatalog.more;
  const label = t(catalog.labelKey);

  return (
    <Dropdown
      items={items}
      label={label}
      placement="bottom-end"
      trigger={
        <IconButton
          action={{
            id: "miaixz-more-actions",
            intent: "more",
            label,
            icon: catalog.icon,
            tone: catalog.tone,
            placement: catalog.placement,
            confirm: catalog.confirm,
            onAction: () => undefined,
          }}
        />
      }
      variant="compact"
    />
  );
}
