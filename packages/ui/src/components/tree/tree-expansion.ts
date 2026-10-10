/*
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");           ~
 ~ you may not use this file except in compliance with the License.          ~
 ~ You may obtain a copy of the License at                                   ~
 ~ http://www.apache.org/licenses/LICENSE-2.0                                ~
 ~ Unless required by applicable law or agreed to in writing, software       ~
 ~ distributed under the License is distributed on an "AS IS" BASIS.         ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
*/

/**
 * Implements the tree expansion module.
 */

import { MiaixzUiError } from "../../errors/ui-error.js";
import type {
  TreeCollection,
  TreeCollectionRecord,
  TreeExpansionScope,
} from "./tree-collection.js";

/**
 * Options for expanding a loaded or recursively loaded tree scope.
 */
export interface TreeExpandAllOptions {
  readonly scope?: TreeExpansionScope;
  readonly load?: "loaded" | "recursive";
  readonly maxDepth?: number;
  readonly maxNodes?: number;
  readonly concurrency?: number;
  readonly signal?: AbortSignal;
}

/**
 * Stable aggregate result of one bulk expansion request.
 */
export interface TreeExpansionResult {
  readonly status: "completed" | "partial" | "aborted" | "read-only";
  readonly expandedIds: readonly string[];
  readonly loadedIds: readonly string[];
  readonly failedIds: readonly string[];
  readonly unresolvedIds: readonly string[];
  readonly truncated: boolean;
  readonly aborted: boolean;
}

/**
 * Internal dependencies required by the bulk expansion traversal.
 */
export interface RunTreeExpansionOptions<Value> extends TreeExpandAllOptions {
  readonly getCollection: () => TreeCollection<Value>;
  readonly loadRecord?: (record: TreeCollectionRecord<Value>) => Promise<void>;
  readonly targetDepth?: boolean;
}

/**
 * Validates an optional positive integer expansion limit.
 * @param value - Candidate limit.
 * @param name - Public option name used in diagnostics.
 */
function requirePositiveInteger(value: number | undefined, name: string): void {
  if (value !== undefined && (!Number.isInteger(value) || value < 1)) {
    throw new MiaixzUiError({ code: "UI_TREE_CONFIG_INVALID", details: { option: name } });
  }
}

/**
 * Resolves the stable starting records for an expansion scope.
 * @param collection - Current indexed tree snapshot.
 * @param scope - Tree, subtree, or sibling expansion scope.
 * @returns Scope roots in source order.
 */
function getScopeRoots<Value>(
  collection: TreeCollection<Value>,
  scope: TreeExpansionScope,
): readonly TreeCollectionRecord<Value>[] {
  if (scope.type === "tree") return collection.roots;
  const record = collection.get(scope.id);
  if (record === undefined) {
    throw new MiaixzUiError({ code: "UI_TREE_CONFIG_INVALID", details: { id: scope.id } });
  }
  return scope.type === "subtree" ? [record] : collection.getChildren(record.parentId);
}

/**
 * Traverses one scope in stable breadth-first order and resolves expandable IDs.
 * @param options - Traversal limits, loading hooks, abort signal, and current collection accessor.
 * @returns Aggregate expansion, loading, failure, and truncation outcome.
 */
