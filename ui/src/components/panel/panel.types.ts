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

/* eslint-disable jsdoc/require-jsdoc -- Closed panel semantics and slots are self-describing.
 */
import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";

export type PanelSurface = "plain" | "filled";
export type PanelFrame = "none" | "outlined" | "elevated";
export type PanelDensity = "compact" | "standard" | "comfortable";
type PanelAccessibleName =
  | { readonly "aria-label": string; readonly "aria-labelledby"?: never }
  | { readonly "aria-label"?: never; readonly "aria-labelledby": string };
type PanelNativeProps = Omit<
  HTMLAttributes<HTMLElement>,
  "aria-label" | "aria-labelledby" | "children" | "title"
>;
export type PanelSemanticRootProps =
  | (PanelNativeProps & {
      readonly as?: "div" | "article";
      readonly "aria-label"?: never;
      readonly "aria-labelledby"?: never;
    })
  | (PanelNativeProps & { readonly as: "section" | "aside" } & PanelAccessibleName);
export type PanelHeaderContent =
  | {
      readonly title?: never;
      readonly description?: never;
      readonly leading?: never;
      readonly actions?: never;
      readonly headingLevel?: never;
    }
  | {
      readonly title: ReactNode;
      readonly description?: ReactNode;
      readonly leading?: ReactNode;
      readonly actions?: ReactNode;
      readonly headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
    };
export type PanelSlot = "root" | "header" | "body" | "footer" | "actions";
export interface PanelOwnerState {
  readonly surface: PanelSurface;
  readonly frame: PanelFrame;
  readonly density: PanelDensity;
  readonly as: "div" | "section" | "article" | "aside";
}
export type PanelRootAttributes = HTMLAttributes<HTMLElement> &
  RefAttributes<HTMLElement> & {
    readonly "data-surface"?: PanelSurface;
    readonly "data-frame"?: PanelFrame;
    readonly "data-density"?: PanelDensity;
  };
export interface PanelSlotProps {
  readonly root?: MiaixzSlotProps<PanelOwnerState, PanelRootAttributes>;
  readonly header?: MiaixzSlotProps<PanelOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly body?: MiaixzSlotProps<PanelOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly footer?: MiaixzSlotProps<PanelOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly actions?: MiaixzSlotProps<PanelOwnerState, HTMLAttributes<HTMLDivElement>>;
}
export type PanelProps = PanelHeaderContent &
  PanelSemanticRootProps & {
    readonly children: ReactNode;
    readonly footer?: ReactNode;
    readonly surface?: PanelSurface;
    readonly frame?: PanelFrame;
    readonly density?: PanelDensity;
    readonly slotProps?: PanelSlotProps;
  };

export type PanelHeaderSlot = "root" | "copy" | "leading" | "title" | "description" | "actions";
export interface PanelHeaderOwnerState {
  readonly density: PanelDensity;
  readonly divider: boolean;
  readonly alignment: "start" | "between";
}
export type PanelHeaderRootAttributes = HTMLAttributes<HTMLDivElement> & {
  readonly "data-density"?: PanelDensity;
  readonly "data-divider"?: boolean;
  readonly "data-alignment"?: "start" | "between";
};
export interface PanelHeaderSlotProps {
  readonly root?: MiaixzSlotProps<PanelHeaderOwnerState, PanelHeaderRootAttributes>;
  readonly copy?: MiaixzSlotProps<PanelHeaderOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly leading?: MiaixzSlotProps<PanelHeaderOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly title?: MiaixzSlotProps<PanelHeaderOwnerState, HTMLAttributes<HTMLHeadingElement>>;
  readonly description?: MiaixzSlotProps<PanelHeaderOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly actions?: MiaixzSlotProps<PanelHeaderOwnerState, HTMLAttributes<HTMLDivElement>>;
}
export interface PanelHeaderProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "title"
> {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly leading?: ReactNode;
  readonly actions?: ReactNode;
  readonly headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  readonly density?: PanelDensity;
  readonly divider?: boolean;
  readonly alignment?: "start" | "between";
  readonly slotProps?: PanelHeaderSlotProps;
}

export type PanelFooterSlot = "root";
export interface PanelFooterOwnerState {
  readonly density: PanelDensity;
  readonly divider: boolean;
  readonly alignment: "start" | "end" | "between";
}
export type PanelFooterRootAttributes = HTMLAttributes<HTMLDivElement> & {
  readonly "data-density"?: PanelDensity;
  readonly "data-divider"?: boolean;
  readonly "data-alignment"?: "start" | "end" | "between";
};
export interface PanelFooterProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  readonly children: ReactNode;
  readonly divider?: boolean;
  readonly alignment?: "start" | "end" | "between";
  readonly density?: PanelDensity;
  readonly slotProps?: {
    readonly root?: MiaixzSlotProps<PanelFooterOwnerState, PanelFooterRootAttributes>;
  };
}

export type PanelRowSlot = "root";
export interface PanelRowOwnerState {
  readonly density: PanelDensity;
  readonly distribution: "start" | "between";
}
export type PanelRowRootAttributes = HTMLAttributes<HTMLDivElement> & {
  readonly "data-density"?: PanelDensity;
  readonly "data-distribution"?: "start" | "between";
};
export interface PanelRowProps extends HTMLAttributes<HTMLDivElement> {
  readonly distribution?: "start" | "between";
  readonly slotProps?: {
    readonly root?: MiaixzSlotProps<PanelRowOwnerState, PanelRowRootAttributes>;
  };
}
