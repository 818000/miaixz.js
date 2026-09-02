/**
 * Describes one locale option displayed by Appearance. @public
 */
export interface AppearanceLocaleOption {
  /**
   * Stable locale identifier.
   */
  readonly id: string;
  /**
   * Full human-readable locale label.
   */
  readonly label: string;
  /**
   * Compact locale preview label.
   */
  readonly shortLabel: string;
}

/**
 * Configures the global Appearance control. @public
 */
export interface AppearanceProps {
  /**
   * Selects the exact group set shown in the drawer.
   */
  readonly scope: "entry" | "authenticated";
  /**
   * Supplies the available locale choices.
   */
  readonly locales: readonly AppearanceLocaleOption[];
  /**
   * Selects the active locale identifier.
   */
  readonly locale: string;
  /**
   * Receives locale selection changes.
   */
  readonly onLocaleChange: (id: string) => void;
  /**
   * Selects fixed or scrolling authenticated header behavior.
   */
  readonly headerBehavior?: "fixed" | "scroll";
  /**
   * Receives header behavior changes.
   */
  readonly onHeaderBehaviorChange?: (value: "fixed" | "scroll") => void;
  /**
   * Supplies the trigger block-start edge in pixels.
   */
  readonly positionBlockPx?: number;
  /**
   * Receives the final trigger block-start edge after movement.
   */
  readonly onPositionBlockPxChange?: (value: number) => void;
  /**
   * Enables pointer and keyboard vertical movement.
   *
   * @defaultValue `true`
   */
  readonly draggable?: boolean;
}
