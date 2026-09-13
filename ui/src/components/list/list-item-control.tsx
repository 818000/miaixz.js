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
 * This internal renderer has no public API surface.
 */
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { ListItemOwnerState, ListItemProps, ListItemSlotProps } from "./list.types.js";

export function ListItemControl({
  item,
  ownerState,
  slotProps,
  children,
}: {
  readonly item: ListItemProps;
  readonly ownerState: ListItemOwnerState;
  readonly slotProps: ListItemSlotProps | undefined;
  readonly children: ReactNode;
}) {
  if (item.kind === "navigation") {
    return (
      <a
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-list-item-control" },
          componentProps: item.anchorProps,
          slotProps: slotProps?.primary as MiaixzSlotProps<
            ListItemOwnerState,
            AnchorHTMLAttributes<HTMLAnchorElement>
          >,
          internalProps: { href: item.href },
          ownedProps: ["href"],
        })}
      >
        {children}
      </a>
    );
  }
  if (item.kind === "command") {
    return (
      <button
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-list-item-control" },
          componentProps: item.buttonProps,
          slotProps: slotProps?.primary as MiaixzSlotProps<
            ListItemOwnerState,
            ButtonHTMLAttributes<HTMLButtonElement>
          >,
          internalProps: {
            type: "button",
            disabled: item.disabled,
            onClick: item.onAction,
          },
          ownedProps: ["type", "disabled"],
        })}
      >
        {children}
      </button>
    );
  }
  return (
    <div
      {...mergeMiaixzSlotProps({
        ownerState,
        defaultProps: { className: "miaixz-list-item-control" },
        componentProps: item.divProps,
        slotProps: slotProps?.primary as MiaixzSlotProps<
          ListItemOwnerState,
          HTMLAttributes<HTMLDivElement>
        >,
      })}
    >
      {children}
    </div>
  );
}
