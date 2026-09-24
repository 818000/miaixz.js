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
 * Converts DrawingML preset and custom geometry into deterministic SVG paths.
 */

import { firstElementByLocalName as first, localAttribute as attribute } from "../xml/xml-codec.js";

/**
 * Describes a normalized local geometry ready for SVG rendering.
 */
export interface OfficeGeometry {
  readonly kind: "ellipse" | "line" | "path" | "rectangle";
  readonly path?: string;
  readonly cornerRadius?: number;
}

/**
 * Converts one optional numeric value to a finite number.
 *
 * @param value - Numeric text obtained from DrawingML.
 * @param fallback - Value returned when the source is not finite.
 * @returns Finite numeric value.
 */
function finite(value: string | undefined, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

/**
 * Clamps a number to an inclusive range.
 *
 * @param value - Number being constrained.
 * @param minimum - Inclusive lower bound.
 * @param maximum - Inclusive upper bound.
 * @returns Constrained number.
 */
function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

/**
 * Resolves one DrawingML guide token against the current geometry variables.
 *
 * @param token - Literal number or guide name.
 * @param values - Available guide and built-in values.
 * @returns Resolved finite guide value.
 */
function guideValue(token: string | undefined, values: ReadonlyMap<string, number>): number {
  if (token === undefined) return 0;
  const literal = Number(token);
  if (Number.isFinite(literal)) return literal;
  return values.get(token) ?? 0;
}

/**
 * Evaluates one DrawingML guide formula.
 *
 * @param formula - Space-delimited DrawingML formula.
 * @param values - Available guide and built-in values.
 * @returns Evaluated finite value.
 */
function evaluateFormula(formula: string, values: ReadonlyMap<string, number>): number {
  const [operator = "val", leftToken, middleToken, rightToken] = formula.trim().split(/\s+/u);
  const left = guideValue(leftToken, values);
  const middle = guideValue(middleToken, values);
  const right = guideValue(rightToken, values);
  let result: number;
  switch (operator) {
    case "val":
      result = left;
      break;
    case "*/":
      result = right === 0 ? 0 : (left * middle) / right;
      break;
    case "+-":
      result = left + middle - right;
      break;
    case "+/":
      result = right === 0 ? 0 : (left + middle) / right;
      break;
    case "?:":
      result = left > 0 ? middle : right;
      break;
    case "abs":
      result = Math.abs(left);
      break;
    case "min":
      result = Math.min(left, middle);
      break;
    case "max":
      result = Math.max(left, middle);
      break;
    case "sqrt":
      result = Math.sqrt(Math.max(0, left));
      break;
    case "mod":
      result = Math.hypot(left, middle, right);
      break;
    case "sin":
      result = left * Math.sin((middle / 60_000) * (Math.PI / 180));
      break;
    case "cos":
      result = left * Math.cos((middle / 60_000) * (Math.PI / 180));
      break;
    case "tan":
      result = left * Math.tan((middle / 60_000) * (Math.PI / 180));
      break;
    case "at2":
      result = (Math.atan2(middle, left) * 180 * 60_000) / Math.PI;
      break;
    case "cat2":
      result = left * Math.cos(Math.atan2(right, middle));
      break;
    case "sat2":
      result = left * Math.sin(Math.atan2(right, middle));
      break;
    case "pin":
      result = clamp(middle, left, right);
      break;
    default:
      result = 0;
  }
  return Number.isFinite(result) ? result : 0;
}

/**
 * Creates the built-in guide dictionary for one shape extent.
 *
 * @param width - Local shape width.
 * @param height - Local shape height.
 * @returns Mutable guide value dictionary.
 */
function builtInGuides(width: number, height: number): Map<string, number> {
  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);
  return new Map([
    ["l", 0],
    ["t", 0],
    ["r", width],
    ["b", height],
    ["w", width],
    ["h", height],
    ["wd2", width / 2],
    ["wd3", width / 3],
    ["wd4", width / 4],
    ["wd5", width / 5],
    ["wd6", width / 6],
    ["wd8", width / 8],
    ["wd10", width / 10],
    ["hd2", height / 2],
    ["hd3", height / 3],
    ["hd4", height / 4],
    ["hd5", height / 5],
    ["hd6", height / 6],
    ["hd8", height / 8],
    ["hd10", height / 10],
    ["hc", width / 2],
    ["vc", height / 2],
    ["ss", shortSide],
    ["ls", longSide],
    ["ssd2", shortSide / 2],
    ["ssd4", shortSide / 4],
    ["cd2", 10_800_000],
    ["cd4", 5_400_000],
    ["cd8", 2_700_000],
    ["3cd4", 16_200_000],
  ]);
}

