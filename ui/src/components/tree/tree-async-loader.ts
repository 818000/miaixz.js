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

/* eslint-disable jsdoc/require-jsdoc -- Internal lazy-loading state is covered through Tree.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import type { TreeNode } from "./tree.types.js";

export interface TreeAsyncLoader<Value> {
  readonly childCache: ReadonlyMap<string, readonly TreeNode<Value>[]>;
  readonly loadingIds: ReadonlySet<string>;
  readonly errorIds: ReadonlySet<string>;
  readonly load: (
    node: Readonly<TreeNode<Value>>,
  ) => Promise<readonly TreeNode<Value>[]> | undefined;
}

export function useTreeAsyncLoader<Value>(
  loadChildren:
    | ((
        node: Readonly<TreeNode<Value>>,
        signal: AbortSignal,
      ) => Promise<readonly TreeNode<Value>[]>)
    | undefined,
): TreeAsyncLoader<Value> {
  const [childCache, setChildCache] = useState<ReadonlyMap<string, readonly TreeNode<Value>[]>>(
    () => new Map(),
  );
  const [loadingIds, setLoadingIds] = useState<ReadonlySet<string>>(() => new Set());
  const [errorIds, setErrorIds] = useState<ReadonlySet<string>>(() => new Set());
  const pendingRef = useRef(
    new Map<
      string,
      { controller: AbortController; promise: Promise<readonly TreeNode<Value>[]> }
    >(),
  );

  useEffect(
    () => () => {
      for (const pending of pendingRef.current.values()) pending.controller.abort();
      pendingRef.current.clear();
    },
    [],
  );

  const load = useCallback(
    (node: Readonly<TreeNode<Value>>) => {
      if (loadChildren === undefined || node.disabled === true) return undefined;
      const pending = pendingRef.current.get(node.id);
      if (pending !== undefined) return pending.promise;
      const controller = new AbortController();
      setLoadingIds((current) => new Set(current).add(node.id));
      setErrorIds((current) => {
        const next = new Set(current);
        next.delete(node.id);
        return next;
      });
      const promise = loadChildren(node, controller.signal)
        .then((children) => {
          if (controller.signal.aborted) return children;
          setChildCache((current) => new Map(current).set(node.id, children));
          return children;
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return [];
          setErrorIds((current) => new Set(current).add(node.id));
          throw error;
        })
        .finally(() => {
          if (pendingRef.current.get(node.id)?.promise === promise) {
            pendingRef.current.delete(node.id);
          }
          if (!controller.signal.aborted) {
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
    [loadChildren],
  );
  return { childCache, loadingIds, errorIds, load };
}
