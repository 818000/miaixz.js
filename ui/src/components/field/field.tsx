import { cloneElement, useId } from "react";

import { classNames } from "../../internal/class-names.js";
import type { FieldProps } from "./field.types.js";

/**
 * Combines optional ARIA reference identifiers without empty segments.
 *
 * @param ids - Candidate identifiers in semantic reading order.
 * @returns A space-delimited identifier list or `undefined` when empty.
 */
function mergeIds(...ids: ReadonlyArray<string | undefined>): string | undefined {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

/* eslint-disable jsdoc/check-param-names, jsdoc/require-param -- TSDoc documents the typed properties instead of dotted parameter names. */
/**
 * Connects a form control to its label, description, required state, and error.
 * Generated identifiers preserve accessible relationships without caller setup.
 *
 * @param props - Form-field configuration and native container properties.
 * @returns The connected field structure.
 * @public
 */
export function Field({
  label,
  children,
  helperText,
  errorText,
  optionalText,
  required = false,
  controlId,
  className,
  ...props
}: FieldProps) {
  const generatedId = useId();
  const id = controlId ?? children.props.id ?? `miaixz-field-${generatedId}`;
  const helperId = helperText ? `${id}-helper` : undefined;
  const errorId = errorText ? `${id}-error` : undefined;
  const describedBy = mergeIds(children.props["aria-describedby"], helperId, errorId);
  const isRequired = required || Boolean(children.props.required);
  const isInvalid = Boolean(errorText) || Boolean(children.props.invalid);
  const ariaInvalid = errorText ? true : children.props["aria-invalid"];

  const control = cloneElement(children, {
    id,
    ...(isRequired ? { required: true } : {}),
    ...(isInvalid ? { invalid: true } : {}),
    ...(ariaInvalid === undefined ? {} : { "aria-invalid": ariaInvalid }),
    ...(describedBy === undefined ? {} : { "aria-describedby": describedBy }),
  });

  return (
    <div
      {...props}
      className={classNames(
        "miaixz-field",
        Boolean(errorText) && "miaixz-field-invalid",
        className,
      )}
      data-invalid={Boolean(errorText) || undefined}
    >
      <div className="miaixz-field-label-row">
        <label className="miaixz-field-label" htmlFor={id}>
          {label}
          {required && (
            <span className="miaixz-field-required" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {!required && optionalText && <span className="miaixz-field-optional">{optionalText}</span>}
      </div>
      {control}
      {helperText && (
        <div id={helperId} className="miaixz-field-helper">
          {helperText}
        </div>
      )}
      {errorText && (
        <div id={errorId} className="miaixz-field-error" role="alert">
          {errorText}
        </div>
      )}
    </div>
  );
}
/* eslint-enable jsdoc/check-param-names, jsdoc/require-param */
