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

import { classNames } from "../../shared/class-names.js";
import { Icon } from "../icon/index.js";
import type { MiaixzFeedbackTone } from "../shared.types.js";
import type { NoticeProps } from "./notice.types.js";

/**
 * Shares compact feedback styling with native message elements.
 *
 * @param variant - Selects the bordered or plain notice recipe.
 * @param tone - Applies the semantic feedback tone.
 * @param className - Appends an optional consumer class name.
 * @returns The composed notice class name.
 * @public
 */
export function getNoticeClassName(
  variant: "default" | "plain" = "default",
  tone: MiaixzFeedbackTone = "neutral",
  className?: string,
): string {
  return classNames(
    variant === "plain" ? "miaixz-notice-plain" : `miaixz-notice miaixz-notice-${tone}`,
    className,
  );
}

const miaixzNoticeIcons: Record<
  MiaixzFeedbackTone,
  "Info" | "CircleCheck" | "TriangleAlert" | "CircleAlert"
> = {
  neutral: "Info",
  info: "Info",
  success: "CircleCheck",
  warning: "TriangleAlert",
  danger: "CircleAlert",
};

/**
 * Renders compact status feedback with an explicit visual and semantic tone.
 *
 * @public
 */
export const Notice = forwardRef<HTMLDivElement, NoticeProps>(function Notice(
  { tone = "neutral", className, children, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      role="status"
      aria-live={tone === "danger" ? "assertive" : undefined}
      data-tone={tone}
      className={getNoticeClassName("default", tone, className)}
    >
      <Icon name={miaixzNoticeIcons[tone]} size="inline" className="miaixz-notice-icon" />
      <span>{children}</span>
    </div>
  );
});
