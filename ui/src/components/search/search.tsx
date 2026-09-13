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

import { forwardRef, useCallback, useRef } from "react";

import { useMiaixzLocale } from "../../i18n/i18n.js";
import { classNames } from "../../shared/class-names.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { useControlled } from "../../shared/use-controlled.js";
import { useMergedRef } from "../../shared/use-merged-ref.js";
import { IconButton } from "../action/icon-button.js";
import { Icon } from "../icon/icon.js";
import { Input } from "../input/input.js";
import type { SearchChangeReason, SearchOwnerState, SearchProps } from "./search.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/**
 * Renders a localized search field with one reasoned value-change channel.
 *
 * @public
 */
export const Search = withMiaixzThemeComponent(
  "Search",
  forwardRef<HTMLInputElement, SearchProps>(function Search(props, forwardedRef) {
    const {
      value,
      defaultValue,
      onValueChange,
      onClear,
      clearable = true,
      clearLabel,
      variant = "default",
      width = "fill",
      shortcut,
      className,
      disabled,
      readOnly,
      size = "medium",
      slotProps,
      "aria-label": ariaLabel,
      ...inputProps
    } = props;
    const { t } = useMiaixzLocale();
    const inputRef = useRef<HTMLInputElement>(null);
    const ref = useMergedRef(forwardedRef, inputRef);
    const reasonRef = useRef<SearchChangeReason>("input");
    const state = useControlled({
      value,
      defaultValue: defaultValue ?? "",
      hasDefaultValue: value !== undefined && defaultValue !== undefined,
      onValueChange: (nextValue) => onValueChange?.(nextValue, reasonRef.current),
    });
    const requestValueChange = useCallback(
      (nextValue: string, reason: SearchChangeReason) => {
        reasonRef.current = reason;
        state.setValue(nextValue);
      },
      [state],
    );
    const resolvedClearLabel = clearLabel ?? t("ui.search.clear");
    const resolvedAriaLabel = ariaLabel ?? t("ui.search");
    const canClear = clearable && state.value.length > 0 && disabled !== true && readOnly !== true;
    const ownerState: SearchOwnerState = {
      variant,
      width,
      size,
      disabled: disabled === true,
      readOnly: readOnly === true,
      filled: state.value.length > 0,
    };
    const startProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-search-start" },
      slotProps: slotProps?.startAdornment,
    });
    const endProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-search-end" },
      slotProps: slotProps?.endAdornment,
    });
    const shortcutProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-search-shortcut" },
      slotProps: slotProps?.shortcut,
    });
    const clearRootProps =
      typeof slotProps?.clear === "function" ? slotProps.clear(ownerState) : slotProps?.clear;
    const rootSlotProps =
      typeof slotProps?.root === "function" ? slotProps.root(ownerState) : slotProps?.root;
    const inputSlotProps =
      typeof slotProps?.input === "function" ? slotProps.input(ownerState) : slotProps?.input;
    const clearAction = canClear ? (
      <span className="miaixz-search-clear">
        <IconButton
          icon="X"
          label={resolvedClearLabel}
          size="small"
          {...(clearRootProps === undefined ? {} : { slotProps: { root: clearRootProps } })}
          onClick={() => {
            requestValueChange("", "clear");
            onClear?.();
            inputRef.current?.focus();
          }}
        />
      </span>
    ) : undefined;
    const endAdornment =
      clearAction !== undefined || shortcut !== undefined ? (
        <span {...endProps}>
          {clearAction}
          {shortcut !== undefined && <span {...shortcutProps}>{shortcut}</span>}
        </span>
      ) : undefined;

    return (
      <Input
        {...inputProps}
        ref={ref}
        aria-label={resolvedAriaLabel}
        className={classNames(
          "miaixz-search",
          variant === "header" && "miaixz-search-header",
          width === "medium" && "miaixz-search-medium",
          className,
        )}
        disabled={disabled}
        endAdornment={endAdornment}
        readOnly={readOnly}
        size={size}
        slotProps={{
          ...(rootSlotProps === undefined ? {} : { root: rootSlotProps }),
          ...(inputSlotProps === undefined ? {} : { input: inputSlotProps }),
        }}
        startAdornment={
          <span {...startProps}>
            <Icon name="Search" size="control" />
          </span>
        }
        type="search"
        value={state.value}
        onChange={(event) => requestValueChange(event.currentTarget.value, "input")}
      />
    );
  }),
);
