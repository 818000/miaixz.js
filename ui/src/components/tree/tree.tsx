import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type ForwardedRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type RefAttributes,
} from "react";

import { createMiaixzUiError, MiaixzUiError } from "../../errors/index.js";
import { useMiaixzLocale, type MiaixzTranslator } from "../../i18n/index.js";
import { classNames } from "../../internal/class-names.js";
import { useMergedRef } from "../../internal/use-merged-ref.js";
import { Icon } from "../icon/index.js";
import type { TreeNode, TreeProps } from "./tree.types.js";

/**
 * Defines the delay used to combine printable-key tree navigation.
 */
const miaixzTreeTypeaheadResetMilliseconds = 500;

/**
 * Tracks the controlled modes selected during the first render.
 */
interface MiaixzTreeControlModes {
  /**
   * Identifies whether selection is controlled.
   */
  readonly selected: boolean;

  /**
   * Identifies whether expansion is controlled.
   */
  readonly expanded: boolean;
}

/**
 * Describes one indexed tree node and its structural relationship.
 *
 * @typeParam Value - Consumer-owned value attached to the node.
 */
interface MiaixzIndexedTreeNode<Value> {
  /**
   * Supplies the original public node.
   */
  readonly node: Readonly<TreeNode<Value>>;

  /**
   * Supplies the parent identifier when the node is not a root.
   */
  readonly parentId: string | null;

  /**
   * Supplies the one-based ARIA depth.
   */
  readonly level: number;

  /**
   * Supplies the one-based sibling position.
   */
  readonly position: number;

  /**
   * Supplies the sibling collection size.
   */
  readonly setSize: number;
}

/**
 * Describes the complete reachable tree index.
 *
 * @typeParam Value - Consumer-owned value attached to each node.
 */
interface MiaixzTreeIndex<Value> {
  /**
   * Maps every reachable identifier to its structural descriptor.
   */
  readonly byId: ReadonlyMap<string, MiaixzIndexedTreeNode<Value>>;

  /**
   * Lists every reachable identifier.
   */
  readonly ids: ReadonlySet<string>;
}

/**
 * Tracks one in-flight lazy child request.
 */
interface MiaixzPendingTreeLoad {
  /**
   * Cancels the request when its tree instance is removed.
   */
  readonly controller: AbortController;

  /**
   * Represents the shared in-flight request.
   */
  readonly promise: Promise<void>;
}

/**
 * Renders the public generic Tree implementation.
 *
 * @typeParam Value - Consumer-owned value attached to each node.
 * @param props - Public tree configuration and native root attributes.
 * @param forwardedRef - Forwarded root div reference.
 * @returns A keyboard-navigable WAI-ARIA tree.
 */
