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
 * Decodes bounded Enhanced Metafile records into a generated inert SVG image.
 */

import type { ResourceBudget } from "../../shared/contracts/resource-budget.js";
import { ViewerError } from "../../shared/errors/viewer-error.js";

interface Point {
  readonly x: number;
  readonly y: number;
}

interface Matrix {
  readonly a: number;
  readonly b: number;
  readonly c: number;
  readonly d: number;
  readonly e: number;
  readonly f: number;
}

interface Pen {
  readonly kind: "pen";
  readonly color: string;
  readonly width: number;
  readonly none: boolean;
  readonly dash?: string;
}

interface Brush {
  readonly kind: "brush";
  readonly color: string;
  readonly none: boolean;
}

type GdiObject = Brush | Pen;

interface DcState {
  readonly windowOrigin: Point;
  readonly windowExtent: Point;
  readonly viewportOrigin: Point;
  readonly viewportExtent: Point;
  readonly world: Matrix;
  readonly pen: Pen;
  readonly brush: Brush;
  readonly fillRule: "evenodd" | "nonzero";
  readonly current: Point;
}

/**
 * Describes a decoded EMF resource.
 */
export interface EmfDecodeResult {
  readonly source: string;
  readonly mimeType: "image/svg+xml";
  readonly recordCount: number;
  readonly unsupportedRecords: readonly number[];
  readonly visible: boolean;
}

const identity: Matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
const defaultPen: Pen = { kind: "pen", color: "#000000", width: 1, none: false };
const defaultBrush: Brush = { kind: "brush", color: "#FFFFFF", none: false };

/**
 * Multiplies two affine matrices.
 *
 * @param left - Matrix applied last.
 * @param right - Matrix applied first.
 * @returns Composite matrix.
 */
function multiply(left: Matrix, right: Matrix): Matrix {
  return {
    a: left.a * right.a + left.c * right.b,
    b: left.b * right.a + left.d * right.b,
    c: left.a * right.c + left.c * right.d,
    d: left.b * right.c + left.d * right.d,
    e: left.a * right.e + left.c * right.f + left.e,
    f: left.b * right.e + left.d * right.f + left.f,
  };
}

/**
 * Converts one COLORREF value to a CSS color.
 *
 * @param value - Little-endian BGR color.
 * @returns CSS hexadecimal color.
 */
function color(value: number): string {
  const red = value & 0xff;
  const green = (value >>> 8) & 0xff;
  const blue = (value >>> 16) & 0xff;
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/**
 * Encodes bytes without depending on window.btoa.
 *
 * @param bytes - Source bytes.
 * @returns Base64 text.
 */
function base64(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;
    const value = (first << 16) | (second << 8) | third;
    result += alphabet[(value >>> 18) & 63] ?? "";
    result += alphabet[(value >>> 12) & 63] ?? "";
    result += index + 1 < bytes.length ? (alphabet[(value >>> 6) & 63] ?? "") : "=";
    result += index + 2 < bytes.length ? (alphabet[value & 63] ?? "") : "=";
  }
  return result;
}

/**
 * Clones mutable DC state values.
 *
 * @param state - Active state.
 * @returns Independent state snapshot.
 */
function cloneState(state: DcState): DcState {
  return {
    ...state,
    windowOrigin: { ...state.windowOrigin },
    windowExtent: { ...state.windowExtent },
    viewportOrigin: { ...state.viewportOrigin },
    viewportExtent: { ...state.viewportExtent },
    world: { ...state.world },
    current: { ...state.current },
  };
}

/**
 * Transforms a logical GDI point into the EMF device coordinate space.
 *
 * @param state - Active GDI state.
 * @param x - Logical horizontal coordinate.
 * @param y - Logical vertical coordinate.
 * @returns Device point.
 */
