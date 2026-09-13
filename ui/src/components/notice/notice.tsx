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
import { getMiaixzFeedbackSemantics, MiaixzFeedback } from "../feedback/feedback.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { NoticeOwnerState, NoticeProps } from "./notice.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/**
 * Renders compact feedback using the shared feedback semantics and structure.
 */
export const Notice = withMiaixzThemeComponent(
  "Notice",
  forwardRef<HTMLDivElement, NoticeProps>(function Notice(props, ref) {
    const { tone = "neutral", live: liveProp, children, slotProps, ...rootNativeProps } = props;
    const live = liveProp ?? (tone === "danger" ? "assertive" : "polite");
    const ownerState: NoticeOwnerState = { tone, live };
    return (
      <MiaixzFeedback
        contentProps={mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-notice-content" },
          slotProps: slotProps?.content,
        })}
        iconProps={mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-notice-icon" },
          slotProps: slotProps?.icon,
        })}
        message={children}
        messageProps={{}}
        rootProps={mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: `miaixz-notice miaixz-notice-${tone}` },
          componentProps: rootNativeProps,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: { ...getMiaixzFeedbackSemantics(tone, live), "data-tone": tone },
          ownedProps: ["role", "aria-live", "data-tone"],
        })}
        tone={tone}
      />
    );
  }),
);
