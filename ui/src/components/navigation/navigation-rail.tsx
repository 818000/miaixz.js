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

import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { classNames } from "../../shared/class-names.js";
import { Dropdown, type DropdownEntry } from "../dropdown/index.js";
import { Icon } from "../icon/index.js";
import { Navigation } from "./navigation.js";
import { NavigationRailGroup } from "./navigation-rail-group.js";
import type {
  NavigationRailGroupModel,
  NavigationRailItem,
  NavigationRailProps,
} from "./navigation-rail.types.js";

type NavigationRailDensity = "comfortable" | "compact" | "condensed";

interface NavigationRailLayout {
  /**
   * Selected height treatment.
   */
  readonly density: NavigationRailDensity;
  /**
   * Destinations collected under the disclosure.
   */
  readonly overflowItems: readonly NavigationRailItem[];
  /**
   * Destinations rendered directly in the rail.
   */
  readonly visibleIds: ReadonlySet<string>;
}

interface StructuredRailGroupProps {
  /**
   * Structured group to render.
   */
  readonly group: NavigationRailGroupModel;
  /**
   * Whether labels are currently revealed.
   */
  readonly expanded: boolean;
  /**
   * Whether the group has a preceding marker.
   */
  readonly separated: boolean;
  /**
   * Destination identities retained in the rail.
   */
  readonly visibleIds: ReadonlySet<string>;
}

interface RailOverflowProps {
  /**
   * Whether labels are currently revealed.
   */
  readonly expanded: boolean;
  /**
   * Original grouped destination order.
   */
  readonly groups: readonly NavigationRailGroupModel[];
  /**
   * Destinations collected under the disclosure.
   */
  readonly items: readonly NavigationRailItem[];
  /**
   * Localized disclosure label.
   */
  readonly label: string;
}

const navigationRailMetrics = Object.freeze({
  comfortable: Object.freeze({ item: 65, marker: 32 }),
  compact: Object.freeze({ item: 52, marker: 24 }),
  condensed: Object.freeze({ item: 44, marker: 16 }),
});
const navigationRailBodyPadding = 8;
const useNavigationRailLayoutEffect = typeof document === "undefined" ? useEffect : useLayoutEffect;

/**
 * Counts the block space occupied by the selected rail destinations.
 *
 * @param groups - Ordered navigation groups.
 * @param visibleIds - Destination identities rendered directly in the rail.
 * @param density - Candidate height treatment.
 * @param includeOverflow - Whether to reserve one disclosure row.
 * @returns Required block size in CSS pixels.
 */
function measureRailLayout(
  groups: readonly NavigationRailGroupModel[],
  visibleIds: ReadonlySet<string>,
  density: NavigationRailDensity,
  includeOverflow: boolean,
): number {
  const metrics = navigationRailMetrics[density];
  const visibleGroups = groups.filter((group) =>
    group.items.some((item) => visibleIds.has(item.id)),
  );
  const itemCount = visibleGroups.reduce(
    (total, group) => total + group.items.filter((item) => visibleIds.has(item.id)).length,
    0,
  );
  const markerCount = Math.max(0, visibleGroups.length - 1);
  return (
    itemCount * metrics.item +
    markerCount * metrics.marker +
    (includeOverflow ? metrics.item : 0) +
    navigationRailBodyPadding
  );
}

/**
 * Selects a density and moves lower-priority destinations into overflow.
 *
 * @param groups - Ordered navigation groups.
 * @param availableBlockSize - Measured body height in CSS pixels.
 * @returns Stable visible and overflow destination partitions.
 */
