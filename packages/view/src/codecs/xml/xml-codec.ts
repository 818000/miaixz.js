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
 * Provides the inert XML codec and namespace-independent query helpers.
 */

import { ViewerError } from "../../shared/errors/viewer-error.js";

/**
 * Parses inert XML while rejecting entity declarations and excessive node counts.
 *
 * @param source - Untrusted XML source text.
 * @param maxNodes - Maximum number of elements allowed in the parsed document.
 * @returns Parsed XML document that satisfies the configured node limit.
 */
export function parseXmlDocument(source: string, maxNodes: number): XMLDocument {
  if (/<!DOCTYPE|<!ENTITY/iu.test(source)) throw new ViewerError("PARSE_FAILED", "parse");
  const document = new DOMParser().parseFromString(source, "application/xml");
  if (document.querySelector("parsererror") !== null)
    throw new ViewerError("PARSE_FAILED", "parse");
  if (document.getElementsByTagName("*").length > maxNodes) {
    throw new ViewerError("RESOURCE_LIMIT_EXCEEDED", "parse");
  }
  return document;
}

/**
 * Returns all descendants with a namespace-independent local name.
 *
 * @param root - Parent node whose descendants are searched.
 * @param localName - Namespace-independent element name to match.
 * @returns Matching descendant elements in document order.
 */
export function elementsByLocalName(root: ParentNode, localName: string): Element[] {
  return [...root.querySelectorAll("*")].filter((element) => element.localName === localName);
}

/**
 * Returns the first descendant with a namespace-independent local name.
 *
 * @param root - Parent node whose descendants are searched.
 * @param localName - Namespace-independent element name to match.
 * @returns First matching element, or undefined when no match exists.
 */
export function firstElementByLocalName(root: ParentNode, localName: string): Element | undefined {
  return elementsByLocalName(root, localName)[0];
}

/**
 * Reads one namespace-independent attribute.
 *
 * @param element - Element whose attributes are inspected.
 * @param localName - Namespace-independent attribute name to match.
 * @returns Attribute value, or undefined when the attribute is absent.
 */
export function localAttribute(element: Element, localName: string): string | undefined {
  for (const item of element.attributes) {
    if (item.localName === localName) return item.value;
  }
  return undefined;
}

/**
 * Concatenates text from descendants matching a local element name.
 *
 * @param root - Parent node whose descendant text is collected.
 * @param localName - Namespace-independent element name to match.
 * @returns Concatenated text content in document order.
 */
export function textFromElements(root: ParentNode, localName = "t"): string {
  return elementsByLocalName(root, localName)
    .map((element) => element.textContent ?? "")
    .join("");
}
