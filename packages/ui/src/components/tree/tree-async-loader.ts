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
 * Loads and caches tree children while tracking cancellation, loading, and error state.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import type { TreeNode } from "./tree.types.js";

/**
 * Abortable child-loading operations and cached results owned by a tree instance.
 */
export interface TreeAsyncLoader<Value> {
  readonly childCache: ReadonlyMap<string, readonly TreeNode<Value>[]>;
  readonly loadingIds: ReadonlySet<string>;
  readonly errorIds: ReadonlySet<string>;
  readonly load: (
    node: Readonly<TreeNode<Value>>,
  ) => Promise<readonly TreeNode<Value>[]> | undefined;
  readonly abortAll: () => void;
}

/**
 * Coordinates cancellable, deduplicated loading and caching of asynchronous tree children.
 *
 * @typeParam Value - Application value stored by each tree node.
 * @param loadChildren - Optional asynchronous child loader.
 * @param asyncCacheKey - Generation key that invalidates cached children when it changes.
 * @param validateCandidate - Validates the complete candidate cache before it is committed.
 * @returns Child cache, pending and error identifiers, and the stable load function.
 */
export function useTreeAsyncLoader<Value>(
  loadChildren:
    | ((
        node: Readonly<TreeNode<Value>>,
        signal: AbortSignal,
      ) => Promise<readonly TreeNode<Value>[]>)
    | undefined,
  asyncCacheKey?: string | number,
  validateCandidate?: (cache: ReadonlyMap<string, readonly TreeNode<Value>[]>) => void,
): TreeAsyncLoader<Value> {
  const [childCache, setChildCache] = useState<ReadonlyMap<string, readonly TreeNode<Value>[]>>(
    () => new Map(),
  );
  const [loadingIds, setLoadingIds] = useState<ReadonlySet<string>>(() => new Set());
  const [errorIds, setErrorIds] = useState<ReadonlySet<string>>(() => new Set());
  const childCacheRef = useRef<ReadonlyMap<string, readonly TreeNode<Value>[]>>(new Map());
  const generationRef = useRef(0);
  const cacheKeyRef = useRef(asyncCacheKey);
  const pendingRef = useRef(
    new Map<
      string,
      { controller: AbortController; promise: Promise<readonly TreeNode<Value>[]> }
    >(),
  );

  const abortAll = useCallback(() => {
    generationRef.current += 1;
    for (const pending of pendingRef.current.values()) pending.controller.abort();
    pendingRef.current.clear();
  }, []);

  useEffect(
    () => () => {
      abortAll();
    },
    [abortAll],
  );

  useEffect(() => {
    if (Object.is(cacheKeyRef.current, asyncCacheKey)) return;
    cacheKeyRef.current = asyncCacheKey;
    abortAll();
    const empty = new Map<string, readonly TreeNode<Value>[]>();
    childCacheRef.current = empty;
    setChildCache(empty);
    setLoadingIds(new Set());
    setErrorIds(new Set());
  }, [abortAll, asyncCacheKey]);

  const load = useCallback(
    (node: Readonly<TreeNode<Value>>) => {
      if (loadChildren === undefined || node.disabled === true) return undefined;
      const pending = pendingRef.current.get(node.id);
      if (pending !== undefined) return pending.promise;
      const controller = new AbortController();
      const generation = generationRef.current;
      setLoadingIds((current) => new Set(current).add(node.id));
      setErrorIds((current) => {
        const next = new Set(current);
        next.delete(node.id);
        return next;
      });
      const promise = loadChildren(node, controller.signal)
        .then((children) => {
          if (controller.signal.aborted || generation !== generationRef.current) return children;
          const candidate = new Map(childCacheRef.current).set(node.id, children);
          validateCandidate?.(candidate);
          childCacheRef.current = candidate;
          setChildCache(candidate);
          return children;
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted || generation !== generationRef.current) return [];
          setErrorIds((current) => new Set(current).add(node.id));
          throw error;
        })
        .finally(() => {
          if (pendingRef.current.get(node.id)?.promise === promise) {
            pendingRef.current.delete(node.id);
          }
          if (!controller.signal.aborted && generation === generationRef.current) {
            setLoadingIds((current) => {
              const next = new Set(current);
              next.delete(node.id);
              return next;
            });
          }
        });
      pendingRef.current.set(node.id, { controller, promise });
      return promise;
    },
    [loadChildren, validateCandidate],
  );
  return { childCache, loadingIds, errorIds, load, abortAll };
}
