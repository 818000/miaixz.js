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
 * Provides the generated, read-only format descriptors and lazy loaders.
 */

import type { ViewerDriver } from "../shared/contracts/driver.js";
import type { FormatDescriptor, FormatDriverId } from "../shared/contracts/format.js";

/**
 * Loads one independently installable format driver.
 */
export type FormatLoader = () => Promise<ViewerDriver>;

/**
 * Describes every format module present at generation time.
 */
export const formatDescriptors = [
  {
    schemaVersion: 1,
    id: "doc",
    label: "Microsoft Word binary document",
    category: "document",
    family: "word",
    extensions: ["doc", "dot"],
    mimeTypes: ["application/msword"],
    implementation: "recognized",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "docx",
    label: "Office Open XML document",
    category: "document",
    family: "word",
    extensions: ["docx", "docm", "dotx", "dotm"],
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-word.document.macroEnabled.12",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
      "application/vnd.ms-word.template.macroEnabled.12",
    ],
    implementation: "ready",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "drawio",
    label: "Draw.io diagram",
    category: "diagram",
    extensions: ["drawio", "dio"],
    mimeTypes: ["application/vnd.jgraph.mxfile"],
    implementation: "ready",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "dxf",
    label: "Drawing Exchange Format",
    category: "cad",
    extensions: ["dxf"],
    mimeTypes: ["image/vnd.dxf", "application/dxf"],
    implementation: "ready",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "epub",
    label: "Electronic publication",
    category: "document",
    extensions: ["epub"],
    mimeTypes: ["application/epub+zip"],
    implementation: "ready",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "geojson",
    label: "GeoJSON data",
    category: "geospatial",
    extensions: ["geojson", "topojson"],
    mimeTypes: ["application/geo+json", "application/topo+json"],
    implementation: "ready",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "gif",
    label: "Graphics Interchange Format",
    category: "image",
    extensions: ["gif"],
    mimeTypes: ["image/gif"],
    implementation: "ready",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "jpeg",
    label: "JPEG image",
    category: "image",
    extensions: ["jpg", "jpeg", "jpe", "jfif", "pjpe", "pjpeg"],
    mimeTypes: ["image/jpeg", "image/pjpeg"],
    implementation: "ready",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "mp3",
    label: "MPEG audio layer III",
    category: "audio",
    extensions: ["mp3"],
    mimeTypes: ["audio/mpeg"],
    implementation: "ready",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "mp4",
    label: "MPEG-4 media",
    category: "video",
    extensions: ["mp4", "m4v"],
    mimeTypes: ["video/mp4", "video/x-m4v"],
    implementation: "ready",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "obj",
    label: "Wavefront OBJ model",
    category: "model-3d",
    extensions: ["obj"],
    mimeTypes: ["model/obj", "text/plain"],
    implementation: "ready",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "odp",
    label: "OpenDocument presentation",
    category: "presentation",
    extensions: ["odp", "fodp", "otp"],
    mimeTypes: [
      "application/vnd.oasis.opendocument.presentation",
      "application/vnd.oasis.opendocument.presentation-template",
    ],
    implementation: "recognized",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "ods",
    label: "OpenDocument spreadsheet",
    category: "spreadsheet",
    extensions: ["ods", "fods", "ots"],
    mimeTypes: [
      "application/vnd.oasis.opendocument.spreadsheet",
      "application/vnd.oasis.opendocument.spreadsheet-template",
    ],
    implementation: "recognized",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "odt",
    label: "OpenDocument text",
    category: "document",
    extensions: ["odt", "fodt", "ott"],
    mimeTypes: [
      "application/vnd.oasis.opendocument.text",
      "application/vnd.oasis.opendocument.text-template",
    ],
    implementation: "recognized",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "ofd",
    label: "Open Fixed-layout Document",
    category: "fixed-layout",
    extensions: ["ofd"],
    mimeTypes: ["application/ofd"],
    implementation: "ready",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "pdf",
    label: "Portable Document Format",
    category: "document",
    extensions: ["pdf"],
    mimeTypes: ["application/pdf"],
    implementation: "ready",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "png",
    label: "Portable Network Graphics",
    category: "image",
    extensions: ["png"],
    mimeTypes: ["image/png"],
    implementation: "ready",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "ppt",
    label: "Microsoft PowerPoint binary presentation",
    category: "presentation",
    family: "powerpoint",
    extensions: ["ppt", "pps", "pot"],
    mimeTypes: ["application/vnd.ms-powerpoint"],
    implementation: "recognized",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "pptx",
    label: "Office Open XML presentation",
    category: "presentation",
    family: "powerpoint",
    extensions: ["pptx", "pptm", "ppsx", "ppsm", "potx", "potm", "sldx", "sldm"],
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-powerpoint.presentation.macroEnabled.12",
      "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
      "application/vnd.ms-powerpoint.slideshow.macroEnabled.12",
      "application/vnd.openxmlformats-officedocument.presentationml.template",
      "application/vnd.ms-powerpoint.template.macroEnabled.12",
      "application/vnd.openxmlformats-officedocument.presentationml.slide",
      "application/vnd.ms-powerpoint.slide.macroEnabled.12",
    ],
    implementation: "ready",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "rar",
    label: "RAR archive",
    category: "archive",
    extensions: ["rar"],
    mimeTypes: ["application/vnd.rar"],
    implementation: "recognized",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "svg",
    label: "Scalable Vector Graphics",
    category: "image",
    extensions: ["svg"],
    mimeTypes: ["image/svg+xml"],
    implementation: "ready",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "wasm",
    label: "WebAssembly module",
    category: "binary",
    extensions: ["wasm"],
    mimeTypes: ["application/wasm"],
    implementation: "ready",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "xls",
    label: "Microsoft Excel binary workbook",
    category: "spreadsheet",
    family: "excel",
    extensions: ["xls", "xlt", "xlsb"],
    mimeTypes: [
      "application/vnd.ms-excel",
      "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
    ],
    implementation: "recognized",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "xlsx",
    label: "Office Open XML spreadsheet",
    category: "spreadsheet",
    family: "excel",
    extensions: ["xlsx", "xlsm", "xltx", "xltm"],
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel.sheet.macroEnabled.12",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
      "application/vnd.ms-excel.template.macroEnabled.12",
    ],
    implementation: "ready",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "xmind",
    label: "XMind workbook",
    category: "diagram",
    extensions: ["xmind"],
    mimeTypes: ["application/vnd.xmind.workbook"],
    implementation: "ready",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "xps",
    label: "XML Paper Specification",
    category: "fixed-layout",
    extensions: ["xps", "oxps"],
    mimeTypes: ["application/vnd.ms-xpsdocument", "application/oxps"],
    implementation: "ready",
    entry: "./driver.ts",
  },
  {
    schemaVersion: 1,
    id: "zip",
    label: "ZIP archive",
    category: "archive",
    extensions: ["zip"],
    mimeTypes: ["application/zip"],
    implementation: "ready",
    entry: "./driver.ts",
  },
] as const satisfies readonly FormatDescriptor[];

