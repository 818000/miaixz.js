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
 * Implements the icon UI component.
 */

import { forwardRef, Suspense, type ForwardedRef } from "react";

import { useIconRegistry } from "../../icons/icon-context.js";
import {
  IconPlaceholder,
  renderIconDefinition,
  type IconRendererProps,
} from "../../icons/icon-renderer.js";
import { classNames } from "../../shared/class-names.js";
import type { IconProps, IconSize } from "./icon.types.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";

const semanticSizes = new Set<IconSize>([
  "indicator",
  "inline",
  "control",
  "navigation",
  "feature",
  "display",
]);

/**
 * Resolves and renders one icon inside the nearest registry boundary.
 *
 * @param options - Resolution and renderer properties.
 * @returns The resolved icon or its error placeholder.
 */
function ResolvedIcon(options: {
  readonly name: IconProps["name"];
  readonly properties: IconRendererProps;
  readonly reference: ForwardedRef<SVGSVGElement>;
}) {
  const { name, properties, reference } = options;
  const registry = useIconRegistry();
  const definition = registry.read(name);
  return definition ? (
    renderIconDefinition(definition, properties, reference)
  ) : (
    <IconPlaceholder properties={properties} reference={reference} state="error" />
  );
}

/**
 * Renders an icon through the unified Miaixz size and accessibility contract.
 *
 * @public
 */
export const Icon = withMiaixzThemeComponent(
  "Icon",
  forwardRef<SVGSVGElement, IconProps>(function Icon(
    { name, size = "inline", stroke = "regular", label, className, ...props },
    ref,
  ) {
    const semanticSize =
      typeof size === "string" && semanticSizes.has(size as IconSize)
        ? (size as IconSize)
        : undefined;
    const pixelSize = semanticSize ? undefined : size;
    const rendererProps: IconRendererProps = {
      ...(pixelSize === undefined ? {} : { width: pixelSize, height: pixelSize }),
      ...props,
      ...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true }),
      focusable: "false",
      className: classNames(
        "miaixz-icon",
        semanticSize && `miaixz-icon-${semanticSize}`,
        stroke === "strong" && "miaixz-icon-strong",
        className,
      ),
    };

    return (
      <Suspense
        fallback={<IconPlaceholder properties={rendererProps} reference={ref} state="loading" />}
      >
        <ResolvedIcon name={name} properties={rendererProps} reference={ref} />
      </Suspense>
    );
  }),
);
