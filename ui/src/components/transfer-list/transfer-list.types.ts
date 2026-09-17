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

import type { HTMLAttributes, ReactNode, RefAttributes } from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";

export type TransferListTargetSize = "compact" | "standard";
export type TransferListMobilePaneSize = "compact" | "comfortable";
export interface TransferListOwnerState {
  readonly targetSize: TransferListTargetSize;
  readonly mobilePaneSize: TransferListMobilePaneSize;
  readonly sourceHeaderLayout: "stack" | "between";
  readonly targetHeaderLayout: "stack" | "between";
}
export type TransferListRootAttributes = HTMLAttributes<HTMLElement> &
  RefAttributes<HTMLElement> & {
    readonly "data-target-size"?: TransferListTargetSize;
    readonly "data-mobile-pane-size"?: TransferListMobilePaneSize;
    readonly "data-source-header-layout"?: "stack" | "between";
    readonly "data-target-header-layout"?: "stack" | "between";
  };
export type TransferListHeaderAttributes = HTMLAttributes<HTMLDivElement> & {
  readonly "data-layout"?: "stack" | "between";
};
export interface TransferListSlotProps {
  readonly root?: MiaixzSlotProps<TransferListOwnerState, TransferListRootAttributes>;
  readonly sourcePane?: MiaixzSlotProps<TransferListOwnerState, HTMLAttributes<HTMLElement>>;
  readonly sourceHeader?: MiaixzSlotProps<TransferListOwnerState, TransferListHeaderAttributes>;
  readonly sourceBody?: MiaixzSlotProps<TransferListOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly targetPane?: MiaixzSlotProps<TransferListOwnerState, HTMLAttributes<HTMLElement>>;
  readonly targetHeader?: MiaixzSlotProps<TransferListOwnerState, TransferListHeaderAttributes>;
  readonly targetBody?: MiaixzSlotProps<TransferListOwnerState, HTMLAttributes<HTMLDivElement>>;
}
export interface TransferListProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "aria-label" | "children"
> {
  readonly label: string;
  readonly source: ReactNode;
  readonly sourceLabel: string;
  readonly sourceHeader: ReactNode;
  readonly target: ReactNode;
  readonly targetLabel: string;
  readonly targetHeader: ReactNode;
  readonly targetSize?: TransferListTargetSize;
  readonly mobilePaneSize?: TransferListMobilePaneSize;
  readonly sourceHeaderLayout?: "stack" | "between";
  readonly targetHeaderLayout?: "stack" | "between";
  readonly slotProps?: TransferListSlotProps;
}
