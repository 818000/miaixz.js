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

import { forwardRef } from "react";

import { classNames } from "../../shared/class-names.js";
import type {
  ListEntry,
  ListProps,
  ListDistributionItemProps,
  ListMarkerProps,
  ListCounterProps,
  ListPart,
  ListItemProps,
} from "./list.types.js";

/**
 * Resolves a shared list text recipe without replacing native markup.
 *
 * @param part - Public list recipe part.
 * @param className - Optional consumer class name.
 * @returns Complete public recipe class name.
 * @public
 */
export function getListClassName(part: ListPart, className?: string): string {
  return classNames(`miaixz-list-${part}`, className);
}

/**
 * Renders a compact visual count inside a list row. @public
 */
export const ListCounter = forwardRef<HTMLSpanElement, ListCounterProps>(function ListCounter(
  { className, variant = "default", ...props },
  ref,
) {
  return (
    <span
      {...props}
      ref={ref}
      className={classNames(
        variant === "alert" ? "miaixz-list-counter-alert" : "miaixz-list-counter",
        className,
      )}
    />
  );
});

/**
 * Renders a list marker without assigning business step numbers. @public
 */
export const ListMarker = forwardRef<HTMLSpanElement, ListMarkerProps>(function ListMarker(
  { className, variant = "default", children, ...props },
  ref,
) {
  return (
    <span {...props} ref={ref} className={classNames(`miaixz-list-marker-${variant}`, className)}>
      {variant === "step" ? <i>{children}</i> : children}
    </span>
  );
});

/**
 * Renders one theme-toned list entry. @public
 */
export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(function ListItem(
  { className, tone = "neutral", ...props },
  ref,
) {
  return (
    <li
      {...props}
      ref={ref}
      data-tone={tone}
      className={classNames("miaixz-list-toned-item", className)}
    />
  );
});

/**
 * Renders one theme-toned distribution entry. @public
 */
export const ListDistributionItem = forwardRef<HTMLLIElement, ListDistributionItemProps>(
  function ListDistributionItem({ className, tone = "neutral", ...props }, ref) {
    return (
      <li
        {...props}
        ref={ref}
        data-tone={tone}
        className={classNames("miaixz-list-distribution-item", className)}
      />
    );
  },
);

/**
 * Renders a semantic collection with shared spacing and divider options.
 *
 * @public
 */
export const List = forwardRef<HTMLUListElement, ListProps>(function List(
  {
    items,
    layout = "default",
    disabledAppearance = "dim",
    dividerTone = "default",
    bordered = false,
    dividers = true,
    plain = false,
    nested = false,
    density = "default",
    variant = "default",
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <ul
      {...props}
      ref={ref}
      className={classNames(
        "miaixz-list",
        `miaixz-list-${density}`,
        `miaixz-list-${variant}`,
        layout === "grid" && "miaixz-list-grid",
        disabledAppearance === "preserve" && "miaixz-list-disabled-preserve",
        dividerTone === "panel" && "miaixz-list-dividers-panel",
        bordered && "miaixz-list-bordered",
        !dividers && "miaixz-list-no-dividers",
        plain && "miaixz-list-plain",
        nested && "miaixz-list-nested",
        className,
      )}
    >
      {items?.map((item, index) => (
        <ListEntryView key={`${item.id ?? "item"}-${index}`} {...item} />
      )) ?? children}
    </ul>
  );
});

/**
 * Renders one list row with optional leading, description, and trailing content.
 *
 * @param entry - Declarative list entry.
 * @returns The rendered list row.
 * @internal
 */
function ListEntryView(entry: ListEntry) {
  const {
    icon,
    title,
    description,
    meta,
    actions,
    href,
    onAction,
    selected = false,
    disabled = false,
    className,
    content,
    tone,
    ...props
  } = entry;
  const hasStructuredContent = title !== undefined || description !== undefined;
  const interactive = href !== undefined || onAction !== undefined;
  const rowContent = (
    <>
      {icon && <span className="miaixz-list-icon">{icon}</span>}
      {hasStructuredContent ? (
        <div className="miaixz-list-content">
          {title !== undefined && <p className="miaixz-list-title">{title}</p>}
          {description !== undefined && <p className="miaixz-list-description">{description}</p>}
        </div>
      ) : (
        content
      )}
      {meta !== undefined && <span className="miaixz-list-meta">{meta}</span>}
      {actions !== undefined && <span className="miaixz-list-actions">{actions}</span>}
    </>
  );

  return (
    <li
      {...props}
      data-selected={selected || undefined}
      data-tone={tone}
      aria-disabled={disabled || undefined}
      className={classNames(
        "miaixz-list-item",
        interactive && "miaixz-list-item-interactive",
        className,
      )}
    >
      {href !== undefined ? (
        <a
          className="miaixz-list-item-control"
          href={href}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : undefined}
        >
          {rowContent}
        </a>
      ) : onAction !== undefined ? (
        <button
          className="miaixz-list-item-control"
          type="button"
          disabled={disabled}
          onClick={onAction}
        >
          {rowContent}
        </button>
      ) : (
        rowContent
      )}
    </li>
  );
}
