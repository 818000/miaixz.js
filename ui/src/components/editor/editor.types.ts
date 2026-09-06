import type { HTMLAttributes, ReactNode } from "react";

/**
 * One label and value displayed in an editor summary. @public
 */
export interface EditorSummaryItem {
  /**
   * Supplies the item label.
   */
  readonly label: ReactNode;
  /**
   * Supplies the item value.
   */
  readonly value: ReactNode;
}

/**
 * One compact value displayed above a tabbed editor. @public
 */
export interface EditorOverviewItem {
  /**
   * Supplies the overview label.
   */
  readonly label: ReactNode;
  /**
   * Supplies the primary overview value.
   */
  readonly value: ReactNode;
  /**
   * Supplies optional supporting copy.
   */
  readonly description?: ReactNode;
}

/**
 * Configures the two-column editor shell. @public
 */
export interface EditorLayoutProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Supplies the editor's summary rail.
   */
  readonly summary: ReactNode;

  /**
   * Selects the summary treatment used to separate it from the editor body.
   *
   * @defaultValue `"default"`
   */
  readonly variant?: "default" | "divided";
}

/**
 * Configures the sticky identity summary shown beside an editor form. @public
 */
export interface EditorSummaryProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /**
   * Supplies the profile image or fallback.
   */
  readonly avatar: ReactNode;
  /**
   * Supplies the primary identity.
   */
  readonly title: ReactNode;
  /**
   * Supplies supporting identity metadata.
   */
  readonly subtitle: ReactNode;
  /**
   * Supplies optional status content.
   */
  readonly status?: ReactNode;
  /**
   * Supplies the labeled summary values.
   */
  readonly items: readonly EditorSummaryItem[];
  /**
   * Supplies content anchored at the summary's end.
   */
  readonly footer?: ReactNode;
}

/**
 * Configures one titled editor section and its field layout. @public
 */
export interface EditorSectionProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /**
   * Supplies the section heading.
   */
  readonly title: ReactNode;
  /**
   * Supplies optional section guidance.
   */
  readonly description?: ReactNode;
  /**
   * Supplies optional trailing header content.
   */
  readonly accessory?: ReactNode;
  /**
   * Selects the field arrangement.
   */
  readonly layout?: "default" | "two" | "associations";
}

/**
 * Configures one framed association group inside an editor section. @public
 */
export interface EditorGroupProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /**
   * Supplies the group heading.
   */
  readonly title: ReactNode;
  /**
   * Supplies optional group guidance.
   */
  readonly description?: ReactNode;
  /**
   * Supplies optional trailing header content.
   */
  readonly accessory?: ReactNode;
}

/**
 * Configures a compact three-column editor overview. @public
 */
export interface EditorOverviewProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Supplies ordered overview values.
   */
  readonly items: readonly EditorOverviewItem[];
}

/**
 * Configures a bordered, scrollable editor option picker. @public
 */
export type EditorPickerProps = HTMLAttributes<HTMLDivElement>;
