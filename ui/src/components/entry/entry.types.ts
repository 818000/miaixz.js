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
 * Closed Entry dimensions and slots are self-describing.
 */
import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";

export interface EntryOwnerState {
  readonly layout: "split" | "centered";
  readonly contentComponent: "div" | "main";
  readonly hasAside: boolean;
}
export type EntryRootAttributes = HTMLAttributes<HTMLDivElement> &
  RefAttributes<HTMLDivElement> & {
    readonly "data-layout"?: EntryOwnerState["layout"];
    readonly "data-has-aside"?: boolean;
  };
export interface EntrySlotProps {
  readonly root?: MiaixzSlotProps<EntryOwnerState, EntryRootAttributes>;
  readonly aside?: MiaixzSlotProps<EntryOwnerState, HTMLAttributes<HTMLElement>>;
  readonly asideContent?: MiaixzSlotProps<EntryOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly content?: MiaixzSlotProps<EntryOwnerState, HTMLAttributes<HTMLElement>>;
}

/*
 * Configures a full-viewport application entry layout. @public
 */
export interface EntryProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  readonly layout?: "split" | "centered";
  readonly contentComponent?: "div" | "main";
  readonly aside?: ReactNode;
  readonly children: ReactNode;
  readonly slotProps?: EntrySlotProps;
}