/**
 * Reads custom-geometry guide definitions in declaration order.
 *
 * @param geometry - DrawingML custom geometry element.
 * @param width - Local shape width.
 * @param height - Local shape height.
 * @returns Complete guide dictionary.
 */
function customGuides(geometry: Element, width: number, height: number): Map<string, number> {
  const values = builtInGuides(width, height);
  for (const listName of ["avLst", "gdLst"]) {
    const list = first(geometry, listName);
    if (list === undefined) continue;
    for (const guide of [...list.children].filter((element) => element.localName === "gd")) {
      const name = attribute(guide, "name");
      const formula = attribute(guide, "fmla");
      if (name !== undefined && formula !== undefined) {
        values.set(name, evaluateFormula(formula, values));
      }
    }
  }
  return values;
}

/**
 * Resolves one path coordinate while respecting the path viewport.
 *
 * @param token - Literal coordinate or guide name.
 * @param values - Available DrawingML guides.
 * @param scale - Literal-coordinate scale for the current path axis.
 * @returns Local shape coordinate.
 */
function coordinate(
  token: string | undefined,
  values: ReadonlyMap<string, number>,
  scale: number,
): number {
  if (token === undefined) return 0;
  const literal = Number(token);
  return Number.isFinite(literal) ? literal * scale : guideValue(token, values);
}

/**
 * Converts custom DrawingML path commands into one SVG path.
 *
 * @param geometry - DrawingML custom geometry element.
 * @param width - Local shape width.
 * @param height - Local shape height.
 * @returns SVG path data or undefined when no path exists.
 */
function customPath(geometry: Element, width: number, height: number): string | undefined {
  const values = customGuides(geometry, width, height);
  const pathList = first(geometry, "pathLst");
  if (pathList === undefined) return undefined;
  const output: string[] = [];
  for (const path of [...pathList.children].filter((element) => element.localName === "path")) {
    const viewportWidth = Math.max(1, finite(attribute(path, "w"), width));
    const viewportHeight = Math.max(1, finite(attribute(path, "h"), height));
    const scaleX = width / viewportWidth;
    const scaleY = height / viewportHeight;
    let currentX = 0;
    let currentY = 0;
    for (const command of path.children) {
      const points = [...command.children].filter((element) => element.localName === "pt");
      if (command.localName === "moveTo" || command.localName === "lnTo") {
        const point = points[0];
        if (point === undefined) continue;
        currentX = coordinate(attribute(point, "x"), values, scaleX);
        currentY = coordinate(attribute(point, "y"), values, scaleY);
        output.push(`${command.localName === "moveTo" ? "M" : "L"}${currentX} ${currentY}`);
      } else if (command.localName === "quadBezTo" && points.length >= 2) {
        const control = points[0];
        const end = points[1];
        if (control === undefined || end === undefined) continue;
        currentX = coordinate(attribute(end, "x"), values, scaleX);
        currentY = coordinate(attribute(end, "y"), values, scaleY);
        output.push(
          `Q${coordinate(attribute(control, "x"), values, scaleX)} ${coordinate(attribute(control, "y"), values, scaleY)} ${currentX} ${currentY}`,
        );
      } else if (command.localName === "cubicBezTo" && points.length >= 3) {
        const firstControl = points[0];
        const secondControl = points[1];
        const end = points[2];
        if (firstControl === undefined || secondControl === undefined || end === undefined)
          continue;
        currentX = coordinate(attribute(end, "x"), values, scaleX);
        currentY = coordinate(attribute(end, "y"), values, scaleY);
        output.push(
          `C${coordinate(attribute(firstControl, "x"), values, scaleX)} ${coordinate(attribute(firstControl, "y"), values, scaleY)} ${coordinate(attribute(secondControl, "x"), values, scaleX)} ${coordinate(attribute(secondControl, "y"), values, scaleY)} ${currentX} ${currentY}`,
        );
      } else if (command.localName === "arcTo") {
        const radiusX = Math.abs(guideValue(attribute(command, "wR"), values));
        const radiusY = Math.abs(guideValue(attribute(command, "hR"), values));
        const startAngle = guideValue(attribute(command, "stAng"), values) / 60_000;
        const sweepAngle = guideValue(attribute(command, "swAng"), values) / 60_000;
        const startRadians = (startAngle * Math.PI) / 180;
        const endRadians = ((startAngle + sweepAngle) * Math.PI) / 180;
        const centerX = currentX - radiusX * Math.cos(startRadians);
        const centerY = currentY - radiusY * Math.sin(startRadians);
        currentX = centerX + radiusX * Math.cos(endRadians);
        currentY = centerY + radiusY * Math.sin(endRadians);
        output.push(
          `A${radiusX} ${radiusY} 0 ${Math.abs(sweepAngle) > 180 ? 1 : 0} ${sweepAngle >= 0 ? 1 : 0} ${currentX} ${currentY}`,
        );
      } else if (command.localName === "close") {
        output.push("Z");
      }
    }
  }
  return output.length === 0 ? undefined : output.join(" ");
}

