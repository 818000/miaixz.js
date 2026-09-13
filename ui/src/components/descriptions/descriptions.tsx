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
 * Public Descriptions contracts are defined by the component type module.
 */
import { forwardRef } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { DescriptionsOwnerState, DescriptionsProps } from "./descriptions.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/*
 * Renders one invariant semantic definition-list structure. @public
 */
export const Descriptions = withMiaixzThemeComponent(
  "Descriptions",
  forwardRef<HTMLDListElement, DescriptionsProps>(function Descriptions(
    { items, layout = "grid", columns = 1, density = "standard", slotProps, ...props },
    ref,
  ) {
    const ids = new Set<string>();
    for (const item of items) {
      if (ids.has(item.id)) {
        throw new MiaixzUiError({
          code: "UI_COLLECTION_DUPLICATE_ID",
          details: { id: item.id },
        });
      }
      ids.add(item.id);
    }
    const rootState: DescriptionsOwnerState = {
      layout,
      columns,
      density,
      itemId: undefined,
    };
    return (
      <dl
        {...mergeMiaixzSlotProps({
          ownerState: rootState,
          defaultProps: { className: "miaixz-descriptions" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: {
            "data-layout": layout,
            "data-columns": columns,
            "data-density": density,
          },
          ownedProps: ["data-layout", "data-columns", "data-density"],
        })}
      >
        {items.map((item) => {
          const ownerState: DescriptionsOwnerState = { layout, columns, density, itemId: item.id };
          return (
            <div
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-descriptions-item" },
                slotProps: slotProps?.item,
              })}
              key={item.id}
            >
              <dt
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-descriptions-term" },
                  slotProps: slotProps?.term,
                })}
              >
                {item.label}
              </dt>
              <dd
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-descriptions-definition" },
                  slotProps: slotProps?.definition,
                })}
              >
                {item.value}
              </dd>
            </div>
          );
        })}
      </dl>
    );
  }),
);
