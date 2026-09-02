import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { ListEntry, ListProps } from "./list.types.js";

/**
 * Renders a semantic collection with shared spacing and divider options.
 *
 * @public
 */
export const List = forwardRef<HTMLUListElement, ListProps>(function List(
  {
    items,
    bordered = false,
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
        bordered && "miaixz-list-bordered",
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
