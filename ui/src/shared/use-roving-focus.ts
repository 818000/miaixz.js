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

import { useCallback, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { MiaixzCollectionController } from "./collection/controller.js";
import type { MiaixzCollectionDirection, MiaixzCollectionOrientation } from "./collection/types.js";

/**
 * Configures roving focus with an explicit, component-owned DOM adapter.
 */
export interface MiaixzRovingFocusOptions {
  /**
   * Supplies focus candidates in semantic order.
   */
  readonly elements: readonly HTMLElement[];
  /**
   * Reports whether a candidate is unavailable.
   */
  readonly isDisabled: (element: HTMLElement, index: number) => boolean;
  /**
   * Selects active arrow-key axes.
   */
  readonly orientation: MiaixzCollectionOrientation;
  /**
   * Controls focus wrapping.
   */
  readonly loop: boolean;
  /**
   * Controls horizontal arrow mapping.
   */
  readonly direction: MiaixzCollectionDirection;
  /**
   * Runs semantic activation for Enter or Space.
   */
  readonly onActivate?:
    ((element: HTMLElement, event: KeyboardEvent<HTMLElement>) => void) | undefined;
}

/**
 * Describes tab-index and event bindings returned by useRovingFocus.
 */
export interface MiaixzRovingFocusResult {
  /**
   * Returns zero for the active element and minus one for all others.
   */
  readonly getTabIndex: (element: HTMLElement) => 0 | -1;
  /**
   * Marks a mounted enabled element active, such as after pointer focus.
   */
  readonly setActiveElement: (element: HTMLElement) => void;
  /**
   * Handles navigation and activation from the collection root.
   */
  readonly onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  /**
   * Exposes the retained active element.
   */
  readonly activeElement: HTMLElement | null;
}

/**
 * Owns one roving tabindex across a caller-supplied ordered element collection.
 *
 * @param options - Explicit ordered elements and keyboard behavior.
 * @returns Roving tabindex bindings for the collection renderer.
 */
export function useRovingFocus(options: MiaixzRovingFocusOptions): MiaixzRovingFocusResult {
  const [requestedActive, setRequestedActive] = useState<HTMLElement | null>(null);
  const controllerRef = useRef(new MiaixzCollectionController([]));
  const items = useMemo(
    () =>
      options.elements.map((element, index) => ({
        id: String(index),
        textValue: element.textContent?.trim() || String(index),
        disabled: options.isDisabled(element, index),
      })),
    [options],
  );
  const enabledElements = options.elements.filter(
    (element, index) => !options.isDisabled(element, index),
  );
  const activeElement =
    requestedActive !== null && enabledElements.includes(requestedActive)
      ? requestedActive
      : (enabledElements[0] ?? null);

  const setActiveElement = useCallback(
    (element: HTMLElement) => {
      const index = options.elements.indexOf(element);
      if (index >= 0 && !options.isDisabled(element, index)) setRequestedActive(element);
    },
    [options],
  );
  const getTabIndex = useCallback(
    (element: HTMLElement): 0 | -1 => (element === activeElement ? 0 : -1),
    [activeElement],
  );
  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      controllerRef.current.updateItems(items);
      const eventElement = options.elements.find(
        (element) => element === event.target || element.contains(event.target as Node),
      );
      if (eventElement !== undefined) {
        controllerRef.current.setActiveId(String(options.elements.indexOf(eventElement)));
      }
      const result = controllerRef.current.handleKey(event.key, {
        orientation: options.orientation,
        direction: options.direction,
        loop: options.loop,
      });
      if (!result.handled) return;
      event.preventDefault();
      const next = result.activeId === null ? null : options.elements[Number(result.activeId)];
      if (next === undefined || next === null) return;
      setRequestedActive(next);
      if (result.activate) options.onActivate?.(next, event);
      else next.focus({ preventScroll: true });
    },
    [items, options],
  );

  return { getTabIndex, setActiveElement, onKeyDown, activeElement };
}
