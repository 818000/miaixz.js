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

import { forwardRef } from "react";

import { assertMiaixzAccessibleName } from "../../accessibility/assert-accessible-name.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";
import type {
  TransferListHeaderAttributes,
  TransferListOwnerState,
  TransferListProps,
} from "./transfer-list.types.js";

/**
 * Renders the shared source-target pane shell for transfer workflows. @public
 */
export const TransferList = withMiaixzThemeComponent(
  "TransferList",
  forwardRef<HTMLElement, TransferListProps>(function TransferList(
    {
      label,
      source,
      sourceLabel,
      sourceHeader,
      target,
      targetLabel,
      targetHeader,
      targetSize = "standard",
      mobilePaneSize = "comfortable",
      sourceHeaderLayout = "stack",
      targetHeaderLayout = "between",
      slotProps,
      ...props
    },
    ref,
  ) {
    assertMiaixzAccessibleName({ ariaLabel: label });
    assertMiaixzAccessibleName({ ariaLabel: sourceLabel });
    assertMiaixzAccessibleName({ ariaLabel: targetLabel });
    const ownerState: TransferListOwnerState = {
      targetSize,
      mobilePaneSize,
      sourceHeaderLayout,
      targetHeaderLayout,
    };
    return (
      <section
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-transfer-list" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: {
            "data-ui": "transfer-list",
            "aria-label": label,
            "data-target-size": targetSize,
            "data-mobile-pane-size": mobilePaneSize,
            "data-source-header-layout": sourceHeaderLayout,
            "data-target-header-layout": targetHeaderLayout,
          },
          ownedProps: [
            "aria-label",
            "data-target-size",
            "data-mobile-pane-size",
            "data-source-header-layout",
            "data-target-header-layout",
          ],
        })}
      >
        <section
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-transfer-list-source" },
            slotProps: slotProps?.sourcePane,
            internalProps: {
              "data-ui": "transfer-list-source",
              "aria-label": sourceLabel,
            },
            ownedProps: ["aria-label"],
          })}
        >
          <div
            {...mergeMiaixzSlotProps<
              TransferListOwnerState,
              TransferListHeaderAttributes,
              HTMLDivElement
            >({
              ownerState,
              defaultProps: { className: "miaixz-transfer-list-header" },
              slotProps: slotProps?.sourceHeader,
              internalProps: { "data-layout": sourceHeaderLayout },
              ownedProps: ["data-layout"],
            })}
          >
            {sourceHeader}
          </div>
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-transfer-list-body" },
              slotProps: slotProps?.sourceBody,
            })}
          >
            {source}
          </div>
        </section>
        <aside
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-transfer-list-target" },
            slotProps: slotProps?.targetPane,
            internalProps: {
              "data-ui": "transfer-list-target",
              "aria-label": targetLabel,
            },
            ownedProps: ["aria-label"],
          })}
        >
          <div
            {...mergeMiaixzSlotProps<
              TransferListOwnerState,
              TransferListHeaderAttributes,
              HTMLDivElement
            >({
              ownerState,
              defaultProps: { className: "miaixz-transfer-list-header" },
              slotProps: slotProps?.targetHeader,
              internalProps: { "data-layout": targetHeaderLayout },
              ownedProps: ["data-layout"],
            })}
          >
            {targetHeader}
          </div>
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-transfer-list-body" },
              slotProps: slotProps?.targetBody,
            })}
          >
            {target}
          </div>
        </aside>
      </section>
    );
  }),
);