/**
 * Maps every owned extension to its canonical format identifier.
 */
export const formatIdByExtension = new Map<string, FormatDriverId>([
  ["doc", "doc"],
  ["dot", "doc"],
  ["docx", "docx"],
  ["docm", "docx"],
  ["dotx", "docx"],
  ["dotm", "docx"],
  ["drawio", "drawio"],
  ["dio", "drawio"],
  ["dxf", "dxf"],
  ["epub", "epub"],
  ["geojson", "geojson"],
  ["topojson", "geojson"],
  ["gif", "gif"],
  ["jpg", "jpeg"],
  ["jpeg", "jpeg"],
  ["jpe", "jpeg"],
  ["jfif", "jpeg"],
  ["pjpe", "jpeg"],
  ["pjpeg", "jpeg"],
  ["mp3", "mp3"],
  ["mp4", "mp4"],
  ["m4v", "mp4"],
  ["obj", "obj"],
  ["odp", "odp"],
  ["fodp", "odp"],
  ["otp", "odp"],
  ["ods", "ods"],
  ["fods", "ods"],
  ["ots", "ods"],
  ["odt", "odt"],
  ["fodt", "odt"],
  ["ott", "odt"],
  ["ofd", "ofd"],
  ["pdf", "pdf"],
  ["png", "png"],
  ["ppt", "ppt"],
  ["pps", "ppt"],
  ["pot", "ppt"],
  ["pptx", "pptx"],
  ["pptm", "pptx"],
  ["ppsx", "pptx"],
  ["ppsm", "pptx"],
  ["potx", "pptx"],
  ["potm", "pptx"],
  ["sldx", "pptx"],
  ["sldm", "pptx"],
  ["rar", "rar"],
  ["svg", "svg"],
  ["wasm", "wasm"],
  ["xls", "xls"],
  ["xlt", "xls"],
  ["xlsb", "xls"],
  ["xlsx", "xlsx"],
  ["xlsm", "xlsx"],
  ["xltx", "xlsx"],
  ["xltm", "xlsx"],
  ["xmind", "xmind"],
  ["xps", "xps"],
  ["oxps", "xps"],
  ["zip", "zip"],
]);

/**
 * Lazily loads only format directories present at generation time.
 */
