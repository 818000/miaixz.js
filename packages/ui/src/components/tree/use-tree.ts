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
 * Implements the use tree module.
 */

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type RefAttributes,
} from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { useControlled } from "../../shared/use-controlled.js";
import { useTreeAsyncLoader } from "./tree-async-loader.js";
import {
  createTreeCollection,
  type TreeCollection,
  type TreeExpansionScope,
} from "./tree-collection.js";
import {
  createReadOnlyTreeExpansionResult,
  runTreeExpansion,
  type TreeExpandAllOptions,
  type TreeExpansionResult,
} from "./tree-expansion.js";
import { findTreeTypeaheadMatch, resolveTreeNavigation } from "./tree-keyboard.js";
import { createTreeViewModel } from "./tree-view-registry.js";
import type { TreeViewModel } from "./tree-view.types.js";
import type {
  TreeExpansionProps,
  TreeNode,
  TreePresentationProps,
  TreeSelectionProps,
  TreeViewMode,
  TreeViewOptionsMap,
  TreeViewRootProps,
} from "./tree.types.js";

/**
 * Asynchronous child-loader contract shared by Tree and useTree.
 */
export type TreeLoadChildren<Value> = (
  node: Readonly<TreeNode<Value>>,
  signal: AbortSignal,
) => Promise<readonly TreeNode<Value>[]>;

/**
 * Options consumed by the public headless Tree controller.
 */
export type UseTreeOptions<Value = unknown, View extends TreeViewMode = TreeViewMode> = {
  readonly label: string;
  readonly nodes: readonly TreeNode<Value>[];
  readonly loadChildren?: TreeLoadChildren<Value>;
  readonly asyncCacheKey?: string | number;
  readonly maxVisibleNodes?: number;
} & TreeSelectionProps &
  TreeExpansionProps &
  TreePresentationProps<View>;

/**
 * Current resolved Tree state.
 */
export interface TreeControllerState {
  readonly selectedIds: ReadonlySet<string>;
  readonly expandedIds: ReadonlySet<string>;
  readonly loadingIds: ReadonlySet<string>;
  readonly errorIds: ReadonlySet<string>;
  readonly focusedId: string | null;
  readonly viewRootId: string | null;
  readonly expansionReadOnly: boolean;
  readonly viewRootReadOnly: boolean;
  readonly batchPending: boolean;
  readonly lastExpansionResult: TreeExpansionResult | null;
}

/**
 * Commands exposed by the public headless Tree controller.
 */
export interface TreeControllerActions<Value> {
  select(id: string): void;
  focus(id: string): void;
  toggle(id: string): void;
  expand(id: string): Promise<void>;
  collapse(id: string): void;
  expandAll(options?: TreeExpandAllOptions): Promise<TreeExpansionResult>;
  collapseAll(scope?: TreeExpansionScope): void;
  expandToDepth(depth: number, scope?: TreeExpansionScope): Promise<TreeExpansionResult>;
  enter(id: string): Promise<void>;
  leave(): void;
  setViewRoot(id: string | null): void;
  retry(id: string): Promise<void>;
  getNode(id: string): Readonly<TreeNode<Value>> | undefined;
}

/**
 * Native root props owned by the Tree controller.
 */
export type TreeRootInteractionProps = HTMLAttributes<HTMLDivElement>;
/**
 * Native item props owned by the Tree controller.
 */
export type TreeItemInteractionProps = HTMLAttributes<HTMLDivElement> &
  RefAttributes<HTMLDivElement>;
/**
 * Native expander props owned by the Tree controller.
 */
export type TreeExpanderInteractionProps = HTMLAttributes<HTMLSpanElement>;

/**
 * Public output of useTree.
 */
export interface TreeController<Value> {
  readonly collection: TreeCollection<Value>;
  readonly view: TreeViewModel<Value>;
  readonly state: TreeControllerState;
  readonly actions: TreeControllerActions<Value>;
  readonly getRootProps: () => TreeRootInteractionProps;
  readonly getItemProps: (id: string) => TreeItemInteractionProps;
  readonly getExpanderProps: (id: string) => TreeExpanderInteractionProps;
}

