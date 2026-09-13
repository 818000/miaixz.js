/*
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~                                                                           ~
 ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~
 ~                                                                           ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");           ~
 ~ you may not use this file except in compliance with the License.          ~
 ~ You may obtain a copy of the License at                                   ~
 ~                                                                           ~
 ~      https://www.apache.org/licenses/LICENSE-2.0                          ~
 ~                                                                           ~
 ~ Unless required by applicable law or agreed to in writing, software       ~
 ~ distributed under the License is distributed on an "AS IS" BASIS,         ~
 ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  ~
 ~ See the License for the specific language governing permissions and       ~
 ~ limitations under the License.                                            ~
 ~                                                                           ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
*/

import { createContext, useContext, useLayoutEffect, useRef } from "react";

import { MiaixzUiError } from "../errors/ui-error.js";

/**
 * Describes state and ARIA properties inherited by a Field control.
 *
 * @public
 */
export interface FieldControlProps {
  /**
   * Identifies the main control.
   */
  id?: string | undefined;
  /**
   * Marks the control as required.
   */
  required?: boolean | undefined;
  /**
   * Marks the control as disabled.
   */
  disabled?: boolean | undefined;
  /**
   * Applies the component's invalid visual state.
   */
  invalid?: boolean | undefined;
  /**
   * Communicates the validation state to assistive technology.
   */
  "aria-invalid"?: boolean | "false" | "true" | "grammar" | "spelling" | undefined;
  /**
   * Supplies an alternative accessible-name relationship.
   */
  "aria-labelledby"?: string | undefined;
  /**
   * References helper and error descriptions.
   */
  "aria-describedby"?: string | undefined;
}

/**
 * Connects one main control to its owning Field.
 */
export interface MiaixzFieldContextValue {
  /**
   * Identifies the registered control.
   */
  readonly controlId: string;
  /**
   * Identifies the visible label.
   */
  readonly labelId: string;
  /**
   * Identifies the optional helper description.
   */
  readonly descriptionId: string | undefined;
  /**
   * Identifies the optional error message.
   */
  readonly errorId: string | undefined;
  /**
   * Reports whether the Field is required.
   */
  readonly required: boolean;
  /**
   * Reports whether the Field is invalid.
   */
  readonly invalid: boolean;
  /**
   * Reports whether the Field is disabled.
   */
  readonly disabled: boolean;
  /**
   * Registers the Field's one main control.
   */
  readonly registerControl: (token: symbol) => void;
  /**
   * Unregisters the Field's main control during cleanup.
   */
  readonly unregisterControl: (token: symbol) => void;
}

/**
 * Shares Field ownership with its single main control.
 */
export const MiaixzFieldContext = createContext<MiaixzFieldContextValue | null>(null);

/**
 * Combines space-delimited ARIA identifier lists, preserving first occurrence order.
 *
 * @param values - Identifier lists in semantic reading order.
 * @returns A normalized identifier list, or undefined when no tokens exist.
 */
function mergeFieldIdRefs(...values: ReadonlyArray<string | undefined>): string | undefined {
  const seen = new Set<string>();
  const tokens: string[] = [];
  for (const value of values) {
    for (const token of value?.split(/\s+/) ?? []) {
      if (token.length === 0 || seen.has(token)) continue;
      seen.add(token);
      tokens.push(token);
    }
  }
  return tokens.length === 0 ? undefined : tokens.join(" ");
}

/**
 * Converts aria-invalid to the boolean meaning used by Field conflict checks.
 *
 * @param value - Explicit aria-invalid value.
 * @returns Whether assistive technology will interpret the control as invalid.
 */
function isAriaInvalid(value: FieldControlProps["aria-invalid"]): boolean {
  return value !== undefined && value !== false && value !== "false";
}

/**
 * Registers and merges the main control owned by the nearest Field.
 * Outside a Field, the original props object is returned unchanged.
 *
 * @param controlProps - Control-owned props to validate and merge.
 * @returns Effective Field control props.
 * @public
 */
export function useFieldControl<ControlProps extends FieldControlProps>(
  controlProps: ControlProps,
): ControlProps & FieldControlProps {
  const context = useContext(MiaixzFieldContext);
  const registrationTokenRef = useRef(Symbol("miaixz-field-control"));

  useLayoutEffect(() => {
    if (context === null) return undefined;
    const token = registrationTokenRef.current;
    context.registerControl(token);
    return () => context.unregisterControl(token);
  }, [context]);

  if (context === null) return controlProps;

  if (controlProps.id !== undefined && controlProps.id !== context.controlId) {
    throw new MiaixzUiError({
      code: "UI_FIELD_CONTROL_ID_INVALID",
    });
  }
  if (controlProps.required !== undefined && controlProps.required !== context.required) {
    throw new MiaixzUiError({
      code: "UI_FIELD_REQUIRED_CONFLICT",
    });
  }
  if (controlProps.disabled !== undefined && controlProps.disabled !== context.disabled) {
    throw new MiaixzUiError({
      code: "UI_FIELD_DISABLED_CONFLICT",
    });
  }
  if (controlProps.invalid !== undefined && controlProps.invalid !== context.invalid) {
    throw new MiaixzUiError({
      code: "UI_FIELD_INVALID_CONFLICT",
    });
  }
  if (
    controlProps["aria-invalid"] !== undefined &&
    isAriaInvalid(controlProps["aria-invalid"]) !== context.invalid
  ) {
    throw new MiaixzUiError({
      code: "UI_FIELD_INVALID_CONFLICT",
    });
  }

  const ariaDescribedBy = mergeFieldIdRefs(
    controlProps["aria-describedby"],
    context.descriptionId,
    context.errorId,
  );
  return {
    ...controlProps,
    id: context.controlId,
    required: context.required,
    disabled: context.disabled,
    invalid: context.invalid,
    ...(context.invalid ? { "aria-invalid": true } : {}),
    "aria-labelledby": controlProps["aria-labelledby"] ?? context.labelId,
    ...(ariaDescribedBy === undefined ? {} : { "aria-describedby": ariaDescribedBy }),
  };
}
