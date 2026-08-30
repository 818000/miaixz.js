import type { HTMLAttributes, ReactElement, ReactNode } from "react";

/**
 * Describes control properties injected by a form field wrapper.
 *
 * @public
 */
export interface FormFieldControlProps {
  /**
   * Identifies the form control and connects it to its label.
   */
  id?: string;
  /**
   * Marks the form control as required.
   */
  required?: boolean;
  /**
   * Applies the component's invalid visual state.
   */
  invalid?: boolean;
  /**
   * Communicates the validation state to assistive technology.
   */
  "aria-invalid"?: boolean | "false" | "true" | "grammar" | "spelling";
  /**
   * References helper and error descriptions.
   */
  "aria-describedby"?: string;
}

/**
 * Configures an accessible form-control wrapper.
 *
 * @public
 */
export interface FormFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * Supplies the visible control label.
   */
  label: ReactNode;
  /**
   * Supplies the single form control enhanced by the wrapper.
   */
  children: ReactElement<FormFieldControlProps>;
  /**
   * Displays supporting guidance for the control.
   */
  helperText?: ReactNode;
  /**
   * Displays and announces the current validation failure.
   */
  errorText?: ReactNode;
  /**
   * Displays a localized optional-field marker.
   */
  optionalText?: ReactNode;
  /**
   * Marks the enhanced control as required.
   *
   * @defaultValue `false`
   */
  required?: boolean;
  /**
   * Overrides the generated control identifier.
   */
  controlId?: string;
}
