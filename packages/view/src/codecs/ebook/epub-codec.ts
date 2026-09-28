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
 * Provides the EPUB codec for safe flow-document models.
 */

import type { FlowDocument } from "../../shared/contracts/document.js";
import type { ViewerDriver } from "../../shared/contracts/driver.js";
import { documentTitle, stableDocumentId } from "../../shared/document/document-identity.js";
import { ViewerError } from "../../shared/errors/viewer-error.js";
import { ZipArchive } from "../archive/zip-codec.js";
import {
  elementsByLocalName,
  firstElementByLocalName,
  localAttribute,
  parseXmlDocument,
  type XmlDocument,
  type XmlElement,
} from "../xml/xml-codec.js";

/**
 * Resolves one relative package target against its owning container part.
 *
 * @param basePart - Normalized path of the part containing the relationship.
 * @param target - Relative target stored in the container metadata.
 * @returns Normalized container path of the resolved target.
 */
function resolvePart(basePart: string, target: string): string {
  const result = basePart.split("/");
  result.pop();
  for (const segment of target.split("/")) {
    if (segment === "..") result.pop();
    else if (segment !== "." && segment !== "") result.push(segment);
  }
  return result.join("/");
}

/**
 * Removes executable elements and normalizes readable document text.
 *
 * @param document - Parsed flow-document XML tree.
 * @returns Whitespace-normalized inert text from the document body.
 */
function normalizedBodyText(document: XmlDocument): string {
  const excluded = new Set(["script", "style", "object", "iframe"]);
  const safeText = (element: XmlElement): string => {
    if (excluded.has(element.localName.toLowerCase())) return "";
    return `${element.ownText} ${element.children.map((child) => safeText(child)).join(" ")}`;
  };
  return safeText(document.documentElement).replaceAll(/\s+/gu, " ").trim();
}

/**
 * Parses EPUB package metadata and spine documents into safe flow sections.
 */
export const epubDriver: ViewerDriver<FlowDocument> = {
  id: "epub",
  /**
   * Opens an EPUB container and converts its spine into flow sections.
   *
   * @param context - Bounded driver context for the selected EPUB source.
   * @returns Complete EPUB flow model or an explicit parse rejection.
   */
  async open(context) {
    const bytes = await context.resource.readAll(context.signal);
    const archive = new ZipArchive(bytes, context.budget);
    const containerPath = "META-INF/container.xml";
    if (!archive.entries.some((entry) => entry.path === containerPath)) {
      return { status: "rejected", error: new ViewerError("PARSE_FAILED", "parse") };
    }
    const container = parseXmlDocument(
      await archive.text(containerPath),
      context.budget.maxXmlNodes,
    );
    const rootfile = firstElementByLocalName(container, "rootfile");
    const packagePath = rootfile === undefined ? undefined : localAttribute(rootfile, "full-path");
    if (packagePath === undefined)
      return { status: "rejected", error: new ViewerError("PARSE_FAILED", "parse") };
    const packageDocument = parseXmlDocument(
      await archive.text(packagePath),
      context.budget.maxXmlNodes,
    );
    const manifest = new Map<string, string>();
    for (const item of elementsByLocalName(packageDocument, "item")) {
      const itemId = localAttribute(item, "id");
      const href = localAttribute(item, "href");
      if (itemId !== undefined && href !== undefined)
        manifest.set(itemId, resolvePart(packagePath, href));
    }
    const id = stableDocumentId(context.resource.name, bytes);
    const sections = [];
    for (const itemReference of elementsByLocalName(packageDocument, "itemref")) {
      const itemId = localAttribute(itemReference, "idref");
      const part = itemId === undefined ? undefined : manifest.get(itemId);
      if (part === undefined) continue;
      const document = parseXmlDocument(await archive.text(part), context.budget.maxXmlNodes);
      sections.push({
        id: `${id}-section-${sections.length + 1}`,
        title: firstElementByLocalName(document, "title")?.textContent?.trim() || part,
        text: normalizedBodyText(document),
      });
    }
    const model: FlowDocument = {
      schemaVersion: 1,
      id,
      kind: "flow",
      title: documentTitle(context.resource.name),
      sections,
    };
    return { status: "complete", model, warnings: [] };
  },
};