export async function runTreeExpansion<Value>(
  options: RunTreeExpansionOptions<Value>,
): Promise<TreeExpansionResult> {
  const mode = options.load ?? "loaded";
  const concurrency = options.concurrency ?? 4;
  const maxNodes = options.maxNodes ?? (mode === "recursive" ? 1000 : Number.MAX_SAFE_INTEGER);
  requirePositiveInteger(concurrency, "concurrency");
  requirePositiveInteger(options.maxDepth, "maxDepth");
  requirePositiveInteger(maxNodes, "maxNodes");
  const scope = options.scope ?? { type: "tree" };
  let level = getScopeRoots(options.getCollection(), scope).map((record) => record.id);
  const visited = new Set<string>();
  const expandedIds: string[] = [];
  const loadedIds: string[] = [];
  const failedIds: string[] = [];
  const unresolvedIds: string[] = [];
  let relativeDepth = 1;
  let truncated = false;

  while (level.length > 0) {
    if (options.signal?.aborted === true) {
      return {
        status: "aborted",
        expandedIds: Object.freeze(expandedIds),
        loadedIds: Object.freeze(loadedIds),
        failedIds: Object.freeze(failedIds),
        unresolvedIds: Object.freeze(unresolvedIds),
        truncated,
        aborted: true,
      };
    }
    const accepted: string[] = [];
    for (const id of level) {
      if (visited.has(id)) continue;
      if (visited.size >= maxNodes) {
        truncated = true;
        break;
      }
      visited.add(id);
      accepted.push(id);
    }
    if (accepted.length === 0) break;

    if (mode === "recursive") {
      for (let offset = 0; offset < accepted.length; offset += concurrency) {
        const batch = accepted.slice(offset, offset + concurrency);
        const outcomes = await Promise.all(
          batch.map(async (id) => {
            const record = options.getCollection().get(id);
            if (record === undefined || record.loaded || !record.expandable) {
              return { id, status: "skipped" as const };
            }
            if (options.loadRecord === undefined) {
              return { id, status: "unresolved" as const };
            }
            try {
              await options.loadRecord(record);
              return { id, status: "loaded" as const };
            } catch {
              return { id, status: "failed" as const };
            }
          }),
        );
        if (!options.signal?.aborted) {
          for (const outcome of outcomes) {
            if (outcome.status === "loaded") loadedIds.push(outcome.id);
            else if (outcome.status === "failed") failedIds.push(outcome.id);
            else if (outcome.status === "unresolved") unresolvedIds.push(outcome.id);
          }
        }
        if (options.signal?.aborted) break;
      }
    }

    const nextLevel: string[] = [];
    for (const id of accepted) {
      const collection = options.getCollection();
      const record = collection.get(id);
      if (record === undefined) continue;
      const children = collection.getChildren(id);
      const mayDisclose = record.loaded && children.length > 0;
      if (mayDisclose && (options.maxDepth === undefined || relativeDepth < options.maxDepth)) {
        expandedIds.push(id);
      }
      if (children.length === 0) continue;
      if (options.maxDepth !== undefined && relativeDepth >= options.maxDepth) {
        if (mode === "recursive" && options.targetDepth !== true) truncated = true;
        continue;
      }
      nextLevel.push(...children.map((child) => child.id));
    }
    level = nextLevel;
    relativeDepth += 1;
  }

  if (options.signal?.aborted === true) {
    return {
      status: "aborted",
      expandedIds: Object.freeze(expandedIds),
      loadedIds: Object.freeze(loadedIds),
      failedIds: Object.freeze(failedIds),
      unresolvedIds: Object.freeze(unresolvedIds),
      truncated,
      aborted: true,
    };
  }
  const partial = failedIds.length > 0 || unresolvedIds.length > 0 || truncated;
  return {
    status: partial ? "partial" : "completed",
    expandedIds: Object.freeze([...new Set(expandedIds)]),
    loadedIds: Object.freeze([...new Set(loadedIds)]),
    failedIds: Object.freeze([...new Set(failedIds)]),
    unresolvedIds: Object.freeze([...new Set(unresolvedIds)]),
    truncated,
    aborted: false,
  };
}

/**
 * Creates the fixed result returned by read-only bulk actions.
 * @returns A stable read-only expansion result with no changed identifiers.
 */
export function createReadOnlyTreeExpansionResult(): TreeExpansionResult {
  return Object.freeze({
    status: "read-only",
    expandedIds: Object.freeze([]),
    loadedIds: Object.freeze([]),
    failedIds: Object.freeze([]),
    unresolvedIds: Object.freeze([]),
    truncated: false,
    aborted: false,
  });
}
