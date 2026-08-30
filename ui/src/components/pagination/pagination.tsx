import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import { useMiaixzLocale } from "../../i18n/index.js";
import { Icon } from "../icon/index.js";
import type { PaginationProps } from "./pagination.types.js";

/**
 * Represents a visible page number or a directional pagination ellipsis.
 *
 * @public
 */
export type MiaixzPaginationEntry = number | "ellipsis-start" | "ellipsis-end";

/**
 * Builds visible page numbers and ellipses around the active page.
 *
 * @param page - Current one-based page.
 * @param pageCount - Total number of pages.
 * @param siblingCount - Page count displayed on either side of the current page.
 * @returns Stable pagination entries suitable for rendering and testing.
 * @public
 */
export function getPaginationEntries(
  page: number,
  pageCount: number,
  siblingCount = 1,
): MiaixzPaginationEntry[] {
  const total = Math.max(1, pageCount);
  const current = Math.min(Math.max(1, page), total);
  const visibleSlots = siblingCount * 2 + 5;
  if (total <= visibleSlots) return Array.from({ length: total }, (_, index) => index + 1);

  const left = Math.max(2, current - siblingCount);
  const right = Math.min(total - 1, current + siblingCount);
  const entries: MiaixzPaginationEntry[] = [1];

  if (left > 2) entries.push("ellipsis-start");
  for (let value = left; value <= right; value += 1) entries.push(value);
  if (right < total - 1) entries.push("ellipsis-end");
  entries.push(total);
  return entries;
}

/**
 * Renders localized previous, page-number, and next navigation controls.
 *
 * @public
 */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(
  {
    page,
    pageCount,
    onPageChange,
    siblingCount = 1,
    label,
    previousLabel,
    nextLabel,
    summary,
    className,
    ...props
  },
  ref,
) {
  const { t } = useMiaixzLocale();
  const resolvedLabel = label ?? t("ui.pagination.label");
  const resolvedPreviousLabel = previousLabel ?? t("ui.pagination.previous");
  const resolvedNextLabel = nextLabel ?? t("ui.pagination.next");
  const total = Math.max(1, pageCount);
  const current = Math.min(Math.max(1, page), total);
  const entries = getPaginationEntries(current, total, Math.max(0, siblingCount));

  return (
    <nav
      {...props}
      ref={ref}
      aria-label={resolvedLabel}
      className={classNames("miaixz-pagination", className)}
    >
      {summary !== undefined && <span className="miaixz-pagination-summary">{summary}</span>}
      <ul className="miaixz-pagination-list">
        <li>
          <button
            type="button"
            className="miaixz-pagination-item"
            disabled={current <= 1}
            aria-label={resolvedPreviousLabel}
            onClick={() => onPageChange(current - 1)}
          >
            <Icon name="ChevronLeft" size="control" />
          </button>
        </li>
        {entries.map((entry) => (
          <li key={entry}>
            {typeof entry === "number" ? (
              <button
                type="button"
                className="miaixz-pagination-item"
                aria-current={entry === current ? "page" : undefined}
                aria-label={t("ui.pagination.page", { page: entry })}
                onClick={() => onPageChange(entry)}
              >
                {entry}
              </button>
            ) : (
              <span className="miaixz-pagination-ellipsis" aria-hidden="true">
                …
              </span>
            )}
          </li>
        ))}
        <li>
          <button
            type="button"
            className="miaixz-pagination-item"
            disabled={current >= total}
            aria-label={resolvedNextLabel}
            onClick={() => onPageChange(current + 1)}
          >
            <Icon name="ChevronRight" size="control" />
          </button>
        </li>
      </ul>
    </nav>
  );
});
