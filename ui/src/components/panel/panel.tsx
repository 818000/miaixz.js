import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { PanelProps } from "./panel.types.js";

/**
 * Renders a framed content surface with optional header, actions, and footer.
 *
 * @public
 */
export const Panel = forwardRef<HTMLElement, PanelProps>(function Panel(
  {
    title,
    sections,
    description,
    actions,
    leading,
    footer,
    surface = "default",
    bodyLayout = "content",
    bodyGap = "default",
    bodySize = "default",
    headerSize = "default",
    responsiveBodyScroll = false,
    variant = "default",
    raised = false,
    selected = false,
    interactive = false,
    flush = false,
    bodyFlush = false,
    bodyPadding = "default",
    minHeight = "default",
    headerLayout = "responsive",
    headingLevel = 3,
    className,
    children,
    ...props
  },
  ref,
) {
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4" | "h5" | "h6";
  const hasHeader =
    title !== undefined ||
    description !== undefined ||
    actions !== undefined ||
    leading !== undefined;

  return (
    <section
      {...props}
      ref={ref}
      data-selected={selected || undefined}
      className={classNames(
        "miaixz-panel",
        `miaixz-panel-${variant}`,
        `miaixz-panel-body-${bodyLayout}`,
        `miaixz-panel-body-gap-${bodyGap}`,
        `miaixz-panel-body-size-${bodySize}`,
        `miaixz-panel-header-${headerSize}`,
        `miaixz-panel-min-height-${minHeight}`,
        responsiveBodyScroll && "miaixz-panel-body-responsive-scroll",
        raised && "miaixz-panel-raised",
        selected && "miaixz-panel-selected",
        interactive && "miaixz-panel-interactive",
        flush && "miaixz-panel-flush",
        bodyFlush && "miaixz-panel-body-flush",
        bodyPadding === "none" && "miaixz-panel-body-padding-none",
        headerLayout === "inline" && "miaixz-panel-header-inline",
        surface === "transparent" && "miaixz-panel-transparent",
        className,
      )}
    >
      {hasHeader && (
        <header className="miaixz-panel-header">
          <div className="miaixz-panel-header-copy">
            {leading !== undefined && <div className="miaixz-panel-leading">{leading}</div>}
            <div>
              {title !== undefined && <Heading className="miaixz-panel-title">{title}</Heading>}
              {description !== undefined && (
                <p className="miaixz-panel-description">{description}</p>
              )}
            </div>
          </div>
          {actions !== undefined && <div className="miaixz-panel-actions">{actions}</div>}
        </header>
      )}
      {(sections !== undefined || children !== undefined) && (
        <div className="miaixz-panel-body">
          {sections?.map((section, index) => (
            <div key={index} className="miaixz-panel-section">
              {section}
            </div>
          )) ?? children}
        </div>
      )}
      {footer !== undefined && <footer className="miaixz-panel-footer">{footer}</footer>}
    </section>
  );
});
