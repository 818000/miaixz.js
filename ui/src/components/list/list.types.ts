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

import type { HTMLAttributes, ReactNode } from "react";

import type { MiaixzVisualTone } from "../shared.types.js";

/**
 * Configures a semantic list container.
 *
 * @public
 */
export interface ListProps extends HTMLAttributes<HTMLUListElement> {
  /**
   * Selects full-width grid flow without fixing business row counts.
   */
  layout?: "default" | "grid";
  /**
   * Preserves fully legible disabled rows where nested actions show their own state.
   */
  disabledAppearance?: "dim" | "preserve";
  /**
   * Selects the generic or panel-surface divider color.
   */
  dividerTone?: "default" | "panel";
  /**
   * Selects a neutral or item-tone-derived hover and keyboard-focus surface.
   *
   * @defaultValue `neutral`
   */
  interactionSurface?: "neutral" | "tone";
  /**
   * Selects the standard or compact row density.
   */
  density?: "default" | "compact";
  /**
   * Selects a reusable row composition.
   * Overview and alert rows retain their hover and descendant keyboard-focus treatment
   * when a single content root contains independently interactive titles.
   * This visual treatment does not make the row itself a link or button.
   */
  variant?:
    | "alert"
    | "default"
    | "overview"
    | "distribution"
    | "progress"
    | "feed"
    | "ranking"
    | "meter"
    | "meter-spaced"
    | "activity"
    | "event"
    | "detail"
    | "connection"
    | "navigation";
  /**
   * Supplies structured list entries.
   */
  items?: readonly ListEntry[];
  /**
   * Displays a surrounding border and row dividers.
   *
   * @defaultValue `false`
   */
  bordered?: boolean;
  /**
   * Displays separators between list items.
   *
   * @defaultValue `true`
   */
  dividers?: boolean;
  /**
   * Removes item padding and background treatment.
   *
   * @defaultValue `false`
   */
  plain?: boolean;
  /**
   * Applies the nested-list indentation.
   *
   * @defaultValue `false`
   */
  nested?: boolean;
}

/**
 * Configures a data-toned row in a compact distribution legend.
 *
 * @public
 */
export interface ListDistributionItemProps extends HTMLAttributes<HTMLLIElement> {
  /**
   * Selects the marker's categorical visual tone.
   */
  tone?: MiaixzVisualTone;
}

/**
 * Configures a native list item with categorical tone and no default row layout.
 *
 * @public
 */
export type ListItemProps = ListDistributionItemProps;

/**
 * Configures a small marker preceding list content.
 *
 * @public
 */
export interface ListMarkerProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Selects the plain, numbered-step, or dot marker recipe.
   */
  variant?: "default" | "step" | "dot";
}

/**
 * Configures a compact plain or outlined alert count.
 *
 * @public
 */
export interface ListCounterProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Selects the plain or alert counter recipe.
   */
  variant?: "default" | "alert";
}

/**
 * Identifies visual list parts that preserve consumer-owned semantic markup.
 *
 * @public
 */
export type ListPart = "alert-copy" | "alert-meta" | "heading";

/**
 * Configures one structured list item.
 *
 * @public
 */
interface ListEntryBase extends Omit<
  HTMLAttributes<HTMLLIElement>,
  "children" | "content" | "title"
> {
  /**
   * Selects the theme-resolved interaction tone.
   */
  tone?: MiaixzVisualTone;
  /**
   * Displays optional leading icon content.
   */
  icon?: ReactNode;
  /**
   * Supplies the structured item title.
   */
  title?: ReactNode;
  /**
   * Supplies supporting item description content.
   */
  description?: ReactNode;
  /**
   * Displays compact trailing metadata.
   */
  meta?: ReactNode;
  /**
   * Displays trailing item actions.
   */
  actions?: ReactNode;
  /**
   * Displays the selected-item treatment.
   *
   * @defaultValue `false`
   */
  selected?: boolean;
  /**
   * Marks the item as unavailable for interaction.
   *
   * @defaultValue `false`
   */
  disabled?: boolean;
  /**
   * Supplies unstructured row content when no title is provided.
   */
  content?: ReactNode;
}

/**
 * Configures a list item that navigates to another location.
 */
interface ListLinkEntry extends ListEntryBase {
  /**
   * Navigates to the supplied location when the row is activated.
   */
  href: string;
  /**
   * Prevents action semantics from being combined with navigation.
   */
  onAction?: never;
}

/**
 * Configures a list item that runs an application action.
 */
interface ListActionEntry extends ListEntryBase {
  /**
   * Prevents navigation semantics from being combined with an action.
   */
  href?: never;
  /**
   * Runs the supplied action when the row is activated.
   */
  onAction: () => void;
}

/**
 * Configures a list item that only displays information.
 */
interface ListStaticEntry extends ListEntryBase {
  /**
   * Prevents static rows from receiving navigation semantics.
   */
  href?: never;
  /**
   * Prevents static rows from receiving action semantics.
   */
  onAction?: never;
}

/**
 * Configures one structured list item as a link, an action, or static content.
 *
 * Link and action semantics are mutually exclusive. Omitting both preserves a
 * non-interactive list row.
 *
 * @public
 */
export type ListEntry = ListLinkEntry | ListActionEntry | ListStaticEntry;
