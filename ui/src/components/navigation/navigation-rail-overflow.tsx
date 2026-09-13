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

import { forwardRef, type RefObject } from "react";

import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { Dropdown } from "../dropdown/dropdown.js";
import type { DropdownEntry } from "../dropdown/dropdown.types.js";
import { Icon } from "../icon/icon.js";
import { Pressable } from "../pressable/pressable.js";
import { Navigation } from "./navigation.js";
import { NavigationRailGroup } from "./navigation-rail-group.js";
import type {
  NavigationRailGroupModel,
  NavigationRailOwnerState,
  NavigationRailSlotProps,
} from "./navigation-rail.types.js";

interface StructuredRailGroupProps {
  /**
   * Supplies the structured group to render.
   */
  readonly group: NavigationRailGroupModel;
  /**
   * Indicates whether the rail shows text labels.
   */
  readonly expanded: boolean;
  /**
   * Supplies the effective navigation density.
   */
  readonly density: NavigationRailOwnerState["density"];
  /**
   * Indicates whether the group begins after a separator.
   */
  readonly separated: boolean;
  /**
   * Supplies item ids retained by layout.
   */
  readonly visibleIds: ReadonlySet<string>;
  /**
   * Supplies owned group measurement refs.
   */
  readonly groupRefs: RefObject<Map<string, HTMLElement>>;
  /**
   * Supplies owned item measurement refs.
   */
  readonly itemRefs: RefObject<Map<string, HTMLAnchorElement>>;
}

/**
 * Renders one structured group retained by adaptive layout.
 *
 * @param props - Structured group and measurement state.
 * @returns One visible rail group or null.
 */
export function StructuredRailGroup(props: StructuredRailGroupProps) {
  const { group, expanded, density, separated, visibleIds, groupRefs, itemRefs } = props;
  const items = group.items.filter((item) => visibleIds.has(item.id));
  if (items.length === 0) return null;
  return (
    <NavigationRailGroup
      data-placement={group.placement ?? "start"}
      label={group.label}
      ref={(element) => {
        if (element === null) groupRefs.current.delete(group.id);
        else groupRefs.current.set(group.id, element);
      }}
      separated={separated}
    >
      <Navigation
        density={density}
        items={items}
        label={typeof group.label === "string" ? group.label : group.id}
        orientation="vertical"
        slotProps={{
          item: (state) => ({
            ref: (element) => {
              if (state.itemId === undefined) return;
              if (element === null) itemRefs.current.delete(state.itemId);
              else itemRefs.current.set(state.itemId, element);
            },
          }),
        }}
        surface="plain"
      />
      {!expanded && null}
    </NavigationRailGroup>
  );
}

interface RailOverflowProps {
  /**
   * Supplies Dropdown entries representing overflow items.
   */
  readonly entries: readonly DropdownEntry[];
  /**
   * Supplies the accessible overflow label.
   */
  readonly label: string;
  /**
   * Indicates whether the row is currently measurement-only.
   */
  readonly measuring: boolean;
  /**
   * Supplies the effective rail owner state.
   */
  readonly ownerState: NavigationRailOwnerState;
  /**
   * Supplies rail slot customizations.
   */
  readonly slotProps: NavigationRailSlotProps | undefined;
}

/**
 * Renders the adaptive overflow menu and its measurement row.
 */
export const RailOverflow = forwardRef<HTMLButtonElement, RailOverflowProps>(function RailOverflow(
  { entries, label, measuring, ownerState, slotProps },
  ref,
) {
  return (
    <div
      {...mergeMiaixzSlotProps({
        ownerState,
        defaultProps: { className: "miaixz-navigation-rail-overflow-row" },
        slotProps: slotProps?.overflow,
        internalProps: { ...(measuring ? { "data-measuring": true } : {}) },
      })}
    >
      <Dropdown
        density="compact"
        items={entries}
        label={label}
        placement="top-start"
        ref={ref}
        surface="plain"
        trigger={
          <Pressable
            className="miaixz-navigation-item miaixz-navigation-rail-overflow-trigger"
            title={ownerState.expanded ? undefined : label}
          >
            <span className="miaixz-navigation-icon">
              <Icon aria-hidden="true" name="Ellipsis" size="navigation" />
            </span>
            <span className="miaixz-navigation-label">{label}</span>
          </Pressable>
        }
      />
    </div>
  );
});