/**
 * Raises the stable diagnostic used for invalid Tree presentation options.
 * @param option - Public option path that failed validation.
 * @returns Never returns because the function always throws.
 */
function invalidConfig(option: string): never {
  throw new MiaixzUiError({ code: "UI_TREE_CONFIG_INVALID", details: { option } });
}

/**
 * Validates one required positive integer Tree option.
 * @param value - Candidate numeric value.
 * @param option - Public option path used in diagnostics.
 */
function requirePositiveInteger(value: number, option: string): void {
  if (!Number.isInteger(value) || value < 1) invalidConfig(option);
}

/**
 * Validates the discriminated view configuration before state is created.
 * @param view - Requested built-in tree view.
 * @param viewOptions - Options associated with the requested view.
 * @param maxVisibleNodes - Renderer safety limit.
 * @param defaultExpansion - Initial expansion policy.
 * @param hasViewRootProps - Whether focus-root properties were supplied.
 */
function validateTreePresentation(
  view: TreeViewMode,
  viewOptions: TreeViewOptionsMap[TreeViewMode] | undefined,
  maxVisibleNodes: number,
  defaultExpansion: unknown,
  hasViewRootProps: boolean,
): void {
  requirePositiveInteger(maxVisibleNodes, "maxVisibleNodes");
  if (typeof defaultExpansion === "object" && defaultExpansion !== null) {
    const depth = (defaultExpansion as { readonly depth?: unknown }).depth;
    if (typeof depth !== "number") invalidConfig("defaultExpansion.depth");
    requirePositiveInteger(depth, "defaultExpansion.depth");
  }
  if (view !== "focus" && hasViewRootProps) invalidConfig("viewRootId");
  const allowed =
    view === "nested"
      ? new Set(["indent"])
      : view === "compact"
        ? new Set(["compression"])
        : new Set(["windowDepth", "navigation"]);
  for (const key of Object.keys(viewOptions ?? {})) {
    if (!allowed.has(key)) invalidConfig(`viewOptions.${key}`);
  }
  if (view === "nested") {
    const indent = (viewOptions as TreeViewOptionsMap["nested"] | undefined)?.indent;
    if (
      indent !== undefined &&
      indent !== "standard" &&
      indent !== "compact" &&
      indent !== "dense"
    ) {
      invalidConfig("viewOptions.indent");
    }
  } else if (view === "compact") {
    const compression = (viewOptions as TreeViewOptionsMap["compact"] | undefined)?.compression;
    if (compression !== undefined && compression !== "balanced" && compression !== "dense") {
      invalidConfig("viewOptions.compression");
    }
  } else {
    const focus = viewOptions as TreeViewOptionsMap["focus"] | undefined;
    if (
      focus?.windowDepth !== undefined &&
      (!Number.isInteger(focus.windowDepth) || focus.windowDepth < 2 || focus.windowDepth > 10)
    ) {
      invalidConfig("viewOptions.windowDepth");
    }
    if (
      focus?.navigation !== undefined &&
      !["breadcrumb", "back", "both"].includes(focus.navigation)
    ) {
      invalidConfig("viewOptions.navigation");
    }
  }
}

/**
 * Resolves the uncontrolled initial expansion identifiers.
 * @param collection - Initial indexed tree snapshot.
 * @param expansion - Declarative initial expansion policy.
 * @returns Expandable identifiers selected by the policy.
 */
function resolveInitialExpansion<Value>(
  collection: TreeCollection<Value>,
  expansion: UseTreeOptions<Value>["defaultExpansion"],
): readonly string[] {
  if (expansion === undefined || expansion === "collapsed") return [];
  if (expansion === "all") return collection.getExpandableIds();
  return collection
    .getExpandableIds()
    .filter((id) => (collection.get(id)?.logicalLevel ?? Infinity) < expansion.depth);
}

/**
 * Removes duplicate identifiers while preserving source order.
 * @param ids - Source identifier sequence.
 * @returns A stable unique identifier sequence.
 */
function normalizeIds(ids: readonly string[]): readonly string[] {
  return [...new Set(ids)];
}

