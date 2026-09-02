import type { MiaixzLocaleDescriptor } from "@miaixz/sdk/i18n";
import type { HTMLAttributes } from "react";

/**
 * Configures the searchable global locale selector.
 *
 * @public
 */
export interface LocalePickerProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /**
   * Supplies the ordered locale catalog descriptors.
   */
  readonly locales: readonly MiaixzLocaleDescriptor[];

  /**
   * Selects the active canonical locale identifier.
   */
  readonly locale: string;

  /**
   * Loads and activates a selected locale.
   */
  readonly onLocaleChange: (locale: string) => void | Promise<void>;

  /**
   * Disables every locale choice.
   *
   * @defaultValue `false`
   */
  readonly disabled?: boolean;
}