function resolveRailLayout(
  groups: readonly NavigationRailGroupModel[],
  availableBlockSize: number,
): NavigationRailLayout {
  const items = groups.flatMap((group) => group.items);
  const allIds = new Set(items.map((item) => item.id));
  for (const density of ["comfortable", "compact", "condensed"] as const) {
    if (measureRailLayout(groups, allIds, density, false) <= availableBlockSize) {
      return { density, overflowItems: [], visibleIds: allIds };
    }
  }

  const visibleIds = new Set(allIds);
  const indexedItems = items.map((item, index) => ({ item, index }));
  const removable = indexedItems
    .filter(({ item }) => item.overflow !== "never" && item.active !== true)
    .sort((left, right) => {
      const priorityDifference = (left.item.priority ?? 0) - (right.item.priority ?? 0);
      return priorityDifference === 0 ? right.index - left.index : priorityDifference;
    });

  for (const { item } of removable) {
    if (measureRailLayout(groups, visibleIds, "condensed", true) <= availableBlockSize) break;
    visibleIds.delete(item.id);
  }

  const protectedItems = indexedItems
    .filter(({ item }) => visibleIds.has(item.id))
    .sort((left, right) => {
      if (left.item.active !== right.item.active) return left.item.active ? 1 : -1;
      const priorityDifference = (left.item.priority ?? 0) - (right.item.priority ?? 0);
      return priorityDifference === 0 ? right.index - left.index : priorityDifference;
    });
  for (const { item } of protectedItems) {
    if (measureRailLayout(groups, visibleIds, "condensed", true) <= availableBlockSize) break;
    visibleIds.delete(item.id);
  }

  const overflowItems = items.filter((item) => !visibleIds.has(item.id));
  return { density: "condensed", overflowItems, visibleIds };
}

/**
 * Renders the visible part of one structured rail group.
 *
 * @param props - Structured group presentation properties.
 * @returns The group or `null` when none of its destinations remain visible.
 */
function StructuredRailGroup(props: StructuredRailGroupProps) {
  const { group, expanded, separated, visibleIds } = props;
  const railItems = group.items.filter((item) => visibleIds.has(item.id));
  if (railItems.length === 0) return null;
  const navigationItems = railItems.map((item) => {
    const { id: _id, overflow: _overflow, priority: _priority, ...entry } = item;
    return entry;
  });
  return (
    <NavigationRailGroup
      data-placement={group.placement ?? "start"}
      label={group.label}
      separated={separated}
    >
      <Navigation
        items={navigationItems}
        label={typeof group.label === "string" ? group.label : group.id}
        orientation="vertical"
        variant={expanded ? "default" : "icon"}
      />
    </NavigationRailGroup>
  );
}

/**
 * Converts overflowed navigation links into a grouped disclosure menu.
 *
 * @param groups - Original grouped destination order.
 * @param overflowItems - Destinations collected under the disclosure.
 * @returns Dropdown entries preserving group labels and destination semantics.
 */
function createOverflowEntries(
  groups: readonly NavigationRailGroupModel[],
  overflowItems: readonly NavigationRailItem[],
): readonly DropdownEntry[] {
  const overflowIds = new Set(overflowItems.map((item) => item.id));
  const entries: DropdownEntry[] = [];
  for (const group of groups) {
    const items = group.items.filter((item) => overflowIds.has(item.id));
    if (items.length === 0) continue;
    if (entries.length > 0) entries.push({ kind: "divider" });
    entries.push({ kind: "label", label: group.label });
    for (const item of items) {
      const {
        id: _id,
        overflow: _overflow,
        priority: _priority,
        active,
        icon,
        label,
        meta: _meta,
        ...props
      } = item;
      entries.push({
        ...props,
        icon,
        kind: "item",
        label,
        selected: active,
      } as DropdownEntry);
    }
  }
  return entries;
}

/**
 * Renders the adaptive overflow disclosure as a semantic menu button.
 *
 * @param props - Overflow disclosure presentation properties.
 * @returns The grouped overflow disclosure.
 */
function RailOverflow(props: RailOverflowProps) {
  const { expanded, groups, items, label } = props;
  const selected = items.some((item) => item.active === true);
  return (
    <Dropdown
      className="miaixz-navigation-rail-overflow"
      items={createOverflowEntries(groups, items)}
      label={label}
      placement="top-start"
      trigger={
        <>
          <span className="miaixz-navigation-icon">
            <Icon aria-hidden="true" name="Ellipsis" size="navigation" />
          </span>
          <span className="miaixz-navigation-label">{label}</span>
        </>
      }
      triggerProps={{
        "aria-current": selected ? "page" : undefined,
        className: "miaixz-navigation-item miaixz-navigation-rail-overflow-trigger",
        title: expanded ? undefined : label,
      }}
      variant="compact"
    />
  );
}

