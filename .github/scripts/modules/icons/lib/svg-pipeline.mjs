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
 * Parses and normalizes the strict SVG subset accepted by the icon system.
 */

import { optimize } from "svgo";
import { SVGPathData } from "svg-pathdata";
import { SaxesParser } from "saxes";

const leafTags = new Set([
  "path",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "rect",
]);
const profiles = new Set(["miaixz", "third-party-build"]);
const geometryAttributes = new Set([
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
  "fill-rule",
]);
const presentationAttributes = new Set([
  "fill",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "fill-rule",
]);
const forbiddenPattern =
  /^\uFEFF|\uFFFD|<!DOCTYPE|<!ENTITY|<\?|javascript:|data:|url\s*\(|<\s*(?:script|style|foreignObject|image|use|text|defs|linearGradient|radialGradient|filter|mask|clipPath)\b/iu;

/**
 * Frozen SVGO transformation order. No default preset is used.
 */
export const svgOptimizationPlugins = Object.freeze([
  "collapseGroups",
  "convertTransform",
  Object.freeze({
    name: "convertPathData",
    params: Object.freeze({ applyTransforms: true, floatPrecision: 3 }),
  }),
]);

/**
 * Copies inherited presentation values and applies local values.
 *
 * @param parent Inherited presentation values.
 * @param attributes Local SVG attributes.
 * @returns Merged presentation values.
 */
function presentationFor(parent, attributes) {
  const next = { ...parent };
  for (const [name, value] of Object.entries(attributes)) {
    if (presentationAttributes.has(name)) next[name] = value;
  }
  return next;
}

/**
 * Parses a finite viewBox and applies the selected profile limits.
 *
 * @param source Raw viewBox value.
 * @param profile Frozen SVG profile.
 * @param label Source diagnostic label.
 * @returns Normalized viewBox value.
 */
function parseViewBox(source, profile, label) {
  const values = source
    .trim()
    .split(/[\s,]+/u)
    .map(Number);
  if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) {
    throw new Error(`${label}: viewBox must contain four finite numbers.`);
  }
  if (profile === "miaixz") {
    if (values.some((value, index) => value !== [0, 0, 24, 24][index])) {
      throw new Error(`${label}: viewBox must be 0 0 24 24.`);
    }
    return "0 0 24 24";
  }
  if (
    values[2] <= 0 ||
    values[3] <= 0 ||
    values[2] > 4096 ||
    values[3] > 4096
  ) {
    throw new Error(
      `${label}: third-party viewBox dimensions must be within (0, 4096].`,
    );
  }
  return values.join(" ");
}

/**
 * Performs the raw XML safety pass before optimization.
 *
 * @param source Raw SVG source.
 * @param profile Frozen SVG profile.
 * @param label Source diagnostic label.
 * @returns Nothing.
 */
