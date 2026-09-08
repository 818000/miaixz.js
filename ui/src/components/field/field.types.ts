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

import type { HTMLAttributes, ReactElement, ReactNode } from "react";

/**
 * Describes control properties injected by a form field wrapper.
 *
 * @public
 */
export interface FieldControlProps {
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
export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * Supplies the visible control label.
   */
  label: ReactNode;
  /**
   * Supplies the single form control enhanced by the wrapper.
   */
  children: ReactElement<FieldControlProps>;
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
