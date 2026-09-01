import { forwardRef, useRef, useState } from "react";

import { useMergedRef } from "../../internal/use-merged-ref.js";
import { useMiaixzLocale } from "../../i18n/index.js";
import { Button } from "../button/index.js";
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

  return (
    <Input
      {...props}
      ref={ref}
      type="search"
      value={currentValue}
      aria-label={resolvedAriaLabel}
      startAdornment={<Icon name="Search" size="control" />}
      endAdornment={
        clearable && currentValue.length > 0 ? (
          <Button
            iconOnly
            type="button"
            size="small"
            variant="ghost"
            aria-label={resolvedClearLabel}
            className="miaixz-search-clear"
            onClick={() => {
              if (value === undefined) {
                setInternalValue("");
              }
              onValueChange?.("");
              inputRef.current?.focus();
            }}
          >
            <Icon name="X" size="control" />
          </Button>
        ) : undefined
      }
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
