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
 * Generates the complete original Miaixz six-master glyph set from deterministic
 * semantic construction rules. The generator never imports third-party geometry.
 */

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const moduleRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(moduleRoot, "../../../../../");
const fontsRoot = resolve(repositoryRoot, "packages/icons/src/assets/fonts");
const masters = Object.freeze([
  ["miaixz-icons-outline-compact.ufo", 0, 12],
  ["miaixz-icons-outline-standard.ufo", 0, 24],
  ["miaixz-icons-outline-display.ufo", 0, 40],
  ["miaixz-icons-filled-compact.ufo", 1, 12],
  ["miaixz-icons-filled-standard.ufo", 1, 24],
  ["miaixz-icons-filled-display.ufo", 1, 40],
]);
const center = Object.freeze({ x: 480, y: 320 });

/**
 * Creates a point.
 *
 * @param {number} x - Horizontal font coordinate.
 * @param {number} y - Vertical font coordinate.
 * @returns {Readonly<{x: number, y: number}>} Immutable point.
 */
function point(x, y) {
  return Object.freeze({ x, y });
}

/**
 * Creates a clockwise rectangle contour.
 *
 * @param {number} left - Left coordinate.
 * @param {number} bottom - Bottom coordinate.
 * @param {number} right - Right coordinate.
 * @param {number} top - Top coordinate.
 * @returns {readonly Readonly<{x: number, y: number}>[]} Rectangle points.
 */
function rectangle(left, bottom, right, top) {
  return Object.freeze([
    point(left, bottom),
    point(left, top),
    point(right, top),
    point(right, bottom),
  ]);
}

/**
 * Creates a convex regular polygon contour.
 *
 * @param {number} x - Center x.
 * @param {number} y - Center y.
 * @param {number} radius - Circumradius.
 * @param {number} sides - Point count.
 * @param {number} rotation - Rotation in radians.
 * @returns {readonly Readonly<{x: number, y: number}>[]} Polygon points.
 */
