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

import { forwardRef, useRef } from "react";

import { useMiaixzLocale } from "../../i18n/i18n.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";
import { Icon } from "../icon/icon.js";
import { Link } from "../link/link.js";
import type { TagOwnerState, TagProps } from "./tag.types.js";

/**
 * Renders a compact static, actionable, or linked label.
 */
export const Tag = withMiaixzThemeComponent(
  "Tag",
  forwardRef<HTMLSpanElement, TagProps>(function Tag(
    {
      children,
      tone = "neutral",
      variant = "filled",
      disabled = false,
      onRemove,
      removeLabel,
      icon,
      avatar,
      slotProps,
      ...props
    },
    forwardedRef,
  ) {
    const { t } = useMiaixzLocale();
    const actionRef = useRef<HTMLButtonElement>(null);
    const href = "href" in props ? props.href : undefined;
    const onAction = "onAction" in props ? props.onAction : undefined;
    const selected = "selected" in props && props.selected === true;
    const rootComponentProps = { ...props } as Record<string, unknown>;
    delete rootComponentProps.href;
    delete rootComponentProps.onAction;
    delete rootComponentProps.selected;
    const ownerState: TagOwnerState = {
      tone,
      variant,
      disabled,
      selected,
      actionable: href !== undefined || onAction !== undefined,
      removable: onRemove !== undefined,
    };
    const rootProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-tag" },
      componentProps: rootComponentProps,
      slotProps: slotProps?.root,
      forwardedRef,
      internalProps: {
        "data-ui": "tag" as const,
        "data-tone": tone,
        "data-variant": variant,
        ...(disabled ? { "data-disabled": true } : {}),
        ...(selected ? { "data-selected": true } : {}),
      },
      ownedProps: ["data-ui", "data-tone", "data-variant", "data-disabled", "data-selected"],
    });
    const content = (
      <>
        {icon !== undefined && (
          <span
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-tag-icon" },
              slotProps: slotProps?.icon,
            })}
          >
            {icon}
          </span>
        )}
        {avatar !== undefined && (
          <span
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-tag-avatar" },
              slotProps: slotProps?.avatar,
            })}
          >
            {avatar}
          </span>
        )}
        <span
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-tag-label" },
            slotProps: slotProps?.label,
          })}
        >
          {children}
        </span>
      </>
    );
    const actionProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-tag-action" },
      slotProps: slotProps?.action,
    });

    return (
      <span {...rootProps}>
        {onAction !== undefined ? (
          <button
            {...actionProps}
            ref={actionRef}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={onAction}
            onKeyDown={(event) => {
              actionProps.onKeyDown?.(event as never);
              if (
                !event.defaultPrevented &&
                !disabled &&
                (event.key === "Delete" || event.key === "Backspace")
              ) {
                event.preventDefault();
                onRemove?.();
              }
            }}
          >
            {content}
          </button>
        ) : href !== undefined ? (
          <Link
            {...actionProps}
            href={href}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : actionProps.tabIndex}
            onClick={(event) => {
              actionProps.onClick?.(event as never);
              if (disabled) event.preventDefault();
            }}
          >
            {content}
          </Link>
        ) : (
          content
        )}
        {onRemove !== undefined && (
          <button
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-tag-remove" },
              slotProps: slotProps?.remove,
            })}
            type="button"
            aria-label={removeLabel ?? t("ui.action.remove")}
            disabled={disabled}
            onClick={onRemove}
            onKeyDown={(event) => {
              if (event.key === "Escape" && onAction !== undefined) {
                event.preventDefault();
                actionRef.current?.focus();
              }
            }}
          >
            <Icon name="X" size="indicator" />
          </button>
        )}
      </span>
    );
  }),
);
