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

import { useMemo, type CSSProperties, type ElementType, type Ref } from "react";

import { MiaixzUiError } from "../errors/ui-error.js";
import { classNames } from "./class-names.js";

/**
 * Defines a renderer that is valid for one explicitly whitelisted slot.
 */
export type MiaixzSlotComponent<Props> = ElementType<Props>;

/**
 * Defines static or owner-state-derived properties for one component slot.
 */
export type MiaixzSlotProps<OwnerState, Props> =
  Partial<Props> | ((ownerState: Readonly<OwnerState>) => Partial<Props>);

/**
 * Describes the minimum event surface required for cancellable internal behavior.
 */
interface MiaixzSlotEvent {
  /**
   * Reports whether an earlier public handler cancelled internal behavior.
   */
  readonly defaultPrevented: boolean;
}

/**
 * Configures the one slot-property merge path used by all multi-node components.
 */
export interface MiaixzMergedSlotPropsOptions<OwnerState, Props extends object, Instance> {
  /**
   * Supplies immutable component state to functional slot properties.
   */
  readonly ownerState: Readonly<OwnerState>;

  /**
   * Supplies package defaults, including the canonical slot class.
   */
  readonly defaultProps?: Partial<Props> | undefined;

  /**
   * Supplies component defaults from the active Theme.
   */
  readonly themeDefaultProps?: Partial<Props> | undefined;

  /**
   * Supplies properties from the component's public props.
   */
  readonly componentProps?: Partial<Props> | undefined;

  /**
   * Supplies ordered component and matching-variant classes from the active Theme.
   */
  readonly themeClassNames?: readonly (string | undefined)[] | undefined;

  /**
   * Supplies consumer slot properties after every Theme layer.
   */
  readonly slotProps?: MiaixzSlotProps<OwnerState, Props> | undefined;

  /**
   * Supplies fixed component-owned semantics and internal event behavior.
   */
  readonly internalProps?: Partial<Props> | undefined;

  /**
   * Lists semantics whose value is owned by the component.
   */
  readonly ownedProps?: readonly (keyof Props)[] | undefined;

  /**
   * Supplies the implementation ref that must receive the instance first.
   */
  readonly internalRef?: Ref<Instance> | undefined;

  /**
   * Supplies the component's forwarded public ref.
   */
  readonly forwardedRef?: Ref<Instance> | undefined;
}

/**
 * Resolves and merges one slot without introducing a parallel component-specific algorithm.
 *
 * @typeParam OwnerState - Immutable component state exposed to slot functions.
 * @typeParam Props - Exact native or renderer property type for the slot.
 * @typeParam Instance - Concrete DOM or renderer instance type.
 * @param options - Ordered public, Theme, slot, and internal inputs.
 * @returns Final properties for the slot renderer.
 * @internal
 */
export function mergeMiaixzSlotProps<OwnerState, Props extends object, Instance>(
  options: MiaixzMergedSlotPropsOptions<OwnerState, Props, Instance>,
): Props {
  const resolvedSlotProps =
    typeof options.slotProps === "function"
      ? options.slotProps(options.ownerState)
      : (options.slotProps ?? {});
  const sources = [
    options.defaultProps ?? {},
    options.themeDefaultProps ?? {},
    options.componentProps ?? {},
  ];
  const componentProps = Object.assign({}, ...sources) as Partial<Props>;
  const internalProps = options.internalProps ?? {};
  const componentRecord = componentProps as Record<string, unknown>;
  const slotRecord = resolvedSlotProps as Record<string, unknown>;
  const internalRecord = internalProps as Record<string, unknown>;

  for (const ownedProp of options.ownedProps ?? []) {
    const key = String(ownedProp);
    if (key in slotRecord && !Object.is(slotRecord[key], internalRecord[key])) {
      throw new MiaixzUiError({
        code: "UI_SLOT_OWNED_PROP_CONFLICT",
        details: { property: key },
      });
    }
  }

  const result = {
    ...componentProps,
    ...resolvedSlotProps,
    ...internalProps,
  } as Record<string, unknown>;
  const className = classNames(
    ...sources.map((source) => (source as Record<string, unknown>).className as string | undefined),
    ...(options.themeClassNames ?? []),
    slotRecord.className as string | undefined,
  );
  if (className !== undefined) result.className = className;

  const style = Object.assign(
    {},
    ...sources.map(
      (source) => ((source as Record<string, unknown>).style as CSSProperties | undefined) ?? {},
    ),
    (slotRecord.style as CSSProperties | undefined) ?? {},
    (internalRecord.style as CSSProperties | undefined) ?? {},
  );
  if (Object.keys(style).length > 0) result.style = style;

  const eventNames = new Set(
    [
      ...Object.keys(componentRecord),
      ...Object.keys(slotRecord),
      ...Object.keys(internalRecord),
    ].filter((key) => /^on[A-Z]/u.test(key)),
  );
  for (const eventName of eventNames) {
    const componentHandler = asEventHandler(componentRecord[eventName]);
    const slotHandler = asEventHandler(slotRecord[eventName]);
    const internalHandler = asEventHandler(internalRecord[eventName]);
    if (
      componentHandler === undefined &&
      slotHandler === undefined &&
      internalHandler === undefined
    ) {
      continue;
    }
    result[eventName] = (event: MiaixzSlotEvent) => {
      componentHandler?.(event);
      slotHandler?.(event);
      if (!event.defaultPrevented) internalHandler?.(event);
    };
  }

  const slotRef = slotRecord.ref as Ref<Instance> | undefined;
  if (
    options.internalRef !== undefined ||
    options.forwardedRef !== undefined ||
    slotRef !== undefined
  ) {
    result.ref = (instance: Instance | null) => {
      setMiaixzSlotRef(options.internalRef, instance);
      setMiaixzSlotRef(options.forwardedRef, instance);
      setMiaixzSlotRef(slotRef, instance);
    };
  }

  return result as Props;
}

/**
 * Memoizes the canonical slot merge for component renderers.
 *
 * @typeParam OwnerState - Immutable component state exposed to slot functions.
 * @typeParam Props - Exact native or renderer property type for the slot.
 * @typeParam Instance - Concrete DOM or renderer instance type.
 * @param options - Ordered public, Theme, slot, and internal inputs.
 * @returns Final properties for the slot renderer.
 * @internal
 */
export function useMergedSlotProps<OwnerState, Props extends object, Instance>(
  options: MiaixzMergedSlotPropsOptions<OwnerState, Props, Instance>,
): Props {
  return useMemo(() => mergeMiaixzSlotProps(options), [options]);
}

/**
 * Narrows an unknown property to the supported event-handler shape.
 *
 * @param value - Candidate slot event handler.
 * @returns Callable event handler or undefined.
 */
function asEventHandler(value: unknown): ((event: MiaixzSlotEvent) => void) | undefined {
  return typeof value === "function" ? (value as (event: MiaixzSlotEvent) => void) : undefined;
}

/**
 * Writes one instance to a callback or mutable object ref.
 *
 * @typeParam Instance - Concrete slot instance type.
 * @param ref - React ref that receives the instance.
 * @param instance - Mounted instance or null during cleanup.
 */
function setMiaixzSlotRef<Instance>(
  ref: Ref<Instance> | undefined,
  instance: Instance | null,
): void {
  if (typeof ref === "function") {
    ref(instance);
  } else if (ref !== null && ref !== undefined) {
    ref.current = instance;
  }
}