function polygon(x, y, radius, sides, rotation = -Math.PI / 2) {
  return Object.freeze(
    Array.from({ length: sides }, (_, index) => {
      const angle = rotation - (index * Math.PI * 2) / sides;
      return point(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    }),
  );
}

/**
 * Creates a closed rectangular stroke around a segment.
 *
 * @param {number} startX - Start x.
 * @param {number} startY - Start y.
 * @param {number} endX - End x.
 * @param {number} endY - End y.
 * @param {number} width - Stroke width.
 * @returns {readonly Readonly<{x: number, y: number}>[]} Stroke contour.
 */
function stroke(startX, startY, endX, endY, width) {
  const length = Math.hypot(endX - startX, endY - startY);
  const offsetX = (-(endY - startY) * width) / (length * 2);
  const offsetY = ((endX - startX) * width) / (length * 2);
  return Object.freeze([
    point(startX + offsetX, startY + offsetY),
    point(endX + offsetX, endY + offsetY),
    point(endX - offsetX, endY - offsetY),
    point(startX - offsetX, startY - offsetY),
  ]);
}

/**
 * Builds a two-contour ring with opposite winding.
 *
 * @param {number} x - Center x.
 * @param {number} y - Center y.
 * @param {number} outerRadius - Outer radius.
 * @param {number} innerRadius - Inner radius.
 * @param {number} sides - Polygon sample count.
 * @param {number} [rotation] - Rotation in radians.
 * @returns {readonly (readonly Readonly<{x: number, y: number}>[])[]} Ring contours.
 */
function ring(x, y, outerRadius, innerRadius, sides, rotation) {
  return Object.freeze([
    polygon(x, y, outerRadius, sides, rotation),
    Object.freeze([...polygon(x, y, innerRadius, sides, rotation)].reverse()),
  ]);
}

/**
 * Builds a rectangular ring with opposite winding.
 *
 * @param {number} left - Outer left.
 * @param {number} bottom - Outer bottom.
 * @param {number} right - Outer right.
 * @param {number} top - Outer top.
 * @param {number} inset - Inner inset.
 * @returns {readonly (readonly Readonly<{x: number, y: number}>[])[]} Ring contours.
 */
function rectangleRing(left, bottom, right, top, inset) {
  const boundedInset = Math.min(inset, (right - left) * 0.44, (top - bottom) * 0.44);
  return Object.freeze([
    rectangle(left, bottom, right, top),
    Object.freeze(
      [
        ...rectangle(
          left + boundedInset,
          bottom + boundedInset,
          right - boundedInset,
          top - boundedInset,
        ),
      ].reverse(),
    ),
  ]);
}

/**
 * Rotates contours around the font center.
 *
 * @param {readonly (readonly Readonly<{x: number, y: number}>[])[]} contours - Source contours.
 * @param {number} quarterTurns - Clockwise quarter turns.
 * @returns {readonly (readonly Readonly<{x: number, y: number}>[])[]} Rotated contours.
 */
function rotate(contours, quarterTurns) {
  const normalized = ((quarterTurns % 4) + 4) % 4;
  return Object.freeze(
    contours.map((contour) =>
      Object.freeze(
        contour.map(({ x, y }) => {
          let nextX = x - center.x;
          let nextY = y - center.y;
          for (let turn = 0; turn < normalized; turn += 1) {
            [nextX, nextY] = [nextY, -nextX];
          }
          return point(nextX + center.x, nextY + center.y);
        }),
      ),
    ),
  );
}

/**
 * Returns a stable 32-bit name seed.
 *
 * @param {string} name - Canonical icon name.
 * @returns {number} Unsigned seed.
 */
function seedFor(name) {
  return Number.parseInt(createHash("sha256").update(name).digest("hex").slice(0, 8), 16);
}

/**
 * Resolves a directional quarter turn, where the source geometry points right.
 *
 * @param {string} name - Canonical name.
 * @returns {number} Clockwise quarter turns.
 */
function directionFor(name) {
  if (/(?:^|-)(?:down)(?:-|$)/u.test(name)) return 1;
  if (/(?:^|-)(?:left)(?:-|$)/u.test(name)) return 2;
  if (/(?:^|-)(?:up)(?:-|$)/u.test(name)) return 3;
  return 0;
}

/**
 * Creates one plus symbol.
 *
 * @param {number} x - Center x.
 * @param {number} y - Center y.
 * @param {number} size - Full arm length.
 * @param {number} weight - Stroke width.
 * @returns {readonly (readonly Readonly<{x: number, y: number}>[])[]} Symbol contours.
 */
function plus(x, y, size, weight) {
  return Object.freeze([
    stroke(x - size / 2, y, x + size / 2, y, weight),
    stroke(x, y - size / 2, x, y + size / 2, weight),
  ]);
}

/**
 * Creates a common status symbol selected from a canonical suffix.
 *
 * @param {string} name - Canonical name.
 * @param {number} weight - Current master weight.
 * @param {number} [scale] - Symbol scale.
 * @returns {readonly (readonly Readonly<{x: number, y: number}>[])[]} Symbol contours.
 */
function statusSymbol(name, weight, scale = 1) {
  const size = 290 * scale;
  if (/(?:check|confirm)(?:-|$)/u.test(name)) {
    return Object.freeze([stroke(350, 315, 445, 220, weight), stroke(430, 225, 625, 435, weight)]);
  }
  if (/(?:^|-)(?:x|close)(?:-|$)/u.test(name)) {
    return Object.freeze([stroke(360, 200, 600, 440, weight), stroke(360, 440, 600, 200, weight)]);
  }
  if (/(?:plus|add)(?:-|$)/u.test(name)) return plus(480, 320, size, weight);
  if (/(?:minus)(?:-|$)/u.test(name)) {
    return Object.freeze([stroke(480 - size / 2, 320, 480 + size / 2, 320, weight)]);
  }
  if (/(?:alert|warning|exclamation)(?:-|$)/u.test(name)) {
    return Object.freeze([
      stroke(480, 235, 480, 400, weight),
      ...ring(480, 150, weight * 0.52, Math.max(8, weight * 0.16), 12),
    ]);
  }
  if (/(?:help|question)(?:-|$)/u.test(name)) {
    return Object.freeze([
      stroke(420, 405, 480, 465, weight),
      stroke(480, 465, 555, 390, weight),
      stroke(555, 390, 480, 300, weight),
      stroke(480, 300, 480, 260, weight),
      ...ring(480, 175, weight * 0.52, Math.max(8, weight * 0.16), 12),
    ]);
  }
  if (/(?:info)(?:-|$)/u.test(name)) {
    return Object.freeze([
      stroke(480, 220, 480, 365, weight),
      ...ring(480, 440, weight * 0.52, Math.max(8, weight * 0.16), 12),
    ]);
  }
  if (/(?:play)(?:-|$)/u.test(name)) return Object.freeze([polygon(500, 320, 155, 3, 0)]);
  if (/(?:pause)(?:-|$)/u.test(name)) {
    return Object.freeze([rectangle(385, 205, 455, 435), rectangle(505, 205, 575, 435)]);
  }
  if (/(?:stop)(?:-|$)/u.test(name)) return Object.freeze([rectangle(375, 215, 585, 425)]);
  if (/(?:dot)(?:-|$)/u.test(name)) return ring(480, 320, weight, Math.max(8, weight / 4), 12);
  return Object.freeze([]);
}

/**
 * Creates an arrow or chevron whose source direction points right.
 *
 * @param {string} name - Canonical name.
 * @param {number} weight - Current master weight.
 * @returns {readonly (readonly Readonly<{x: number, y: number}>[])[]} Arrow contours.
 */
function arrow(name, weight) {
  const isChevron = /chevron/u.test(name);
  const base = [
    ...(isChevron ? [] : [stroke(245, 320, 690, 320, weight)]),
    stroke(isChevron ? 365 : 545, 495, isChevron ? 600 : 720, 320, weight),
    stroke(isChevron ? 600 : 720, 320, isChevron ? 365 : 545, 145, weight),
  ];
  if (/double|chevrons/u.test(name)) {
    base.push(stroke(225, 495, 460, 320, weight), stroke(460, 320, 225, 145, weight));
  }
  return rotate(Object.freeze(base), directionFor(name));
}

/**
 * Creates deterministic semantic glyph contours for one master.
 *
 * @param {string} name - Canonical name.
 * @param {number} fill - FILL axis endpoint.
 * @param {number} opticalSize - opsz axis endpoint.
 * @returns {readonly (readonly Readonly<{x: number, y: number}>[])[]} Glyph contours.
 */
export function buildGlyphContours(name, fill, opticalSize) {
  const opticalWeight = opticalSize === 12 ? 14 : opticalSize === 40 ? -8 : 0;
  const weight = 58 + fill * 82 + opticalWeight;
  const frameInset = 58 + fill * 155 + opticalWeight;
  const outerRadius = opticalSize === 12 ? 285 : opticalSize === 40 ? 315 : 300;
  const innerRadius = Math.max(62, outerRadius - frameInset);
  const symbols = statusSymbol(name, weight);

  if (/^(?:arrow|chevron|chevrons|corner|move|forward|backspace|import|export)/u.test(name)) {
    return arrow(name, weight);
  }
  if (/^(?:add|plus|circle-plus)$/u.test(name)) return plus(480, 320, 430, weight);
  if (/^(?:close|cross|x)$/u.test(name)) return statusSymbol("close", weight);
  if (/^(?:confirm|check|check-check|check-line)$/u.test(name)) {
    return statusSymbol("confirm", weight);
  }
  if (/^(?:menu|list|logs)/u.test(name)) {
    return Object.freeze([
      stroke(250, 465, 710, 465, weight),
      stroke(250, 320, 710, 320, weight),
      stroke(250, 175, 710, 175, weight),
    ]);
  }
  if (/^(?:more-horizontal|ellipsis|grip-horizontal)/u.test(name)) {
    return Object.freeze(
      [330, 480, 630].flatMap((x) => ring(x, 320, weight * 0.72, Math.max(8, weight * 0.18), 12)),
    );
  }
  if (/^(?:search|zoom)/u.test(name)) {
    return Object.freeze([
      ...ring(425, 375, 205, Math.max(54, 205 - weight), 16),
      stroke(560, 235, 725, 70, weight),
    ]);
  }
  if (/^(?:eye)/u.test(name)) {
    const contours = [
      polygon(480, 320, 300, 12, 0),
      [...polygon(480, 320, Math.max(90, 300 - frameInset), 12, 0)].reverse(),
      ...ring(480, 320, 90 + fill * 25, 34, 16),
    ];
    if (/(?:off|closed)/u.test(name)) contours.push(stroke(260, 540, 700, 100, weight));
    return Object.freeze(contours.map((contour) => Object.freeze(contour)));
  }
  if (/^(?:circle|disc|donut|badge)/u.test(name)) {
    return Object.freeze([...ring(480, 320, outerRadius, innerRadius, 20), ...symbols]);
  }
  if (/^(?:shield)/u.test(name)) {
    const outer = Object.freeze([
      point(480, 650),
      point(760, 550),
      point(720, 180),
      point(480, -10),
      point(240, 180),
      point(200, 550),
    ]);
    const innerScale = fill === 0 ? 0.73 : 0.32;
    const inner = Object.freeze(
      outer
        .map(({ x, y }) => point(480 + (x - 480) * innerScale, 320 + (y - 320) * innerScale))
        .reverse(),
    );
    return Object.freeze([outer, inner, ...symbols]);
  }
  if (/^(?:warning|alert-triangle)/u.test(name)) {
    return Object.freeze([
      ...ring(480, 300, outerRadius, innerRadius, 3, Math.PI / 2),
      ...statusSymbol("alert", weight),
    ]);
  }
  if (/^(?:star|asterisk|snowflake)/u.test(name)) {
    const outer = polygon(480, 320, outerRadius, /snowflake/u.test(name) ? 12 : 10);
    const inner = Object.freeze(
      [...polygon(480, 320, Math.max(65, outerRadius - frameInset), outer.length)].reverse(),
    );
    return Object.freeze([outer, inner]);
  }
  if (/^(?:file|clipboard|book|notebook)/u.test(name)) {
    return Object.freeze([
      ...rectangleRing(230, -20, 730, 660, frameInset),
      stroke(350, 390, 610, 390, weight),
      stroke(350, 250, 610, 250, weight),
      ...symbols,
    ]);
  }
  if (/^(?:folder|archive|inbox|briefcase)/u.test(name)) {
    return Object.freeze([
      ...rectangleRing(150, 40, 810, 570, frameInset),
      rectangle(210, 570, 455, 650),
      ...symbols,
    ]);
  }
  if (/^(?:home|house|building|hotel|hospital|church|factory)/u.test(name)) {
    return Object.freeze([
      stroke(190, 300, 480, 640, weight),
      stroke(480, 640, 770, 300, weight),
      ...rectangleRing(245, -20, 715, 340, frameInset),
      rectangle(435, -20, 525, 180),
      ...symbols,
    ]);
  }
  if (/^(?:user|contact|baby|bot|face)/u.test(name)) {
    return Object.freeze([
      ...ring(480, 475, 135, Math.max(45, 135 - frameInset), 16),
      ...ring(480, 70, 230, Math.max(68, 230 - frameInset), 20, Math.PI),
      ...symbols,
    ]);
  }
  if (/^(?:lock|key)/u.test(name)) {
    return Object.freeze([
      ...rectangleRing(260, 0, 700, 390, frameInset),
      ...ring(480, 420, 190, Math.max(55, 190 - frameInset), 16),
      ...symbols,
    ]);
  }
  if (/^(?:mail|message|send)/u.test(name)) {
    return Object.freeze([
      ...rectangleRing(150, 45, 810, 595, frameInset),
      stroke(180, 560, 480, 300, weight),
      stroke(780, 560, 480, 300, weight),
      ...symbols,
    ]);
  }
  if (/^(?:calendar|clock|alarm|watch|timer|hourglass)/u.test(name)) {
    return Object.freeze([
      ...ring(480, 320, outerRadius, innerRadius, 20),
      stroke(480, 320, 480, 490, weight),
      stroke(480, 320, 610, 245, weight),
      ...symbols,
    ]);
  }
  if (/^(?:play|pause|stop|fast-forward|rewind|skip|eject)/u.test(name)) {
    if (/^eject/u.test(name)) {
      return Object.freeze([
        polygon(480, 370, 190, 3, Math.PI / 2),
        stroke(330, 120, 630, 120, weight),
      ]);
    }
    if (/^fast-forward/u.test(name)) {
      const mediaRadius =
        150 + fill * 24 + (opticalSize === 12 ? -10 : opticalSize === 40 ? 10 : 0);
      return Object.freeze([
        polygon(390, 320, mediaRadius, 3, 0),
        polygon(590, 320, mediaRadius, 3, 0),
      ]);
    }
    if (/^rewind/u.test(name)) {
      return rotate(Object.freeze([polygon(390, 320, 150, 3, 0), polygon(590, 320, 150, 3, 0)]), 2);
    }
    if (/^skip/u.test(name)) {
      const contours = Object.freeze([
        polygon(455, 320, 175, 3, 0),
        stroke(660, 160, 660, 480, weight),
      ]);
      return /back/u.test(name) ? rotate(contours, 2) : contours;
    }
    return statusSymbol(name, weight);
  }
  if (/^(?:settings|cog|gear)/u.test(name)) {
    const spokes = Array.from({ length: 8 }, (_, index) => {
      const angle = (index * Math.PI) / 4;
      return stroke(
        480 + Math.cos(angle) * 190,
        320 + Math.sin(angle) * 190,
        480 + Math.cos(angle) * 305,
        320 + Math.sin(angle) * 305,
        weight,
      );
    });
    return Object.freeze([...ring(480, 320, 220, Math.max(68, 220 - frameInset), 20), ...spokes]);
  }
  if (/^(?:heart)/u.test(name)) {
    const opticalScale = opticalSize === 12 ? 0.94 : opticalSize === 40 ? 1.04 : 1;
    const outer = Object.freeze(
      [
        point(480, 20),
        point(190, 300),
        point(230, 570),
        point(480, 500),
        point(730, 570),
        point(770, 300),
      ].map(({ x, y }) => point(480 + (x - 480) * opticalScale, 315 + (y - 315) * opticalScale)),
    );
    const scale = fill === 0 ? 0.68 : 0.24;
    return Object.freeze([
      outer,
      Object.freeze(
        outer.map(({ x, y }) => point(480 + (x - 480) * scale, 315 + (y - 315) * scale)).reverse(),
      ),
      ...symbols,
    ]);
  }

  const seed = seedFor(name);
  const sides = 5 + (seed % 4);
  const rotation = ((seed >>> 8) % 16) * (Math.PI / 8);
  const primary = ring(480, 320, outerRadius, innerRadius, sides, rotation);
  const barOffset = 90 + ((seed >>> 16) % 80);
  const horizontal = (seed & 1) === 0;
  const marks = horizontal
    ? [
        stroke(330, 320 + barOffset, 630, 320 + barOffset, weight),
        stroke(330, 320 - barOffset, 630, 320 - barOffset, weight),
      ]
    : [
        stroke(480 - barOffset, 170, 480 - barOffset, 470, weight),
        stroke(480 + barOffset, 170, 480 + barOffset, 470, weight),
      ];
  return Object.freeze([...primary, ...marks, ...symbols]);
}

/**
 * Serializes one contour to GLIF format 2.
 *
 * @param {readonly Readonly<{x: number, y: number}>[]} contour - Geometry contour.
 * @returns {string} GLIF contour XML.
 */
function serializeContour(contour) {
  return `    <contour>\n${contour
    .map(({ x, y }) => `      <point x="${Math.round(x)}" y="${Math.round(y)}" type="line"/>`)
    .join("\n")}\n    </contour>`;
}

/**
 * Creates a complete canonical GLIF document.
 *
 * @param {{name: string, codepoint: number, glyphName: string}} icon - Codepoint ledger row.
 * @param {number} fill - FILL endpoint.
 * @param {number} opticalSize - opsz endpoint.
 * @returns {string} GLIF source.
 */
function glyphSource(icon, fill, opticalSize) {
  const contours = buildGlyphContours(icon.name, fill, opticalSize);
  if (contours.length === 0 || contours.some((contour) => contour.length < 3)) {
    throw new Error(`Geometry generator produced an invalid contour for ${icon.name}.`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<glyph name="${icon.glyphName}" format="2">
  <advance width="960"/>
  <unicode hex="${icon.codepoint.toString(16).toUpperCase().padStart(6, "0")}"/>
  <outline>
${contours.map(serializeContour).join("\n")}
  </outline>
</glyph>
`;
}

/**
 * Writes or verifies all 6,144 canonical GLIF files.
 *
 * @param {boolean} check - Compare without writing.
 * @returns {Promise<void>} Promise completed when every source is current.
 */
export async function generateGlyphs(check) {
  const codepointFile = JSON.parse(await readFile(resolve(fontsRoot, "codepoints.json"), "utf8"));
  if (codepointFile.icons.length !== 1024) {
    throw new Error("Glyph generation requires exactly 1024 codepoint records.");
  }
  for (const [directory, fill, opticalSize] of masters) {
    for (const icon of codepointFile.icons) {
      const destination = resolve(fontsRoot, directory, "glyphs", `${icon.glyphName}.glif`);
      const source = glyphSource(icon, fill, opticalSize);
      if (check) {
        if ((await readFile(destination, "utf8")) !== source) {
          throw new Error(`Generated glyph source is stale: ${directory}/${icon.glyphName}.glif.`);
        }
      } else {
        await writeFile(destination, source);
      }
    }
  }
}

const arguments_ = process.argv.slice(2);
if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  if (arguments_.length !== 1 || !["--write", "--check"].includes(arguments_[0])) {
    throw new Error("generate-glyphs.mjs requires exactly --write or --check.");
  }
  const check = arguments_[0] === "--check";
  await generateGlyphs(check);
  console.log(check ? "Miaixz glyph sources are current." : "Miaixz glyph sources were generated.");
}