function TreeImplementation<Value = unknown>(
  props: TreeProps<Value>,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const {
    nodes,
    selectionMode = "single",
    selectedIds,
    defaultSelectedIds,
    onSelectedIdsChange,
    expandedIds,
    defaultExpandedIds,
    onExpandedIdsChange,
    loadChildren,
    label,
    className,
    onBlurCapture,
    onFocusCapture,
    ...rootProps
  } = props;
  const { t } = useMiaixzLocale();
  const selectedControlled = selectedIds !== undefined;
  const expandedControlled = expandedIds !== undefined;
  validateMiaixzTreeControlledValue(
    t,
    selectedControlled,
    defaultSelectedIds !== undefined,
    onSelectedIdsChange !== undefined,
  );
  validateMiaixzTreeControlledValue(
    t,
    expandedControlled,
    defaultExpandedIds !== undefined,
    onExpandedIdsChange !== undefined,
  );
  useStableMiaixzTreeControlModes(t, selectedControlled, expandedControlled);

  const [internalSelectedIds, setInternalSelectedIds] = useState<readonly string[]>(() =>
    createUniqueMiaixzTreeIds(defaultSelectedIds ?? []),
  );
  const [internalExpandedIds, setInternalExpandedIds] = useState<readonly string[]>(() =>
    createUniqueMiaixzTreeIds(defaultExpandedIds ?? []),
  );
  const [childCache, setChildCache] = useState<ReadonlyMap<string, readonly TreeNode<Value>[]>>(
    () => new Map(),
  );
  const [loadingIds, setLoadingIds] = useState<ReadonlySet<string>>(() => new Set());
  const [failedIds, setFailedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<MiaixzUiError | null>(null);
  const rootElementRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useMergedRef(forwardedRef, rootElementRef);
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const pendingLoadsRef = useRef(new Map<string, MiaixzPendingTreeLoad>());
  const childCacheRef = useRef<ReadonlyMap<string, readonly TreeNode<Value>[]>>(new Map());
  const selectedSnapshotRef = useRef<readonly string[]>(
    createUniqueMiaixzTreeIds(selectedIds ?? defaultSelectedIds ?? []),
  );
  const expandedSnapshotRef = useRef<readonly string[]>(
    createUniqueMiaixzTreeIds(expandedIds ?? defaultExpandedIds ?? []),
  );
  const typeaheadRef = useRef("");
  const typeaheadTimerRef = useRef<number | undefined>(undefined);
  const treeHadFocusRef = useRef(false);

  const currentSelectedIds = createUniqueMiaixzTreeIds(
    selectedControlled ? (selectedIds ?? []) : internalSelectedIds,
  );
  const currentExpandedIds = createUniqueMiaixzTreeIds(
    expandedControlled ? (expandedIds ?? []) : internalExpandedIds,
  );
  const selectedSet = useMemo(() => new Set(currentSelectedIds), [currentSelectedIds]);
  const expandedSet = useMemo(() => new Set(currentExpandedIds), [currentExpandedIds]);
  const treeIndex = useMemo(
    () => createMiaixzTreeIndex(t, nodes, childCache),
    [childCache, nodes, t],
  );
  const visibleNodes = useMemo(
    () => createVisibleMiaixzTreeNodes(nodes, childCache, expandedSet),
    [childCache, expandedSet, nodes],
  );
  const visibleIdSet = useMemo(
    () => new Set(visibleNodes.map((entry) => entry.node.id)),
    [visibleNodes],
  );
  const resolvedFocusedId = resolveMiaixzTreeFocusedId(
    focusedId,
    currentSelectedIds,
    visibleNodes,
    visibleIdSet,
    treeIndex,
  );

  useEffect(() => {
    if (selectedControlled) selectedSnapshotRef.current = currentSelectedIds;
  }, [currentSelectedIds, selectedControlled]);

  useEffect(() => {
    if (expandedControlled) expandedSnapshotRef.current = currentExpandedIds;
  }, [currentExpandedIds, expandedControlled]);

  useEffect(() => {
    const reachableIds = treeIndex.ids;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const nextCache = new Map(childCacheRef.current);
      let changed = false;
      for (const id of nextCache.keys()) {
        if (reachableIds.has(id)) continue;
        nextCache.delete(id);
        changed = true;
      }
      for (const [id, pending] of pendingLoadsRef.current) {
        if (reachableIds.has(id)) continue;
        pending.controller.abort();
        pendingLoadsRef.current.delete(id);
      }
      if (changed) {
        childCacheRef.current = nextCache;
        setChildCache(nextCache);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [treeIndex.ids]);

  useEffect(
    () => () => {
      if (typeaheadTimerRef.current !== undefined) {
        window.clearTimeout(typeaheadTimerRef.current);
      }
      for (const pending of pendingLoadsRef.current.values()) pending.controller.abort();
      pendingLoadsRef.current.clear();
    },
    [],
  );

  useLayoutEffect(() => {
    if (focusedId !== resolvedFocusedId && resolvedFocusedId !== null && treeHadFocusRef.current) {
      itemRefs.current.get(resolvedFocusedId)?.focus({ preventScroll: true });
    }
  }, [focusedId, resolvedFocusedId]);

  const emitSelectedIds = useCallback(
    (nextIds: readonly string[]) => {
      const normalizedIds = createUniqueMiaixzTreeIds(nextIds);
      if (!selectedControlled) {
        selectedSnapshotRef.current = normalizedIds;
        setInternalSelectedIds(normalizedIds);
      }
      onSelectedIdsChange?.(normalizedIds);
    },
    [onSelectedIdsChange, selectedControlled],
  );
  const emitExpandedIds = useCallback(
    (nextIds: readonly string[]) => {
      const normalizedIds = createUniqueMiaixzTreeIds(nextIds);
      if (!expandedControlled) {
        expandedSnapshotRef.current = normalizedIds;
        setInternalExpandedIds(normalizedIds);
      }
      onExpandedIdsChange?.(normalizedIds);
    },
    [expandedControlled, onExpandedIdsChange],
  );
  const setNodeExpanded = useCallback(
    (nodeId: string, expanded: boolean) => {
      const currentIds = expandedSnapshotRef.current;
      const nextIds = expanded
        ? currentIds.includes(nodeId)
          ? currentIds
          : [...currentIds, nodeId]
        : currentIds.filter((id) => id !== nodeId);
      emitExpandedIds(nextIds);
    },
    [emitExpandedIds],
  );
  const setNodeSelected = useCallback(
    (node: Readonly<TreeNode<Value>>) => {
      if (selectionMode === "none" || node.disabled === true) return;
      const currentIds = selectedSnapshotRef.current;
      if (selectionMode === "single") {
        emitSelectedIds([node.id]);
        return;
      }
      emitSelectedIds(
        currentIds.includes(node.id)
          ? currentIds.filter((id) => id !== node.id)
          : [...currentIds, node.id],
      );
    },
    [emitSelectedIds, selectionMode],
  );
  const focusNode = useCallback((nodeId: string) => {
    setFocusedId(nodeId);
    itemRefs.current.get(nodeId)?.focus({ preventScroll: true });
  }, []);
  const loadLazyChildren = useCallback(
    (node: Readonly<TreeNode<Value>>) => {
      if (loadChildren === undefined || node.disabled === true) return;
      const existing = pendingLoadsRef.current.get(node.id);
      if (existing !== undefined) return existing.promise;

      const controller = new AbortController();
      setLoadingIds((currentIds) => addMiaixzTreeSetValue(currentIds, node.id));
      setFailedIds((currentIds) => removeMiaixzTreeSetValue(currentIds, node.id));
      const promise = loadChildren(node, controller.signal)
        .then((children) => {
          if (controller.signal.aborted) return;
          const nextCache = new Map(childCacheRef.current);
          nextCache.set(node.id, children);
          createMiaixzTreeIndex(t, nodes, nextCache);
          childCacheRef.current = nextCache;
          setChildCache(nextCache);
          setFailedIds((currentIds) => removeMiaixzTreeSetValue(currentIds, node.id));
          if (children.length > 0) setNodeExpanded(node.id, true);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          if (error instanceof MiaixzUiError && error.code === "UI_TREE_DUPLICATE_ID") {
            setFatalError(error);
            return;
          }
          setFailedIds((currentIds) => addMiaixzTreeSetValue(currentIds, node.id));
        })
        .finally(() => {
          const current = pendingLoadsRef.current.get(node.id);
          if (current?.promise === promise) pendingLoadsRef.current.delete(node.id);
          if (!controller.signal.aborted) {
            setLoadingIds((currentIds) => removeMiaixzTreeSetValue(currentIds, node.id));
          }
        });
      pendingLoadsRef.current.set(node.id, { controller, promise });
      return promise;
    },
    [loadChildren, nodes, setNodeExpanded, t],
  );
  const toggleNodeExpanded = useCallback(
    (node: Readonly<TreeNode<Value>>) => {
      if (node.disabled === true) return;
      if (expandedSnapshotRef.current.includes(node.id)) {
        setNodeExpanded(node.id, false);
        return;
      }
      const resolvedChildren = resolveMiaixzTreeChildren(node, childCache);
      if (resolvedChildren !== undefined) {
        if (resolvedChildren.length > 0) setNodeExpanded(node.id, true);
        return;
      }
      if (node.hasChildren === true) void loadLazyChildren(node);
    },
    [childCache, loadLazyChildren, setNodeExpanded],
  );
  const handleTreeItemKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>, entry: MiaixzIndexedTreeNode<Value>) => {
      event.stopPropagation();
      const visibleIndex = visibleNodes.findIndex(
        (candidate) => candidate.node.id === entry.node.id,
      );
      if (event.key === "ArrowDown") {
        event.preventDefault();
        const next = visibleNodes[Math.min(visibleIndex + 1, visibleNodes.length - 1)];
        if (next !== undefined) focusNode(next.node.id);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        const previous = visibleNodes[Math.max(visibleIndex - 1, 0)];
        if (previous !== undefined) focusNode(previous.node.id);
        return;
      }
      if (event.key === "Home") {
        event.preventDefault();
        const first = visibleNodes[0];
        if (first !== undefined) focusNode(first.node.id);
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        const last = visibleNodes[visibleNodes.length - 1];
        if (last !== undefined) focusNode(last.node.id);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (isMiaixzTreeNodeExpandable(entry.node, childCache) && !expandedSet.has(entry.node.id)) {
          toggleNodeExpanded(entry.node);
          return;
        }
        const next = visibleNodes[visibleIndex + 1];
        if (expandedSet.has(entry.node.id) && next?.parentId === entry.node.id) {
          focusNode(next.node.id);
        }
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (expandedSet.has(entry.node.id)) {
          toggleNodeExpanded(entry.node);
        } else if (entry.parentId !== null) {
          focusNode(entry.parentId);
        }
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setNodeSelected(entry.node);
        return;
      }
      if (isMiaixzTreeTypeaheadKey(event)) {
        typeaheadRef.current += event.key.toLocaleLowerCase();
        if (typeaheadTimerRef.current !== undefined) {
          window.clearTimeout(typeaheadTimerRef.current);
        }
        typeaheadTimerRef.current = window.setTimeout(() => {
          typeaheadRef.current = "";
          typeaheadTimerRef.current = undefined;
        }, miaixzTreeTypeaheadResetMilliseconds);
        const match = findMiaixzTreeTypeaheadMatch(
          visibleNodes,
          visibleIndex,
          typeaheadRef.current,
        );
        if (match !== undefined) focusNode(match.node.id);
      }
    },
    [childCache, expandedSet, focusNode, setNodeSelected, toggleNodeExpanded, visibleNodes],
  );
  const handleFocusCapture = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      treeHadFocusRef.current = true;
      onFocusCapture?.(event);
    },
    [onFocusCapture],
  );
  const handleBlurCapture = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        queueMicrotask(() => {
          treeHadFocusRef.current =
            rootElementRef.current?.contains(document.activeElement) === true;
        });
      }
      onBlurCapture?.(event);
    },
    [onBlurCapture],
  );

  /**
   * Renders one sibling collection and its recursively expanded descendants.
   *
   * @param siblings - Ordered sibling nodes to render.
   * @returns Tree item elements for the supplied sibling collection.
   */
  const renderNodes = (siblings: readonly TreeNode<Value>[]) =>
    siblings.map((node) => {
      const entry = treeIndex.byId.get(node.id)!;
      const resolvedChildren = resolveMiaixzTreeChildren(node, childCache);
      const expandable = isMiaixzTreeNodeExpandable(node, childCache);
      const expanded = expandable && expandedSet.has(node.id);
      const selected = selectedSet.has(node.id);
      const loading = loadingIds.has(node.id);
      const failed = failedIds.has(node.id);
      const itemState = loading
        ? "loading"
        : failed
          ? "error"
          : expanded
            ? "expanded"
            : "collapsed";
      return (
        <div
          key={node.id}
          ref={(element) => {
            if (element === null) itemRefs.current.delete(node.id);
            else itemRefs.current.set(node.id, element);
          }}
          role="treeitem"
          tabIndex={node.id === resolvedFocusedId ? 0 : -1}
          aria-level={entry.level}
          aria-posinset={entry.position}
          aria-setsize={entry.setSize}
          aria-label={getMiaixzTreeLabelText(node.label) || undefined}
          aria-expanded={expandable ? expanded : undefined}
          aria-selected={selectionMode === "none" ? undefined : selected}
          aria-disabled={node.disabled || undefined}
          aria-busy={loading || undefined}
          className="miaixz-tree-item"
          data-state={itemState}
          data-disabled={node.disabled || undefined}
          onFocus={(event) => {
            event.stopPropagation();
            setFocusedId(node.id);
          }}
          onKeyDown={(event) => handleTreeItemKeyDown(event, entry)}
        >
          <div
            className="miaixz-tree-row"
            onClick={() => {
              focusNode(node.id);
              setNodeSelected(node);
            }}
          >
            <span
              className="miaixz-tree-expander"
              data-state={expandable ? (expanded ? "expanded" : "collapsed") : "leaf"}
              onClick={(event: MouseEvent<HTMLSpanElement>) => {
                event.stopPropagation();
                focusNode(node.id);
                if (expandable) toggleNodeExpanded(node);
              }}
            >
              {loading ? (
                <Icon name="LoaderCircle" size="control" className="miaixz-icon-spin" />
              ) : expandable ? (
                <Icon name={expanded ? "ChevronDown" : "ChevronRight"} size="control" />
              ) : null}
            </span>
            <span className="miaixz-tree-label">{node.label}</span>
            {selected && selectionMode !== "none" && (
              <Icon name="Check" size="control" className="miaixz-tree-selection" />
            )}
          </div>
          {failed && (
            <div className="miaixz-tree-error" role="alert">
              <span>{t("ui.tree.loadError")}</span>
              <button
                type="button"
                className="miaixz-tree-retry"
                onClick={(event) => {
                  event.stopPropagation();
                  void loadLazyChildren(node);
                }}
              >
                <Icon name="RotateCcw" size="indicator" />
                {t("ui.action.retry")}
              </button>
            </div>
          )}
          {expanded && resolvedChildren !== undefined && resolvedChildren.length > 0 && (
            <div role="group" className="miaixz-tree-group">
              {renderNodes(resolvedChildren)}
            </div>
          )}
        </div>
      );
    });

  if (fatalError !== null) throw fatalError;

  return (
    <div
      {...rootProps}
      ref={rootRef}
      role="tree"
      aria-label={label}
      aria-multiselectable={selectionMode === "multiple" || undefined}
      className={classNames("miaixz-tree", className)}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
    >
      {renderNodes(nodes)}
    </div>
  );
}

