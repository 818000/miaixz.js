import type { HTMLAttributes, ReactNode } from "react";

/**
 * Configures controlled page-number navigation.
 *
 * @public
 */
export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, "onChange"> {
  /**
   * Selects the current one-based page.
   */
  page: number;
  /**
   * Supplies the total number of pages.
   */
  pageCount: number;
  /**
   * Receives a requested one-based page.
   */
  onPageChange: (page: number) => void;
  /**
   * Controls the page count shown on either side of the current page.
   *
   * @defaultValue `1`
   */
  siblingCount?: number;
  /**
   * Overrides the localized navigation label.
   */
  label?: string;
  /**
   * Overrides the localized previous-page label.
   */
  previousLabel?: string;
  /**
   * Overrides the localized next-page label.
   */
  nextLabel?: string;
  /**
   * Displays optional pagination summary content.
   */
  summary?: ReactNode;
}
