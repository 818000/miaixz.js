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
 * Implements the icon renderer UI module.
 */

import {
  createElement,
  type ComponentPropsWithoutRef,
  type ForwardedRef,
  type ReactElement,
} from "react";

import type { IconDefinition } from "./icon-definition.js";

/**
 * Defines SVG properties normalized by the public Icon component.
 */
export type IconRendererProps = Omit<ComponentPropsWithoutRef<"svg">, "children">;

/**
 * Configures the stable SVG placeholder.
 */
export interface IconPlaceholderProps {
  readonly properties: IconRendererProps;
  readonly reference: ForwardedRef<SVGSVGElement>;
  readonly state: "loading" | "error";
}

/**
 * Renders the stable empty SVG used during asynchronous resolution.
 *
 * @param options - Placeholder renderer properties.
 * @returns The stable SVG placeholder.
 */
export function IconPlaceholder(options: IconPlaceholderProps): ReactElement {
  const { properties, reference, state } = options;
  const marker =
    state === "loading"
      ? { "data-miaixz-icon-loading": "true" }
      : { "data-miaixz-icon-error": "true" };
  return <svg {...properties} {...marker} ref={reference} viewBox="0 0 24 24" />;
}

/**
 * Renders a validated provider-neutral definition through a stable SVG root.
 *
 * @param definition - Validated neutral definition.
 * @param properties - Native SVG properties to preserve.
 * @param reference - Forwarded reference for the stable SVG root.
 * @returns The provider-neutral SVG element.
 */
export function renderIconDefinition(
  definition: IconDefinition,
  properties: IconRendererProps,
  reference: ForwardedRef<SVGSVGElement>,
): ReactElement {
  if (definition.kind === "font") {
    return (
      <svg
        {...properties}
        ref={reference}
        viewBox={definition.viewBox}
        fill="currentColor"
        stroke="none"
        data-miaixz-icon-paint="font"
      >
        <text
          x={definition.x}
          y={definition.y}
          fontFamily={definition.fontFamily}
          fontSize={definition.fontSize}
          textAnchor="middle"
        >
          {definition.glyph}
        </text>
      </svg>
    );
  }
  return (
    <svg
      {...properties}
      ref={reference}
      viewBox={definition.viewBox}
      fill={definition.paint === "stroke" ? "none" : "currentColor"}
      stroke={definition.paint === "stroke" ? "currentColor" : "none"}
      strokeLinecap={definition.paint === "stroke" ? "round" : undefined}
      strokeLinejoin={definition.paint === "stroke" ? "round" : undefined}
      data-miaixz-icon-paint={definition.paint}
    >
      {definition.nodes.map((node, index) =>
        createElement(node.tag, { ...node.attributes, key: `${node.tag}-${index}` }),
      )}
    </svg>
  );
}
