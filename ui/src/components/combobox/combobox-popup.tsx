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

import type { ReactNode, RefObject, UIEvent } from "react";

import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { Icon } from "../icon/icon.js";
import type { MiaixzComboboxLoadState } from "./combobox-controller.js";
import type { ComboboxOwnerState, ComboboxSlotProps } from "./combobox.types.js";

/* eslint-disable jsdoc/require-jsdoc --
 * This module exposes implementation-only composition contracts.
 */

/*
 * Configures the shared popup surface and finite message states.
 */
export interface ComboboxPopupProps {
  readonly component: "combobox" | "picker";
  readonly surfaceRef: RefObject<HTMLDivElement | null>;
  readonly listboxId: string;
  readonly labelId: string;
  readonly state: MiaixzComboboxLoadState;
  readonly ownerState: ComboboxOwnerState;
  readonly slotProps: ComboboxSlotProps | undefined;
  readonly loadingMessage: ReactNode;
  readonly errorMessage: ReactNode;
  readonly emptyMessage: ReactNode;
  readonly refineMessage: ReactNode;
  readonly empty: boolean;
  readonly hasNextPage: boolean;
  readonly onLoadNextPage: () => void;
  readonly children: ReactNode;
}

/**
 * Renders one fixed popup surface, message, or listbox branch.
 *
 * @param props - Popup state, messages, and ready listbox.
 * @returns One manual popover surface.
 */
export function ComboboxPopup(props: ComboboxPopupProps) {
  const surfaceProps = mergeMiaixzSlotProps({
    ownerState: props.ownerState,
    defaultProps: { className: `miaixz-${props.component}-surface` },
    slotProps: props.slotProps?.surface,
    internalRef: props.surfaceRef,
    internalProps: {
      popover: "manual" as const,
      role: "region",
      "aria-labelledby": props.labelId,
      "data-state": props.state,
      onScroll: (event: UIEvent<HTMLDivElement>) => {
        const element = event.currentTarget;
        if (
          props.hasNextPage &&
          element.scrollHeight - element.scrollTop <= element.clientHeight + 1
        ) {
          props.onLoadNextPage();
        }
      },
    },
    ownedProps: ["popover", "role", "aria-labelledby", "data-state"],
  });
  const messageProps = mergeMiaixzSlotProps({
    ownerState: props.ownerState,
    defaultProps: { className: `miaixz-${props.component}-message` },
    slotProps: props.slotProps?.message,
    internalProps: { id: props.listboxId },
    ownedProps: ["id"],
  });
  let content = props.children;
  if (props.state === "loading") {
    content = (
      <div {...messageProps} role="status">
        <Icon name="LoaderCircle" size="control" className="miaixz-icon-spin" />
        {props.loadingMessage}
      </div>
    );
  } else if (props.state === "error") {
    content = (
      <div {...messageProps} role="alert">
        {props.errorMessage}
      </div>
    );
  } else if (props.state === "limit") {
    content = (
      <div {...messageProps} role="status">
        {props.refineMessage}
      </div>
    );
  } else if (props.empty) {
    content = (
      <div {...messageProps} role="status">
        {props.emptyMessage}
      </div>
    );
  }
  return <div {...surfaceProps}>{content}</div>;
}
