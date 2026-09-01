import type { HTMLAttributes, ReactNode } from "react";

/**
 * Configures a semantic list container.
 *
 * @public
 */
export interface ListProps extends HTMLAttributes<HTMLUListElement> {
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
export interface ListEntry extends Omit<
  HTMLAttributes<HTMLLIElement>,
  "children" | "content" | "title"
> {
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
   * Enables hover and pointer interaction treatment.
   *
   * @defaultValue `false`
   */
  interactive?: boolean;
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
