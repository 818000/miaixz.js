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
 * Implements the local PDF parser without PDF.js.
 */

import type { PagedDocument, PagedPage, ViewerWarning } from "../../shared/contracts/document.js";
import type { ViewerDriver } from "../../shared/contracts/driver.js";
import { documentTitle, stableDocumentId } from "../../shared/document/document-identity.js";
import { ViewerError } from "../../shared/errors/viewer-error.js";

interface PdfObject {
  readonly source: string;
  readonly sourceOffset: number;
}

const latinDecoder = new TextDecoder("windows-1252");
const utf8Decoder = new TextDecoder();

/**
 * Indexes classic indirect PDF objects from decoded source text.
 *
 * @param source - Windows-1252 decoded PDF source.
 * @returns Object-number map containing source slices and byte offsets.
 */
function parseObjects(source: string): Map<number, PdfObject> {
  const objects = new Map<number, PdfObject>();
  for (const match of source.matchAll(/(\d+)\s+\d+\s+obj\b([\s\S]*?)\bendobj\b/gu)) {
    if (match.index === undefined || match[2] === undefined) continue;
    objects.set(Number(match[1]), {
      source: match[2],
      sourceOffset: match.index + match[0].indexOf(match[2]),
    });
  }
  return objects;
}

/**
 * Extracts indirect object references from a PDF syntax fragment.
 *
 * @param value - PDF syntax fragment containing zero or more references.
 * @returns Referenced object numbers in source order.
 */
function references(value: string): number[] {
  return [...value.matchAll(/(\d+)\s+\d+\s+R/gu)].map((match) => Number(match[1]));
}

/**
 * Reads a page crop or media box with a letter-size fallback.
 *
 * @param source - Source of one PDF page object.
 * @returns Positive page width and height.
 */
function pageSize(source: string): { readonly width: number; readonly height: number } {
  const box = source.match(
    /\/(?:CropBox|MediaBox)\s*\[\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s*\]/u,
  );
  if (box === null) return { width: 612, height: 792 };
  return {
    width: Math.max(1, Number(box[3]) - Number(box[1])),
    height: Math.max(1, Number(box[4]) - Number(box[2])),
  };
}

/**
 * Decodes escape sequences used by literal PDF strings.
 *
 * @param value - Literal string contents without surrounding parentheses.
 * @returns Decoded literal string.
 */
function unescapePdfString(value: string): string {
  return value.replaceAll(/\\([nrtbf()\\]|[0-7]{1,3})/gu, (_match, escaped: string) => {
    const named: Readonly<Record<string, string>> = {
      n: "\n",
      r: "\r",
      t: "\t",
      b: "\b",
      f: "\f",
      "(": "(",
      ")": ")",
      "\\": "\\",
    };
    return named[escaped] ?? String.fromCharCode(Number.parseInt(escaped, 8));
  });
}

/**
 * Decodes a hexadecimal PDF string, including UTF-16 big-endian values.
 *
 * @param value - Hexadecimal string contents without surrounding brackets.
 * @returns Decoded text value.
 */
function decodeHexString(value: string): string {
  const normalized = value.replaceAll(/\s/gu, "");
  const padded = normalized.length % 2 === 0 ? normalized : `${normalized}0`;
  const bytes = new Uint8Array(padded.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(padded.slice(index * 2, index * 2 + 2), 16);
  }
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    let result = "";
    for (let index = 2; index + 1 < bytes.length; index += 2) {
      result += String.fromCharCode(((bytes[index] ?? 0) << 8) | (bytes[index + 1] ?? 0));
    }
    return result;
  }
  return latinDecoder.decode(bytes);
}

/**
 * Extracts supported text-showing operators from a PDF content stream.
 *
 * @param content - Decoded PDF content stream instructions.
 * @returns Normalized readable text fragments.
 */
