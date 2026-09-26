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
 * Defines how a provider-neutral icon receives color.
 */
export type IconPaint = "stroke" | "fill";

/**
 * Defines the complete safe SVG attribute vocabulary accepted from providers.
 */
export interface IconSvgAttributes {
  readonly d?: string;
  readonly cx?: string | number;
  readonly cy?: string | number;
  readonly r?: string | number;
  readonly rx?: string | number;
  readonly ry?: string | number;
  readonly x?: string | number;
  readonly y?: string | number;
  readonly x1?: string | number;
  readonly x2?: string | number;
  readonly y1?: string | number;
  readonly y2?: string | number;
  readonly width?: string | number;
  readonly height?: string | number;
  readonly points?: string;
  readonly fill?: "none" | "currentColor";
  readonly fillRule?: "evenodd" | "nonzero";
  readonly clipRule?: "evenodd" | "nonzero";
  readonly opacity?: string | number;
}

/**
 * Defines one safe provider-neutral SVG node.
 */
export interface IconSvgNode {
  readonly tag: "path" | "circle" | "ellipse" | "line" | "polyline" | "polygon" | "rect";
  readonly attributes: IconSvgAttributes;
}

/**
 * Defines an icon rendered from declarative SVG geometry.
 */
export interface IconSvgDefinition {
  readonly kind: "svg";
  readonly viewBox: string;
  readonly paint: IconPaint;
  readonly nodes: readonly IconSvgNode[];
}

/**
 * Defines a local-font glyph rendered inside the shared SVG root.
 */
export interface IconFontDefinition {
  readonly kind: "font";
  readonly viewBox: "0 0 1024 1024";
  readonly paint: "fill";
  readonly fontFamily: string;
  readonly glyph: string;
  readonly x: number;
  readonly y: number;
  readonly fontSize: number;
}

/**
 * Defines every provider-neutral icon representation.
 */
export type IconDefinition = IconSvgDefinition | IconFontDefinition;

/**
 * Defines the module contract returned by an individual icon loader.
 */
export interface IconDefinitionModule {
  readonly default: IconDefinition;
}

const allowedTags = new Set<IconSvgNode["tag"]>([
  "path",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "rect",
]);
const allowedAttributes = new Set<keyof IconSvgAttributes>([
  "d",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "x",
  "y",
  "x1",
  "x2",
  "y1",
  "y2",
  "width",
  "height",
  "points",
  "fill",
  "fillRule",
  "clipRule",
  "opacity",
]);

/**
 * Validates one provider-owned primitive SVG attribute.
 *
 * @param value - Attribute value to validate.
 * @param label - Diagnostic label for an invalid value.
 */
const assertFiniteValue = (value: unknown, label: string): void => {
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (typeof value === "string" && value.length > 0 && !/url\s*\(|javascript:/iu.test(value))
    return;
  throw new TypeError(`[miaixz] Invalid icon ${label}.`);
};

/**
 * Validates an untrusted provider definition before it reaches React.
 *
 * @param value - Candidate provider definition.
 * @returns The validated definition.
 */
export function assertIconDefinition(value: unknown): IconDefinition {
  if (!value || typeof value !== "object") {
    throw new TypeError("[miaixz] Icon definition must be an object.");
  }
  const definition = value as Record<string, unknown>;
  if (definition.kind === "font") {
    if (
      definition.viewBox !== "0 0 1024 1024" ||
      definition.paint !== "fill" ||
      typeof definition.fontFamily !== "string" ||
      definition.fontFamily.length === 0 ||
      /url\s*\(|javascript:/iu.test(definition.fontFamily) ||
      typeof definition.glyph !== "string" ||
      Array.from(definition.glyph).length !== 1
    ) {
      throw new TypeError("[miaixz] Invalid icon font definition.");
    }
    for (const field of ["x", "y", "fontSize"] as const) {
      if (typeof definition[field] !== "number" || !Number.isFinite(definition[field])) {
        throw new TypeError(`[miaixz] Invalid icon font ${field}.`);
      }
    }
    return value as IconFontDefinition;
  }
  if (
    definition.kind !== "svg" ||
    (definition.paint !== "stroke" && definition.paint !== "fill") ||
    typeof definition.viewBox !== "string" ||
    !/^\s*-?(?:\d+(?:\.\d+)?|\.\d+)\s+-?(?:\d+(?:\.\d+)?|\.\d+)\s+(?:\d+(?:\.\d+)?|\.\d+)\s+(?:\d+(?:\.\d+)?|\.\d+)\s*$/u.test(
      definition.viewBox,
    ) ||
    !Array.isArray(definition.nodes) ||
    definition.nodes.length === 0
  ) {
    throw new TypeError("[miaixz] Invalid SVG icon definition.");
  }
  for (const candidate of definition.nodes) {
    if (!candidate || typeof candidate !== "object") {
      throw new TypeError("[miaixz] Invalid SVG icon node.");
    }
    const node = candidate as Record<string, unknown>;
    if (!allowedTags.has(node.tag as IconSvgNode["tag"]) || !node.attributes) {
      throw new TypeError("[miaixz] Unsupported SVG icon node.");
    }
    if (typeof node.attributes !== "object") {
      throw new TypeError("[miaixz] Invalid SVG icon attributes.");
    }
    for (const [name, attribute] of Object.entries(node.attributes)) {
      if (!allowedAttributes.has(name as keyof IconSvgAttributes)) {
        throw new TypeError(`[miaixz] Unsupported SVG icon attribute "${name}".`);
      }
      assertFiniteValue(attribute, `attribute "${name}"`);
    }
  }
  return value as IconSvgDefinition;
}