export const formatLoaders = new Map<FormatDriverId, FormatLoader>([
  [
    "doc",
    /**
     * Loads the doc format driver.
     *
     * @returns Loaded doc format driver.
     */
    async () => (await import("../formats/doc/driver.js")).formatDriver,
  ],
  [
    "docx",
    /**
     * Loads the docx format driver.
     *
     * @returns Loaded docx format driver.
     */
    async () => (await import("../formats/docx/driver.js")).formatDriver,
  ],
  [
    "drawio",
    /**
     * Loads the drawio format driver.
     *
     * @returns Loaded drawio format driver.
     */
    async () => (await import("../formats/drawio/driver.js")).formatDriver,
  ],
  [
    "dxf",
    /**
     * Loads the dxf format driver.
     *
     * @returns Loaded dxf format driver.
     */
    async () => (await import("../formats/dxf/driver.js")).formatDriver,
  ],
  [
    "epub",
    /**
     * Loads the epub format driver.
     *
     * @returns Loaded epub format driver.
     */
    async () => (await import("../formats/epub/driver.js")).formatDriver,
  ],
  [
    "geojson",
    /**
     * Loads the geojson format driver.
     *
     * @returns Loaded geojson format driver.
     */
    async () => (await import("../formats/geojson/driver.js")).formatDriver,
  ],
  [
    "gif",
    /**
     * Loads the gif format driver.
     *
     * @returns Loaded gif format driver.
     */
    async () => (await import("../formats/gif/driver.js")).formatDriver,
  ],
  [
    "jpeg",
    /**
     * Loads the jpeg format driver.
     *
     * @returns Loaded jpeg format driver.
     */
    async () => (await import("../formats/jpeg/driver.js")).formatDriver,
  ],
  [
    "mp3",
    /**
     * Loads the mp3 format driver.
     *
     * @returns Loaded mp3 format driver.
     */
    async () => (await import("../formats/mp3/driver.js")).formatDriver,
  ],
  [
    "mp4",
    /**
     * Loads the mp4 format driver.
     *
     * @returns Loaded mp4 format driver.
     */
    async () => (await import("../formats/mp4/driver.js")).formatDriver,
  ],
  [
    "obj",
    /**
     * Loads the obj format driver.
     *
     * @returns Loaded obj format driver.
     */
    async () => (await import("../formats/obj/driver.js")).formatDriver,
  ],
  [
    "odp",
    /**
     * Loads the odp format driver.
     *
     * @returns Loaded odp format driver.
     */
    async () => (await import("../formats/odp/driver.js")).formatDriver,
  ],
  [
    "ods",
    /**
     * Loads the ods format driver.
     *
     * @returns Loaded ods format driver.
     */
    async () => (await import("../formats/ods/driver.js")).formatDriver,
  ],
  [
    "odt",
    /**
     * Loads the odt format driver.
     *
     * @returns Loaded odt format driver.
     */
    async () => (await import("../formats/odt/driver.js")).formatDriver,
  ],
  [
    "ofd",
    /**
     * Loads the ofd format driver.
     *
     * @returns Loaded ofd format driver.
     */
    async () => (await import("../formats/ofd/driver.js")).formatDriver,
  ],
  [
    "pdf",
    /**
     * Loads the pdf format driver.
     *
     * @returns Loaded pdf format driver.
     */
    async () => (await import("../formats/pdf/driver.js")).formatDriver,
  ],
  [
    "png",
    /**
     * Loads the png format driver.
     *
     * @returns Loaded png format driver.
     */
    async () => (await import("../formats/png/driver.js")).formatDriver,
  ],
  [
    "ppt",
    /**
     * Loads the ppt format driver.
     *
     * @returns Loaded ppt format driver.
     */
    async () => (await import("../formats/ppt/driver.js")).formatDriver,
  ],
  [
    "pptx",
    /**
     * Loads the pptx format driver.
     *
     * @returns Loaded pptx format driver.
     */
    async () => (await import("../formats/pptx/driver.js")).formatDriver,
  ],
  [
    "rar",
    /**
     * Loads the rar format driver.
     *
     * @returns Loaded rar format driver.
     */
    async () => (await import("../formats/rar/driver.js")).formatDriver,
  ],
  [
    "svg",
    /**
     * Loads the svg format driver.
     *
     * @returns Loaded svg format driver.
     */
    async () => (await import("../formats/svg/driver.js")).formatDriver,
  ],
  [
    "wasm",
    /**
     * Loads the wasm format driver.
     *
     * @returns Loaded wasm format driver.
     */
    async () => (await import("../formats/wasm/driver.js")).formatDriver,
  ],
  [
    "xls",
    /**
     * Loads the xls format driver.
     *
     * @returns Loaded xls format driver.
     */
    async () => (await import("../formats/xls/driver.js")).formatDriver,
  ],
  [
    "xlsx",
    /**
     * Loads the xlsx format driver.
     *
     * @returns Loaded xlsx format driver.
     */
    async () => (await import("../formats/xlsx/driver.js")).formatDriver,
  ],
  [
    "xmind",
    /**
     * Loads the xmind format driver.
     *
     * @returns Loaded xmind format driver.
     */
    async () => (await import("../formats/xmind/driver.js")).formatDriver,
  ],
  [
    "xps",
    /**
     * Loads the xps format driver.
     *
     * @returns Loaded xps format driver.
     */
    async () => (await import("../formats/xps/driver.js")).formatDriver,
  ],
  [
    "zip",
    /**
     * Loads the zip format driver.
     *
     * @returns Loaded zip format driver.
     */
    async () => (await import("../formats/zip/driver.js")).formatDriver,
  ],
]);
