import type { HTMLAttributes } from "react";

import type { MiaixzComponentSize } from "../shared.types.js";

/**
 * Defines properties owned by the Miaixz Spinner contract.
 *
 * @public
 */
export interface MiaixzSpinnerOwnProps {
  /**
   * Selects the semantic spinner size.
   *
   * @defaultValue `"medium"`
   */
  readonly size?: MiaixzComponentSize;

  /**
   * Supplies the required localized accessible loading label.
   */
  readonly label: string;
}

/**
 * Configures an accessible indeterminate loading indicator.
 *
 * @public
 */
export interface SpinnerProps
  extends
    Omit<HTMLAttributes<HTMLSpanElement>, keyof MiaixzSpinnerOwnProps>,
    MiaixzSpinnerOwnProps {}
