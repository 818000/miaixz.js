import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Defines the visual and semantic treatment of a button.
 *
 * @public
 */
export type ButtonVariant =
  "danger" | "ghost" | "link" | "outline" | "primary" | "refresh" | "secondary";

/**
 * Defines the supported button control sizes.
 *
 * @public
 */
export type ButtonSize = "small" | "medium" | "large";

/**
 * Defines properties shared by all Miaixz button variants.
 *
 * @public
 */
export interface MiaixzButtonBaseProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  /**
   * Selects the visual and semantic treatment.
   *
   * @defaultValue `"secondary"`
   */
  variant?: ButtonVariant;
  /**
   * Selects the button control size.
   *
   * @defaultValue `"medium"`
   */
  size?: ButtonSize;
  /**
   * Expands the button to the width of its container.
   *
   * @defaultValue `false`
   */
  block?: boolean;
  /**
   * Disables interaction and displays progress feedback.
   *
   * @defaultValue `false`
   */
  loading?: boolean;
  /**
   * Overrides the localized loading announcement.
   */
  loadingLabel?: string;
  /**
   * Displays content before the button label.
   */
  startIcon?: ReactNode;
  /**
   * Displays content after the button label.
   */
  endIcon?: ReactNode;
}

/**
 * Configures a labeled Miaixz button.
 *
 * @public
 */
export interface MiaixzButtonWithContentProps extends MiaixzButtonBaseProps {
  /**
   * Keeps the visible label presentation enabled.
   *
   * @defaultValue `false`
   */
  iconOnly?: false;
  /**
   * Supplies the visible button label.
   */
  children: ReactNode;
}

/**
 * Configures an accessible icon-only Miaixz button.
 *
 * @public
 */
export interface MiaixzIconOnlyButtonProps extends MiaixzButtonBaseProps {
  /**
   * Enables a frameless icon action with no surface, border or bottom focus line.
   * Keeps the control hit area and keyboard-only focus outline. Text variants do
   * not add a frame; danger and disabled actions retain their semantic colors.
   * The accessible name is also used as the title unless a title is supplied.
   */
  iconOnly: true;
  /**
   * Provides the required accessible name for an icon-only button.
   */
  "aria-label": string;
  /**
   * Supplies the icon-only button content.
   */
  children: ReactNode;
}

/**
 * Configures either a labeled or an icon-only action button.
 *
 * @public
 */
export type ButtonProps = MiaixzButtonWithContentProps | MiaixzIconOnlyButtonProps;