/**
 * Renders a business-neutral WAI-ARIA tree view.
 *
 * @public
 */
export const Tree = forwardRef(TreeImplementation) as <Value = unknown>(
  props: TreeProps<Value> & RefAttributes<HTMLDivElement>,
) => ReactElement;

/**
 * Validates one selected or expanded controlled-value contract.
 *
 * @param translate - Active localized message resolver.
 * @param controlled - Whether a controlled value was supplied.
 * @param hasDefault - Whether an uncontrolled default was supplied.
 * @param hasChangeHandler - Whether requested changes can be observed.
 */
function validateMiaixzTreeControlledValue(
  translate: MiaixzTranslator,
  controlled: boolean,
  hasDefault: boolean,
  hasChangeHandler: boolean,
): void {
  if (controlled && (!hasChangeHandler || hasDefault)) {
    throw createMiaixzUiError(translate, {
      code: "UI_CONTROLLED_VALUE_INVALID",
      messageKey: "ui.error.controlled.valueInvalid",
    });
  }
}

/**
 * Freezes selected and expanded control modes for the mounted lifetime.
 *
 * @param translate - Active localized message resolver.
 * @param selectedControlled - Current selection control mode.
 * @param expandedControlled - Current expansion control mode.
 */
function useStableMiaixzTreeControlModes(
  translate: MiaixzTranslator,
  selectedControlled: boolean,
  expandedControlled: boolean,
): void {
  const [initialModes] = useState<MiaixzTreeControlModes>({
    selected: selectedControlled,
    expanded: expandedControlled,
  });
  if (
    initialModes.selected !== selectedControlled ||
    initialModes.expanded !== expandedControlled
  ) {
    throw createMiaixzUiError(translate, {
      code: "UI_CONTROL_MODE_CHANGED",
      messageKey: "ui.error.controlled.modeChanged",
    });
  }
}

