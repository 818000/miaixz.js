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

/**
 * Defines the panel public type contracts.
 */

import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Panel surface treatments permitted by the component contract.
 */
export type PanelSurface = "plain" | "filled";
/**
 * Panel frame treatments permitted by the component contract.
 */
export type PanelFrame = "none" | "outlined" | "elevated";
/**
 * Panel spacing densities permitted by the component contract.
 */
export type PanelDensity = "compact" | "standard" | "comfortable";
/**
 * Panel body-padding choices permitted by the component contract.
 */
export type PanelBodyPadding = "default" | "block" | "none";
/**
 * Panel Body gap tokens permitted by the component contract.
 */
export type PanelBodyGap = "default" | "none";
/**
 * Panel Body content arrangements permitted by the component contract.
 */
export type PanelBodyLayout = "content" | "fill";
/**
 * Panel minimum-height choices permitted by the component contract.
 */
export type PanelMinHeight = "default" | "tall";
/**
 * Panel interaction alternatives permitted by the component contract.
 */
export type PanelInteraction = "none" | "lift";
/**
 * Panel presentation alternatives permitted by the component contract.
 */
export type PanelPresentation = "default" | "workbench" | "entity-header";
/**
 * Accessible naming alternatives for semantic panel roots.
 */
type PanelAccessibleName =
  | { readonly "aria-label": string; readonly "aria-labelledby"?: never }
  | { readonly "aria-label"?: never; readonly "aria-labelledby": string };
/**
 * Native panel-root attributes before semantic naming and interaction are selected.
 */
type PanelNativeProps = Omit<
  HTMLAttributes<HTMLElement>,
  "aria-label" | "aria-labelledby" | "children" | "title"
>;
/**
 * Semantic root alternatives for a panel and their naming constraints.
 */
export type PanelSemanticRootProps =
  | (PanelNativeProps & {
      readonly as?: "div" | "article" | "header";
      readonly "aria-label"?: never;
      readonly "aria-labelledby"?: never;
    })
  | (PanelNativeProps & { readonly as: "section" | "aside" } & PanelAccessibleName);
/**
 * Content configuration for a panel heading and its supplementary controls.
 */
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
/**
 * Named Panel parts available for slot and style customization.
 */
export type PanelSlot = "root" | "header" | "body" | "footer" | "actions";
/**
 * Resolved Panel state exposed to theme and slot overrides.
 */
export interface PanelOwnerState {
  readonly surface: PanelSurface;
  readonly frame: PanelFrame;
  readonly density: PanelDensity;
  readonly minHeight: PanelMinHeight;
  readonly interaction: PanelInteraction;
  readonly presentation: PanelPresentation;
  readonly bodyPadding: PanelBodyPadding;
  readonly bodyGap: PanelBodyGap;
  readonly bodyLayout: PanelBodyLayout;
  readonly as: "div" | "section" | "article" | "aside" | "header";
}
/**
 * Attributes accepted by the Panel Root slot.
 */
export type PanelRootAttributes = HTMLAttributes<HTMLElement> &
  RefAttributes<HTMLElement> & {
    readonly "data-surface"?: PanelSurface;
    readonly "data-frame"?: PanelFrame;
    readonly "data-density"?: PanelDensity;
    readonly "data-body-padding"?: PanelBodyPadding;
    readonly "data-body-gap"?: PanelBodyGap;
    readonly "data-body-layout"?: PanelBodyLayout;
    readonly "data-min-height"?: PanelMinHeight;
    readonly "data-interaction"?: PanelInteraction;
    readonly "data-presentation"?: PanelPresentation;
  };
/**
 * Per-slot attributes and state-dependent override callbacks for Panel.
 */
export interface PanelSlotProps {
  readonly root?: MiaixzSlotProps<PanelOwnerState, PanelRootAttributes>;
  readonly header?: MiaixzSlotProps<PanelOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly headerCopy?: MiaixzSlotProps<PanelOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly headerLeading?: MiaixzSlotProps<PanelOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly headerTitle?: MiaixzSlotProps<PanelOwnerState, HTMLAttributes<HTMLHeadingElement>>;
  readonly headerDescription?: MiaixzSlotProps<PanelOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly body?: MiaixzSlotProps<PanelOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly footer?: MiaixzSlotProps<PanelOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly actions?: MiaixzSlotProps<PanelOwnerState, HTMLAttributes<HTMLDivElement>>;
}
/**
 * Properties accepted by the Panel renderer.
 */
