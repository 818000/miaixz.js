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
import { getMiaixzFeedbackSemantics, MiaixzFeedback } from "../feedback/feedback.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { AlertOwnerState, AlertProps } from "./alert.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/**
 * Renders prominent feedback with independently controlled tone and announcement priority.
 */
export const Alert = withMiaixzThemeComponent(
  "Alert",
  forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
    const {
      tone = "neutral",
      live: liveProp,
      title,
      children,
      actions,
      dismissLabel,
      onDismiss,
      slotProps,
      ...rootNativeProps
    } = props;
    const { t } = useMiaixzLocale();
    const live = liveProp ?? (tone === "danger" ? "assertive" : "polite");
    const ownerState: AlertOwnerState = { tone, live, dismissible: onDismiss !== undefined };
    return (
      <MiaixzFeedback
        actions={actions}
        actionsProps={mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-alert-actions" },
          slotProps: slotProps?.actions,
        })}
        contentProps={mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-alert-content" },
          slotProps: slotProps?.content,
        })}
        dismissLabel={dismissLabel ?? t("ui.action.dismiss")}
        dismissProps={mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-alert-dismiss" },
          slotProps: slotProps?.dismiss,
        })}
        iconProps={mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-alert-icon" },
          slotProps: slotProps?.icon,
        })}
        message={children}
        messageProps={mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-alert-message" },
          slotProps: slotProps?.message,
        })}
        onDismiss={onDismiss}
        rootProps={mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: `miaixz-alert miaixz-alert-${tone}` },
          componentProps: rootNativeProps,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: { ...getMiaixzFeedbackSemantics(tone, live), "data-tone": tone },
          ownedProps: ["role", "aria-live", "data-tone"],
        })}
        title={title}
        titleProps={mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-alert-title" },
          slotProps: slotProps?.title,
        })}
        tone={tone}
      />
    );
  }),
);
