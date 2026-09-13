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

/* eslint-disable jsdoc/require-jsdoc -- Public contract is declared in the adjacent type module.
 */
import { forwardRef, useId } from "react";
import { useMiaixzLocale } from "../../i18n/i18n.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { IconButton } from "../action/icon-button.js";
import { Button } from "../button/button.js";
import { Icon } from "../icon/icon.js";
import type { ToastOwnerState, ToastProps, ToastTone } from "./toast.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

const toneIcons: Record<ToastTone, "Info" | "CircleCheck" | "TriangleAlert" | "CircleAlert"> = {
  neutral: "Info",
  success: "CircleCheck",
  warning: "TriangleAlert",
  danger: "CircleAlert",
  info: "Info",
};

/*
 * Renders one notification without owning live-region semantics.
 */
export const Toast = withMiaixzThemeComponent(
  "Toast",
  forwardRef<HTMLDivElement, ToastProps>(function Toast(
    {
      id,
      title,
      message,
      action,
      tone = "neutral",
      dismissLabel,
      onClose,
      slots,
      slotProps,
      ...props
    },
    ref,
  ) {
    const { t } = useMiaixzLocale();
    const contentId = useId();
    const titleId = `${contentId}-title`;
    const messageId = `${contentId}-message`;
    const ownerState: ToastOwnerState = {
      tone,
      actionable: action !== undefined,
      dismissible: onClose !== undefined,
    };
    const Title = slots?.title ?? "div";
    const Message = slots?.message ?? "div";
    return (
      <div
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-toast" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: {
            "data-tone": tone,
            "aria-labelledby": titleId,
            ...(message === undefined ? {} : { "aria-describedby": messageId }),
          },
          ownedProps: ["data-tone", "aria-labelledby", "aria-describedby"],
        })}
      >
        <span
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-toast-icon" },
            slotProps: slotProps?.icon,
            internalProps: { "aria-hidden": true },
            ownedProps: ["aria-hidden"],
          })}
        >
          <Icon name={toneIcons[tone]} size="control" />
        </span>
        <div
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-toast-content" },
            slotProps: slotProps?.content,
          })}
        >
          <Title
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-toast-title" },
              slotProps: slotProps?.title,
              internalProps: { id: titleId },
              ownedProps: ["id"],
            })}
          >
            {title}
          </Title>
          {message !== undefined && (
            <Message
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-toast-message" },
                slotProps: slotProps?.message,
                internalProps: { id: messageId },
                ownedProps: ["id"],
              })}
            >
              {message}
            </Message>
          )}
          {action !== undefined && (
            <div
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-toast-actions" },
                slotProps: slotProps?.actions,
              })}
            >
              <Button
                {...mergeMiaixzSlotProps({
                  ownerState,
                  slotProps: slotProps?.action,
                  internalProps: {
                    variant: "plain",
                    tone: "neutral",
                    size: "small",
                    onClick: (event) => {
                      action.onAction(event);
                      if (!event.defaultPrevented) onClose?.(id, "action");
                    },
                  },
                  ownedProps: ["variant", "tone", "size"],
                })}
              >
                {action.label}
              </Button>
            </div>
          )}
        </div>
        {onClose !== undefined && (
          <IconButton
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-toast-dismiss" },
              slotProps: slotProps?.dismiss,
              internalProps: {
                icon: "X",
                label: dismissLabel ?? t("ui.notification.dismiss"),
                size: "small",
                onClick: () => onClose(id, "dismiss"),
              },
              ownedProps: ["icon", "label", "size"],
            })}
          />
        )}
      </div>
    );
  }),
);