/**
 * Reads one connector adjustment as a normalized ratio.
 *
 * @param geometry - Preset geometry element containing adjustments.
 * @param name - Adjustment guide name.
 * @param fallback - Ratio used when the guide is absent.
 * @returns Ratio clamped to a practical connector range.
 */
function adjustment(geometry: Element, name: string, fallback: number): number {
  const list = first(geometry, "avLst");
  if (list === undefined) return fallback;
  const guide = [...list.children].find(
    (element) => element.localName === "gd" && attribute(element, "name") === name,
  );
  const formula = guide === undefined ? undefined : attribute(guide, "fmla");
  if (formula === undefined) return fallback;
  const value = finite(formula.trim().split(/\s+/u).at(-1));
  return clamp(value / 100_000, -5, 5);
}

/**
 * Produces a path for the DrawingML presets used by flow diagrams.
 *
 * @param preset - DrawingML preset geometry identifier.
 * @param width - Local shape width.
 * @param height - Local shape height.
 * @param geometry - Preset geometry element containing optional adjustments.
 * @returns Normalized SVG geometry.
 */
function presetGeometry(
  preset: string,
  width: number,
  height: number,
  geometry: Element,
): OfficeGeometry {
  const centerX = width / 2;
  const centerY = height / 2;
  const inset = Math.min(width, height) * 0.22;
  if (preset === "ellipse" || preset === "flowChartConnector") return { kind: "ellipse" };
  if (preset === "roundRect") {
    return { kind: "rectangle", cornerRadius: Math.min(width, height) * 0.16 };
  }
  if (/connector/iu.test(preset)) {
    const first = adjustment(geometry, "adj1", 0.5);
    const second = adjustment(geometry, "adj2", 0.5);
    if (preset === "bentConnector2") {
      return { kind: "line", path: `M0 0 L${width} 0 L${width} ${height}` };
    }
    if (preset === "bentConnector3") {
      const middle = width * first;
      return { kind: "line", path: `M0 0 L${middle} 0 L${middle} ${height} L${width} ${height}` };
    }
    if (preset === "bentConnector4") {
      const firstX = width * first;
      const middleY = height * second;
      return {
        kind: "line",
        path: `M0 0 L${firstX} 0 L${firstX} ${middleY} L${width} ${middleY} L${width} ${height}`,
      };
    }
    if (preset === "bentConnector5") {
      const firstX = width * first;
      const secondX = width * second;
      return {
        kind: "line",
        path: `M0 0 L${firstX} 0 L${firstX} ${centerY} L${secondX} ${centerY} L${secondX} ${height} L${width} ${height}`,
      };
    }
    if (preset === "curvedConnector2") {
      return { kind: "line", path: `M0 0 Q${width} 0 ${width} ${height}` };
    }
    if (preset === "curvedConnector3") {
      return {
        kind: "line",
        path: `M0 0 C${centerX} 0 ${centerX} ${height} ${width} ${height}`,
      };
    }
    return { kind: "line", path: `M0 0 L${width} ${height}` };
  }
  if (/flowChartDecision|diamond/iu.test(preset)) {
    return {
      kind: "path",
      path: `M${centerX} 0 L${width} ${centerY} L${centerX} ${height} L0 ${centerY} Z`,
    };
  }
  if (/flowChartInputOutput|parallelogram/iu.test(preset)) {
    return {
      kind: "path",
      path: `M${inset} 0 L${width} 0 L${width - inset} ${height} L0 ${height} Z`,
    };
  }
  if (/flowChartMagneticDisk|can|cylinder/iu.test(preset)) {
    const cap = Math.min(height / 4, width / 6);
    return {
      kind: "path",
      path: `M0 ${cap} A${centerX} ${cap} 0 0 1 ${width} ${cap} L${width} ${height - cap} A${centerX} ${cap} 0 0 1 0 ${height - cap} Z M0 ${cap} A${centerX} ${cap} 0 0 0 ${width} ${cap}`,
    };
  }
  if (/flowChartMultidocument/iu.test(preset)) {
    const wave = height * 0.1;
    return {
      kind: "path",
      path: `M${inset} 0 H${width} V${height - wave} Q${width * 0.75} ${height - wave * 2} ${width / 2} ${height - wave} Q${width * 0.25} ${height} 0 ${height - wave} V${inset} H${inset} Z M${inset} 0 V${inset} H0`,
    };
  }
  if (preset === "mathPlus" || preset === "plus") {
    const horizontal = width * 0.34;
    const vertical = height * 0.34;
    return {
      kind: "path",
      path: `M${horizontal} 0 H${width - horizontal} V${vertical} H${width} V${height - vertical} H${width - horizontal} V${height} H${horizontal} V${height - vertical} H0 V${vertical} H${horizontal} Z`,
    };
  }
  if (/triangle/iu.test(preset)) {
    return { kind: "path", path: `M${centerX} 0 L${width} ${height} H0 Z` };
  }
  if (/hexagon/iu.test(preset)) {
    return {
      kind: "path",
      path: `M${inset} 0 H${width - inset} L${width} ${centerY} L${width - inset} ${height} H${inset} L0 ${centerY} Z`,
    };
  }
  if (/chevron/iu.test(preset)) {
    return {
      kind: "path",
      path: `M0 0 H${width - inset} L${width} ${centerY} L${width - inset} ${height} H0 L${inset} ${centerY} Z`,
    };
  }
  if (/pentagon/iu.test(preset)) {
    return {
      kind: "path",
      path: `M0 0 H${width - inset} L${width} ${centerY} L${width - inset} ${height} H0 Z`,
    };
  }
  if (/flowChartDocument|document/iu.test(preset)) {
    const wave = height * 0.12;
    return {
      kind: "path",
      path: `M0 0 H${width} V${height - wave} Q${width * 0.75} ${height - wave * 2} ${width / 2} ${height - wave} Q${width * 0.25} ${height} 0 ${height - wave} Z`,
    };
  }
  if (/borderCallout/iu.test(preset)) return { kind: "rectangle" };
  return { kind: "rectangle" };
}

/**
 * Converts one DrawingML shape geometry into SVG-ready local geometry.
 *
 * @param shapeProperties - Shape properties containing preset or custom geometry.
 * @param width - Local shape width.
 * @param height - Local shape height.
 * @param connector - Whether the owning object is a connection shape.
 * @returns Normalized local geometry and its preset identifier.
 */
export function decodeOfficeGeometry(
  shapeProperties: Element,
  width: number,
  height: number,
  connector: boolean,
): { readonly geometry: OfficeGeometry; readonly preset: string } {
  const custom = first(shapeProperties, "custGeom");
  if (custom !== undefined) {
    const path = customPath(custom, width, height);
    return {
      geometry: { kind: "path", ...(path === undefined ? {} : { path }) },
      preset: "custom",
    };
  }
  const presetElement = first(shapeProperties, "prstGeom");
  const preset =
    attribute(presetElement ?? shapeProperties, "prst") ??
    (connector ? "straightConnector1" : "rect");
  return {
    geometry: presetGeometry(preset, width, height, presetElement ?? shapeProperties),
    preset,
  };
}
