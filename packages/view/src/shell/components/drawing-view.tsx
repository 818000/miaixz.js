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
 * Renders format-neutral vector drawing scenes through one SVG implementation.
 */

import type { DrawingScene, DrawingShape } from "../../shared/contracts/document.js";

/**
 * Converts an optional affine transform into an SVG matrix value.
 *
 * @param shape - Drawing shape containing an optional transform.
 * @returns SVG transform attribute value.
 */
function shapeTransform(shape: DrawingShape): string | undefined {
  const transform = shape.transform;
  if (transform === undefined) return undefined;
  return `matrix(${transform.a} ${transform.b} ${transform.c} ${transform.d} ${transform.e} ${transform.f})`;
}

/**
 * Wraps plain text using deterministic font-width estimates.
 *
 * @param shape - Shape whose text must fit within its local extent.
 * @returns Visual text lines.
 */
function textLines(shape: DrawingShape): string[] {
  if (shape.text === undefined) return [];
  const fontSize = shape.textStyle?.fontSize ?? 12;
  const maximum = Math.max(1, Math.floor((shape.width - 8) / (fontSize * 0.72)));
  const lines: string[] = [];
  for (const paragraph of shape.text.split("\n")) {
    if (paragraph.length <= maximum) {
      lines.push(paragraph);
      continue;
    }
    let remaining = paragraph;
    while (remaining.length > maximum) {
      let split = remaining.lastIndexOf(" ", maximum);
      if (split <= 0) split = maximum;
      lines.push(remaining.slice(0, split));
      remaining = remaining.slice(split).trimStart();
    }
    if (remaining !== "") lines.push(remaining);
  }
  return lines;
}

/**
 * Computes horizontal text position and SVG anchor mode.
 *
 * @param shape - Shape containing normalized text alignment.
 * @returns Horizontal coordinate and SVG anchor mode.
 */
function horizontalText(shape: DrawingShape): {
  readonly x: number;
  readonly anchor: "end" | "middle" | "start";
} {
  if (shape.textStyle?.align === "center") return { x: shape.width / 2, anchor: "middle" };
  if (shape.textStyle?.align === "end") return { x: shape.width - 4, anchor: "end" };
  return { x: 4, anchor: "start" };
}

/**
 * Computes the first text baseline for vertical alignment.
 *
 * @param shape - Shape containing normalized vertical alignment.
 * @param lineCount - Number of wrapped visual lines.
 * @returns First SVG text baseline.
 */
function verticalText(shape: DrawingShape, lineCount: number): number {
  const fontSize = shape.textStyle?.fontSize ?? 12;
  const lineHeight = fontSize * 1.2;
  if (shape.textStyle?.verticalAlign === "bottom") {
    return Math.max(fontSize, shape.height - 4 - lineHeight * (lineCount - 1));
  }
  if (shape.textStyle?.verticalAlign === "center") {
    return Math.max(
      fontSize,
      shape.height / 2 - (lineHeight * (lineCount - 1)) / 2 + fontSize * 0.35,
    );
  }
  return fontSize + 4;
}

/**
 * Renders text inside one shape using SVG text spans.
 *
 * @param root0 - Drawing shape and stable React key prefix.
 * @param root0.shape - Shape containing normalized text.
 * @returns SVG text element or null when the shape has no text.
 */
