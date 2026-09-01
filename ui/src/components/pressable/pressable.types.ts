import type { ButtonHTMLAttributes } from "react";

/**
 * Configures a semantic button with only shared interaction behavior.
 *
 * Use this for custom list rows, navigation labels and other composite
 * surfaces whose visual layout belongs to the consuming product.
 *
 * @public
 */
export interface PressableProps extends ButtonHTMLAttributes<HTMLButtonElement> {}
