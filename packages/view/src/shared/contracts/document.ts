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
 * Defines the closed format-neutral document model contracts.
 */

import type { ViewerError } from "../errors/viewer-error.js";

/**
 * Identifies a stable, non-fatal parse diagnostic.
 */
export interface ViewerWarning {
  readonly code: string;
  readonly messageKey: string;
}

/**
 * Identifies a source feature intentionally omitted from a partial result.
 */
export interface SkippedFeature {
  readonly code: string;
  readonly count?: number;
}

interface DocumentBase {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly title: string;
}

/**
 * Represents decoded text or source code.
 */
export interface TextDocument extends DocumentBase {
  readonly kind: "text";
  readonly content: string;
  readonly language?: string;
  readonly lineCount: number;
}

/**
 * Represents content rendered by a browser-native media element.
 */
export interface MediaDocument extends DocumentBase {
  readonly kind: "media";
  readonly mediaKind: "image" | "audio" | "video";
  readonly sourceUrl: string;
  readonly mimeType?: string;
}

/**
 * Represents one normalized cell in a spreadsheet.
 */
export interface SpreadsheetCell {
  readonly address: string;
  readonly value: string | number | boolean | null;
  readonly formula?: string;
}

/**
 * Identifies one zero-based rectangular worksheet range.
 */
export interface SpreadsheetRange {
  readonly reference: string;
  readonly startRow: number;
  readonly startColumn: number;
  readonly endRow: number;
  readonly endColumn: number;
}

/**
 * Describes one resolved spreadsheet font.
 */
export interface SpreadsheetFontStyle {
  readonly family: string;
  readonly size: number;
  readonly color: string;
  readonly bold: boolean;
  readonly italic: boolean;
  readonly underline: boolean;
  readonly strike: boolean;
}

/**
 * Describes one visible spreadsheet border edge.
 */
export interface SpreadsheetBorderSide {
  readonly color: string;
  readonly style: string;
  readonly width: number;
}

/**
 * Describes four resolved spreadsheet border edges.
 */
export interface SpreadsheetBorderStyle {
  readonly top?: SpreadsheetBorderSide;
  readonly right?: SpreadsheetBorderSide;
  readonly bottom?: SpreadsheetBorderSide;
  readonly left?: SpreadsheetBorderSide;
}

/**
 * Stores one fully resolved cell style ready for browser rendering.
 */
export interface SpreadsheetCellStyle {
  readonly font: SpreadsheetFontStyle;
  readonly fill?: string;
  readonly border: SpreadsheetBorderStyle;
  readonly horizontal: "center" | "fill" | "general" | "justify" | "left" | "right";
  readonly vertical: "bottom" | "center" | "top";
  readonly wrapText: boolean;
  readonly shrinkToFit: boolean;
  readonly textRotation: number;
  readonly numberFormat: string;
}

/**
 * Stores resolved workbook styles and their source inventory counts.
 */
export interface SpreadsheetStyleTable {
  readonly cellStyles: readonly SpreadsheetCellStyle[];
  readonly fontCount: number;
  readonly fillCount: number;
  readonly borderCount: number;
}

/**
 * Describes one worksheet row override.
 */
export interface SpreadsheetRowLayout {
  readonly index: number;
  readonly height: number;
  readonly hidden: boolean;
  readonly outlineLevel: number;
  readonly collapsed: boolean;
  readonly styleId?: number;
}

/**
 * Describes one worksheet column interval.
 */
export interface SpreadsheetColumnLayout {
  readonly start: number;
  readonly end: number;
  readonly width: number;
  readonly hidden: boolean;
  readonly outlineLevel: number;
  readonly collapsed: boolean;
  readonly styleId?: number;
}

/**
 * Describes a saved split or frozen pane.
 */
export interface SpreadsheetPane {
  readonly state?: "frozen" | "frozenSplit" | "split";
  readonly xSplit: number;
  readonly ySplit: number;
  readonly topLeftCell?: string;
  readonly activePane?: "bottomLeft" | "bottomRight" | "topLeft" | "topRight";
}

