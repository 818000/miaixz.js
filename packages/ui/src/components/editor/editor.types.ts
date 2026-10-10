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
 * Defines the editor public type contracts.
 */

import type { FieldsetHTMLAttributes, FormHTMLAttributes, HTMLAttributes, ReactNode } from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { GridProps } from "../grid/grid.types.js";
import type { MiaixzFeedbackTone } from "../shared.types.js";

/**
 * Properties accepted by the Editor Form renderer.
 */
export interface EditorFormProps extends FormHTMLAttributes<HTMLFormElement> {
  readonly presentation?: "default" | "drawer";
}

/**
 * Properties accepted by the Editor Fieldset renderer.
 */
export interface EditorFieldsetProps extends FieldsetHTMLAttributes<HTMLFieldSetElement> {
  readonly legend: ReactNode;
  readonly emphasis?: "default" | "strong";
}

/**
 * Resolved Editor Layout state exposed to theme and slot overrides.
 */
export interface EditorLayoutOwnerState {
  readonly layout: "single" | "split";
  readonly divided: boolean;
}
/**
 * Per-slot attributes and state-dependent override callbacks for Editor Layout.
 */
export interface EditorLayoutSlotProps {
  readonly summary?: MiaixzSlotProps<EditorLayoutOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly content?: MiaixzSlotProps<EditorLayoutOwnerState, HTMLAttributes<HTMLDivElement>>;
}
/**
 * Properties accepted by the Editor Layout renderer.
 */
export interface EditorLayoutProps extends HTMLAttributes<HTMLDivElement> {
  readonly summary: ReactNode;
  readonly children: ReactNode;
  readonly layout?: "single" | "split";
  readonly divided?: boolean;
  readonly slotProps?: EditorLayoutSlotProps;
}

/**
 * Labeled summary value shown by the editor summary region.
 */
export interface EditorSummaryItem {
  readonly id: string;
  readonly label: ReactNode;
  readonly value: ReactNode;
}
/**
 * Resolved Editor Summary state exposed to theme and slot overrides.
 */
export interface EditorSummaryOwnerState {
  readonly headingLevel: 1 | 2 | 3 | 4 | 5 | 6;
  readonly surface: "plain" | "framed";
}
/**
 * Per-slot attributes and state-dependent override callbacks for Editor Summary.
 */
export interface EditorSummarySlotProps {
  readonly avatar?: MiaixzSlotProps<EditorSummaryOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly title?: MiaixzSlotProps<EditorSummaryOwnerState, HTMLAttributes<HTMLHeadingElement>>;
  readonly subtitle?: MiaixzSlotProps<EditorSummaryOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly status?: MiaixzSlotProps<EditorSummaryOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly facts?: MiaixzSlotProps<EditorSummaryOwnerState, HTMLAttributes<HTMLDListElement>>;
  readonly footer?: MiaixzSlotProps<EditorSummaryOwnerState, HTMLAttributes<HTMLDivElement>>;
}
/**
 * Properties accepted by the Editor Summary renderer.
 */
export interface EditorSummaryProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "children" | "title"
> {
  readonly avatar: ReactNode;
  readonly title: ReactNode;
  readonly subtitle: ReactNode;
  readonly status?: ReactNode;
  readonly items: readonly EditorSummaryItem[];
  readonly footer?: ReactNode;
  readonly headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  readonly surface?: "plain" | "framed";
  readonly slotProps?: EditorSummarySlotProps;
}

/**
 * Resolved Editor Section state exposed to theme and slot overrides.
 */
export interface EditorSectionOwnerState {
  readonly surface: "plain" | "framed" | "card";
  readonly layout: "single" | "two-column";
  readonly span: "auto" | "full";
  readonly headingLevel: 1 | 2 | 3 | 4 | 5 | 6;
}
/**
 * Per-slot attributes and state-dependent override callbacks for Editor Section.
 */