/**
 * Produces an ordered identifier list without duplicate values.
 *
 * @param ids - Source identifier collection.
 * @returns Ordered unique identifier collection.
 */
function createUniqueMiaixzTreeIds(ids: readonly string[]): readonly string[] {
  return [...new Set(ids)];
}

/**
 * Builds the complete reachable tree index and validates identifier uniqueness.
 *
 * @typeParam Value - Consumer-owned value attached to each node.
 * @param translate - Active localized message resolver.
 * @param nodes - Root node collection.
 * @param childCache - Successful lazy child results.
 * @returns Complete immutable structural index.
 */
function createMiaixzTreeIndex<Value>(
  translate: MiaixzTranslator,
  nodes: readonly TreeNode<Value>[],
  childCache: ReadonlyMap<string, readonly TreeNode<Value>[]>,
): MiaixzTreeIndex<Value> {
  const byId = new Map<string, MiaixzIndexedTreeNode<Value>>();

  /**
   * Visits one sibling collection in source order.
   *
   * @param siblings - Ordered siblings at the current depth.
   * @param parentId - Parent identifier or null for roots.
   * @param level - One-based ARIA depth.
   */
  function visit(siblings: readonly TreeNode<Value>[], parentId: string | null, level: number) {
    siblings.forEach((node, index) => {
      if (byId.has(node.id)) {
        throw createMiaixzUiError(translate, {
          code: "UI_TREE_DUPLICATE_ID",
          messageKey: "ui.error.tree.duplicateId",
          details: { duplicateId: node.id },
        });
      }
      byId.set(node.id, {
        node,
        parentId,
        level,
        position: index + 1,
        setSize: siblings.length,
      });
      const children = resolveMiaixzTreeChildren(node, childCache);
      if (children !== undefined) visit(children, node.id, level + 1);
    });
  }

  visit(nodes, null, 1);
  return { byId, ids: new Set(byId.keys()) };
}