/**
 * Describes the persisted worksheet selection for one pane.
 */
export interface SpreadsheetSelection {
  readonly activeCell: string;
  readonly range: string;
  readonly pane?: "bottomLeft" | "bottomRight" | "topLeft" | "topRight";
}

/**
 * Stores page margins in the inch units used by SpreadsheetML.
 */
export interface SpreadsheetPageMargins {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  readonly header: number;
  readonly footer: number;
}

/**
 * Stores the visible saved print configuration for one worksheet.
 */
export interface SpreadsheetPageSetup {
  readonly paperSize?: number;
  readonly scale: number;
  readonly orientation: "default" | "landscape" | "portrait";
  readonly fitToWidth?: number;
  readonly fitToHeight?: number;
}

/**
 * Stores deterministic worksheet geometry shared by every rendering layer.
 */
export interface SpreadsheetSheetLayout {
  readonly dimension: SpreadsheetRange;
  readonly defaultRowHeight: number;
  readonly defaultColumnWidth: number;
  readonly rows: readonly SpreadsheetRowLayout[];
  readonly columns: readonly SpreadsheetColumnLayout[];
  readonly mergedCells: readonly SpreadsheetRange[];
  readonly columnOffsets: Float64Array;
  readonly rowOffsets: Float64Array;
  readonly width: number;
  readonly height: number;
  readonly showGridLines: boolean;
  readonly showRowColumnHeaders: boolean;
  readonly rightToLeft: boolean;
  readonly outlineSummaryBelow: boolean;
  readonly outlineSummaryRight: boolean;
  readonly viewMode: "normal" | "pageBreakPreview" | "pageLayout";
  readonly zoomScale: number;
  readonly zoomScaleNormal: number;
  readonly zoomScalePageLayout: number;
  readonly pane?: SpreadsheetPane;
  readonly selections: readonly SpreadsheetSelection[];
  readonly activeSelection?: SpreadsheetSelection;
  readonly pageMargins: SpreadsheetPageMargins;
  readonly pageSetup: SpreadsheetPageSetup;
  readonly printArea?: SpreadsheetRange;
  readonly printTitleRows?: SpreadsheetRange;
  readonly rowBreaks: readonly number[];
  readonly columnBreaks: readonly number[];
}

/**
 * Extends a sparse cell with resolved layout and display information.
 */
export interface SpreadsheetRenderCell extends SpreadsheetCell {
  readonly row: number;
  readonly column: number;
  readonly styleId: number;
  readonly displayValue: string;
}

/**
 * Extends one worksheet with complete saved-state layout information.
 */
export interface SpreadsheetRenderSheet extends SpreadsheetSheet {
  readonly state: "hidden" | "veryHidden" | "visible";
  readonly tabColor?: string;
  readonly cells: readonly SpreadsheetRenderCell[];
  readonly layout: SpreadsheetSheetLayout;
}

/**
 * Enumerates visible spreadsheet feature families used for completeness accounting.
 */
export type SpreadsheetFeatureId =
  | "active-content-preview"
  | "cell"
  | "chart"
  | "comment"
  | "conditional-format"
  | "drawing"
  | "external-data-cache"
  | "filter"
  | "hyperlink"
  | "image"
  | "merge"
  | "pivot-view"
  | "sheet-layout"
  | "sparkline"
  | "style"
  | "table"
  | "view"
  | "vml"
  | "workbook";

/**
 * Counts one discovered workbook feature before and after modeling.
 */
export interface SpreadsheetCoverageEntry {
  readonly feature: SpreadsheetFeatureId;
  readonly part: string;
  readonly sheetId?: string;
  readonly discovered: number;
  readonly modeled: number;
  readonly renderable: number;
  readonly skipped: number;
}

/**
 * Stores immutable feature coverage used to derive ParseOutcome status.
 */
