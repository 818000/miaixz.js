import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { EmptyStateProps } from "./empty-state.types.js";

/**
 * Presents an empty, missing, or filtered state with optional icon and actions.
 *
 * @public
 */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { title, description, icon, actions, compact = false, headingLevel = 3, className, ...props },
  ref,
) {
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4" | "h5" | "h6";

  return (
    <div
      {...props}
      ref={ref}
      className={classNames(
        "miaixz-empty-state",
        compact && "miaixz-empty-state-compact",
        className,
      )}
    >
      <div className="miaixz-empty-state-content">
        {icon !== undefined && <div className="miaixz-empty-state-icon">{icon}</div>}
        <Heading className="miaixz-empty-state-title">{title}</Heading>
        {description !== undefined && (
          <p className="miaixz-empty-state-description">{description}</p>
        )}
        {actions !== undefined && <div className="miaixz-empty-state-actions">{actions}</div>}
      </div>
    </div>
  );
});