/**
 * Owns all Tree data, state, actions, keyboard behavior, and ARIA interaction props.
 * @param options - Tree data, controlled state, behavior, view, and loading configuration.
 * @returns A headless Tree controller with state, actions, and interaction prop getters.
 */
export function useTree<Value = unknown, View extends TreeViewMode = TreeViewMode>(
  options: UseTreeOptions<Value, View>,
): TreeController<Value> {
  const optionRecord = options as UseTreeOptions<Value> & Partial<TreeViewRootProps>;
  const view = (options.view ?? "nested") as TreeViewMode;
  const viewOptions = useMemo(
    () => (options.viewOptions ?? {}) as TreeViewOptionsMap[TreeViewMode],
    [options.viewOptions],
  );
  const maxVisibleNodes = options.maxVisibleNodes ?? 5000;
  const hasViewRootProps =
    "viewRootId" in optionRecord ||
    "defaultViewRootId" in optionRecord ||
    "onViewRootIdChange" in optionRecord;
  validateTreePresentation(
    view,
    viewOptions,
    maxVisibleNodes,
    options.defaultExpansion,
    hasViewRootProps,
  );

  const baseCollection = useMemo(() => createTreeCollection(options.nodes), [options.nodes]);
  const latestCollectionRef = useRef<TreeCollection<Value>>(baseCollection);
  const validateCandidate = useCallback(
    (cache: ReadonlyMap<string, readonly TreeNode<Value>[]>) => {
      latestCollectionRef.current = createTreeCollection(options.nodes, cache);
    },
    [options.nodes],
  );
  const loader = useTreeAsyncLoader(options.loadChildren, options.asyncCacheKey, validateCandidate);
  const collection = useMemo(
    () =>
      loader.childCache.size === 0
        ? baseCollection
        : createTreeCollection(options.nodes, loader.childCache),
    [baseCollection, loader.childCache, options.nodes],
  );
  useEffect(() => {
    latestCollectionRef.current = collection;
  }, [collection]);

  const [initialExpansion] = useState(() =>
    normalizeIds(
      options.defaultExpandedIds ?? resolveInitialExpansion(collection, options.defaultExpansion),
    ),
  );
  const expansion = useControlled<readonly string[]>({
    value: options.expandedIds,
    defaultValue: initialExpansion,
    hasDefaultValue:
      options.expandedIds !== undefined &&
      (options.defaultExpandedIds !== undefined || options.defaultExpansion !== undefined),
    ...(options.onExpandedIdsChange === undefined
      ? {}
      : { onValueChange: options.onExpandedIdsChange }),
    readOnly: options.expandedIds !== undefined && options.onExpandedIdsChange === undefined,
  });
  const selectionMode = options.selectionMode ?? "single";
  const selection = useControlled<readonly string[]>({
    value: options.selectedIds,
    defaultValue: normalizeIds(options.defaultSelectedIds ?? []),
    hasDefaultValue: options.selectedIds !== undefined && options.defaultSelectedIds !== undefined,
    ...(options.onSelectedIdsChange === undefined
      ? {}
      : { onValueChange: options.onSelectedIdsChange }),
    readOnly: options.selectedIds !== undefined && options.onSelectedIdsChange === undefined,
  });
  const viewRoot = useControlled<string | null>({
    value: view === "focus" ? optionRecord.viewRootId : undefined,
    defaultValue: view === "focus" ? (optionRecord.defaultViewRootId ?? null) : null,
    hasDefaultValue:
      view === "focus" &&
      optionRecord.viewRootId !== undefined &&
      optionRecord.defaultViewRootId !== undefined,
    ...(optionRecord.onViewRootIdChange === undefined
      ? {}
      : { onValueChange: optionRecord.onViewRootIdChange }),
    readOnly:
      view === "focus" &&
      optionRecord.viewRootId !== undefined &&
      optionRecord.onViewRootIdChange === undefined,
  });

  const selectedValues = useMemo(
    () => (selectionMode === "none" ? [] : normalizeIds(selection.value)),
    [selection.value, selectionMode],
  );
  if (selectionMode === "single" && selectedValues.filter((id) => collection.get(id)).length > 1) {
    throw new MiaixzUiError({ code: "UI_CONTROLLED_VALUE_INVALID" });
  }
  const expandedValues = useMemo(() => normalizeIds(expansion.value), [expansion.value]);
  const expandedSet = useMemo(() => new Set(expandedValues), [expandedValues]);
  const selectedSet = useMemo(
    () => new Set(selectedValues.filter((id) => collection.get(id) !== undefined)),
    [collection, selectedValues],
  );

  const [focusedId, setFocusedId] = useState<string | null>(null);
  const reconcileFocusedId = useCallback((id: string | null) => setFocusedId(id), []);
  const previousCollectionRef = useRef(collection);
  const resolvedViewRootId =
    viewRoot.value === null || collection.get(viewRoot.value) !== undefined ? viewRoot.value : null;
  useEffect(() => {
    const previous = previousCollectionRef.current;
    if (previous === collection) return;
    previousCollectionRef.current = collection;
    const removed = new Set(
      [...previous.byId.keys()].filter((id) => collection.get(id) === undefined),
    );
    if (!selection.controlled && removed.size > 0) {
      selection.resetValue(selection.value.filter((id) => !removed.has(id)));
    }
    if (!expansion.controlled && removed.size > 0) {
      expansion.resetValue(expansion.value.filter((id) => !removed.has(id)));
    }
    if (focusedId !== null && removed.has(focusedId)) {
      const oldPath = previous.getPath(focusedId);
      const fallback =
        [...oldPath].reverse().find((record) => collection.get(record.id) !== undefined)?.id ??
        null;
      reconcileFocusedId(fallback);
    }
    if (
      !viewRoot.controlled &&
      viewRoot.value !== null &&
      collection.get(viewRoot.value) === undefined
    ) {
      const oldPath = previous.get(viewRoot.value) ? previous.getPath(viewRoot.value) : [];
      const fallback =
        [...oldPath].reverse().find((record) => collection.get(record.id) !== undefined)?.id ??
        null;
      viewRoot.resetValue(fallback);
    }
  }, [collection, expansion, focusedId, reconcileFocusedId, selection, viewRoot]);

  const model = useMemo(
    () =>
      createTreeViewModel(view, {
        collection,
        expandedIds: expandedSet,
        viewRootId: view === "focus" ? resolvedViewRootId : null,
        options: viewOptions,
      }),
    [collection, expandedSet, resolvedViewRootId, view, viewOptions],
  );
  if (model.visibleRecords.length > maxVisibleNodes) {
    throw new MiaixzUiError({
      code: "UI_TREE_VISIBLE_LIMIT",
      details: { visibleCount: model.visibleRecords.length, limit: maxVisibleNodes },
    });
  }

  const visibleIds = useMemo(
    () => new Set(model.visibleRecords.map((record) => record.record.id)),
    [model.visibleRecords],
  );
  let resolvedFocusedId = focusedId;
  while (resolvedFocusedId !== null && !visibleIds.has(resolvedFocusedId)) {
    resolvedFocusedId = collection.get(resolvedFocusedId)?.parentId ?? null;
  }
  resolvedFocusedId ??=
    selectedValues.find((id) => visibleIds.has(id)) ?? model.visibleRecords[0]?.record.id ?? null;

  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const typeaheadRef = useRef("");
  const typeaheadTimerRef = useRef<number | undefined>(undefined);
  const descriptionPrefix = useId().replaceAll(":", "");
  const [batchPending, setBatchPending] = useState(false);
  const [lastExpansionResult, setLastExpansionResult] = useState<TreeExpansionResult | null>(null);
  const batchRef = useRef<{ token: number; controller: AbortController } | null>(null);
  const batchCacheKeyRef = useRef(options.asyncCacheKey);

  useEffect(() => {
    if (Object.is(batchCacheKeyRef.current, options.asyncCacheKey)) return;
    batchCacheKeyRef.current = options.asyncCacheKey;
    batchRef.current?.controller.abort();
  }, [options.asyncCacheKey]);

  useEffect(
    () => () => {
      if (typeaheadTimerRef.current !== undefined) window.clearTimeout(typeaheadTimerRef.current);
      batchRef.current?.controller.abort();
    },
    [],
  );

  const requireRecord = useCallback((id: string) => {
    const record = latestCollectionRef.current.get(id);
    if (record === undefined) {
      throw new MiaixzUiError({ code: "UI_TREE_CONFIG_INVALID", details: { id } });
    }
    return record;
  }, []);
  const requestExpanded = useCallback(
    (ids: readonly string[]) => {
      if (!expansion.readOnly) expansion.setValue(normalizeIds(ids));
    },
    [expansion],
  );
  const focus = useCallback(
    (id: string) => {
      requireRecord(id);
      setFocusedId(id);
      itemRefs.current.get(id)?.focus({ preventScroll: true });
    },
    [requireRecord],
  );
  const select = useCallback(
    (id: string) => {
      const record = requireRecord(id);
      if (selectionMode === "none" || record.node.disabled === true || selection.readOnly) return;
      const next =
        selectionMode === "single"
          ? [id]
          : selectedValues.includes(id)
            ? selectedValues.filter((candidate) => candidate !== id)
            : [...selectedValues, id];
      selection.setValue(next);
    },
    [requireRecord, selectedValues, selection, selectionMode],
  );
  const collapse = useCallback(
    (id: string) => {
      requireRecord(id);
      requestExpanded(expandedValues.filter((candidate) => candidate !== id));
    },
    [expandedValues, requestExpanded, requireRecord],
  );
  const expand = useCallback(
    async (id: string) => {
      const record = requireRecord(id);
      if (record.node.disabled === true || expansion.readOnly) return;
      let children = latestCollectionRef.current.getChildren(id);
      if (!record.loaded && record.expandable) {
        const loaded = await loader.load(record.node);
        if (loaded === undefined) return;
        children = latestCollectionRef.current.getChildren(id);
      }
      if (children.length > 0) requestExpanded([...expandedValues, id]);
    },
    [expandedValues, expansion.readOnly, loader, requestExpanded, requireRecord],
  );
  const toggle = useCallback(
    (id: string) => {
      const record = requireRecord(id);
      if (record.node.disabled === true || expansion.readOnly) return;
      if (expandedSet.has(id)) collapse(id);
      else void expand(id).catch(() => undefined);
    },
    [collapse, expand, expandedSet, expansion.readOnly, requireRecord],
  );
  const setViewRoot = useCallback(
    (id: string | null) => {
      if (id !== null) requireRecord(id);
      if (viewRoot.readOnly) return;
      viewRoot.setValue(id);
      if (id !== null) setFocusedId(id);
    },
    [requireRecord, viewRoot],
  );
  const enter = useCallback(
    async (id: string) => {
      const record = requireRecord(id);
      if (
        record.node.disabled === true ||
        viewRoot.readOnly ||
        (!expandedSet.has(id) && expansion.readOnly)
      ) {
        return;
      }
      let children = latestCollectionRef.current.getChildren(id);
      if (!record.loaded && record.expandable) {
        const loaded = await loader.load(record.node);
        if (loaded === undefined) return;
        children = latestCollectionRef.current.getChildren(id);
      }
      if (children.length === 0) return;
      if (!expandedSet.has(id)) requestExpanded([...expandedValues, id]);
      viewRoot.setValue(id);
      setFocusedId(id);
    },
    [
      expandedSet,
      expandedValues,
      expansion.readOnly,
      loader,
      requestExpanded,
      requireRecord,
      viewRoot,
    ],
  );
  const leave = useCallback(() => {
    if (resolvedViewRootId === null || viewRoot.readOnly) return;
    viewRoot.setValue(collection.get(resolvedViewRootId)?.parentId ?? null);
  }, [collection, resolvedViewRootId, viewRoot]);
  const retry = useCallback(
    async (id: string) => {
      const record = requireRecord(id);
      await loader.load(record.node);
    },
    [loader, requireRecord],
  );

  const constrainBulkResult = useCallback(
    (result: TreeExpansionResult, base: readonly string[]): TreeExpansionResult => {
      const accepted = [...base];
      let truncated = result.truncated;
      for (const id of result.expandedIds) {
        if (accepted.includes(id)) continue;
        const candidate = [...accepted, id];
        const candidateModel = createTreeViewModel(view, {
          collection: latestCollectionRef.current,
          expandedIds: new Set(candidate),
          viewRootId: view === "focus" ? resolvedViewRootId : null,
          options: viewOptions,
        });
        if (candidateModel.visibleRecords.length > maxVisibleNodes) {
          truncated = true;
          continue;
        }
        accepted.push(id);
      }
      return {
        ...result,
        status: result.status === "completed" && truncated ? "partial" : result.status,
        expandedIds: Object.freeze(accepted),
        truncated,
      };
    },
    [maxVisibleNodes, resolvedViewRootId, view, viewOptions],
  );
  const runBatch = useCallback(
    async (
      batchOptions: TreeExpandAllOptions,
      targetDepth = false,
    ): Promise<TreeExpansionResult> => {
      if (expansion.readOnly) {
        const result = createReadOnlyTreeExpansionResult();
        setLastExpansionResult(result);
        return result;
      }
      batchRef.current?.controller.abort();
      const controller = new AbortController();
      const token = (batchRef.current?.token ?? 0) + 1;
      batchRef.current = { token, controller };
      const abort = () => controller.abort();
      batchOptions.signal?.addEventListener("abort", abort, { once: true });
      setBatchPending(true);
      const snapshot = [...expandedValues];
      try {
        const result = await runTreeExpansion<Value>({
          ...batchOptions,
          signal: controller.signal,
          targetDepth,
          getCollection: () => latestCollectionRef.current,
          ...(options.loadChildren === undefined
            ? {}
            : {
                loadRecord: async (record) => {
                  const loaded = loader.load(record.node);
                  if (loaded !== undefined) await loaded;
                },
              }),
        });
        if (controller.signal.aborted || batchRef.current?.token !== token) {
          return { ...result, status: "aborted", aborted: true };
        }
        const constrained = constrainBulkResult(result, snapshot);
        if (constrained.status !== "aborted") requestExpanded(constrained.expandedIds);
        setLastExpansionResult(constrained);
        return constrained;
      } finally {
        batchOptions.signal?.removeEventListener("abort", abort);
        if (batchRef.current?.token === token) {
          batchRef.current = null;
          setBatchPending(false);
        }
      }
    },
    [
      constrainBulkResult,
      expandedValues,
      expansion.readOnly,
      loader,
      options.loadChildren,
      requestExpanded,
    ],
  );
  const expandAll = useCallback(
    (batchOptions: TreeExpandAllOptions = {}) => runBatch(batchOptions),
    [runBatch],
  );
  const expandToDepth = useCallback(
    (depth: number, scope: TreeExpansionScope = { type: "tree" }) => {
      requirePositiveInteger(depth, "depth");
      return runBatch({ scope, load: "loaded", maxDepth: depth }, true);
    },
    [runBatch],
  );
  const collapseAll = useCallback(
    (scope: TreeExpansionScope = { type: "tree" }) => {
      if (expansion.readOnly) return;
      const inScope = new Set(latestCollectionRef.current.getExpandableIds(scope));
      requestExpanded(expandedValues.filter((id) => !inScope.has(id)));
    },
    [expandedValues, expansion.readOnly, requestExpanded],
  );

  const expandSiblings = useCallback(
    (id: string) => {
      if (expansion.readOnly) return;
      const record = requireRecord(id);
      const siblings = collection.getChildren(record.parentId);
      requestExpanded([
        ...expandedValues,
        ...siblings
          .filter((candidate) => candidate.expandable && candidate.node.disabled !== true)
          .map((candidate) => candidate.id),
      ]);
    },
    [collection, expandedValues, expansion.readOnly, requestExpanded, requireRecord],
  );
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>, id: string) => {
      const record = model.byId.get(id);
      if (record === undefined) return;
      event.stopPropagation();
      if (
        event.key.length === 1 &&
        event.key !== " " &&
        event.key !== "*" &&
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
        const match = findTreeTypeaheadMatch(model.visibleRecords, id, typeaheadRef.current);
        if (match !== undefined) focus(match.record.id);
        return;
      }
      const action = resolveTreeNavigation(
        event.key,
        record,
        model.visibleRecords,
        expandedSet,
        record.record.expandable,
      );
      if (action.kind === "none") return;
      event.preventDefault();
      if (action.kind === "focus") focus(action.id);
      else if (action.kind === "expand") void expand(action.id).catch(() => undefined);
      else if (action.kind === "collapse") collapse(action.id);
      else if (action.kind === "expand-siblings") expandSiblings(action.id);
      else if (action.kind === "enter") void enter(action.id).catch(() => undefined);
      else select(action.id);
    },
    [collapse, enter, expand, expandSiblings, expandedSet, focus, model, select],
  );

  const getRootProps = useCallback(
    (): TreeRootInteractionProps => ({
      role: "tree",
      "aria-label": options.label,
      "aria-multiselectable": selectionMode === "multiple" || undefined,
    }),
    [options.label, selectionMode],
  );
  const getItemProps = useCallback(
    (id: string): TreeItemInteractionProps => {
      const record = model.byId.get(id);
      if (record === undefined) {
        throw new MiaixzUiError({ code: "UI_TREE_CONFIG_INVALID", details: { id } });
      }
      const descriptionId = `${descriptionPrefix}-tree-${encodeURIComponent(id)}-description`;
      return {
        role: "treeitem",
        "aria-label": record.record.node.textValue,
        "aria-describedby":
          record.record.node.description === undefined ? undefined : descriptionId,
        "aria-level": record.semanticLevel,
        "aria-posinset": record.semanticPosition,
        "aria-setsize": record.semanticSetSize,
        "aria-expanded": record.record.expandable ? record.disclosed : undefined,
        "aria-selected": selectionMode === "none" ? undefined : selectedSet.has(id),
        "aria-disabled": record.record.node.disabled || undefined,
        "aria-busy": loader.loadingIds.has(id) || undefined,
        tabIndex: id === resolvedFocusedId ? 0 : -1,
        ref: (element: HTMLDivElement | null) => {
          if (element === null) itemRefs.current.delete(id);
          else itemRefs.current.set(id, element);
        },
        onFocus: () => setFocusedId(id),
        onKeyDown: (event) => handleKeyDown(event, id),
      };
    },
    [
      descriptionPrefix,
      handleKeyDown,
      loader.loadingIds,
      model.byId,
      resolvedFocusedId,
      selectedSet,
      selectionMode,
    ],
  );
  const getExpanderProps = useCallback(
    (id: string): TreeExpanderInteractionProps => {
      const record = model.byId.get(id);
      if (record === undefined) {
        throw new MiaixzUiError({ code: "UI_TREE_CONFIG_INVALID", details: { id } });
      }
      return {
        "aria-hidden": true,
        onClick: (event) => {
          event.stopPropagation();
          focus(id);
          if (record.boundary) void enter(id).catch(() => undefined);
          else if (record.record.expandable) toggle(id);
        },
      };
    },
    [enter, focus, model.byId, toggle],
  );

  const actions = useMemo<TreeControllerActions<Value>>(
    () => ({
      select,
      focus,
      toggle,
      expand,
      collapse,
      expandAll,
      collapseAll,
      expandToDepth,
      enter,
      leave,
      setViewRoot,
      retry,
      getNode: (id) => collection.get(id)?.node,
    }),
    [
      collapse,
      collapseAll,
      collection,
      enter,
      expand,
      expandAll,
      expandToDepth,
      focus,
      leave,
      retry,
      select,
      setViewRoot,
      toggle,
    ],
  );

  return {
    collection,
    view: model,
    state: {
      selectedIds: selectedSet,
      expandedIds: expandedSet,
      loadingIds: loader.loadingIds,
      errorIds: loader.errorIds,
      focusedId: resolvedFocusedId,
      viewRootId: resolvedViewRootId,
      expansionReadOnly: expansion.readOnly,
      viewRootReadOnly: viewRoot.readOnly,
      batchPending,
      lastExpansionResult,
    },
    actions,
    getRootProps,
    getItemProps,
    getExpanderProps,
  };
}
