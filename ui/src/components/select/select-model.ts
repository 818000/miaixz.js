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

import { MiaixzUiError } from "../../errors/ui-error.js";
import { MiaixzCollectionController } from "../../shared/collection/controller.js";
import type { SelectEntry, SelectGroup, SelectOption } from "./select.types.js";

/**
 * Pairs one flattened option with its optional owning group.
 */
export interface FlatSelectOption {
  /**
   * Supplies the flattened option.
   */
  readonly option: SelectOption;
  /**
   * Retains the owning group or null for a top-level option.
   */
  readonly group: SelectGroup | null;
}

/**
 * Validates entries and returns options in render order.
 *
 * @param items - Public Select entries.
 * @returns Valid flattened options.
 */
export function validateAndFlattenSelectEntries(items: readonly SelectEntry[]): FlatSelectOption[] {
  const ids = new Set<string>();
  const options: FlatSelectOption[] = [];
  const registerId = (id: string) => {
    if (ids.has(id)) throw new MiaixzUiError({ code: "UI_COLLECTION_DUPLICATE_ID" });
    ids.add(id);
  };
  for (const entry of items) {
    registerId(entry.id);
    if (entry.kind === "option") options.push({ option: entry, group: null });
    else {
      for (const option of entry.options) {
        registerId(option.id);
        options.push({ option, group: entry });
      }
    }
  }
  for (const { option } of options) {
    if (option.value === "") throw new MiaixzUiError({ code: "UI_SELECT_EMPTY_OPTION_VALUE" });
  }
  new MiaixzCollectionController(options.map(({ option }) => option));
  return options;
}

/**
 * Joins defined ARIA id references without blank tokens.
 *
 * @param ids - Optional id references.
 * @returns A joined id reference or undefined.
 */
export function joinIds(...ids: readonly (string | undefined)[]): string | undefined {
  const joined = ids.filter((id): id is string => id !== undefined && id.length > 0).join(" ");
  return joined.length === 0 ? undefined : joined;
}

/**
 * Immutable fallback used when Theme defaults omit required items.
 */
export const emptySelectItems: readonly SelectEntry[] = Object.freeze([]);