function point(state: DcState, x: number, y: number): Point {
  const worldX = state.world.a * x + state.world.c * y + state.world.e;
  const worldY = state.world.b * x + state.world.d * y + state.world.f;
  const windowWidth = state.windowExtent.x === 0 ? 1 : state.windowExtent.x;
  const windowHeight = state.windowExtent.y === 0 ? 1 : state.windowExtent.y;
  return {
    x:
      ((worldX - state.windowOrigin.x) * state.viewportExtent.x) / windowWidth +
      state.viewportOrigin.x,
    y:
      ((worldY - state.windowOrigin.y) * state.viewportExtent.y) / windowHeight +
      state.viewportOrigin.y,
  };
}

/**
 * Produces SVG paint attributes from the current GDI state.
 *
 * @param state - Active GDI state.
 * @param fill - Whether the operation fills its path.
 * @param stroke - Whether the operation strokes its path.
 * @returns Safe SVG attribute fragment.
 */
function paint(state: DcState, fill: boolean, stroke: boolean): string {
  const fillColor = fill && !state.brush.none ? state.brush.color : "none";
  const strokeColor = stroke && !state.pen.none ? state.pen.color : "none";
  const dash = state.pen.dash === undefined ? "" : ` stroke-dasharray="${state.pen.dash}"`;
  return ` fill="${fillColor}" fill-rule="${state.fillRule}" stroke="${strokeColor}" stroke-width="${Math.max(0.5, state.pen.width)}"${dash}`;
}

/**
 * Reads one affine XFORM record.
 *
 * @param view - Source data view.
 * @param offset - Record-relative XFORM offset.
 * @returns Affine matrix.
 */
function matrix(view: DataView, offset: number): Matrix {
  return {
    a: view.getFloat32(offset, true),
    b: view.getFloat32(offset + 4, true),
    c: view.getFloat32(offset + 8, true),
    d: view.getFloat32(offset + 12, true),
    e: view.getFloat32(offset + 16, true),
    f: view.getFloat32(offset + 20, true),
  };
}

/**
 * Converts point records into an SVG path segment.
 *
 * @param view - Source view.
 * @param offset - First point offset.
 * @param count - Point count.
 * @param short - Whether coordinates are signed 16-bit values.
 * @param state - Active transform state.
 * @returns Transformed points.
 */
function points(
  view: DataView,
  offset: number,
  count: number,
  short: boolean,
  state: DcState,
): Point[] {
  const result: Point[] = [];
  const stride = short ? 4 : 8;
  for (let index = 0; index < count; index += 1) {
    const pointOffset = offset + index * stride;
    const x = short ? view.getInt16(pointOffset, true) : view.getInt32(pointOffset, true);
    const y = short ? view.getInt16(pointOffset + 2, true) : view.getInt32(pointOffset + 4, true);
    result.push(point(state, x, y));
  }
  return result;
}

/**
 * Builds a browser-readable BMP around one DIB payload.
 *
 * @param record - Complete EMF record bytes.
 * @param infoOffset - Record-relative bitmap-info offset.
 * @param infoLength - Bitmap-info byte length.
 * @param bitsOffset - Record-relative pixel-data offset.
 * @param bitsLength - Pixel-data byte length.
 * @returns BMP data URL when offsets are valid.
 */
function dibDataUrl(
  record: Uint8Array,
  infoOffset: number,
  infoLength: number,
  bitsOffset: number,
  bitsLength: number,
): string | undefined {
  if (
    infoLength <= 0 ||
    bitsLength <= 0 ||
    infoOffset < 0 ||
    bitsOffset < 0 ||
    infoOffset + infoLength > record.length ||
    bitsOffset + bitsLength > record.length
  ) {
    return undefined;
  }
  const result = new Uint8Array(14 + infoLength + bitsLength);
  const view = new DataView(result.buffer);
  result[0] = 0x42;
  result[1] = 0x4d;
  view.setUint32(2, result.length, true);
  view.setUint32(10, 14 + infoLength, true);
  result.set(record.subarray(infoOffset, infoOffset + infoLength), 14);
  result.set(record.subarray(bitsOffset, bitsOffset + bitsLength), 14 + infoLength);
  return `data:image/bmp;base64,${base64(result)}`;
}

