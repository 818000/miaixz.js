import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { ToolbarProps } from "./toolbar.types.js";

/**
 * Renders a labeled toolbar for a related set of controls.
 *
 * @public
 */
export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
  {
    label,
    orientation = "horizontal",
    leading,
    actions,
    sticky = false,
    className,
    children,
    ...props
  },
  ref,
) {
  const structured = leading !== undefined || actions !== undefined;
  return (
    <div
      {...props}
      ref={ref}
      role="toolbar"
      aria-label={label}
      aria-orientation={orientation}
      data-orientation={orientation}
      className={classNames("miaixz-toolbar", sticky && "miaixz-toolbar-sticky", className)}
    >
      {structured ? (
        <>
          <div className="miaixz-toolbar-leading">{leading ?? children}</div>
          {actions !== undefined && <div className="miaixz-toolbar-actions">{actions}</div>}
        </>
      ) : (
        children
      )}
    </div>
  );
});