/**
 * Creates the ordered visible-node collection for current expansion state.
 *
 * @typeParam Value - Consumer-owned value attached to each node.
 * @param nodes - Root node collection.
 * @param childCache - Successful lazy child results.
 * @param expandedIds - Currently expanded identifiers.
 * @returns Visible nodes in depth-first keyboard order.
 */
function createVisibleMiaixzTreeNodes<Value>(
  nodes: readonly TreeNode<Value>[],
  childCache: ReadonlyMap<string, readonly TreeNode<Value>[]>,
  expandedIds: ReadonlySet<string>,
): readonly MiaixzIndexedTreeNode<Value>[] {
  const result: MiaixzIndexedTreeNode<Value>[] = [];

  /**
   * Appends one sibling collection and expanded descendants.
   *
   * @param siblings - Ordered siblings at the current depth.
   * @param parentId - Parent identifier or null for roots.
   * @param level - One-based ARIA depth.
   */
  function append(siblings: readonly TreeNode<Value>[], parentId: string | null, level: number) {
    siblings.forEach((node, index) => {
      result.push({
        node,
        parentId,
        level,
        position: index + 1,
        setSize: siblings.length,
      });
      const children = resolveMiaixzTreeChildren(node, childCache);
      if (expandedIds.has(node.id) && children !== undefined && children.length > 0) {
        append(children, node.id, level + 1);
      }
    });
  }

  append(nodes, null, 1);
  return result;
}