export interface SpreadsheetCoverageLedger {
  readonly entries: readonly SpreadsheetCoverageEntry[];
}

/**
 * Represents one worksheet and its sparse cells.
 */
export interface SpreadsheetSheet {
  readonly id: string;
  readonly name: string;
  readonly cells: readonly SpreadsheetCell[];
}

/**
 * Represents spreadsheet content independently from its renderer.
 */
export interface SpreadsheetDocument extends DocumentBase {
  readonly kind: "spreadsheet";
  readonly sheets: readonly SpreadsheetSheet[];
  readonly drawings: readonly DrawingScene[];
}

/**
 * Represents the complete internal workbook model produced by the built-in XLSX driver.
 */
export interface SpreadsheetRenderDocument extends SpreadsheetDocument {
  readonly layoutVersion: 1;
  readonly activeSheetId: string;
  readonly sheets: readonly SpreadsheetRenderSheet[];
  readonly styles: SpreadsheetStyleTable;
  readonly coverage: SpreadsheetCoverageLedger;
}

/**
 * Narrows a spreadsheet model to the complete layout-aware representation.
 *
 * @param document - Public spreadsheet model.
 * @returns Whether the model contains the built-in layout contract.
 */
export function isSpreadsheetRenderDocument(
  document: SpreadsheetDocument,
): document is SpreadsheetRenderDocument {
  return "layoutVersion" in document && document.layoutVersion === 1;
}

/**
 * Stores one affine transform using the SVG matrix component order.
 */
export interface DrawingTransform {
  readonly a: number;
  readonly b: number;
  readonly c: number;
  readonly d: number;
  readonly e: number;
  readonly f: number;
}

/**
 * Describes normalized text presentation inside one drawing shape.
 */
export interface DrawingTextStyle {
  readonly align: "center" | "end" | "start";
  readonly bold: boolean;
  readonly color: string;
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly italic: boolean;
  readonly underline: boolean;
  readonly verticalAlign: "bottom" | "center" | "top";
}

/**
 * Represents one immutable vector shape.
 */
export interface DrawingShape {
  readonly id: string;
  readonly kind: "rectangle" | "ellipse" | "line" | "text" | "image" | "path";
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly text?: string;
  readonly fill?: string;
  readonly stroke?: string;
  readonly rotation?: number;
  readonly name?: string;
  readonly preset?: string;
  readonly path?: string;
  readonly source?: string;
  readonly mimeType?: string;
  readonly imageCrop?: {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
  };
  readonly opacity?: number;
  readonly transform?: DrawingTransform;
  readonly strokeWidth?: number;
  readonly strokeDasharray?: string;
  readonly startArrow?: string;
  readonly endArrow?: string;
  readonly cornerRadius?: number;
  readonly textStyle?: DrawingTextStyle;
}

/**
 * Represents one connector in a semantic diagram.
 */
export interface DiagramEdge {
  readonly id: string;
  readonly from?: string;
  readonly to?: string;
  readonly label?: string;
  readonly inferred: boolean;
}

/**
 * Stores format-neutral geometry used by diagram analysis.
 */