function validateRawSvg(source, profile, label) {
  const parser = new SaxesParser({ xmlns: false, fragment: false });
  let rootSeen = false;
  let depth = 0;
  let failure;
  parser.on("error", (error) => {
    failure = error;
  });
  parser.on("opentag", (tag) => {
    if (failure) return;
    const attributes = Object.fromEntries(
      Object.entries(tag.attributes).map(([key, value]) => [
        key,
        String(value),
      ]),
    );
    if (!rootSeen) {
      if (tag.name !== "svg")
        throw new Error(`${label}: root element must be svg.`);
      rootSeen = true;
      parseViewBox(attributes.viewBox ?? "", profile, label);
      if (
        attributes.xmlns !== undefined &&
        attributes.xmlns !== "http://www.w3.org/2000/svg"
      ) {
        throw new Error(`${label}: unsupported SVG namespace.`);
      }
      const allowedRoot = new Set([
        "viewBox",
        "xmlns",
        ...presentationAttributes,
      ]);
      if (profile === "third-party-build") {
        allowedRoot.add("width");
        allowedRoot.add("height");
      }
      for (const attribute of Object.keys(attributes)) {
        if (!allowedRoot.has(attribute)) {
          throw new Error(`${label}: unsupported root attribute ${attribute}.`);
        }
      }
      depth = 1;
      return;
    }
    if (tag.name !== "g" && !leafTags.has(tag.name)) {
      throw new Error(`${label}: unsupported element ${tag.name}.`);
    }
    const allowed =
      tag.name === "g"
        ? new Set([...presentationAttributes, "transform"])
        : new Set([
            ...geometryAttributes,
            ...presentationAttributes,
            "transform",
          ]);
    for (const attribute of Object.keys(attributes)) {
      if (attribute.toLowerCase().startsWith("on") || !allowed.has(attribute)) {
        throw new Error(
          `${label}: unsupported ${tag.name} attribute ${attribute}.`,
        );
      }
    }
    depth += 1;
    if (depth > 65) throw new Error(`${label}: SVG nesting is too deep.`);
  });
  parser.on("closetag", () => {
    depth -= 1;
  });
  parser.write(source).close();
  if (failure) throw failure;
  if (!rootSeen || depth !== 0)
    throw new Error(`${label}: SVG document is incomplete.`);
}

/**
 * Determines a uniform paint mode for a normalized third-party SVG.
 *
 * @param presentation Effective presentation values.
 * @param label Source diagnostic label.
 * @returns Uniform runtime paint mode.
 */
function thirdPartyPaint(presentation, label) {
  const fill = presentation.fill;
  const stroke = presentation.stroke;
  if (fill === "none" && stroke !== undefined && stroke !== "none")
    return "stroke";
  if (
    (fill === undefined || fill === "currentColor") &&
    (stroke === undefined || stroke === "none")
  ) {
    return "fill";
  }
  throw new Error(
    `${label}: third-party SVG must use one uniform fill or stroke paint.`,
  );
}

/**
 * Parses optimized XML into the runtime definition subset.
 *
 * @param source Optimized SVG source.
 * @param variant Requested icon variant.
 * @param profile Frozen SVG profile.
 * @param label Source diagnostic label.
 * @returns Normalized runtime icon definition.
 */
