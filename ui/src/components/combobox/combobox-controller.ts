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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { MiaixzCollectionController } from "../../shared/collection/controller.js";
import type { MiaixzOption, MiaixzOptionSource } from "./combobox.types.js";

/* eslint-disable jsdoc/require-jsdoc --
 * This module exposes implementation-only controller contracts.
 */

const maximumVisibleOptions = 500;
const queryDebounceMilliseconds = 200;

/*
 * Describes the finite option-source state rendered by both public pickers.
 */
export type MiaixzComboboxLoadState = "ready" | "loading" | "error" | "limit";

/*
 * Configures the shared option data adapter.
 */
export interface MiaixzComboboxControllerOptions<Value extends string> {
  /*
   * Supplies the only static or asynchronous data source.
   */
  readonly source: MiaixzOptionSource<Value>;
  /*
   * Supplies the current search query.
   */
  readonly query: string;
  /*
   * Enables asynchronous loading while the popup is visible.
   */
  readonly open: boolean;
}

/*
 * Contains validated visible options and pagination actions.
 */
export interface MiaixzComboboxControllerResult<Value extends string> {
  /*
   * Contains the complete currently visible page set.
   */
  readonly options: readonly MiaixzOption<Value>[];
  /*
   * Reports the active loading or message state.
   */
  readonly state: MiaixzComboboxLoadState;
  /*
   * Reports whether another asynchronous page can be requested.
   */
  readonly hasNextPage: boolean;
  /*
   * Requests the next page once, when one is available.
   */
  readonly loadNextPage: () => void;
}

/**
 * Adapts the fixed static/asynchronous source union to one validated visible collection.
 *
 * @typeParam Value - Stable string value carried by each option.
 * @param options - Source, query, and popup visibility.
 * @returns Validated visible options plus pagination state.
 */
export function useComboboxController<Value extends string>(
  options: MiaixzComboboxControllerOptions<Value>,
): MiaixzComboboxControllerResult<Value> {
  const asynchronous = "loadOptions" in options.source;
  const staticOptions = "options" in options.source ? options.source.options : undefined;
  const loader = "loadOptions" in options.source ? options.source.loadOptions : undefined;
  const validatedStatic = useMemo(
    () => (staticOptions === undefined ? undefined : validateMiaixzOptions(staticOptions, true)),
    [staticOptions],
  );
  const [loadedOptions, setLoadedOptions] = useState<readonly MiaixzOption<Value>[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [state, setState] = useState<MiaixzComboboxLoadState>("ready");
  const [fatalError, setFatalError] = useState<Error | null>(null);
  const [requestState, setRequestState] = useState<{
    readonly query: string;
    readonly cursor: string | null;
    readonly key: number;
  } | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const optionsRef = useRef<readonly MiaixzOption<Value>[]>([]);
  const requestKeyRef = useRef(0);

  useEffect(() => {
    if (!asynchronous || !options.open || loader === undefined) {
      requestRef.current?.abort();
      return undefined;
    }
    let current = true;
    queueMicrotask(() => {
      if (!current) return;
      optionsRef.current = [];
      setLoadedOptions([]);
      setNextCursor(null);
      setState("loading");
      setFatalError(null);
      requestKeyRef.current += 1;
      setRequestState({ query: options.query, cursor: null, key: requestKeyRef.current });
    });
    return () => {
      current = false;
    };
  }, [asynchronous, loader, options.open, options.query]);

  useEffect(() => {
    if (loader === undefined || requestState === null) return undefined;
    const firstPage = requestState.cursor === null;
    requestRef.current?.abort();
    const request = new AbortController();
    requestRef.current = request;
    queueMicrotask(() => {
      if (!request.signal.aborted) setState("loading");
    });
    const timer = globalThis.setTimeout(
      () => {
        void loader({
          query: requestState.query,
          cursor: requestState.cursor,
          signal: request.signal,
        })
          .then((page) => {
            if (request.signal.aborted) return;
            const merged = firstPage ? page.options : [...optionsRef.current, ...page.options];
            if (merged.length > maximumVisibleOptions) {
              setNextCursor(null);
              setState("limit");
              return;
            }
            try {
              const validated = validateMiaixzOptions(merged, false);
              optionsRef.current = validated;
              setLoadedOptions(validated);
              setNextCursor(page.nextCursor);
              setState("ready");
            } catch (error) {
              setFatalError(error instanceof Error ? error : new Error(String(error)));
            }
          })
          .catch(() => {
            if (!request.signal.aborted) setState("error");
          });
      },
      firstPage ? queryDebounceMilliseconds : 0,
    );
    return () => {
      globalThis.clearTimeout(timer);
      request.abort();
    };
  }, [loader, requestState]);

  if (fatalError !== null) throw fatalError;

  const visibleOptions = useMemo(() => {
    if (validatedStatic === undefined) return loadedOptions;
    const normalized = options.query.trim().toLocaleLowerCase();
    if (normalized.length === 0) return validatedStatic;
    return validatedStatic.filter((option) =>
      option.textValue.toLocaleLowerCase().includes(normalized),
    );
  }, [loadedOptions, options.query, validatedStatic]);
  const loadNextPage = useCallback(() => {
    if (state === "loading" || nextCursor === null) return;
    requestKeyRef.current += 1;
    setRequestState({ query: options.query, cursor: nextCursor, key: requestKeyRef.current });
  }, [nextCursor, options.query, state]);
  return {
    options: visibleOptions,
    state,
    hasNextPage: asynchronous && nextCursor !== null,
    loadNextPage,
  };
}

/**
 * Validates option identity, text, group consistency, and the static collection ceiling.
 *
 * @typeParam Value - Stable string value carried by each option.
 * @param options - Complete currently visible option set.
 * @param enforceLimit - Whether exceeding the limit is a configuration error.
 * @returns The same immutable option sequence after validation.
 */
export function validateMiaixzOptions<Value extends string>(
  options: readonly MiaixzOption<Value>[],
  enforceLimit: boolean,
): readonly MiaixzOption<Value>[] {
  if (enforceLimit && options.length > maximumVisibleOptions) {
    throw new MiaixzUiError({
      code: "UI_COLLECTION_VISIBLE_LIMIT",
    });
  }
  const groups = new Map<string, string>();
  for (const option of options) {
    const existing = option.group === undefined ? undefined : groups.get(option.group.id);
    if (existing !== undefined && existing !== option.group?.label) {
      throw new MiaixzUiError({
        code: "UI_COLLECTION_DUPLICATE_ID",
      });
    }
    if (option.group !== undefined && existing === undefined) {
      groups.set(option.group.id, option.group.label);
    }
  }
  new MiaixzCollectionController(
    options.map((option) => ({
      id: option.value,
      value: option.value,
      textValue: option.textValue,
      ...(option.disabled === undefined ? {} : { disabled: option.disabled }),
    })),
  );
  return options;
}
