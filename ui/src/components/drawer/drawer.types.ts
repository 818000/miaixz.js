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

/* eslint-disable jsdoc/require-jsdoc -- Closed drawer slots and state are self-describing.
 */

import type {
  ButtonHTMLAttributes,
  DialogHTMLAttributes,
  HTMLAttributes,
  ReactNode,
  RefAttributes,
} from "react";

import type { MiaixzSlotComponent, MiaixzSlotProps } from "../../shared/slots.js";

export type DrawerWidth = "small" | "medium" | "large" | "xlarge" | "wide" | number;
export type DrawerDensity = "compact" | "standard" | "comfortable";
export type DrawerPlacement = "left" | "right" | "bottom";
export type DrawerCloseReason = "escape" | "backdrop" | "closeButton" | "nativeClose";
export type DrawerSlot =
  "root" | "paper" | "header" | "title" | "description" | "content" | "footer" | "closeButton";

export interface DrawerInset {
  readonly block?: number;
  readonly inline?: number;
}

export interface DrawerOwnerState {
  readonly open: boolean;
  readonly placement: DrawerPlacement;
  readonly width: DrawerWidth | undefined;
  readonly density: DrawerDensity;
  readonly floating: boolean;
  readonly positioned: boolean;
  readonly showClose: boolean;
}

export interface DrawerSlots {
  readonly description?: MiaixzSlotComponent<HTMLAttributes<HTMLDivElement>>;
}

export type DrawerRootAttributes = DialogHTMLAttributes<HTMLDialogElement> &
  RefAttributes<HTMLDialogElement> & {
    readonly "data-placement"?: DrawerPlacement;
    readonly "data-width"?: Exclude<DrawerWidth, number>;
    readonly "data-density"?: DrawerDensity;
    readonly "data-floating"?: boolean;
    readonly "data-positioned"?: boolean;
  };

export interface DrawerSlotProps {
  readonly root?: MiaixzSlotProps<DrawerOwnerState, DrawerRootAttributes>;
  readonly paper?: MiaixzSlotProps<DrawerOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly header?: MiaixzSlotProps<DrawerOwnerState, HTMLAttributes<HTMLElement>>;
  readonly title?: MiaixzSlotProps<DrawerOwnerState, HTMLAttributes<HTMLHeadingElement>>;
  readonly description?: MiaixzSlotProps<DrawerOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly content?: MiaixzSlotProps<DrawerOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly footer?: MiaixzSlotProps<DrawerOwnerState, HTMLAttributes<HTMLElement>>;
  readonly closeButton?: MiaixzSlotProps<DrawerOwnerState, ButtonHTMLAttributes<HTMLButtonElement>>;
}

interface DrawerSharedProps {
  readonly boundary?: HTMLElement | null;
  readonly inset?: number | DrawerInset;
  readonly floating?: boolean;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean, reason: DrawerCloseReason) => void;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly density?: DrawerDensity;
  readonly headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  readonly closeLabel?: string;
  readonly showClose?: boolean;
  readonly closeOnBackdrop?: boolean;
  readonly slots?: DrawerSlots;
  readonly slotProps?: DrawerSlotProps;
}

type DrawerSideGeometry = {
  readonly placement?: "left" | "right";
  readonly width?: DrawerWidth;
};

type DrawerBottomGeometry = {
  readonly placement: "bottom";
  readonly width?: never;
};

export type DrawerProps = DrawerSharedProps &
  (DrawerSideGeometry | DrawerBottomGeometry) &
  Omit<
    DialogHTMLAttributes<HTMLDialogElement>,
    keyof DrawerSharedProps | "children" | "open" | "role" | "title" | "width"
  >;

/* eslint-enable jsdoc/require-jsdoc
 */
