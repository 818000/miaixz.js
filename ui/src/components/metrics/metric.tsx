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

/* eslint-disable jsdoc/require-jsdoc -- Public Metric contract lives in metric.types.
 */
import {
  forwardRef,
  useContext,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";

import { classNames } from "../../shared/class-names.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { MetricVariantContext } from "./context.js";
import type { MetricOwnerState, MetricProps } from "./metric.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

export const Metric = withMiaixzThemeComponent(
  "Metric",
  forwardRef<HTMLElement | HTMLAnchorElement | HTMLButtonElement, MetricProps>(function Metric(
    {
      label,
      value,
      hint,
      status,
      trend,
      visual,
      variant: explicitVariant,
      density = "standard",
      tone = "neutral",
      emphasized = false,
      slotProps,
      href,
      onAction,
      className,
      ...props
    },
    ref,
  ) {
    const groupVariant = useContext(MetricVariantContext);
    const variant = explicitVariant ?? groupVariant ?? "standard";
    const interactive = href !== undefined || onAction !== undefined;
    const ownerState: MetricOwnerState = { variant, density, tone, emphasized, interactive };
    const content: ReactNode = (
      <>
        <span
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-metric-label" },
            slotProps: slotProps?.label,
          })}
        >
          {label}
        </span>
        <span
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-metric-value" },
            slotProps: slotProps?.value,
          })}
        >
          {value}
        </span>
        {hint !== undefined && (
          <span
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-metric-hint" },
              slotProps: slotProps?.hint,
            })}
          >
            {hint}
          </span>
        )}
        {status !== undefined && (
          <span
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-metric-status" },
              slotProps: slotProps?.status,
            })}
          >
            {status}
          </span>
        )}
        {trend !== undefined && (
          <span
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-metric-trend" },
              slotProps: slotProps?.trend,
            })}
          >
            {trend}
          </span>
        )}
        {visual !== undefined && (
          <span
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-metric-visual" },
              slotProps: slotProps?.visual,
            })}
          >
            {visual}
          </span>
        )}
      </>
    );
    const rootProps = {
      ...props,
      className: classNames("miaixz-metric", className),
      "data-variant": variant,
      "data-density": density,
      "data-tone": tone,
      ...(emphasized ? { "data-emphasized": true } : {}),
    };
    if (href !== undefined) {
      return (
        <a
          {...(rootProps as AnchorHTMLAttributes<HTMLAnchorElement>)}
          ref={ref as Ref<HTMLAnchorElement>}
          href={href}
        >
          {content}
        </a>
      );
    }
    if (onAction !== undefined) {
      return (
        <button
          {...(rootProps as ButtonHTMLAttributes<HTMLButtonElement>)}
          ref={ref as Ref<HTMLButtonElement>}
          type="button"
          onClick={onAction}
        >
          {content}
        </button>
      );
    }
    return (
      <article {...(rootProps as HTMLAttributes<HTMLElement>)} ref={ref as Ref<HTMLElement>}>
        {content}
      </article>
    );
  }),
);
