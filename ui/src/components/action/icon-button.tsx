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

import { useMiaixzLocale } from "../../i18n/i18n.js";
import { classNames } from "../../shared/class-names.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { Icon } from "../icon/icon.js";
import { Tooltip } from "../tooltip/tooltip.js";
import type {
  IconButtonOwnerState,
  IconButtonProps,
  IconButtonRootAttributes,
} from "./action.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/**
 * Renders one accessible icon-only command.
 *
 * @public
 */
export const IconButton = withMiaixzThemeComponent(
  "IconButton",
  forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(props, ref) {
    const { t } = useMiaixzLocale();
    const {
      label,
      icon,
      tone = "neutral",
      size = "medium",
      loading = false,
      tooltip = true,
      pressed,
      disabled: disabledProp,
      type = "button",
      slotProps,
      ...nativeProps
    } = props;
    const disabled = disabledProp === true || loading;
    const ownerState: IconButtonOwnerState = {
      tone,
      size,
      loading,
      disabled,
      ...(pressed === undefined ? {} : { pressed }),
    };
    const rootProps = mergeMiaixzSlotProps<
      IconButtonOwnerState,
      IconButtonRootAttributes,
      HTMLButtonElement
    >({
      ownerState,
      defaultProps: {
        className: classNames(
          "miaixz-interactive",
          "miaixz-control",
          "miaixz-button",
          "miaixz-icon-button",
          `miaixz-control-${size}`,
        ),
      },
      componentProps: nativeProps,
      slotProps: slotProps?.root,
      forwardedRef: ref,
      internalProps: {
        type,
        disabled,
        "aria-label": label,
        ...(loading ? { "aria-busy": true, "data-loading": true } : {}),
        ...(pressed === undefined ? {} : { "aria-pressed": pressed }),
        "data-miaixz-ripple": "true",
        "data-size": size,
        "data-tone": tone,
        "data-variant": "plain",
      },
      ownedProps: [
        "type",
        "disabled",
        "aria-label",
        "aria-busy",
        "aria-pressed",
        "data-loading",
        "data-miaixz-ripple",
        "data-size",
        "data-tone",
        "data-variant",
      ],
    });
    const iconProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-icon-button-icon" },
      slotProps: slotProps?.icon,
    });
    const indicatorProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-icon-button-loading-indicator" },
      slotProps: slotProps?.loadingIndicator,
      internalProps: { "aria-hidden": true },
      ownedProps: ["aria-hidden"],
    });
    const target = (
      <button {...rootProps}>
        <span {...iconProps} data-loading={loading || undefined}>
          <Icon name={icon} size="control" />
        </span>
        {loading && (
          <>
            <span {...indicatorProps}>
              <Icon className="miaixz-button-spinner" name="LoaderCircle" size="control" />
            </span>
            <span className="miaixz-hidden">{t("ui.loading")}</span>
          </>
        )}
      </button>
    );
    return tooltip ? <Tooltip content={label}>{target}</Tooltip> : target;
  }),
);
