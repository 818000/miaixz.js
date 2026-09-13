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

import {
  createElement,
  forwardRef,
  type ElementType,
  type ForwardedRef,
  type ReactNode,
} from "react";

import { classNames } from "../shared/class-names.js";
import type { MiaixzThemeComponentRegistry } from "./components.js";
import { useMiaixzThemeComponent } from "./context.js";

/* eslint-disable jsdoc/require-jsdoc --
 * Private structural runtime types are self-describing.
 */

interface UntypedThemeComponent {
  readonly defaultProps?: Readonly<Record<string, unknown>>;
  readonly slotClassNames?: Readonly<Record<string, string>>;
  readonly variants?: readonly {
    readonly props: Readonly<Record<string, unknown>>;
    readonly slotClassNames: Readonly<Record<string, string>>;
  }[];
}

type UntypedSlotProps =
  | Readonly<Record<string, unknown>>
  | ((ownerState: Readonly<Record<string, unknown>>) => Readonly<Record<string, unknown>>);

/* eslint-enable jsdoc/require-jsdoc
 */

/**
 * Applies the canonical Theme defaults and slot classes to one public DOM component.
 *
 * @typeParam Name - Exact registry component name.
 * @typeParam Component - Original public component type preserved by the wrapper.
 * @param name - Registry key used to resolve the nearest Theme configuration.
 * @param component - Component implementation receiving the resolved public properties.
 * @returns A ref-forwarding component with the original public type.
 * @internal
 */
export function withMiaixzThemeComponent<
  Name extends keyof MiaixzThemeComponentRegistry,
  Component,
>(name: Name, component: Component): Component {
  const implementation = component as ElementType;
  const themed = forwardRef(function MiaixzThemedComponent(
    incomingProps: Record<string, unknown>,
    ref: ForwardedRef<unknown>,
  ): ReactNode {
    const theme = useMiaixzThemeComponent(name) as UntypedThemeComponent;
    const resolvedProps: Record<string, unknown> = {
      ...theme.defaultProps,
      ...incomingProps,
    };
    const configuredSlots = new Set([
      ...Object.keys(theme.slotClassNames ?? {}),
      ...(theme.variants ?? []).flatMap((variant) => Object.keys(variant.slotClassNames)),
    ]);
    const incomingSlotProps = resolvedProps.slotProps as
      Readonly<Record<string, UntypedSlotProps | undefined>> | undefined;
    const supportsSlots =
      incomingSlotProps !== undefined || [...configuredSlots].some((slot) => slot !== "root");

    if (supportsSlots) {
      const themedSlotProps: Record<string, UntypedSlotProps> = {};
      for (const [slot, slotProps] of Object.entries(incomingSlotProps ?? {})) {
        if (slotProps !== undefined) themedSlotProps[slot] = slotProps;
      }
      for (const slot of configuredSlots) {
        const consumerSlotProps = incomingSlotProps?.[slot];
        themedSlotProps[slot] = (ownerState) => {
          const resolvedConsumer =
            typeof consumerSlotProps === "function"
              ? consumerSlotProps(ownerState)
              : (consumerSlotProps ?? {});
          return {
            ...resolvedConsumer,
            className: classNames(
              ...getThemeSlotClassNames(theme, ownerState, slot),
              resolvedConsumer.className as string | undefined,
            ),
          };
        };
      }
      resolvedProps.slotProps = themedSlotProps;
    } else if (configuredSlots.has("root")) {
      resolvedProps.className = classNames(
        ...getThemeSlotClassNames(theme, resolvedProps, "root"),
        resolvedProps.className as string | undefined,
      );
    }

    if (ref !== null) resolvedProps.ref = ref;
    return createElement(implementation, resolvedProps);
  });
  themed.displayName = `MiaixzThemed(${String(name)})`;
  return themed as unknown as Component;
}

/**
 * Resolves ordered base and variant classes without exposing an untyped public API.
 *
 * @param theme - Runtime component Theme configuration.
 * @param ownerState - Effective component owner state.
 * @param slot - Component slot being rendered.
 * @returns Ordered Theme classes for the slot.
 */
function getThemeSlotClassNames(
  theme: UntypedThemeComponent,
  ownerState: Readonly<Record<string, unknown>>,
  slot: string,
): readonly (string | undefined)[] {
  const classes: (string | undefined)[] = [theme.slotClassNames?.[slot]];
  for (const variant of theme.variants ?? []) {
    const matches = Object.entries(variant.props).every(([key, expected]) =>
      Object.is(ownerState[key], expected),
    );
    if (matches) classes.push(variant.slotClassNames[slot]);
  }
  return classes;
}
