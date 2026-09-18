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

import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { IconButton } from "../action/icon-button.js";
import type {
  ViewSelectorOwnerState,
  ViewSelectorProps,
  ViewSelectorRootAttributes,
  ViewSelectorValue,
} from "./selector.types.js";

/**
 * Renders the shared list/grid view selector with stable option order and geometry.
 *
 * @public
 */
export const Selector = forwardRef<HTMLDivElement, ViewSelectorProps>(function Selector(
  {
    "aria-label": ariaLabel,
    value,
    onValueChange,
    listLabel,
    gridLabel,
    disabled = false,
    ...props
  },
  ref,
) {
  const ownerState: ViewSelectorOwnerState = { value, disabled };
  const select = (nextValue: ViewSelectorValue) => {
    if (!disabled && nextValue !== value) onValueChange(nextValue);
  };

  return (
    <div
      {...mergeMiaixzSlotProps<ViewSelectorOwnerState, ViewSelectorRootAttributes, HTMLDivElement>({
        ownerState,
        defaultProps: { className: "miaixz-view-selector" },
        componentProps: props,
        forwardedRef: ref,
        internalProps: {
          role: "group",
          "aria-label": ariaLabel,
          "data-ui": "view-selector",
          "data-value": value,
        },
        ownedProps: ["role", "aria-label", "data-ui", "data-value"],
      })}
    >
      <IconButton
        appearance="glyph"
        className="miaixz-view-selector-option"
        disabled={disabled}
        icon="Menu"
        label={listLabel}
        onClick={() => select("list")}
        pressed={value === "list"}
      />
      <IconButton
        appearance="glyph"
        className="miaixz-view-selector-option"
        disabled={disabled}
        icon="LayoutGrid"
        label={gridLabel}
        onClick={() => select("grid")}
        pressed={value === "grid"}
      />
    </div>
  );
});
