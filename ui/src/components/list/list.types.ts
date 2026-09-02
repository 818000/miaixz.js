import type { HTMLAttributes, ReactNode } from "react";

import type { MiaixzVisualTone } from "../shared.types.js";

/**
 * Configures a semantic list container.
 *
 * @public
 */
export interface ListProps extends HTMLAttributes<HTMLUListElement> {
  /**
   * Selects the standard or compact row density.
   */
  density?: "default" | "compact";
  /**
   * Selects a reusable row composition.
   */
  variant?: "alert" | "default" | "overview";
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
