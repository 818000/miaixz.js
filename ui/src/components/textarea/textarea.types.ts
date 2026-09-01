import type { TextareaHTMLAttributes } from "react";

import type { MiaixzFormPreviewProps } from "../shared.types.js";

/**
 * Defines the supported multiline control sizes.
 *
 * @public
 */
export type TextareaSize = "small" | "medium" | "large";

/**
 * Defines the browser resize directions enabled for a textarea.
 *
 * @public
 */
export type TextareaResize = "none" | "vertical" | "horizontal" | "both";

/**
 * Configures a multiline native text control.
 *
 * @public
 */
export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>, MiaixzFormPreviewProps {
  /**
   * Selects the control size.
   *
   * @defaultValue `"medium"`
   */
  size?: TextareaSize;
  /**
   * Applies the invalid state independently of `aria-invalid`.
   *
   * @defaultValue `false`
   */
  invalid?: boolean;
  /**
   * Selects the browser resize directions.
   *
   * @defaultValue `"vertical"`
   */
  resize?: TextareaResize;
}
