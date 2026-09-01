import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { EmptyProps } from "./empty.types.js";

/**
 * Presents an empty, missing, or filtered state with optional icon and actions.
 *
 * @public
 */
export const Empty = forwardRef<HTMLDivElement, EmptyProps>(function Empty(
  { title, description, icon, actions, compact = false, headingLevel = 3, className, ...props },
  ref,
) {
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4" | "h5" | "h6";

  return (
    <div
      {...props}
      ref={ref}
      className={classNames("miaixz-empty", compact && "miaixz-empty-compact", className)}
    >
      <div className="miaixz-empty-content">
        {icon !== undefined && <div className="miaixz-empty-icon">{icon}</div>}
        <Heading className="miaixz-empty-title">{title}</Heading>
        {description !== undefined && <p className="miaixz-empty-description">{description}</p>}
        {actions !== undefined && <div className="miaixz-empty-actions">{actions}</div>}
      </div>
    </div>
  );
});
