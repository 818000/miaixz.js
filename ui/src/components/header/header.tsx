import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { HeaderProps } from "./header.types.js";

/**
 * Renders a page title area with description, metadata, and actions. @public
 */
export const Header = forwardRef<HTMLElement, HeaderProps>(function Header(
  { title, eyebrow, description, actions, headingLevel = 1, className, children, ...props },
  ref,
) {
  const Heading = `h${headingLevel}` as "h1" | "h2" | "h3";
  return (
    <header {...props} ref={ref} className={classNames("miaixz-header", className)}>
      <div className="miaixz-header-content">
        {eyebrow !== undefined && <div className="miaixz-header-eyebrow">{eyebrow}</div>}
        <Heading className="miaixz-header-title">{title}</Heading>
        {description !== undefined && <p className="miaixz-header-description">{description}</p>}
        {children}
      </div>
      {actions !== undefined && <div className="miaixz-header-actions">{actions}</div>}
    </header>
  );
});
