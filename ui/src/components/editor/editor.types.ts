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

import type { FieldsetHTMLAttributes, HTMLAttributes, ReactNode } from "react";

/**
 * Selects a shared recipe for native, directly composed editor content.
 *
 * @public
 */
export type EditorPart =
  | "section"
  | "hint"
  | "image"
  | "group"
  | "group-head"
  | "options"
  | "actions"
  | "compact-section"
  | "picker"
  | "code";

/**
 * Configures an unframed field group with a semantic legend.
 *
 * @public
 */
export interface EditorFieldsetProps extends FieldsetHTMLAttributes<HTMLFieldSetElement> {
  /**
   * Supplies the semantic field group label.
   */
  readonly legend: ReactNode;
  /**
   * Selects the default or emphasized legend treatment.
   *
   * @defaultValue `"default"`
   */
  readonly emphasis?: "default" | "strong";
}

/**
 * Configures a divided status footer while business status colors remain with the consumer.
 *
 * @public
 */
export type EditorStatusProps = HTMLAttributes<HTMLElement>;

/**
 * One label and value displayed in an editor summary. @public
 */
export interface EditorSummaryItem {
  /**
   * Supplies the item label.
   */
  readonly label: ReactNode;
  /**
   * Supplies the item value.
   */
  readonly value: ReactNode;
}

/**
 * One compact value displayed above a tabbed editor. @public
 */
export interface EditorOverviewItem {
  /**
   * Supplies the overview label.
   */
  readonly label: ReactNode;
  /**
   * Supplies the primary overview value.
   */
  readonly value: ReactNode;
  /**
   * Supplies optional supporting copy.
   */
  readonly description?: ReactNode;
}

/**
 * Configures the two-column editor shell. @public
 */
export interface EditorLayoutProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Supplies the editor's summary rail.
   */
  readonly summary: ReactNode;

  /**
   * Selects the summary treatment used to separate it from the editor body.
   *
   * @defaultValue `"default"`
   */
  readonly variant?: "default" | "divided";
}

/**
 * Configures the sticky identity summary shown beside an editor form. @public
 */
export interface EditorSummaryProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /**
   * Supplies the profile image or fallback.
   */
  readonly avatar: ReactNode;
  /**
   * Supplies the primary identity.
   */
  readonly title: ReactNode;
  /**
   * Supplies supporting identity metadata.
   */
  readonly subtitle: ReactNode;
  /**
   * Supplies optional status content.
   */
  readonly status?: ReactNode;
  /**
   * Supplies the labeled summary values.
   */
  readonly items: readonly EditorSummaryItem[];
  /**
   * Supplies content anchored at the summary's end.
   */
  readonly footer?: ReactNode;
}

/**
 * Configures one titled editor section and its field layout. @public
 */
export interface EditorSectionProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /**
   * Selects a form section or a framed content section.
   *
   * @defaultValue `"default"`
   */
  readonly variant?: "default" | "framed" | "card";
  /**
   * Supplies the section heading.
   */
  readonly title: ReactNode;
  /**
   * Supplies optional section guidance.
   */
  readonly description?: ReactNode;
  /**
   * Supplies optional trailing header content.
   */
  readonly accessory?: ReactNode;
  /**
   * Selects the field arrangement.
   */
  readonly layout?: "default" | "two" | "associations";
}

/**
 * Configures one framed association group inside an editor section. @public
 */
export interface EditorGroupProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /**
   * Supplies the group heading.
   */
  readonly title: ReactNode;
  /**
   * Supplies optional group guidance.
   */
  readonly description?: ReactNode;
  /**
   * Supplies optional trailing header content.
   */
  readonly accessory?: ReactNode;
}

/**
 * Configures a compact three-column editor overview. @public
 */
export interface EditorOverviewProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Keeps the original compact overview or shows detailed status cells.
   *
   * @defaultValue `"default"`
   */
  readonly variant?: "default" | "detailed";
  /**
   * Supplies ordered overview values.
   */
  readonly items: readonly EditorOverviewItem[];
}

/**
 * Configures a bordered, scrollable editor option picker. @public
 */
export type EditorPickerProps = HTMLAttributes<HTMLDivElement>;

/**
 * Configures a consistently spaced field collection; business code selects columns.
 *
 * @public
 */
export type EditorFieldsProps = HTMLAttributes<HTMLDivElement>;
/**
 * Configures a footer control group without automatic wrapping.
 *
 * @public
 */
export type EditorActionsProps = HTMLAttributes<HTMLDivElement>;
/**
 * Configures a small bordered control or guidance region.
 *
 * @public
 */
export interface EditorBoxProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Selects the standard box or guidance treatment.
   *
   * @defaultValue `"default"`
   */
  readonly variant?: "default" | "guidance";
}
