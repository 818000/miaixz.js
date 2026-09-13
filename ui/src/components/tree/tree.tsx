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

/* eslint-disable jsdoc/require-jsdoc -- Public Tree composes the dedicated controllers.
 */
import {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type RefAttributes,
} from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { useMiaixzLocale } from "../../i18n/i18n.js";
import { classNames } from "../../shared/class-names.js";
import { useControlled } from "../../shared/use-controlled.js";
import { useMergedRef } from "../../shared/use-merged-ref.js";
import { useTreeAsyncLoader } from "./tree-async-loader.js";
import {
  buildTreeIndex,
  getVisibleTreeRecords,
  isTreeNodeExpandable,
  normalizeTreeIds,
  resolveTreeChildren,
  resolveTreeFocusedId,
  type TreeRecord,
} from "./tree-controller.js";
import { findTreeTypeaheadMatch, resolveTreeNavigation } from "./tree-keyboard.js";
import { TreeRenderer } from "./tree-renderer.js";
import type { TreeNode, TreeProps } from "./tree.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

function TreeImplementation<Value = unknown>(
  props: TreeProps<Value>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    nodes,
    label,
    loadChildren,
    selectionMode = "single",
    selectedIds,
    defaultSelectedIds,
    onSelectedIdsChange,
    expandedIds,
    defaultExpandedIds,
    onExpandedIdsChange,
    surface = "framed",
    connectors = false,
    dividerStyle = "none",
    density = "standard",
    slotProps,
    className,
    ...rootProps
  } = props;
  const { t } = useMiaixzLocale();
  const selection = useControlled<readonly string[]>({
    value: selectedIds,
    defaultValue: normalizeTreeIds(defaultSelectedIds ?? []),
    hasDefaultValue: selectedIds !== undefined && defaultSelectedIds !== undefined,
    ...(onSelectedIdsChange === undefined ? {} : { onValueChange: onSelectedIdsChange }),
    readOnly: selectedIds !== undefined && onSelectedIdsChange === undefined,
  });
  const expansion = useControlled<readonly string[]>({
    value: expandedIds,
    defaultValue: normalizeTreeIds(defaultExpandedIds ?? []),
    hasDefaultValue: expandedIds !== undefined && defaultExpandedIds !== undefined,
    ...(onExpandedIdsChange === undefined ? {} : { onValueChange: onExpandedIdsChange }),
    readOnly: expandedIds !== undefined && onExpandedIdsChange === undefined,
  });
  const selectedValues = useMemo(
    () => (selectionMode === "none" ? [] : normalizeTreeIds(selection.value)),
    [selection.value, selectionMode],
  );
  const expandedValues = useMemo(() => normalizeTreeIds(expansion.value), [expansion.value]);
  if (selectionMode === "single" && selectedValues.length > 1) {
    throw new MiaixzUiError({
      code: "UI_CONTROLLED_VALUE_INVALID",
    });
  }
  const loader = useTreeAsyncLoader(loadChildren);
  const index = useMemo(() => buildTreeIndex(nodes, loader.childCache), [loader.childCache, nodes]);
  const expandedSet = useMemo(() => new Set(expandedValues), [expandedValues]);
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  const visible = useMemo(
    () => getVisibleTreeRecords(index, loader.childCache, expandedSet),
    [expandedSet, index, loader.childCache],
  );
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const resolvedFocusedId = resolveTreeFocusedId(focusedId, selectedValues, visible, index);
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const rootRef = useMergedRef(forwardedRef, null);
  const typeaheadRef = useRef("");
  const typeaheadTimerRef = useRef<number | undefined>(undefined);

  const focusNode = useCallback((id: string) => {
    setFocusedId(id);
    itemRefs.current.get(id)?.focus({ preventScroll: true });
  }, []);
  const setExpanded = useCallback(
    (id: string, expanded: boolean) => {
      if (expansion.readOnly) return;
      const next = expanded
        ? expandedValues.includes(id)
          ? expandedValues
          : [...expandedValues, id]
        : expandedValues.filter((candidate) => candidate !== id);
      expansion.setValue(next);
    },
    [expandedValues, expansion],
  );
  const toggle = useCallback(
    (node: Readonly<TreeNode<Value>>) => {
      if (node.disabled === true || expansion.readOnly) return;
      if (expandedSet.has(node.id)) {
        setExpanded(node.id, false);
        return;
      }
      const children = resolveTreeChildren(node, loader.childCache);
      if (children !== undefined) {
        if (children.length > 0) setExpanded(node.id, true);
        return;
      }
      if (node.hasChildren === true) {
        void loader
          .load(node)
          ?.then((loaded) => {
            if (loaded.length > 0) setExpanded(node.id, true);
          })
          .catch(() => undefined);
      }
    },
    [expandedSet, expansion.readOnly, loader, setExpanded],
  );
  const select = useCallback(
    (node: Readonly<TreeNode<Value>>) => {
      if (selectionMode === "none" || node.disabled === true || selection.readOnly) return;
      const next =
        selectionMode === "single"
          ? [node.id]
          : selectedValues.includes(node.id)
            ? selectedValues.filter((id) => id !== node.id)
            : [...selectedValues, node.id];
      selection.setValue(next);
    },
    [selectedValues, selection, selectionMode],
  );
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>, record: TreeRecord<Value>) => {
      event.stopPropagation();
      if (
        event.key.length === 1 &&
        event.key !== " " &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        typeaheadRef.current += event.key.toLocaleLowerCase();
        if (typeaheadTimerRef.current !== undefined) window.clearTimeout(typeaheadTimerRef.current);
        typeaheadTimerRef.current = window.setTimeout(() => {
          typeaheadRef.current = "";
          typeaheadTimerRef.current = undefined;
        }, 500);
        const match = findTreeTypeaheadMatch(visible, record.node.id, typeaheadRef.current);
        if (match !== undefined) focusNode(match.node.id);
        return;
      }
      const action = resolveTreeNavigation(
        event.key,
        record,
        visible,
        expandedSet,
        isTreeNodeExpandable(record.node, loader.childCache),
      );
      if (action.kind === "none") return;
      event.preventDefault();
      if (action.kind === "focus") focusNode(action.id);
      else if (action.kind === "expand") toggle(record.node);
      else if (action.kind === "collapse") setExpanded(record.node.id, false);
      else select(record.node);
    },
    [expandedSet, focusNode, loader.childCache, select, setExpanded, toggle, visible],
  );

  return (
    <div
      {...rootProps}
      ref={rootRef}
      role="tree"
      aria-label={label}
      aria-multiselectable={selectionMode === "multiple" || undefined}
      className={classNames("miaixz-tree", className)}
      data-surface={surface}
      data-connectors={connectors || undefined}
      data-divider-style={dividerStyle}
      data-density={density}
    >
      <TreeRenderer
        nodes={nodes}
        index={index}
        childCache={loader.childCache}
        expandedIds={expandedSet}
        selectedIds={selectedSet}
        loadingIds={loader.loadingIds}
        errorIds={loader.errorIds}
        focusedId={resolvedFocusedId}
        selectionMode={selectionMode}
        surface={surface}
        connectors={connectors}
        dividerStyle={dividerStyle}
        density={density}
        slotProps={slotProps}
        itemRefs={itemRefs}
        errorLabel={t("ui.tree.loadError")}
        retryLabel={t("ui.action.retry")}
        onFocus={setFocusedId}
        onSelect={select}
        onToggle={toggle}
        onRetry={(node) => {
          void loader.load(node)?.catch(() => undefined);
        }}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

/*
 * Renders a business-neutral WAI-ARIA tree view. @public
 */
export const Tree = withMiaixzThemeComponent(
  "Tree",
  forwardRef(TreeImplementation) as <Value = unknown>(
    props: TreeProps<Value> & RefAttributes<HTMLDivElement>,
  ) => ReactElement,
);
