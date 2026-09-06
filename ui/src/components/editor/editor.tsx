import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type {
  EditorGroupProps,
  EditorLayoutProps,
  EditorOverviewProps,
  EditorPickerProps,
  EditorSectionProps,
  EditorSummaryProps,
} from "./editor.types.js";

/**
 * Creates a summary-and-form editor layout. @public
 */
export const EditorLayout = forwardRef<HTMLDivElement, EditorLayoutProps>(function EditorLayout(
  { summary, variant = "default", className, children, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={classNames(
        "miaixz-editor-layout",
        variant === "divided" && "miaixz-editor-layout-divided",
        className,
      )}
    >
      {summary}
      <div className="miaixz-editor-form">{children}</div>
    </div>
  );
});

/**
 * Renders the sticky identity summary for an editor. @public
 */
export const EditorSummary = forwardRef<HTMLElement, EditorSummaryProps>(function EditorSummary(
  { avatar, title, subtitle, status, items, footer, className, ...props },
  ref,
) {
  return (
    <aside {...props} ref={ref} className={classNames("miaixz-editor-summary", className)}>
      <div className="miaixz-editor-summary-avatar">{avatar}</div>
      <div className="miaixz-editor-summary-name">
        <h3>{title}</h3>
        <p>{subtitle}</p>
        {status}
      </div>
      <dl>
        {items.map((item, index) => (
          <div key={index}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
      {footer !== undefined && <div className="miaixz-editor-summary-footer">{footer}</div>}
    </aside>
  );
});

/**
 * Renders a titled form section with a reusable field grid. @public
 */
export const EditorSection = forwardRef<HTMLElement, EditorSectionProps>(function EditorSection(
  { title, description, accessory, layout = "default", className, children, ...props },
  ref,
) {
  return (
    <section {...props} ref={ref} className={classNames("miaixz-editor-section", className)}>
      <header>
        <div>
          <h3>{title}</h3>
          {description !== undefined && <p>{description}</p>}
        </div>
        {accessory}
      </header>
      <div className={classNames("miaixz-editor-section-body", `miaixz-editor-${layout}`)}>
        {children}
      </div>
    </section>
  );
});

/**
 * Renders one bordered association group. @public
 */
export const EditorGroup = forwardRef<HTMLElement, EditorGroupProps>(function EditorGroup(
  { title, description, accessory, className, children, ...props },
  ref,
) {
  return (
    <section {...props} ref={ref} className={classNames("miaixz-editor-group", className)}>
      <header>
        <div>
          <h4>{title}</h4>
          {description !== undefined && <p>{description}</p>}
        </div>
        {accessory}
      </header>
      <div className="miaixz-editor-group-options">{children}</div>
    </section>
  );
});

/**
 * Renders a compact set of editor headline values. @public
 */
export const EditorOverview = forwardRef<HTMLDivElement, EditorOverviewProps>(
  function EditorOverview({ items, className, ...props }, ref) {
    return (
      <div {...props} ref={ref} className={classNames("miaixz-editor-overview", className)}>
        {items.map((item, index) => (
          <div key={index}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            {item.description !== undefined && <small>{item.description}</small>}
          </div>
        ))}
      </div>
    );
  },
);

/**
 * Renders a bordered, scrollable option collection. @public
 */
export const EditorPicker = forwardRef<HTMLDivElement, EditorPickerProps>(function EditorPicker(
  { className, ...props },
  ref,
) {
  return <div {...props} ref={ref} className={classNames("miaixz-editor-picker", className)} />;
});