function parseNormalizedSvg(source, variant, profile, label) {
  const parser = new SaxesParser({ xmlns: false, fragment: false });
  const stack = [];
  const nodes = [];
  const paints = new Set();
  let rootSeen = false;
  let viewBox;
  let failure;
  parser.on("error", (error) => {
    failure = error;
  });
  parser.on("opentag", (tag) => {
    if (failure) return;
    const name = tag.name;
    const attributes = Object.fromEntries(
      Object.entries(tag.attributes).map(([key, value]) => [
        key,
        String(value),
      ]),
    );
    if (!rootSeen) {
      if (name !== "svg")
        throw new Error(`${label}: root element must be svg.`);
      rootSeen = true;
      viewBox = parseViewBox(attributes.viewBox ?? "", profile, label);
      if (
        attributes.xmlns !== undefined &&
        attributes.xmlns !== "http://www.w3.org/2000/svg"
      ) {
        throw new Error(`${label}: unsupported SVG namespace.`);
      }
      const allowedRoot = new Set([
        "viewBox",
        "xmlns",
        ...presentationAttributes,
      ]);
      if (profile === "third-party-build") {
        allowedRoot.add("width");
        allowedRoot.add("height");
      }
      for (const attribute of Object.keys(attributes)) {
        if (!allowedRoot.has(attribute)) {
          throw new Error(
            `${label}: unsupported normalized root attribute ${attribute}.`,
          );
        }
      }
      stack.push({ presentation: presentationFor({}, attributes) });
      return;
    }
    if (!leafTags.has(name)) {
      throw new Error(
        `${label}: normalized SVG retains unsupported element ${name}.`,
      );
    }
    for (const attribute of Object.keys(attributes)) {
      if (
        !geometryAttributes.has(attribute) &&
        !presentationAttributes.has(attribute)
      ) {
        throw new Error(
          `${label}: unsupported normalized ${name} attribute ${attribute}.`,
        );
      }
    }
    const presentation = presentationFor(
      stack.at(-1)?.presentation ?? {},
      attributes,
    );
    if (profile === "miaixz") {
      const expected =
        variant === "outline"
          ? {
              fill: "none",
              stroke: "currentColor",
              "stroke-width": "1.75",
              "stroke-linecap": "round",
              "stroke-linejoin": "round",
            }
          : { fill: "currentColor", stroke: "none" };
      for (const [attribute, value] of Object.entries(expected)) {
        if (presentation[attribute] !== value) {
          throw new Error(
            `${label}: ${name} must inherit ${attribute}="${value}".`,
          );
        }
      }
      paints.add(variant === "outline" ? "stroke" : "fill");
    } else {
      paints.add(thirdPartyPaint(presentation, label));
    }
    const normalized = {};
    for (const [attribute, value] of Object.entries(attributes)) {
      if (
        !geometryAttributes.has(attribute) ||
        presentationAttributes.has(attribute)
      )
        continue;
      normalized[attribute] =
        attribute === "d" && profile === "miaixz"
          ? new SVGPathData(value).toAbs().encode()
          : value;
    }
    const fillRule = attributes["fill-rule"] ?? presentation["fill-rule"];
    if (fillRule !== undefined) {
      if (fillRule !== "evenodd" && fillRule !== "nonzero") {
        throw new Error(`${label}: fill-rule must be evenodd or nonzero.`);
      }
      normalized.fillRule = fillRule;
    }
    nodes.push({ tag: name, attributes: normalized });
    stack.push({ presentation });
  });
  parser.on("closetag", () => {
    stack.pop();
  });
  parser.write(source).close();
  if (failure) throw failure;
  if (!rootSeen || nodes.length === 0 || nodes.length > 64) {
    throw new Error(
      `${label}: SVG must contain between 1 and 64 safe geometry nodes.`,
    );
  }
  if (paints.size !== 1)
    throw new Error(`${label}: SVG mixes fill and stroke paint.`);
  return { kind: "svg", viewBox, paint: [...paints][0], nodes };
}

/**
 * Parses one source SVG into a safe runtime definition.
 *
 * @param {string} source Raw SVG text.
 * @param {"outline" | "filled"} variant Catalog variant.
 * @param {string} label Diagnostic file label.
 * @param {"miaixz" | "third-party-build"} profile Frozen pipeline profile.
 * @returns A normalized provider-neutral definition.
 */
export function parseIconSvg(source, variant, label, profile) {
  if (!profiles.has(profile))
    throw new Error(`${label}: an explicit SVG pipeline profile is required.`);
  if (
    typeof source !== "string" ||
    source.length === 0 ||
    source.length > 32768
  ) {
    throw new Error(`${label}: SVG source size is invalid.`);
  }
  if (variant !== "outline" && variant !== "filled") {
    throw new Error(`${label}: variant must be outline or filled.`);
  }
  if (forbiddenPattern.test(source))
    throw new Error(`${label}: SVG contains forbidden content.`);
  validateRawSvg(source, profile, label);
  const optimized = optimize(source, {
    multipass: false,
    plugins: svgOptimizationPlugins,
  });
  if ("error" in optimized) throw new Error(`${label}: ${optimized.error}`);
  return parseNormalizedSvg(optimized.data, variant, profile, label);
}

/**
 * Serializes one normalized node as an Iconify-compatible SVG fragment.
 *
 * @param node Normalized SVG leaf node.
 * @returns Iconify-compatible SVG fragment.
 */
export function serializeSvgNode(node) {
  const attributes = Object.entries(node.attributes)
    .map(
      ([name, value]) =>
        `${name === "fillRule" ? "fill-rule" : name}="${String(value)}"`,
    )
    .join(" ");
  return `<${node.tag}${attributes === "" ? "" : ` ${attributes}`}/>`;
}
