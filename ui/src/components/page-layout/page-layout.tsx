import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import { useMiaixzLocale } from "../../i18n/index.js";
import type {
  AppShellProps,
  ClusterProps,
  GridProps,
  PageBodyProps,
  PageHeaderProps,
  PageProps,
  PageToolbarProps,
  ScrollRegionProps,
  SidebarLayoutProps,
  SplitLayoutProps,
  StackProps,
  StickyProps,
} from "./page-layout.types.js";

/**
 * Provides the root grid for product navigation, header, and main content.
 *
 * @public
 */
export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppShell(
  {
    header,
    sidebar,
    headerClassName,
    sidebarClassName,
    mainClassName,
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <div {...props} ref={ref} className={classNames("miaixz-shell", className)}>
      <header className={classNames("miaixz-shell-header", headerClassName)}>{header}</header>
      <aside className={classNames("miaixz-shell-sidebar", sidebarClassName)}>{sidebar}</aside>
      <main className={classNames("miaixz-shell-main", mainClassName)}>{children}</main>
    </div>
  );
});

/**
 * Establishes the width, spacing, and semantic main region of a page.
 *
 * @public
 */
export const Page = forwardRef<HTMLElement, PageProps>(function Page(
  { fullWidth = false, className, ...props },
  ref,
) {
  return (
    <section
      {...props}
      ref={ref}
      className={classNames("miaixz-page", fullWidth && "miaixz-layout-full-width", className)}
    />
  );
});

/**
 * Renders a page title area with description, metadata, and actions.
 *
 * @public
 */
export const PageHeader = forwardRef<HTMLElement, PageHeaderProps>(function PageHeader(
  { title, eyebrow, description, actions, headingLevel = 1, className, children, ...props },
  ref,
) {
  const Heading = `h${headingLevel}` as "h1" | "h2" | "h3";

  return (
    <header {...props} ref={ref} className={classNames("miaixz-page-header", className)}>
      <div className="miaixz-page-header-content">
        {eyebrow !== undefined && <div className="miaixz-page-eyebrow">{eyebrow}</div>}
        <Heading className="miaixz-page-title">{title}</Heading>
        {description !== undefined && <p className="miaixz-page-description">{description}</p>}
        {children}
      </div>
      {actions !== undefined && <div className="miaixz-page-actions">{actions}</div>}
    </header>
  );
});

/**
 * Wraps the primary page content with standardized vertical rhythm.
 *
 * @public
 */
export const PageBody = forwardRef<HTMLDivElement, PageBodyProps>(function PageBody(
  { className, ...props },
  ref,
) {
  return <div {...props} ref={ref} className={classNames("miaixz-page-body", className)} />;
});

/**
 * Aligns page-level filters, search, and primary actions.
 *
 * @public
 */
export const PageToolbar = forwardRef<HTMLDivElement, PageToolbarProps>(function PageToolbar(
  { leading, actions, sticky = false, className, children, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={classNames(
        "miaixz-page-toolbar",
        sticky && "miaixz-page-toolbar-sticky",
        className,
      )}
    >
      <div className="miaixz-page-toolbar-leading">{leading ?? children}</div>
      {actions !== undefined && <div className="miaixz-page-toolbar-actions">{actions}</div>}
    </div>
  );
});

/**
 * Arranges children vertically using a design-token gap.
 *
 * @public
 */
export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  { className, ...props },
  ref,
) {
  return <div {...props} ref={ref} className={classNames("miaixz-layout-stack", className)} />;
});

/**
 * Arranges wrapping inline content with controlled alignment and spacing.
 *
 * @public
 */
export const Cluster = forwardRef<HTMLDivElement, ClusterProps>(function Cluster(
  { justify = "start", className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      data-justify={justify}
      className={classNames("miaixz-layout-cluster", className)}
    />
  );
});

/**
 * Creates a responsive auto-fit grid with configurable minimum column width.
 *
 * @public
 */
export const Grid = forwardRef<HTMLDivElement, GridProps>(function Grid(
  { minItemWidth = "standard", className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={classNames(
        "miaixz-layout-grid",
        minItemWidth === "wide" && "miaixz-layout-grid-wide",
        className,
      )}
    />
  );
});

/**
 * Creates a responsive primary-secondary split layout.
 *
 * @public
 */
export const SplitLayout = forwardRef<HTMLDivElement, SplitLayoutProps>(function SplitLayout(
  { ratio = "equal", className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      data-ratio={ratio}
      className={classNames("miaixz-layout-split", className)}
    />
  );
});

/**
 * Creates a localized sidebar and content layout that collapses responsively.
 *
 * @public
 */
export const SidebarLayout = forwardRef<HTMLDivElement, SidebarLayoutProps>(function SidebarLayout(
  { sidebar, sidebarLabel, stickySidebar = true, contentClassName, className, children, ...props },
  ref,
) {
  const { t } = useMiaixzLocale();
  return (
    <div {...props} ref={ref} className={classNames("miaixz-layout-sidebar-content", className)}>
      <aside
        aria-label={sidebarLabel ?? t("ui.sectionNavigation.label")}
        className={classNames("miaixz-layout-sidebar", stickySidebar && "miaixz-layout-sticky")}
      >
        {sidebar}
      </aside>
      <div className={classNames("miaixz-layout-sidebar-main", contentClassName)}>{children}</div>
    </div>
  );
});

/**
 * Creates a bounded, keyboard-focusable overflow region.
 *
 * @public
 */
export const ScrollRegion = forwardRef<HTMLDivElement, ScrollRegionProps>(function ScrollRegion(
  { label, className, tabIndex, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      aria-label={label}
      role={label ? "region" : undefined}
      tabIndex={tabIndex ?? 0}
      className={classNames("miaixz-layout-scroll-region", className)}
    />
  );
});

/**
 * Keeps content pinned to a viewport edge within its scrolling container.
 *
 * @public
 */
export const Sticky = forwardRef<HTMLDivElement, StickyProps>(function Sticky(
  { className, ...props },
  ref,
) {
  return <div {...props} ref={ref} className={classNames("miaixz-layout-sticky", className)} />;
});