function extractText(content: string): string {
  const fragments: string[] = [];
  const pattern =
    /\(((?:\\.|[^\\)])*)\)\s*(?:Tj|'|")|<([0-9A-Fa-f\s]+)>\s*Tj|\[((?:\((?:\\.|[^\\)])*\)|<[^>]*>|[^\]])*)\]\s*TJ|T\*/gu;
  for (const match of content.matchAll(pattern)) {
    if (match[0] === "T*") fragments.push("\n");
    else if (match[1] !== undefined) fragments.push(unescapePdfString(match[1]));
    else if (match[2] !== undefined) fragments.push(decodeHexString(match[2]));
    else if (match[3] !== undefined) {
      for (const item of match[3].matchAll(/\(((?:\\.|[^\\)])*)\)|<([0-9A-Fa-f\s]+)>/gu)) {
        fragments.push(
          item[1] === undefined ? decodeHexString(item[2] ?? "") : unescapePdfString(item[1]),
        );
      }
    }
    if (/['"]$/u.test(match[0])) fragments.push("\n");
  }
  return fragments
    .join("")
    .replaceAll(/\n{3,}/gu, "\n\n")
    .trim();
}

/**
 * Reads and optionally inflates one supported PDF stream.
 *
 * @param object - Indexed PDF object containing stream metadata.
 * @param bytes - Complete PDF source bytes.
 * @returns Decoded stream text, or undefined for unsupported filters.
 */
async function streamContent(object: PdfObject, bytes: Uint8Array): Promise<string | undefined> {
  const marker = /stream\r?\n/u.exec(object.source);
  if (marker?.index === undefined) return undefined;
  const end = object.source.lastIndexOf("endstream");
  if (end < marker.index) return undefined;
  const start = marker.index + marker[0].length;
  let streamBytes = bytes.subarray(object.sourceOffset + start, object.sourceOffset + end);
  while (streamBytes.at(-1) === 0x0a || streamBytes.at(-1) === 0x0d)
    streamBytes = streamBytes.subarray(0, -1);
  if (/\/Filter\s*\/FlateDecode\b/u.test(object.source)) {
    const stream = new Blob([Uint8Array.from(streamBytes).buffer])
      .stream()
      .pipeThrough(new DecompressionStream("deflate"));
    streamBytes = new Uint8Array(await new Response(stream).arrayBuffer());
  } else if (/\/Filter\b/u.test(object.source)) return undefined;
  return utf8Decoder.decode(streamBytes);
}

/**
 * Parses PDF objects, pages, basic streams, and text operators without PDF.js.
 */
export const formatDriver: ViewerDriver<PagedDocument> = {
  id: "pdf",
  /**
   * Opens a PDF and extracts supported page geometry and text locally.
   *
   * @param context - Bounded driver context for the selected PDF source.
   * @returns Complete or partial paged model, or an explicit rejection.
   */
  async open(context) {
    const bytes = await context.resource.readAll(context.signal);
    const source = latinDecoder.decode(bytes);
    if (!source.startsWith("%PDF-")) {
      return { status: "rejected", error: new ViewerError("PARSE_FAILED", "parse") };
    }
    if (/\/Encrypt\b/u.test(source)) {
      return { status: "rejected", error: new ViewerError("FORMAT_UNSUPPORTED", "parse", true) };
    }
    const id = stableDocumentId(context.resource.name, bytes);
    const objects = parseObjects(source);
    const pageObjects = [...objects.values()].filter((object) =>
      /\/Type\s*\/Page\b/u.test(object.source),
    );
    const pages: PagedPage[] = [];
    const warnings: ViewerWarning[] = [];
    for (const [index, page] of pageObjects.entries()) {
      context.signal.throwIfAborted();
      const contents = page.source.match(/\/Contents\s*(\[[^\]]*\]|\d+\s+\d+\s+R)/u)?.[1] ?? "";
      const chunks: string[] = [];
      for (const reference of references(contents)) {
        const object = objects.get(reference);
        if (object === undefined) continue;
        try {
          const content = await streamContent(object, bytes);
          if (content === undefined)
            warnings.push({ code: "PDF_FILTER_UNSUPPORTED", messageKey: "pdf.filterUnsupported" });
          else chunks.push(extractText(content));
        } catch {
          warnings.push({ code: "PDF_STREAM_FAILED", messageKey: "pdf.streamFailed" });
        }
      }
      pages.push({
        id: `${id}-page-${index + 1}`,
        ...pageSize(page.source),
        text: chunks.filter(Boolean).join("\n"),
      });
    }
    if (pages.length === 0)
      return { status: "rejected", error: new ViewerError("PARSE_FAILED", "parse") };
    const model: PagedDocument = {
      schemaVersion: 1,
      id,
      kind: "paged",
      title: documentTitle(context.resource.name),
      pages,
    };
    return warnings.length === 0
      ? { status: "complete", model, warnings }
      : {
          status: "partial",
          model,
          warnings,
          skipped: [{ code: "PDF_UNSUPPORTED_STREAM_FILTER", count: warnings.length }],
        };
  },
};