/**
 * Resolves static or successfully loaded children for one node.
 *
 * @typeParam Value - Consumer-owned value attached to the node.
 * @param node - Node whose children are requested.
 * @param childCache - Successful lazy child results.
 * @returns Loaded child collection, including an empty result, or undefined.
 */
function resolveMiaixzTreeChildren<Value>(
  node: Readonly<TreeNode<Value>>,
  childCache: ReadonlyMap<string, readonly TreeNode<Value>[]>,
): readonly TreeNode<Value>[] | undefined {
  return node.children ?? childCache.get(node.id);
}

/**
 * Reports whether one node currently exposes an expansion affordance.
 *
 * @typeParam Value - Consumer-owned value attached to the node.
 * @param node - Candidate tree node.
 * @param childCache - Successful lazy child results.
 * @returns Whether the node has visible or loadable children.
 */
function isMiaixzTreeNodeExpandable<Value>(
  node: Readonly<TreeNode<Value>>,
  childCache: ReadonlyMap<string, readonly TreeNode<Value>[]>,
): boolean {
  const children = resolveMiaixzTreeChildren(node, childCache);
  return children === undefined ? node.hasChildren === true : children.length > 0;
}

/**
 * Resolves the sole visible roving-tabindex node.
 *
 * @typeParam Value - Consumer-owned value attached to each node.
 * @param focusedId - Last explicitly focused identifier.
 * @param selectedIds - Ordered selected identifiers.
 * @param visibleNodes - Current depth-first visible nodes.
 * @param visibleIds - Set form of the visible identifiers.
 * @param treeIndex - Complete reachable tree index.
 * @returns Visible focused identifier or null for an empty tree.
 */