export interface EditorSectionSlotProps {
  readonly header?: MiaixzSlotProps<EditorSectionOwnerState, HTMLAttributes<HTMLElement>>;
  readonly description?: MiaixzSlotProps<EditorSectionOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly body?: MiaixzSlotProps<EditorSectionOwnerState, HTMLAttributes<HTMLDivElement>>;
}
/**
 * Properties accepted by the Editor Section renderer.
 */
export interface EditorSectionProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly accessory?: ReactNode;
  readonly headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  readonly surface?: "plain" | "framed" | "card";
  readonly layout?: "single" | "two-column";
  readonly span?: "auto" | "full";
  readonly slotProps?: EditorSectionSlotProps;
}

/**
 * Reuses Grid without introducing editor-specific layout dimensions. @public
 */
export type EditorFieldsProps = GridProps;
/**
 * Properties accepted by the Editor Actions renderer.
 */
export interface EditorActionsProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  readonly children: ReactNode;
}
/**
 * Scopes the filled, outlined compact Panel recipe to editor compositions. @public
 */
export interface EditorBoxProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "aria-label" | "aria-labelledby" | "children" | "title"
> {
  readonly children: ReactNode;
}

/**
 * Resolved Editor Group state exposed to theme and slot overrides.
 */
export interface EditorGroupOwnerState {
  readonly headingLevel: 1 | 2 | 3 | 4 | 5 | 6;
}
/**
 * Per-slot attributes and state-dependent override callbacks for Editor Group.
 */
export interface EditorGroupSlotProps {
  readonly header?: MiaixzSlotProps<EditorGroupOwnerState, HTMLAttributes<HTMLElement>>;
  readonly description?: MiaixzSlotProps<EditorGroupOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly options?: MiaixzSlotProps<EditorGroupOwnerState, HTMLAttributes<HTMLDivElement>>;
}
/**
 * Properties accepted by the Editor Group renderer.
 */
export interface EditorGroupProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly accessory?: ReactNode;
  readonly headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  readonly slotProps?: EditorGroupSlotProps;
}

/**
 * Overview item rendered by the editor overview region.
 */
export interface EditorOverviewItem {
  readonly id: string;
  readonly label: ReactNode;
  readonly value: ReactNode;
  readonly description?: ReactNode;
}
/**
 * Resolved Editor Overview state exposed to theme and slot overrides.
 */
export interface EditorOverviewOwnerState {
  readonly density: "compact" | "comfortable";
  readonly itemId: string | undefined;
}
/**
 * Per-slot attributes and state-dependent override callbacks for Editor Overview.
 */
export interface EditorOverviewSlotProps {
  readonly item?: MiaixzSlotProps<EditorOverviewOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly label?: MiaixzSlotProps<EditorOverviewOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly value?: MiaixzSlotProps<EditorOverviewOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly description?: MiaixzSlotProps<EditorOverviewOwnerState, HTMLAttributes<HTMLDivElement>>;
}
/**
 * Properties accepted by the Editor Overview renderer.
 */
export interface EditorOverviewProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  readonly items: readonly EditorOverviewItem[];
  readonly density?: "compact" | "comfortable";
  readonly slotProps?: EditorOverviewSlotProps;
}

/**
 * Accessible naming alternatives for an editor picker.
 */
type EditorPickerName =
  | { readonly "aria-label": string; readonly "aria-labelledby"?: never }
  | { readonly "aria-label"?: never; readonly "aria-labelledby": string };
/**
 * Properties accepted by the Editor Picker renderer.
 */
export type EditorPickerProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "aria-label" | "aria-labelledby" | "children"
> &
  EditorPickerName & { readonly children: ReactNode };

/**
 * Properties accepted by the Editor Status renderer.
 */
export interface EditorStatusProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  readonly tone: MiaixzFeedbackTone | "brand";
  readonly label: ReactNode;
  readonly children?: ReactNode;
}
