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

import { createElement, forwardRef, type HTMLAttributes } from "react";

import { classNames } from "../../shared/class-names.js";
import type {
  PanelProps,
  PanelFooterProps,
  PanelRowProps,
  PanelStyleOptions,
} from "./panel.types.js";

/**
 * Shares the native surface recipe with directly composed cards.
 *
 * @param root0 - Framework-independent panel surface options.
 * @param root0.variant - Direct composition recipe.
 * @param root0.surface - Inherited or explicitly filled surface.
 * @param root0.className - Optional consumer class appended to the recipe.
 * @returns A complete class name for a directly composed panel surface.
 * @public
 */
export function getPanelClassName({
  variant = "plain",
  surface = "default",
  className,
}: PanelStyleOptions = {}): string {
  return classNames(
    "miaixz-panel-surface",
    `miaixz-panel-surface-${variant}`,
    surface === "filled" && "miaixz-panel-surface-filled",
    className,
  );
}

/**
 * Renders a standalone panel header region.
 *
 * @public
 */
export const PanelHeader = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  function PanelHeader({ className, ...props }, ref) {
    return (
      <header
        {...props}
        ref={ref}
        className={classNames("miaixz-panel-section-header", className)}
      />
    );
  },
);

/**
 * Renders a standalone panel action region.
 *
 * @public
 */
export const PanelFooter = forwardRef<HTMLElement, PanelFooterProps>(function PanelFooter(
  { className, variant = "framed", ...props },
  ref,
) {
  return (
    <footer
      {...props}
      ref={ref}
      className={classNames(
        (variant === "framed" || variant === "inset") && "miaixz-panel-action-footer",
        `miaixz-panel-action-footer-${variant}`,
        className,
      )}
    />
  );
});

/**
 * Renders one divided content row.
 *
 * @public
 */
export const PanelRow = forwardRef<HTMLElement, PanelRowProps>(function PanelRow(
  { className, as = "article", spacing = "default", distribution = "between", ...props },
  ref,
) {
  return createElement(as, {
    ...props,
    ref,
    className: classNames(
      "miaixz-panel-row",
      distribution === "start" && "miaixz-panel-row-start",
      spacing === "comfortable" && "miaixz-panel-row-comfortable",
      className,
    ),
  });
});

/**
 * Renders a framed content surface with optional header, actions, and footer.
 *
 * @public
 */
export const Panel = forwardRef<HTMLElement, PanelProps>(function Panel(
  {
    title,
    as = "section",
    frame = "default",
    interaction = "default",
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

  if (
    variant === "plain" ||
    variant === "content" ||
    variant === "navigation" ||
    variant === "section"
  ) {
    return createElement(
      as,
      {
        ...props,
        ref,
        className: getPanelClassName({
          variant,
          ...(surface === "filled" ? { surface } : {}),
          ...(className !== undefined ? { className } : {}),
        }),
      },
      hasHeader && (
        <header>
          {leading}
          {title !== undefined && <Heading>{title}</Heading>}
          {description !== undefined && <p>{description}</p>}
          {actions}
        </header>
      ),
      sections ?? children,
      footer !== undefined && <footer>{footer}</footer>,
    );
  }

  return (
    <section
      {...props}
      ref={ref}
      data-selected={selected || undefined}
      className={classNames(
        "miaixz-panel",
        frame !== "default" && `miaixz-panel-frame-${frame}`,
        interaction === "lift" && "miaixz-panel-lift",
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