function resolveMiaixzTreeFocusedId<Value>(
  focusedId: string | null,
  selectedIds: readonly string[],
  visibleNodes: readonly MiaixzIndexedTreeNode<Value>[],
  visibleIds: ReadonlySet<string>,
  treeIndex: MiaixzTreeIndex<Value>,
): string | null {
  if (focusedId !== null) {
    let candidate: string | null = focusedId;
    while (candidate !== null) {
      if (visibleIds.has(candidate)) return candidate;
      candidate = treeIndex.byId.get(candidate)?.parentId ?? null;
    }
  }
  const selected = selectedIds.find((id) => visibleIds.has(id));
  return selected ?? visibleNodes[0]?.node.id ?? null;
}

/**
 * Adds one value to an immutable set snapshot.
 *
 * @param values - Current set snapshot.
 * @param value - Value to add.
 * @returns Original or updated set snapshot.
 */
function addMiaixzTreeSetValue(values: ReadonlySet<string>, value: string): ReadonlySet<string> {
  if (values.has(value)) return values;
  const nextValues = new Set(values);
  nextValues.add(value);
  return nextValues;
}

/**
 * Removes one value from an immutable set snapshot.
 *
 * @param values - Current set snapshot.
 * @param value - Value to remove.
 * @returns Original or updated set snapshot.
 */
function removeMiaixzTreeSetValue(values: ReadonlySet<string>, value: string): ReadonlySet<string> {
  if (!values.has(value)) return values;
  const nextValues = new Set(values);
  nextValues.delete(value);
  return nextValues;
}

/**
 * Reports whether a keyboard event contains one printable typeahead character.
 *
 * @param event - Tree-item keyboard event.
 * @returns Whether the key can participate in typeahead navigation.
 */
function isMiaixzTreeTypeaheadKey(event: KeyboardEvent<HTMLDivElement>): boolean {
  return (
    event.key.length === 1 && event.key !== " " && !event.altKey && !event.ctrlKey && !event.metaKey
  );
}

/**
 * Finds the next visible node matching the current typeahead buffer.
 *
 * @typeParam Value - Consumer-owned value attached to each node.
 * @param visibleNodes - Current depth-first visible nodes.
 * @param currentIndex - Current visible node index.
 * @param query - Normalized accumulated typeahead query.
 * @returns Next matching node or undefined.
 */
function findMiaixzTreeTypeaheadMatch<Value>(
  visibleNodes: readonly MiaixzIndexedTreeNode<Value>[],
  currentIndex: number,
  query: string,
): MiaixzIndexedTreeNode<Value> | undefined {
  for (let offset = 1; offset <= visibleNodes.length; offset += 1) {
    const candidate = visibleNodes[(currentIndex + offset) % visibleNodes.length];
    if (
      candidate !== undefined &&
      getMiaixzTreeLabelText(candidate.node.label).toLocaleLowerCase().startsWith(query)
    ) {
      return candidate;
    }
  }
  return undefined;
}

/**
 * Extracts safe typeahead text from primitive React labels.
 *
 * @param label - Public React node label.
 * @returns String or numeric label text, otherwise an empty string.
 */
function getMiaixzTreeLabelText(label: TreeNode["label"]): string {
  return typeof label === "string" || typeof label === "number" ? String(label) : "";
}