export type PanelProps = PanelHeaderContent &
  PanelSemanticRootProps & {
    readonly children: ReactNode;
    readonly footer?: ReactNode;
    readonly surface?: PanelSurface;
    readonly frame?: PanelFrame;
    readonly density?: PanelDensity;
    readonly bodyPadding?: PanelBodyPadding;
    readonly bodyGap?: PanelBodyGap;
    readonly bodyLayout?: PanelBodyLayout;
    readonly minHeight?: PanelMinHeight;
    readonly interaction?: PanelInteraction;
    readonly presentation?: PanelPresentation;
    readonly slotProps?: PanelSlotProps;
  };

/**
 * Named Panel Header parts available for slot and style customization.
 */
export type PanelHeaderSlot = "root" | "copy" | "leading" | "title" | "description" | "actions";
/**
 * Resolved Panel Header state exposed to theme and slot overrides.
 */
export interface PanelHeaderOwnerState {
  readonly density: PanelDensity;
  readonly divider: boolean;
  readonly alignment: "start" | "between";
}
/**
 * Attributes accepted by the Panel Header Root slot.
 */
export type PanelHeaderRootAttributes = HTMLAttributes<HTMLDivElement> & {
  readonly "data-density"?: PanelDensity;
  readonly "data-divider"?: boolean;
  readonly "data-alignment"?: "start" | "between";
};
/**
 * Per-slot attributes and state-dependent override callbacks for Panel Header.
 */
export interface PanelHeaderSlotProps {
  readonly root?: MiaixzSlotProps<PanelHeaderOwnerState, PanelHeaderRootAttributes>;
  readonly copy?: MiaixzSlotProps<PanelHeaderOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly leading?: MiaixzSlotProps<PanelHeaderOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly title?: MiaixzSlotProps<PanelHeaderOwnerState, HTMLAttributes<HTMLHeadingElement>>;
  readonly description?: MiaixzSlotProps<PanelHeaderOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly actions?: MiaixzSlotProps<PanelHeaderOwnerState, HTMLAttributes<HTMLDivElement>>;
}
/**
 * Properties accepted by the Panel Header renderer.
 */
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

/**
 * Named Panel Footer parts available for slot and style customization.
 */
export type PanelFooterSlot = "root";
/**
 * Resolved Panel Footer state exposed to theme and slot overrides.
 */
export interface PanelFooterOwnerState {
  readonly density: PanelDensity;
  readonly divider: boolean;
  readonly alignment: "start" | "end" | "between";
  readonly presentation: "default" | "muted";
}
/**
 * Attributes accepted by the Panel Footer Root slot.
 */
export type PanelFooterRootAttributes = HTMLAttributes<HTMLDivElement> & {
  readonly "data-density"?: PanelDensity;
  readonly "data-divider"?: boolean;
  readonly "data-alignment"?: "start" | "end" | "between";
  readonly "data-presentation"?: PanelFooterOwnerState["presentation"];
};
/**
 * Properties accepted by the Panel Footer renderer.
 */
export interface PanelFooterProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  readonly children: ReactNode;
  readonly divider?: boolean;
  readonly alignment?: "start" | "end" | "between";
  readonly density?: PanelDensity;
  readonly presentation?: PanelFooterOwnerState["presentation"];
  readonly slotProps?: {
    readonly root?: MiaixzSlotProps<PanelFooterOwnerState, PanelFooterRootAttributes>;
  };
}

/**
 * Named Panel Row parts available for slot and style customization.
 */
export type PanelRowSlot = "root";
/**
 * Resolved Panel Row state exposed to theme and slot overrides.
 */
export interface PanelRowOwnerState {
  readonly density: PanelDensity;
  readonly distribution: "start" | "between";
}
/**
 * Attributes accepted by the Panel Row Root slot.
 */
export type PanelRowRootAttributes = HTMLAttributes<HTMLDivElement> & {
  readonly "data-density"?: PanelDensity;
  readonly "data-distribution"?: "start" | "between";
};
/**
 * Properties accepted by the Panel Row renderer.
 */
export interface PanelRowProps extends HTMLAttributes<HTMLDivElement> {
  readonly distribution?: "start" | "between";
  readonly slotProps?: {
    readonly root?: MiaixzSlotProps<PanelRowOwnerState, PanelRowRootAttributes>;
  };
}