/**
 * Decodes one Enhanced Metafile into inert SVG markup.
 *
 * @param bytes - Complete EMF bytes.
 * @param budget - Resource limits applied to records and generated output.
 * @returns Generated SVG resource and record inventory.
 */
export function decodeEmf(bytes: Uint8Array, budget: ResourceBudget): EmfDecodeResult {
  if (bytes.length < 88) throw new ViewerError("PARSE_FAILED", "parse");
  const source = bytes.slice();
  const view = new DataView(source.buffer, source.byteOffset, source.byteLength);
  if (view.getUint32(0, true) !== 1) throw new ViewerError("PARSE_FAILED", "parse");
  const left = view.getInt32(8, true);
  const top = view.getInt32(12, true);
  const right = view.getInt32(16, true);
  const bottom = view.getInt32(20, true);
  const width = Math.max(1, right - left);
  const height = Math.max(1, bottom - top);
  if (width * height > budget.maxImagePixels) {
    throw new ViewerError("RESOURCE_LIMIT_EXCEEDED", "parse", false, [], {
      field: "maxImagePixels",
      actual: width * height,
      allowed: budget.maxImagePixels,
    });
  }
  let state: DcState = {
    windowOrigin: { x: 0, y: 0 },
    windowExtent: { x: width, y: height },
    viewportOrigin: { x: 0, y: 0 },
    viewportExtent: { x: width, y: height },
    world: identity,
    pen: defaultPen,
    brush: defaultBrush,
    fillRule: "evenodd",
    current: { x: 0, y: 0 },
  };
  const stack: DcState[] = [];
  const objects = new Map<number, GdiObject>();
  const output: string[] = [];
  const unsupported = new Set<number>();
  let activePath = "";
  let savedPath = "";
  let offset = 0;
  let recordCount = 0;
  let emfPlusDual = false;
  const appendPolyline = (items: readonly Point[], close: boolean, move: boolean): void => {
    if (items.length === 0) return;
    const [firstPoint, ...remaining] = items;
    if (firstPoint === undefined) return;
    if (move) activePath += `M${firstPoint.x} ${firstPoint.y}`;
    else activePath += `L${firstPoint.x} ${firstPoint.y}`;
    for (const item of remaining) activePath += `L${item.x} ${item.y}`;
    if (close) activePath += "Z";
    state = { ...state, current: items.at(-1) ?? state.current };
  };
  while (offset + 8 <= source.length) {
    const type = view.getUint32(offset, true);
    const size = view.getUint32(offset + 4, true);
    if (size < 8 || size % 4 !== 0 || offset + size > source.length) {
      throw new ViewerError("PARSE_FAILED", "parse");
    }
    recordCount += 1;
    if (recordCount > budget.maxVectorRecords) {
      throw new ViewerError("RESOURCE_LIMIT_EXCEEDED", "parse", false, [], {
        field: "maxVectorRecords",
        actual: recordCount,
        allowed: budget.maxVectorRecords,
      });
    }
    const relative = (position: number): number => offset + position;
    const int32 = (position: number): number => view.getInt32(relative(position), true);
    const uint32 = (position: number): number => view.getUint32(relative(position), true);
    if (type === 9) state = { ...state, windowExtent: { x: int32(8), y: int32(12) } };
    else if (type === 10) state = { ...state, windowOrigin: { x: int32(8), y: int32(12) } };
    else if (type === 11) state = { ...state, viewportExtent: { x: int32(8), y: int32(12) } };
    else if (type === 12) state = { ...state, viewportOrigin: { x: int32(8), y: int32(12) } };
    else if (type === 19) state = { ...state, fillRule: uint32(8) === 2 ? "nonzero" : "evenodd" };
    else if (type === 27) state = { ...state, current: point(state, int32(8), int32(12)) };
    else if (type === 33) stack.push(cloneState(state));
    else if (type === 34) state = stack.pop() ?? state;
    else if (type === 35) state = { ...state, world: matrix(view, relative(8)) };
    else if (type === 36) {
      const value = matrix(view, relative(8));
      const mode = uint32(32);
      state = {
        ...state,
        world:
          mode === 1
            ? identity
            : mode === 2
              ? multiply(value, state.world)
              : mode === 3
                ? multiply(state.world, value)
                : value,
      };
    } else if (type === 37) {
      const handle = uint32(8);
      if ((handle & 0x80000000) !== 0) {
        const stock = handle & 0x7fffffff;
        if (stock === 5) state = { ...state, brush: { ...defaultBrush, none: true } };
        else if (stock === 8) state = { ...state, pen: { ...defaultPen, none: true } };
        else if (stock <= 4)
          state = {
            ...state,
            brush: { ...defaultBrush, color: stock === 0 ? "#FFFFFF" : "#000000" },
          };
        else state = { ...state, pen: defaultPen };
      } else {
        const object = objects.get(handle);
        if (object?.kind === "pen") state = { ...state, pen: object };
        else if (object?.kind === "brush") state = { ...state, brush: object };
      }
    } else if (type === 38 || type === 95) {
      const handle = uint32(8);
      const style = uint32(type === 38 ? 12 : 28);
      const widthValue = Math.abs(int32(type === 38 ? 16 : 32));
      const colorValue = uint32(type === 38 ? 24 : 40);
      const dashStyle = style & 0xf;
      objects.set(handle, {
        kind: "pen",
        color: color(colorValue),
        width: Math.max(1, widthValue),
        none: dashStyle === 5,
        ...(dashStyle === 1
          ? { dash: "6 3" }
          : dashStyle === 2
            ? { dash: "1 2" }
            : dashStyle === 3
              ? { dash: "6 3 1 3" }
              : {}),
      });
    } else if (type === 39) {
      objects.set(uint32(8), {
        kind: "brush",
        color: color(uint32(16)),
        none: uint32(12) === 1,
      });
    } else if (type === 40) objects.delete(uint32(8));
    else if (type === 59) activePath = "";
    else if (type === 60) savedPath = activePath;
    else if (type === 61) activePath += "Z";
    else if (type === 62)
      output.push(`<path d="${savedPath || activePath}"${paint(state, true, false)}/>`);
    else if (type === 63)
      output.push(`<path d="${savedPath || activePath}"${paint(state, true, true)}/>`);
    else if (type === 64)
      output.push(`<path d="${savedPath || activePath}"${paint(state, false, true)}/>`);
    else if ([2, 4, 5, 6, 85, 87, 88, 89].includes(type)) {
      const short = type >= 85;
      const count = uint32(24);
      const items = points(view, relative(28), count, short, state);
      const bezier = type === 5 || type === 85 || type === 88;
      const move = type === 2 || type === 4 || type === 85 || type === 87;
      if (bezier && items.length >= 4) {
        const firstPoint = items[0];
        if (move && firstPoint !== undefined) activePath += `M${firstPoint.x} ${firstPoint.y}`;
        const start = move ? 1 : 0;
        for (let index = start; index + 2 < items.length; index += 3) {
          const firstControl = items[index];
          const secondControl = items[index + 1];
          const endPoint = items[index + 2];
          if (firstControl !== undefined && secondControl !== undefined && endPoint !== undefined) {
            activePath += `C${firstControl.x} ${firstControl.y} ${secondControl.x} ${secondControl.y} ${endPoint.x} ${endPoint.y}`;
          }
        }
      } else appendPolyline(items, false, move);
    } else if (type === 3 || type === 86) {
      const short = type === 86;
      const items = points(view, relative(28), uint32(24), short, state);
      const path =
        items.map((item, index) => `${index === 0 ? "M" : "L"}${item.x} ${item.y}`).join("") + "Z";
      output.push(`<path d="${path}"${paint(state, true, true)}/>`);
    } else if (type === 42 || type === 43) {
      const start = point(state, int32(8), int32(12));
      const end = point(state, int32(16), int32(20));
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const shapeWidth = Math.abs(end.x - start.x);
      const shapeHeight = Math.abs(end.y - start.y);
      output.push(
        type === 42
          ? `<ellipse cx="${x + shapeWidth / 2}" cy="${y + shapeHeight / 2}" rx="${shapeWidth / 2}" ry="${shapeHeight / 2}"${paint(state, true, true)}/>`
          : `<rect x="${x}" y="${y}" width="${shapeWidth}" height="${shapeHeight}"${paint(state, true, true)}/>`,
      );
    } else if (type === 54) {
      const end = point(state, int32(8), int32(12));
      output.push(
        `<path d="M${state.current.x} ${state.current.y}L${end.x} ${end.y}"${paint(state, false, true)}/>`,
      );
      state = { ...state, current: end };
    } else if (type === 76 || type === 81) {
      const stretch = type === 81;
      const x = int32(24);
      const y = int32(28);
      const destinationWidth = int32(stretch ? 72 : 32);
      const destinationHeight = int32(stretch ? 76 : 36);
      const infoOffset = uint32(stretch ? 48 : 84);
      const infoLength = uint32(stretch ? 52 : 88);
      const bitsOffset = uint32(stretch ? 56 : 92);
      const bitsLength = uint32(stretch ? 60 : 96);
      const record = source.subarray(offset, offset + size);
      const image = dibDataUrl(record, infoOffset, infoLength, bitsOffset, bitsLength);
      const start = point(state, x, y);
      const end = point(state, x + destinationWidth, y + destinationHeight);
      if (image === undefined && type === 76) {
        output.push(
          `<rect x="${Math.min(start.x, end.x)}" y="${Math.min(start.y, end.y)}" width="${Math.abs(end.x - start.x)}" height="${Math.abs(end.y - start.y)}" fill="${state.brush.none ? "none" : state.brush.color}"/>`,
        );
      } else if (image === undefined) unsupported.add(type);
      else {
        output.push(
          `<image href="${image}" x="${Math.min(start.x, end.x)}" y="${Math.min(start.y, end.y)}" width="${Math.abs(end.x - start.x)}" height="${Math.abs(end.y - start.y)}" preserveAspectRatio="none"/>`,
        );
      }
    } else if (type === 94) {
      objects.set(uint32(8), { kind: "brush", color: "#808080", none: false });
    } else if (type === 70) {
      if (size < 16) throw new ViewerError("PARSE_FAILED", "parse");
      const dataSize = uint32(8);
      if (dataSize > size - 12) throw new ViewerError("PARSE_FAILED", "parse");
      const signature = uint32(12);
      if (signature === 0x2b464d45 && dataSize >= 16) {
        const recordType = view.getUint16(relative(16), true);
        const flags = view.getUint16(relative(18), true);
        if (recordType === 0x4001) emfPlusDual = (flags & 1) === 1;
      }
      if (!emfPlusDual) unsupported.add(type);
    } else if (![1, 14, 17, 18, 21, 67, 98].includes(type)) unsupported.add(type);
    offset += size;
    if (type === 14) break;
  }
  if (offset !== source.length) throw new ViewerError("PARSE_FAILED", "parse");
  const outputText = output.join("");
  if (outputText.length > budget.maxTextCharacters) {
    throw new ViewerError("RESOURCE_LIMIT_EXCEEDED", "parse", false, [], {
      field: "maxTextCharacters",
      actual: outputText.length,
      allowed: budget.maxTextCharacters,
    });
  }
  const svgNamespace = `http${"://"}www.w3.org/2000/svg`;
  const svg = `<svg xmlns="${svgNamespace}" viewBox="${left} ${top} ${width} ${height}">${outputText}</svg>`;
  return {
    source: `data:image/svg+xml;base64,${base64(new TextEncoder().encode(svg))}`,
    mimeType: "image/svg+xml",
    recordCount,
    unsupportedRecords: [...unsupported].sort((first, second) => first - second),
    visible: output.length > 0,
  };
}