function ShapeText({ shape }: { readonly shape: DrawingShape }): React.ReactElement | null {
  const lines = textLines(shape);
  if (lines.length === 0) return null;
  const horizontal = horizontalText(shape);
  const fontSize = shape.textStyle?.fontSize ?? 12;
  const lineHeight = fontSize * 1.2;
  return (
    <text
      fill={shape.textStyle?.color ?? "#000000"}
      fontFamily={shape.textStyle?.fontFamily ?? "Arial, sans-serif"}
      fontSize={fontSize}
      fontStyle={shape.textStyle?.italic === true ? "italic" : "normal"}
      fontWeight={shape.textStyle?.bold === true ? "bold" : "normal"}
      pointerEvents="none"
      textAnchor={horizontal.anchor}
      textDecoration={shape.textStyle?.underline === true ? "underline" : "none"}
      x={horizontal.x}
      y={verticalText(shape, lines.length)}
    >
      {lines.map((line, index) => (
        <tspan dy={index === 0 ? 0 : lineHeight} key={`${shape.id}-line-${index}`} x={horizontal.x}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

/**
 * Renders one normalized drawing element.
 *
 * @param root0 - Shape and marker identifiers supplied by the scene renderer.
 * @param root0.shape - Shape being rendered.
 * @param root0.startMarkerId - Marker identifier used for start arrows.
 * @param root0.endMarkerId - Marker identifier used for end arrows.
 * @returns SVG group representing the drawing element.
 */
function ShapeElement({
  shape,
  startMarkerId,
  endMarkerId,
}: {
  readonly shape: DrawingShape;
  readonly startMarkerId: string;
  readonly endMarkerId: string;
}): React.ReactElement {
  const common = {
    fill: shape.fill ?? "none",
    stroke: shape.stroke ?? "currentColor",
    strokeDasharray: shape.strokeDasharray,
    strokeWidth: shape.strokeWidth ?? 1,
  };
  const markerStart =
    shape.startArrow === undefined || shape.startArrow === "none"
      ? undefined
      : `url(#${startMarkerId})`;
  const markerEnd =
    shape.endArrow === undefined || shape.endArrow === "none" ? undefined : `url(#${endMarkerId})`;
  const horizontalCrop = Math.max(
    0.0001,
    1 - (shape.imageCrop?.left ?? 0) - (shape.imageCrop?.right ?? 0),
  );
  const verticalCrop = Math.max(
    0.0001,
    1 - (shape.imageCrop?.top ?? 0) - (shape.imageCrop?.bottom ?? 0),
  );
  const cropId = `${startMarkerId}-${shape.id.replaceAll(/[^a-z\d_-]/giu, "-")}-crop`;
  return (
    <g data-drawing-id={shape.id} transform={shapeTransform(shape)}>
      {shape.kind === "ellipse" ? (
        <ellipse
          {...common}
          cx={shape.x + shape.width / 2}
          cy={shape.y + shape.height / 2}
          rx={shape.width / 2}
          ry={shape.height / 2}
        />
      ) : shape.kind === "image" ? (
        shape.source === undefined ? (
          <g>
            <rect {...common} height={shape.height} width={shape.width} x={shape.x} y={shape.y} />
            <line
              {...common}
              x1={shape.x}
              x2={shape.x + shape.width}
              y1={shape.y}
              y2={shape.y + shape.height}
            />
            <line
              {...common}
              x1={shape.x + shape.width}
              x2={shape.x}
              y1={shape.y}
              y2={shape.y + shape.height}
            />
          </g>
        ) : (
          <g>
            {shape.imageCrop === undefined ? null : (
              <clipPath id={cropId}>
                <rect height={shape.height} width={shape.width} x={shape.x} y={shape.y} />
              </clipPath>
            )}
            <image
              clipPath={shape.imageCrop === undefined ? undefined : `url(#${cropId})`}
              height={shape.height / verticalCrop}
              href={shape.source}
              opacity={shape.opacity}
              preserveAspectRatio={shape.imageCrop === undefined ? "xMidYMid meet" : "none"}
              width={shape.width / horizontalCrop}
              x={shape.x - ((shape.imageCrop?.left ?? 0) * shape.width) / horizontalCrop}
              y={shape.y - ((shape.imageCrop?.top ?? 0) * shape.height) / verticalCrop}
            />
          </g>
        )
      ) : shape.path !== undefined ? (
        <path {...common} d={shape.path} markerEnd={markerEnd} markerStart={markerStart} />
      ) : shape.kind === "line" ? (
        <line
          {...common}
          markerEnd={markerEnd}
          markerStart={markerStart}
          x1={shape.x}
          x2={shape.x + shape.width}
          y1={shape.y}
          y2={shape.y + shape.height}
        />
      ) : (
        <rect
          {...common}
          height={shape.height}
          rx={shape.cornerRadius}
          ry={shape.cornerRadius}
          width={shape.width}
          x={shape.x}
          y={shape.y}
        />
      )}
      <ShapeText shape={shape} />
    </g>
  );
}

/**
 * Renders one drawing scene with reusable arrow markers and preserved z-order.
 *
 * @param root0 - Drawing scene and optional class name.
 * @param root0.scene - Scene being rendered.
 * @param root0.className - Optional CSS class applied to the SVG root.
 * @param root0.instanceId - Optional suffix keeping SVG definition ids unique across frozen panes.
 * @param root0.coordinateWidth - Optional host coordinate width used by anchored spreadsheet scenes.
 * @param root0.coordinateHeight - Optional host coordinate height used by anchored spreadsheet scenes.
 * @returns Accessible SVG drawing.
 */
export function DrawingView({
  scene,
  className = "miaixz-preview-drawing",
  instanceId,
  coordinateWidth = scene.width,
  coordinateHeight = scene.height,
}: {
  readonly scene: DrawingScene;
  readonly className?: string;
  readonly instanceId?: string;
  readonly coordinateWidth?: number;
  readonly coordinateHeight?: number;
}): React.ReactElement {
  const safeId = `${scene.id}${instanceId === undefined ? "" : `-${instanceId}`}`.replaceAll(
    /[^a-z\d_-]/giu,
    "-",
  );
  const startMarkerId = `${safeId}-arrow-start`;
  const endMarkerId = `${safeId}-arrow-end`;
  return (
    <svg
      aria-label={scene.title}
      className={className}
      preserveAspectRatio="xMinYMin meet"
      role="img"
      viewBox={`0 0 ${coordinateWidth} ${coordinateHeight}`}
    >
      <defs>
        <marker
          id={startMarkerId}
          markerHeight="8"
          markerUnits="strokeWidth"
          markerWidth="8"
          orient="auto-start-reverse"
          refX="6"
          refY="3"
          viewBox="0 0 7 6"
        >
          <path d="M6 0 L0 3 L6 6 Z" fill="context-stroke" />
        </marker>
        <marker
          id={endMarkerId}
          markerHeight="8"
          markerUnits="strokeWidth"
          markerWidth="8"
          orient="auto"
          refX="6"
          refY="3"
          viewBox="0 0 7 6"
        >
          <path d="M0 0 L6 3 L0 6 Z" fill="context-stroke" />
        </marker>
      </defs>
      {scene.shapes.map((shape) => (
        <ShapeElement
          endMarkerId={endMarkerId}
          key={shape.id}
          shape={shape}
          startMarkerId={startMarkerId}
        />
      ))}
    </svg>
  );
}
