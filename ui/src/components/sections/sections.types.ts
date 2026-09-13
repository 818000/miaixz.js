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

/* eslint-disable jsdoc/require-jsdoc -- Closed sections models and slots are self-describing.
 */
import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";

export interface SectionsItem {
  readonly id: string;
  readonly title: ReactNode;
  readonly description?: ReactNode;
}
export interface SectionsEntry {
  readonly id: string;
  readonly label: ReactNode;
  readonly count?: ReactNode;
  readonly items: readonly SectionsItem[];
  readonly empty?: ReactNode;
}
export type SectionsLayout = "columns" | "rows";
export type SectionsSlot =
  | "root"
  | "grid"
  | "section"
  | "header"
  | "heading"
  | "count"
  | "items"
  | "item"
  | "title"
  | "description"
  | "empty";
export interface SectionsOwnerState {
  readonly layout: SectionsLayout;
  readonly sectionId: string | undefined;
  readonly itemId: string | undefined;
}
export type SectionsRootAttributes = HTMLAttributes<HTMLDivElement> &
  RefAttributes<HTMLDivElement> & { readonly "data-layout"?: SectionsLayout };
export interface SectionsSlotProps {
  readonly root?: MiaixzSlotProps<SectionsOwnerState, SectionsRootAttributes>;
  readonly grid?: MiaixzSlotProps<SectionsOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly section?: MiaixzSlotProps<SectionsOwnerState, HTMLAttributes<HTMLElement>>;
  readonly header?: MiaixzSlotProps<SectionsOwnerState, HTMLAttributes<HTMLElement>>;
  readonly heading?: MiaixzSlotProps<SectionsOwnerState, HTMLAttributes<HTMLHeadingElement>>;
  readonly count?: MiaixzSlotProps<SectionsOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly items?: MiaixzSlotProps<SectionsOwnerState, HTMLAttributes<HTMLUListElement>>;
  readonly item?: MiaixzSlotProps<SectionsOwnerState, HTMLAttributes<HTMLLIElement>>;
  readonly title?: MiaixzSlotProps<SectionsOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly description?: MiaixzSlotProps<SectionsOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly empty?: MiaixzSlotProps<SectionsOwnerState, HTMLAttributes<HTMLDivElement>>;
}
export interface MiaixzSectionsOwnProps {
  readonly sections: readonly SectionsEntry[];
  readonly layout?: SectionsLayout;
  readonly headingLevel?: 2 | 3 | 4 | 5 | 6;
  readonly slotProps?: SectionsSlotProps;
}
/*
 * Configures named read-only sections. @public
 */
export type SectionsProps = MiaixzSectionsOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzSectionsOwnProps | "children">;
