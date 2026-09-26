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

/**
 * Owns the React font renderer, accessibility, sizing, and motion behavior.
 */

import {
  forwardRef,
  Suspense,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactElement,
} from "react";

import type { IconName } from "../autogen/catalog.js";
import { readMiaixzIcon, type IconVariant } from "../runtime/font.js";

export type IconSize = "indicator" | "inline" | "control" | "navigation" | "feature" | "display";
export type IconMotion = "auto" | "none";

export interface IconProps extends Omit<
  ComponentPropsWithoutRef<"span">,
  "children" | "role" | "aria-label" | "aria-hidden" | "name"
> {
  readonly name: IconName;
  readonly variant?: IconVariant;
  readonly fill?: number;
  readonly size?: IconSize | number;
  readonly motion?: IconMotion;
  readonly label?: string;
}

interface IconMetrics {
  readonly pixels: number;
  readonly opticalSize: number;
}

const semanticMetrics: Readonly<Record<IconSize, IconMetrics>> = Object.freeze({
  indicator: Object.freeze({ pixels: 12, opticalSize: 12 }),
  inline: Object.freeze({ pixels: 16, opticalSize: 16 }),
  control: Object.freeze({ pixels: 16, opticalSize: 16 }),
  navigation: Object.freeze({ pixels: 20, opticalSize: 20 }),
  feature: Object.freeze({ pixels: 24, opticalSize: 24 }),
  display: Object.freeze({ pixels: 32, opticalSize: 32 }),
});

/**
 * Resolves and validates semantic or numeric icon metrics.
 *
 * @param size - Semantic token or CSS pixel size.
 * @returns Pixel and optical size values.
 */
function resolveMetrics(size: IconSize | number): IconMetrics {
  if (typeof size === "string") return semanticMetrics[size];
  if (!Number.isFinite(size) || size <= 0) {
    throw new TypeError("[miaixz] Icon size must be a finite number greater than zero.");
  }
  return { pixels: size, opticalSize: Math.min(40, Math.max(12, size)) };
}

/**
 * Resolves and validates the continuous fill value.
 *
 * @param fill - Explicit fill override.
 * @param variant - Discrete default variant.
 * @returns A normalized FILL axis value.
 */
function resolveFill(fill: number | undefined, variant: IconVariant): number {
  if (fill === undefined) return variant === "filled" ? 1 : 0;
  if (!Number.isFinite(fill) || fill < 0 || fill > 1) {
    throw new TypeError("[miaixz] Icon fill must be a finite number from zero through one.");
  }
  return fill;
}

interface ResolvedIconProps {
  readonly name: IconName;
}

/**
 * Resolves and renders one built-in font glyph.
 *
 * @param properties - Font-backed icon name.
 * @returns Font glyph or controlled failure placeholder.
 */
function ResolvedIcon(properties: ResolvedIconProps): ReactElement {
  const definition = readMiaixzIcon(properties.name);
  if (definition === null) {
    return <span aria-hidden="true" className="miaixz-icon-placeholder" data-state="failed" />;
  }
  return (
    <span
      aria-hidden="true"
      className="miaixz-icon-glyph"
      data-miaixz-icon-glyph={definition.glyph}
      data-miaixz-icon-mirror={definition.rtl === "mirror" ? "true" : undefined}
    />
  );
}

/**
 * Renders one Miaixz font icon through the motion and accessibility contract.
 */
export const Icon = forwardRef<HTMLSpanElement, IconProps>(function Icon(
  {
    name,
    variant = "outline",
    fill,
    size = "inline",
    motion = "auto",
    label,
    className,
    style,
    ...properties
  },
  reference,
) {
  const metrics = resolveMetrics(size);
  const resolvedFill = resolveFill(fill, variant);
  const trimmedLabel = label?.trim();
  if (label !== undefined && trimmedLabel === "") {
    throw new TypeError("[miaixz] Icon label cannot be empty or whitespace.");
  }

  const customStyle: CSSProperties & Record<`--miaixz-icon-${string}`, string | number> = {
    ...style,
    "--miaixz-icon-fill": resolvedFill,
    "--miaixz-icon-opsz": metrics.opticalSize,
    "--miaixz-icon-size": `${String(metrics.pixels)}px`,
  };
  const accessibility =
    trimmedLabel === undefined
      ? ({ "aria-hidden": true } as const)
      : ({ "aria-label": trimmedLabel, role: "img" } as const);

  return (
    <span
      {...properties}
      {...accessibility}
      className={["miaixz-icon", className].filter(Boolean).join(" ")}
      data-motion={motion}
      data-size={typeof size === "string" ? size : undefined}
      data-variant={variant}
      ref={reference}
      style={customStyle}
    >
      <Suspense
        fallback={
          <span aria-hidden="true" className="miaixz-icon-placeholder" data-state="loading" />
        }
      >
        <ResolvedIcon name={name} />
      </Suspense>
    </span>
  );
});
