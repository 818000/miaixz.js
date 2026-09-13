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

import { forwardRef } from "react";

import { useFieldControl } from "../../shared/field-context.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { RangeOwnerState, RangeProps } from "./range.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/**
 * Renders a branded native range input with one root slot.
 *
 * @public
 */
export const Range = withMiaixzThemeComponent(
  "Range",
  forwardRef<HTMLInputElement, RangeProps>(function Range(props, ref) {
    const {
      disabled,
      invalid,
      id,
      required,
      slotProps,
      "aria-invalid": ariaInvalid,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      ...nativeProps
    } = props;
    const fieldProps = useFieldControl({
      ...(id === undefined ? {} : { id }),
      ...(required === undefined ? {} : { required }),
      ...(disabled === undefined ? {} : { disabled }),
      ...(invalid === undefined ? {} : { invalid }),
      ...(ariaInvalid === undefined ? {} : { "aria-invalid": ariaInvalid }),
      ...(ariaLabelledBy === undefined ? {} : { "aria-labelledby": ariaLabelledBy }),
      ...(ariaDescribedBy === undefined ? {} : { "aria-describedby": ariaDescribedBy }),
    });
    const effectiveDisabled = fieldProps.disabled ?? false;
    const effectiveInvalid = fieldProps.invalid ?? false;
    const ownerState: RangeOwnerState = {
      disabled: effectiveDisabled,
      invalid: effectiveInvalid,
    };
    const rootProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-range" },
      componentProps: nativeProps,
      slotProps: slotProps?.root,
      forwardedRef: ref,
      internalProps: {
        ...(fieldProps.id === undefined ? {} : { id: fieldProps.id }),
        type: "range",
        disabled: effectiveDisabled,
        ...(fieldProps.required === undefined ? {} : { required: fieldProps.required }),
        ...(effectiveInvalid ? { "aria-invalid": true } : {}),
        ...(fieldProps["aria-labelledby"] === undefined
          ? {}
          : { "aria-labelledby": fieldProps["aria-labelledby"] }),
        ...(fieldProps["aria-describedby"] === undefined
          ? {}
          : { "aria-describedby": fieldProps["aria-describedby"] }),
        ...(effectiveDisabled ? { "data-disabled": true } : {}),
        ...(effectiveInvalid ? { "data-invalid": true } : {}),
      },
      ownedProps: [
        "id",
        "type",
        "disabled",
        "required",
        "aria-invalid",
        "aria-labelledby",
        "aria-describedby",
        "data-disabled",
        "data-invalid",
      ],
    });
    return <input {...rootProps} />;
  }),
);
