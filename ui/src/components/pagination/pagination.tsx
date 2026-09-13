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

/* eslint-disable jsdoc/require-jsdoc --
 * Public Pagination contracts are defined by the component type module.
 */
import { forwardRef } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { useMiaixzLocale } from "../../i18n/i18n.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { Icon } from "../icon/icon.js";
import type { PaginationOwnerState, PaginationProps } from "./pagination.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/*
 * Represents a visible page number or a directional pagination ellipsis. @public
 */
export type MiaixzPaginationEntry = number | "ellipsis-start" | "ellipsis-end";

/*
 * Builds validated visible page numbers and ellipses around the active page. @public
 */
export function getPaginationEntries(
  page: number,
  pageCount: number,
  siblingCount = 1,
): MiaixzPaginationEntry[] {
  validatePagination(page, pageCount, siblingCount);
  if (pageCount === 0) return [];
  const visibleSlots = siblingCount * 2 + 5;
  if (pageCount <= visibleSlots) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  const left = Math.max(2, page - siblingCount);
  const right = Math.min(pageCount - 1, page + siblingCount);
  const entries: MiaixzPaginationEntry[] = [1];
  if (left > 2) entries.push("ellipsis-start");
  for (let value = left; value <= right; value += 1) entries.push(value);
  if (right < pageCount - 1) entries.push("ellipsis-end");
  entries.push(pageCount);
  return entries;
}

/*
 * Renders one invariant pagination control set for every surface variant. @public
 */
export const Pagination = withMiaixzThemeComponent(
  "Pagination",
  forwardRef<HTMLElement, PaginationProps>(function Pagination(
    {
      page,
      pageCount,
      onPageChange,
      siblingCount = 1,
      showPrevious = true,
      showNext = true,
      label,
      previousLabel,
      nextLabel,
      summary,
      variant = "default",
      inset = false,
      slotProps,
      ...props
    },
    ref,
  ) {
    validatePagination(page, pageCount, siblingCount);
    const { t } = useMiaixzLocale();
    const entries = getPaginationEntries(page, pageCount, siblingCount);
    const ownerState: PaginationOwnerState = { variant, inset, page, pageCount };
    return (
      <nav
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-pagination" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: {
            "aria-label": label ?? t("ui.pagination.label"),
            "data-variant": variant,
            ...(inset ? { "data-inset": true } : {}),
          },
          ownedProps: ["aria-label", "data-variant", "data-inset"],
        })}
      >
        {summary !== undefined && (
          <span
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-pagination-summary" },
              slotProps: slotProps?.summary,
            })}
          >
            {summary}
          </span>
        )}
        {pageCount > 0 && (
          <ul
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-pagination-list" },
              slotProps: slotProps?.list,
            })}
          >
            {showPrevious && (
              <li>
                <button
                  {...mergeMiaixzSlotProps({
                    ownerState,
                    defaultProps: { className: "miaixz-pagination-item" },
                    slotProps: slotProps?.item,
                    internalProps: {
                      type: "button",
                      disabled: page <= 1,
                      "aria-label": previousLabel ?? t("ui.pagination.previous"),
                      onClick: () => onPageChange(page - 1),
                    },
                    ownedProps: ["type", "disabled", "aria-label"],
                  })}
                >
                  <Icon aria-hidden="true" name="ChevronLeft" size="control" />
                </button>
              </li>
            )}
            {entries.map((entry) => (
              <li key={entry}>
                {typeof entry === "number" ? (
                  <button
                    {...mergeMiaixzSlotProps({
                      ownerState,
                      defaultProps: { className: "miaixz-pagination-item" },
                      slotProps: slotProps?.item,
                      internalProps: {
                        type: "button",
                        ...(entry === page ? { "aria-current": "page" as const } : {}),
                        "aria-label": t("ui.pagination.page", { page: entry }),
                        onClick: () => onPageChange(entry),
                      },
                      ownedProps: ["type", "aria-current", "aria-label"],
                    })}
                  >
                    {entry}
                  </button>
                ) : (
                  <span
                    {...mergeMiaixzSlotProps({
                      ownerState,
                      defaultProps: { className: "miaixz-pagination-ellipsis" },
                      slotProps: slotProps?.ellipsis,
                      internalProps: { "aria-hidden": true },
                      ownedProps: ["aria-hidden"],
                    })}
                  >
                    …
                  </span>
                )}
              </li>
            ))}
            {showNext && (
              <li>
                <button
                  {...mergeMiaixzSlotProps({
                    ownerState,
                    defaultProps: { className: "miaixz-pagination-item" },
                    slotProps: slotProps?.item,
                    internalProps: {
                      type: "button",
                      disabled: page >= pageCount,
                      "aria-label": nextLabel ?? t("ui.pagination.next"),
                      onClick: () => onPageChange(page + 1),
                    },
                    ownedProps: ["type", "disabled", "aria-label"],
                  })}
                >
                  <Icon aria-hidden="true" name="ChevronRight" size="control" />
                </button>
              </li>
            )}
          </ul>
        )}
      </nav>
    );
  }),
);

function validatePagination(page: number, pageCount: number, siblingCount: number): void {
  if (!Number.isInteger(pageCount) || pageCount < 0) {
    throw new MiaixzUiError({
      code: "UI_PAGINATION_PAGE_COUNT_INVALID",
      details: { pageCount },
    });
  }
  if (!Number.isInteger(page) || (pageCount === 0 ? page !== 0 : page < 1 || page > pageCount)) {
    throw new MiaixzUiError({
      code: "UI_PAGINATION_PAGE_INVALID",
      details: { page, pageCount },
    });
  }
  if (!Number.isInteger(siblingCount) || siblingCount < 0) {
    throw new MiaixzUiError({
      code: "UI_PAGINATION_SIBLING_COUNT_INVALID",
      details: { siblingCount },
    });
  }
}
