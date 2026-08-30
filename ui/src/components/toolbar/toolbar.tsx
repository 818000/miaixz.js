import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { ToolbarGroupProps, ToolbarProps, ToolbarSpacerProps } from "./toolbar.types.js";

/**
 * Renders a labeled toolbar for a related set of controls.
 *
 * @public
 */
export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
  { label, orientation = "horizontal", className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      role="toolbar"
      aria-label={label}
      aria-orientation={orientation}
      data-orientation={orientation}
      className={classNames("miaixz-toolbar", className)}
    />
  );
});

/**
 * Groups related toolbar controls with consistent spacing.
 *
 * @public
 */
export const ToolbarGroup = forwardRef<HTMLDivElement, ToolbarGroupProps>(function ToolbarGroup(
  { label, className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      role="group"
      aria-label={label}
      className={classNames("miaixz-toolbar-group", className)}
    />
  );
});

/**
 * Consumes available toolbar space to separate control groups.
 *
 * @public
 */
export const ToolbarSpacer = forwardRef<HTMLSpanElement, ToolbarSpacerProps>(function ToolbarSpacer(
  { className, "aria-hidden": ariaHidden = true, ...props },
  ref,
) {
  return (
    <span
      {...props}
      ref={ref}
      aria-hidden={ariaHidden}
      className={classNames("miaixz-toolbar-spacer", className)}
    />
  );
});
