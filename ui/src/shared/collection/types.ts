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
 * Describes one ordered item consumed by the shared collection controller.
 */
export interface MiaixzCollectionItem {
  /**
   * Supplies the stable identity retained across asynchronous updates.
   */
  readonly id: string;
  /**
   * Supplies normalized text used for typeahead.
   */
  readonly textValue: string;
  /**
   * Supplies an optional form or selection value requiring uniqueness.
   */
  readonly value?: string | undefined;
  /**
   * Removes the item from keyboard navigation.
   */
  readonly disabled?: boolean | undefined;
}

/**
 * Defines collection geometry for arrow-key mapping.
 */
export type MiaixzCollectionOrientation = "horizontal" | "vertical" | "both";

/**
 * Defines inline arrow-key direction.
 */
export type MiaixzCollectionDirection = "ltr" | "rtl";

/**
 * Configures deterministic collection keyboard navigation.
 */
export interface MiaixzCollectionKeyboardOptions {
  /**
   * Selects which arrow-key axes are active.
   */
  readonly orientation: MiaixzCollectionOrientation;
  /**
   * Selects inline direction for horizontal arrows.
   */
  readonly direction: MiaixzCollectionDirection;
  /**
   * Wraps navigation at the first and last enabled items.
   */
  readonly loop: boolean;
}

/**
 * Describes the result of one collection keyboard command.
 */
export interface MiaixzCollectionKeyboardResult {
  /**
   * Reports whether the key belongs to the active collection model.
   */
  readonly handled: boolean;
  /**
   * Supplies the next active item, retaining null for an empty collection.
   */
  readonly activeId: string | null;
  /**
   * Requests activation for Enter or Space without moving focus.
   */
  readonly activate: boolean;
}
