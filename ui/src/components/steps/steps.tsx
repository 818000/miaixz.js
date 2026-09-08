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
import type { StepsItem, StepsProps } from "./types.js";

/**
 * Renders an ordered workflow as presentation by default and enables native-button interaction
 * only when the consumer supplies `onStepChange`.
 *
 * @public
 */
export const Steps = forwardRef<HTMLOListElement, StepsProps>(function Steps(
  { label, items, className, variant = "default", onStepChange, ...props },
  ref,
) {
  const interactive = onStepChange !== undefined;

  return (
    <ol
      {...props}
      ref={ref}
      aria-label={label}
      data-interactive={interactive || undefined}
      className={classNames(variant === "cards" ? "miaixz-steps-cards" : "miaixz-steps", className)}
    >
      {items.map((item, index) => {
        const status = item.status ?? "pending";
        const disabled = status === "disabled";
        const content = <StepsItemContent item={item} index={index} />;

        return (
          <li
            key={item.id ?? index}
            data-status={status}
            aria-current={status === "current" ? "step" : undefined}
            aria-disabled={disabled || undefined}
          >
            {interactive ? (
              <button
                type="button"
                className="miaixz-steps-item-content"
                disabled={disabled}
                onClick={() => onStepChange(item, index)}
              >
                {content}
              </button>
            ) : (
              <div className="miaixz-steps-item-content">{content}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
});

interface StepsItemContentProps {
  /**
   * Zero-based position used as the default marker.
   */
  readonly index: number;
  /**
   * Workflow item whose visible content is rendered.
   */
  readonly item: StepsItem;
}

/**
 * Renders shared static content for display and interactive step rows.
 *
 * @param properties - Item content properties.
 * @param properties.item - Workflow item whose visible content is rendered.
 * @param properties.index - Zero-based position used as the fallback marker.
 * @returns The marker, label, and optional description.
 */
function StepsItemContent({ item, index }: StepsItemContentProps) {
  return (
    <>
      <strong>{item.marker ?? index + 1}</strong>
      <span>{item.label}</span>
      {item.description !== undefined && <small>{item.description}</small>}
    </>
  );
}
