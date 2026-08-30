import type { HTMLAttributes } from "react";

import type { MiaixzComponentSize } from "../shared.types.js";

/**
 * Defines properties owned by the Miaixz Avatar contract.
 *
 * @public
 */
export interface MiaixzAvatarOwnProps {
  /**
   * Supplies the optional profile image source.
   */
  readonly src?: string;

  /**
   * Supplies the required accessible name for either image or fallback content.
   */
  readonly alt: string;

  /**
   * Supplies the name used to derive fallback graphemes.
   */
  readonly name: string;

  /**
   * Selects the semantic avatar size.
   *
   * @defaultValue `"medium"`
   */
  readonly size?: MiaixzComponentSize;
}

/**
 * Configures an accessible profile image with a deterministic name fallback.
 *
 * @public
 */
export interface AvatarProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, keyof MiaixzAvatarOwnProps>, MiaixzAvatarOwnProps {}