/**
 * Composes a single-level application rail that can reveal its labels in place.
 *
 * @public
 */
export const NavigationRail = forwardRef<HTMLDivElement, NavigationRailProps>(
  function NavigationRail(
    {
      brand,
      toggle,
      navigation,
      groups,
      utility,
      expanded = false,
      variant = "default",
      overflowMode,
      overflowLabel = "More",
      className,
      classNames: slotClassNames = {},
      ...props
    },
    ref,
  ) {
    const bodyRef = useRef<HTMLDivElement>(null);
    const [availableBlockSize, setAvailableBlockSize] = useState(Number.POSITIVE_INFINITY);
    const structured = groups !== undefined;
    const resolvedOverflowMode = overflowMode ?? (structured ? "adaptive" : "scroll");
    const adaptive = resolvedOverflowMode === "adaptive" && structured;
    useNavigationRailLayoutEffect(() => {
      if (!adaptive) return;
      const body = bodyRef.current;
      if (body === null) return;
      const update = () => {
        if (body.clientHeight > 0) setAvailableBlockSize(body.clientHeight);
      };
      update();
      if (typeof ResizeObserver !== "function") {
        body.ownerDocument.defaultView?.addEventListener("resize", update);
        return () => body.ownerDocument.defaultView?.removeEventListener("resize", update);
      }
      const observer = new ResizeObserver(update);
      observer.observe(body);
      return () => observer.disconnect();
    }, [adaptive]);
    const layout = useMemo(
      () => resolveRailLayout(groups ?? [], availableBlockSize),
      [availableBlockSize, groups],
    );
    const startGroups = groups?.filter((group) => group.placement !== "end") ?? [];
    const endGroups = groups?.filter((group) => group.placement === "end") ?? [];
    const visibleStartGroups = startGroups.filter((group) =>
      group.items.some((item) => layout.visibleIds.has(item.id)),
    );
    const visibleEndGroups = endGroups.filter((group) =>
      group.items.some((item) => layout.visibleIds.has(item.id)),
    );
    const structuredNavigation: ReactNode = structured ? (
      <div className="miaixz-navigation-rail-groups">
        {visibleStartGroups.map((group, index) => (
          <StructuredRailGroup
            expanded={expanded}
            group={group}
            key={group.id}
            separated={index > 0}
            visibleIds={layout.visibleIds}
          />
        ))}
        {layout.overflowItems.length > 0 && (
          <RailOverflow
            expanded={expanded}
            groups={groups ?? []}
            items={layout.overflowItems}
            label={overflowLabel}
          />
        )}
        {visibleEndGroups.map((group, index) => (
          <StructuredRailGroup
            expanded={expanded}
            group={group}
            key={group.id}
            separated={
              visibleStartGroups.length > 0 || layout.overflowItems.length > 0 || index > 0
            }
            visibleIds={layout.visibleIds}
          />
        ))}
      </div>
    ) : (
      navigation
    );
    return (
      <div
        {...props}
        ref={ref}
        data-expanded={expanded || undefined}
        data-density={adaptive ? layout.density : undefined}
        data-overflow-mode={resolvedOverflowMode}
        data-variant={variant}
        className={classNames("miaixz-navigation-rail-frame", className, slotClassNames.root)}
      >
        <div className={classNames("miaixz-navigation-rail-header", slotClassNames.header)}>
          <div className={classNames("miaixz-navigation-rail-toggle", slotClassNames.toggle)}>
            {toggle}
          </div>
          {expanded && (
            <div className={classNames("miaixz-navigation-rail-brand", slotClassNames.brand)}>
              {brand}
            </div>
          )}
        </div>
        <div
          ref={bodyRef}
          className={classNames("miaixz-navigation-rail-body", slotClassNames.body)}
        >
          {structuredNavigation}
        </div>
        {utility !== undefined && utility !== null && (
          <div className={classNames("miaixz-navigation-rail-utility", slotClassNames.utility)}>
            {utility}
          </div>
        )}
      </div>
    );
  },
);
