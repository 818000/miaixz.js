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

import { useLayoutEffect, useState, type RefObject } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";

/**
 * Describes an action identity accepted by the shared capacity algorithm.
 */
export interface MiaixzActionIdentity {
  /**
   * Supplies the stable identity used by React and action state.
   */
  readonly id: string;
}

/**
 * Describes stable visible and overflow partitions.
 */
export interface MiaixzActionPartition<Action> {
  /**
   * Contains the leading actions that fit.
   */
  readonly visible: readonly Action[];
  /**
   * Contains remaining actions in original order.
   */
  readonly overflow: readonly Action[];
}

/**
 * Partitions actions by original index without relying on identity filtering.
 *
 * @typeParam Action - Action record type.
 * @param actions - Ordered actions to partition.
 * @param capacity - Number of leading visible actions.
 * @returns Stable leading and remaining slices.
 */
export function partitionActions<Action>(
  actions: readonly Action[],
  capacity: number,
): MiaixzActionPartition<Action> {
  const boundary = Math.max(0, Math.min(actions.length, Math.floor(capacity)));
  return { visible: actions.slice(0, boundary), overflow: actions.slice(boundary) };
}

/**
 * Rejects duplicate action ids in development and production builds.
 *
 * @param actions - Action identities to validate.
 */
export function assertUniqueActionIds(actions: readonly MiaixzActionIdentity[]): void {
  const ids = new Set<string>();
  for (const action of actions) {
    if (ids.has(action.id)) {
      throw new MiaixzUiError({ code: "UI_ACTION_DUPLICATE_ID" });
    }
    ids.add(action.id);
  }
}

/**
 * Configures one measured action layout.
 */
export interface MiaixzActionCapacityOptions {
  /**
   * References the available-width container.
   */
  readonly rootRef: RefObject<HTMLElement | null>;
  /**
   * References invisible action recipe measurements in source order.
   */
  readonly actionMeasureRefs: readonly RefObject<HTMLElement | null>[];
  /**
   * References the always-visible primary action measurement.
   */
  readonly primaryMeasureRef?: RefObject<HTMLElement | null> | undefined;
  /**
   * References the overflow trigger measurement.
   */
  readonly overflowMeasureRef: RefObject<HTMLElement | null>;
}

/**
 * Calculates the largest complete leading action sequence that can fit.
 *
 * @param availableWidth - Root content-box width.
 * @param actionWidths - Measured action widths in source order.
 * @param columnGap - Computed root column gap.
 * @param primaryWidth - Always-visible primary action width, or zero.
 * @param overflowWidth - Overflow trigger width reserved only when required.
 * @returns Number of leading actions that fit completely.
 */
export function calculateMiaixzActionCapacity(
  availableWidth: number,
  actionWidths: readonly number[],
  columnGap: number,
  primaryWidth: number,
  overflowWidth: number,
): number {
  if (actionWidths.length === 0 || availableWidth <= 0) return 0;
  const primaryCount = primaryWidth > 0 ? 1 : 0;
  const allItemsWidth = actionWidths.reduce((sum, width) => sum + width, primaryWidth);
  const allGaps = Math.max(0, actionWidths.length + primaryCount - 1) * columnGap;
  if (allItemsWidth + allGaps <= availableWidth) return actionWidths.length;

  const fixedCount = primaryCount + 1;
  let usedWidth = primaryWidth + overflowWidth + Math.max(0, fixedCount - 1) * columnGap;
  let capacity = 0;
  for (const actionWidth of actionWidths) {
    const nextWidth = usedWidth + actionWidth + columnGap;
    if (nextWidth > availableWidth) break;
    usedWidth = nextWidth;
    capacity += 1;
  }
  return capacity;
}

/**
 * Measures action recipes before paint and observes geometry and font changes.
 *
 * @param options - Root and invisible measurement references.
 * @returns Current leading visible-action capacity, initially zero for SSR and hydration.
 */
export function useActionCapacity(options: MiaixzActionCapacityOptions): number {
  const [capacity, setCapacity] = useState(0);
  useLayoutEffect(() => {
    const root = options.rootRef.current;
    const overflow = options.overflowMeasureRef.current;
    const actionElements = options.actionMeasureRefs.map((reference) => reference.current);
    if (root === null || overflow === null || actionElements.some((element) => element === null)) {
      return undefined;
    }
    const ownerWindow = root.ownerDocument.defaultView;
    if (ownerWindow === null) return undefined;
    const recalculate = () => {
      const computed = ownerWindow.getComputedStyle(root);
      const parsedGap = Number.parseFloat(computed.columnGap);
      setCapacity(
        calculateMiaixzActionCapacity(
          root.clientWidth,
          actionElements.map((element) => element?.getBoundingClientRect().width ?? 0),
          Number.isFinite(parsedGap) ? parsedGap : 0,
          options.primaryMeasureRef?.current?.getBoundingClientRect().width ?? 0,
          overflow.getBoundingClientRect().width,
        ),
      );
    };
    recalculate();
    const ResizeObserverConstructor = ownerWindow.ResizeObserver;
    const observer =
      ResizeObserverConstructor === undefined
        ? undefined
        : new ResizeObserverConstructor(recalculate);
    observer?.observe(root);
    observer?.observe(overflow);
    for (const element of actionElements) if (element !== null) observer?.observe(element);
    if (
      options.primaryMeasureRef?.current !== null &&
      options.primaryMeasureRef?.current !== undefined
    ) {
      observer?.observe(options.primaryMeasureRef.current);
    }
    const fonts = root.ownerDocument.fonts;
    fonts?.addEventListener("loadingdone", recalculate);
    void fonts?.ready.then(recalculate);
    return () => {
      observer?.disconnect();
      fonts?.removeEventListener("loadingdone", recalculate);
    };
  }, [options]);
  return capacity;
}
