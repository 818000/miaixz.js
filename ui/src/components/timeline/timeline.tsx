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
 * Public Timeline contracts are defined by the component type module.
 */
import { forwardRef } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { TimelineOwnerState, TimelineProps } from "./timeline.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/*
 * Renders invariant ol/li timeline semantics with customizable item bodies. @public
 */
export const Timeline = withMiaixzThemeComponent(
  "Timeline",
  forwardRef<HTMLOListElement, TimelineProps>(function Timeline(
    { items, layout = "track", renderItem, slotProps, ...props },
    ref,
  ) {
    const ids = new Set<string>();
    for (const item of items) {
      if (ids.has(item.id)) {
        throw new MiaixzUiError({
          code: "UI_TIMELINE_DUPLICATE_ID",
          details: { id: item.id },
        });
      }
      ids.add(item.id);
    }
    const rootState: TimelineOwnerState = { layout, itemId: undefined, tone: undefined };
    return (
      <ol
        {...mergeMiaixzSlotProps({
          ownerState: rootState,
          defaultProps: { className: "miaixz-timeline" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: { "data-layout": layout },
          ownedProps: ["data-layout"],
        })}
      >
        {items.map((item) => {
          const ownerState: TimelineOwnerState = { layout, itemId: item.id, tone: item.tone };
          const defaultBody = (
            <>
              <div
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-timeline-heading" },
                  slotProps: slotProps?.heading,
                })}
              >
                <div
                  {...mergeMiaixzSlotProps({
                    ownerState,
                    defaultProps: { className: "miaixz-timeline-title" },
                    slotProps: slotProps?.title,
                  })}
                >
                  {item.title}
                </div>
                <span
                  {...mergeMiaixzSlotProps({
                    ownerState,
                    defaultProps: { className: "miaixz-timeline-status" },
                    slotProps: slotProps?.status,
                  })}
                >
                  {item.status}
                </span>
              </div>
              {item.description !== undefined && (
                <div
                  {...mergeMiaixzSlotProps({
                    ownerState,
                    defaultProps: { className: "miaixz-timeline-description" },
                    slotProps: slotProps?.description,
                  })}
                >
                  {item.description}
                </div>
              )}
              {item.meta !== undefined && (
                <div
                  {...mergeMiaixzSlotProps({
                    ownerState,
                    defaultProps: { className: "miaixz-timeline-meta" },
                    slotProps: slotProps?.meta,
                  })}
                >
                  {item.meta}
                </div>
              )}
            </>
          );
          return (
            <li
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-timeline-item" },
                slotProps: slotProps?.item,
                internalProps: { "data-tone": item.tone },
              })}
              key={item.id}
            >
              <span
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-timeline-node" },
                  slotProps: slotProps?.node,
                  internalProps: { "aria-hidden": true },
                  ownedProps: ["aria-hidden"],
                })}
              />
              <div
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-timeline-body" },
                  slotProps: slotProps?.body,
                })}
              >
                {renderItem === undefined ? defaultBody : renderItem(item, defaultBody)}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }),
);
