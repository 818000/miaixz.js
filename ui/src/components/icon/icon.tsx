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

import { forwardRef, type ForwardedRef, type ReactElement } from "react";
import type { LucideIcon } from "lucide-react";

import { miaixzIconRegistry } from "../../icons/icon-registry.js";
import { classNames } from "../../shared/class-names.js";
import type { IconProps, IconSize } from "./icon.types.js";

const semanticSizes = new Set<IconSize>([
  "indicator",
  "inline",
  "control",
  "navigation",
  "feature",
  "display",
]);

/**
 * Renders one explicitly selected Lucide component through the shared Miaixz icon contract.
 *
 * @param LucideIcon - Statically imported Lucide component to render.
 * @param size - Semantic or native icon size.
 * @param stroke - Semantic stroke weight.
 * @param label - Optional localized accessible name.
 * @param className - Optional consumer class name.
 * @param props - Remaining supported Lucide SVG properties.
 * @param ref - Forwarded SVG element reference.
 * @returns The configured Lucide icon element.
 */
function renderMiaixzIcon(
  LucideIcon: LucideIcon,
  size: IconSize | number | string,
  stroke: "regular" | "strong",
  label: string | undefined,
  className: string | undefined,
  props: Omit<IconProps, "className" | "icon" | "label" | "name" | "size" | "stroke">,
  ref: ForwardedRef<SVGSVGElement>,
): ReactElement {
  const semanticSize =
    typeof size === "string" && semanticSizes.has(size as IconSize)
      ? (size as IconSize)
      : undefined;
  const pixelSize = semanticSize ? undefined : size;

  return (
    <LucideIcon
      {...props}
      ref={ref}
      {...(pixelSize === undefined ? {} : { size: pixelSize })}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      focusable="false"
      className={classNames(
        "miaixz-icon",
        semanticSize && `miaixz-icon-${semanticSize}`,
        stroke === "strong" && "miaixz-icon-strong",
        className,
      )}
    />
  );
}

/**
 * Renders a Lucide icon through the unified Miaixz size and accessibility contract.
 *
 * @public
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  { name, icon, size = "inline", stroke = "regular", label, className, ...props },
  ref,
) {
  const Source = icon ?? miaixzIconRegistry[name!];
  return renderMiaixzIcon(Source, size, stroke, label, className, props, ref);
});
