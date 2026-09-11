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

import { forwardRef, useRef, useState } from "react";

import { classNames } from "../../shared/class-names.js";
import { useMergedRef } from "../../shared/use-merged-ref.js";
import { useMiaixzLocale } from "../../i18n/index.js";
import { IconButton } from "../action/index.js";
import { Icon } from "../icon/index.js";
import { Input } from "../input/index.js";
import type { SearchProps } from "./search.types.js";

/**
 * Renders a localized search field with optional clear control.
 *
 * @public
 */
export const Search = forwardRef<HTMLInputElement, SearchProps>(function Search(
  {
    value,
    defaultValue = "",
    onChange,
    onValueChange,
    clearable = true,
    clearLabel,
    variant = "default",
    width = "fill",
    shortcut,
    className,
    "aria-label": ariaLabel,
    ...props
  },
  forwardedRef,
) {
  const { t } = useMiaixzLocale();
  const resolvedClearLabel = clearLabel ?? t("ui.search.clear");
  const resolvedAriaLabel = ariaLabel ?? t("ui.search");
  const inputRef = useRef<HTMLInputElement>(null);
  const ref = useMergedRef(forwardedRef, inputRef);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = value ?? internalValue;
  const clearAction =
    clearable && currentValue.length > 0 ? (
      <span className="miaixz-search-clear">
        <IconButton
          action={{
            id: "clear-search",
            intent: "close",
            label: resolvedClearLabel,
            icon: "X",
            tone: "neutral",
            size: "compact",
            confirm: "none",
            placement: "icon",
            onAction: () => {
              if (value === undefined) setInternalValue("");
              onValueChange?.("");
              inputRef.current?.focus();
            },
          }}
        />
      </span>
    ) : undefined;
  const endAdornment =
    clearAction !== undefined || shortcut !== undefined ? (
      <span className="miaixz-search-end">
        {clearAction}
        {shortcut !== undefined && <span className="miaixz-search-shortcut">{shortcut}</span>}
      </span>
    ) : undefined;

  return (
    <Input
      {...props}
      ref={ref}
      type="search"
      value={currentValue}
      aria-label={resolvedAriaLabel}
      className={classNames(
        "miaixz-search",
        variant === "header" && "miaixz-search-header",
        width === "medium" && "miaixz-search-medium",
        className,
      )}
      startAdornment={<Icon name="Search" size="control" />}
      endAdornment={endAdornment}
      onChange={(event) => {
        if (value === undefined) {
          setInternalValue(event.currentTarget.value);
        }
        onChange?.(event);
        onValueChange?.(event.currentTarget.value);
      }}
    />
  );
});
