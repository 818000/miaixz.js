/**
 * Describes pagination metadata returned by a list operation.
 *
 * @public
 */
export interface MiaixzPagination {
  /**
   * One-based current page number.
   */
  page: number;

  /**
   * Maximum number of items requested per page.
   */
  pageSize: number;

  /**
   * Total number of items available across all pages.
   */
  total: number;
}

/**
 * Describes optional pagination parameters for a list request.
 *
 * @public
 */
export interface MiaixzPageQuery {
  /**
   * Optional one-based page number to request.
   */
  page?: number;

  /**
   * Optional maximum number of items to request per page.
   */
  pageSize?: number;
}

/**
 * Describes a page of immutable result items and its pagination metadata.
 *
 * @typeParam T - Type of each result item.
 * @public
 */
export interface MiaixzPage<T> extends MiaixzPagination {
  /**
   * Immutable items contained in the current page.
   */
  items: readonly T[];
}

/**
 * Calculates the number of pages, returning zero when the page size is invalid.
 *
 * @param pagination - Pagination metadata used for the calculation.
 * @returns Total page count rounded up to include a partial final page.
 * @public
 */
export function getMiaixzPageCount(pagination: MiaixzPagination): number {
  if (pagination.pageSize <= 0) return 0;
  return Math.ceil(Math.max(0, pagination.total) / pagination.pageSize);
}
