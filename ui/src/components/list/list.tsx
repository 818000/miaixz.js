import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { ListItemProps, ListProps } from "./list.types.js";

/**
 * Renders a semantic collection with shared spacing and divider options.
 *
 * @public
 */
export const List = forwardRef<HTMLUListElement, ListProps>(function List(
  { bordered = false, plain = false, nested = false, className, ...props },
  ref,
) {
  return (
    <ul
      {...props}
      ref={ref}
      className={classNames(
        "miaixz-list",
        bordered && "miaixz-list-bordered",
        plain && "miaixz-list-plain",
        nested && "miaixz-list-nested",
        className,
      )}
    />
  );
});

/**
 * Renders one list row with optional leading, description, and trailing content.
 *
 * @public
 */
export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(function ListItem(
  {
    icon,
    title,
    description,
    meta,
    actions,
    interactive = false,
    selected = false,
    disabled = false,
    className,
    children,
    ...props
  },
  ref,
) {
  const hasStructuredContent = title !== undefined || description !== undefined;

  return (
    <li
      {...props}
      ref={ref}
      data-selected={selected || undefined}
      aria-disabled={disabled || undefined}
      className={classNames(
        "miaixz-list-item",
        interactive && "miaixz-list-item-interactive",
        className,
      )}
    >
      {icon && <span className="miaixz-list-icon">{icon}</span>}
      {hasStructuredContent ? (
        <div className="miaixz-list-content">
          {title !== undefined && <p className="miaixz-list-title">{title}</p>}
          {description !== undefined && <p className="miaixz-list-description">{description}</p>}
        </div>
      ) : (
        children
      )}
      {meta !== undefined && <span className="miaixz-list-meta">{meta}</span>}
      {actions !== undefined && <span className="miaixz-list-actions">{actions}</span>}
    </li>
  );
});
