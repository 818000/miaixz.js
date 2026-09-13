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

/* eslint-disable jsdoc/require-jsdoc --
 * Public View contracts are defined by the component type module.
 */
import { forwardRef, type ReactNode } from "react";

import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { Header } from "../header/header.js";
import { Navigation } from "../navigation/navigation.js";
import { Tabs } from "../tabs/tabs.js";
import type { NavigationEntry } from "../navigation/navigation.types.js";
import type { TabsEntry } from "../tabs/tabs.types.js";
import type { ViewOwnerState, ViewProps } from "./view.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/*
 * Renders one explicit content, route-navigation, or tabs view composition. @public
 */
export const View = withMiaixzThemeComponent(
  "View",
  forwardRef<HTMLElement, ViewProps>(function View(
    {
      "aria-label": ariaLabel,
      title,
      description,
      actions,
      surface = "plain",
      density = "standard",
      headingLevel = 1,
      mode = "content",
      slotProps,
      ...props
    },
    ref,
  ) {
    const ownerState: ViewOwnerState = { mode, surface, density };
    const {
      children: content,
      navigationLabel,
      items,
      value,
      defaultValue,
      onValueChange,
      ...attributes
    } = props as typeof props & {
      readonly children?: ReactNode;
      readonly navigationLabel?: string;
      readonly items?: readonly NavigationEntry[] | readonly TabsEntry[];
      readonly value?: string;
      readonly defaultValue?: string;
      readonly onValueChange?: (value: string) => void;
    };
    const headerSlot = resolveSlot(slotProps?.header, ownerState);
    const actionsSlot = resolveSlot(slotProps?.actions, ownerState);
    const contentSlot = resolveSlot(slotProps?.content, ownerState);
    return (
      <section
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-view" },
          componentProps: attributes,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: {
            "aria-label": ariaLabel,
            "data-mode": mode,
            "data-surface": surface,
            "data-density": density,
          },
          ownedProps: ["aria-label", "data-mode", "data-surface", "data-density"],
        })}
      >
        <Header
          actions={actions}
          density={density}
          description={description}
          headingLevel={headingLevel}
          slotProps={{
            ...(headerSlot === undefined ? {} : { root: headerSlot }),
            ...(actionsSlot === undefined ? {} : { actions: actionsSlot }),
          }}
          spacing="none"
          title={title}
        />
        {mode === "navigation" && (
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-view-navigation" },
              slotProps: slotProps?.navigation,
            })}
          >
            <Navigation
              density={density}
              items={items as readonly NavigationEntry[]}
              label={navigationLabel as string}
              orientation="horizontal"
            />
          </div>
        )}
        {mode === "tabs" && (
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-view-navigation" },
              slotProps: slotProps?.navigation,
            })}
          >
            <Tabs
              activationMode="manual"
              items={items as readonly TabsEntry[]}
              label={navigationLabel as string}
              {...(value === undefined
                ? {
                    ...(defaultValue === undefined ? {} : { defaultValue }),
                    ...(onValueChange === undefined ? {} : { onValueChange }),
                  }
                : {
                    value,
                    ...(onValueChange === undefined ? {} : { onValueChange }),
                  })}
              {...(contentSlot === undefined ? {} : { slotProps: { panel: contentSlot } })}
            />
          </div>
        )}
        {mode !== "tabs" && (
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-view-content" },
              slotProps: slotProps?.content,
            })}
          >
            {content}
          </div>
        )}
      </section>
    );
  }),
);

function resolveSlot<Props extends object>(
  slot: ((state: Readonly<ViewOwnerState>) => Partial<Props>) | Partial<Props> | undefined,
  ownerState: ViewOwnerState,
): Partial<Props> | undefined {
  return typeof slot === "function" ? slot(ownerState) : slot;
}