export interface Rectangle {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Represents one recognized flow node with an explicit confidence score.
 */
export interface DiagramNode {
  readonly id: string;
  readonly label: string;
  readonly role:
    "decision" | "document" | "end" | "input" | "output" | "process" | "start" | "unknown";
  readonly bounds: Rectangle;
  readonly sheet?: string;
  readonly cellRange?: string;
  readonly confidence: number;
}

/**
 * Describes a stable diagram-analysis warning.
 */
export interface DiagramWarning {
  readonly code: string;
  readonly edgeId?: string;
  readonly nodeId?: string;
}

/**
 * Summarizes source features retained by one drawing scene.
 */
export interface DrawingFeatures {
  readonly shapeCount: number;
  readonly connectorCount: number;
  readonly groupCount: number;
  readonly pictureCount: number;
  readonly customGeometryCount: number;
  readonly smartArtCount: number;
  readonly unsupportedCount: number;
}

/**
 * Exposes semantic graph data independently from visual shape rendering.
 */
export interface DiagramGraph {
  readonly nodes: readonly DiagramNode[];
  readonly edges: readonly DiagramEdge[];
  readonly warnings: readonly DiagramWarning[];
}

/**
 * Represents one drawing surface shared by Office and drawing formats.
 */
export interface DrawingScene extends DocumentBase {
  readonly kind: "drawing";
  readonly width: number;
  readonly height: number;
  readonly shapes: readonly DrawingShape[];
  readonly edges: readonly DiagramEdge[];
  readonly graph?: DiagramGraph;
  readonly sheetId?: string;
  readonly sheetName?: string;
  readonly features?: DrawingFeatures;
}

/**
 * Represents one fixed-layout page.
 */
export interface PagedPage {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly text: string;
  readonly drawing?: DrawingScene;
}

/**
 * Represents fixed-layout formats including PDF, XPS, OFD, and slides.
 */
export interface PagedDocument extends DocumentBase {
  readonly kind: "paged";
  readonly pages: readonly PagedPage[];
}

/**
 * Represents flowing document chapters or sections.
 */
export interface FlowSection {
  readonly id: string;
  readonly title?: string;
  readonly text: string;
}

/**
 * Represents reflowable documents including DOCX, ODT, EPUB, and email.
 */
export interface FlowDocument extends DocumentBase {
  readonly kind: "flow";
  readonly sections: readonly FlowSection[];
}

/**
 * Represents a safe archive entry without opening it implicitly.
 */
export interface ArchiveEntry {
  readonly path: string;
  readonly compressedSize?: number;
  readonly uncompressedSize?: number;
  readonly directory: boolean;
}

/**
 * Represents an archive directory.
 */
export interface ArchiveDocument extends DocumentBase {
  readonly kind: "archive";
  readonly entries: readonly ArchiveEntry[];
}

/**
 * Represents a structured inspection result for unsupported binary content.
 */
export interface BinaryDocument extends DocumentBase {
  readonly kind: "binary";
  readonly byteLength: number;
  readonly format: string;
  readonly summary: readonly { readonly label: string; readonly value: string }[];
}

/**
 * Represents one immutable mesh primitive in a 3D scene.
 */
export interface SceneMesh {
  readonly id: string;
  readonly name?: string;
  readonly vertexCount: number;
  readonly triangleCount: number;
}

/**
 * Represents one node in a format-neutral 3D scene hierarchy.
 */
export interface SceneNode {
  readonly id: string;
  readonly name: string;
  readonly parentId?: string;
  readonly meshId?: string;
  readonly visible: boolean;
}

/**
 * Represents a safe, renderer-independent 3D scene.
 */
export interface SceneDocument extends DocumentBase {
  readonly kind: "scene";
  readonly nodes: readonly SceneNode[];
  readonly meshes: readonly SceneMesh[];
  readonly preview?: DrawingScene;
}

/**
 * Enumerates every stable model consumed by the viewer shell.
 */
export type ViewerDocument =
  | ArchiveDocument
  | BinaryDocument
  | DrawingScene
  | FlowDocument
  | MediaDocument
  | PagedDocument
  | SceneDocument
  | SpreadsheetDocument
  | TextDocument;

/**
 * Expresses parser completion without implicit null or exception semantics.
 */
export type ParseOutcome<TModel extends ViewerDocument = ViewerDocument> =
  | {
      readonly status: "complete";
      readonly model: TModel;
      readonly warnings: readonly ViewerWarning[];
    }
  | {
      readonly status: "partial";
      readonly model: TModel;
      readonly warnings: readonly ViewerWarning[];
      readonly skipped: readonly SkippedFeature[];
    }
  | { readonly status: "rejected"; readonly error: ViewerError };
