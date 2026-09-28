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
 * Provides an inert, Worker-safe XML tree and namespace-independent query helpers.
 */

import { ViewerError } from "../../shared/errors/viewer-error.js";

/**
 * Represents one decoded XML attribute without exposing browser DOM objects.
 */
export interface XmlAttribute {
  readonly name: string;
  readonly localName: string;
  readonly value: string;
}

/**
 * Represents one immutable XML element that can be structured-cloned in a Worker.
 */
export interface XmlElement {
  readonly name: string;
  readonly localName: string;
  readonly attributes: readonly XmlAttribute[];
  readonly children: readonly XmlElement[];
  readonly ownText: string;
  readonly textContent: string;
}

/**
 * Represents one parsed XML document.
 */
export interface XmlDocument {
  readonly documentElement: XmlElement;
}

interface MutableXmlElement {
  readonly name: string;
  readonly localName: string;
  readonly attributes: XmlAttribute[];
  readonly children: MutableXmlElement[];
  readonly content: (MutableXmlElement | string)[];
}

/**
 * Returns the namespace-independent suffix of one qualified XML name.
 *
 * @param name - Qualified element or attribute name.
 * @returns Local name after the final namespace separator.
 */
function localName(name: string): string {
  return name.includes(":") ? (name.split(":").at(-1) ?? name) : name;
}

/**
 * Decodes predefined and numeric XML character references.
 *
 * @param value - Untrusted attribute or text value.
 * @returns Decoded Unicode string.
 */
function decodeEntities(value: string): string {
  return value.replaceAll(/&(?:#x[\da-f]+|#\d+|amp|apos|gt|lt|quot);/giu, (entity) => {
    if (entity === "&amp;") return "&";
    if (entity === "&apos;") return "'";
    if (entity === "&gt;") return ">";
    if (entity === "&lt;") return "<";
    if (entity === "&quot;") return '"';
    const hexadecimal = entity.slice(0, 3).toLowerCase() === "&#x";
    const source = entity.slice(hexadecimal ? 3 : 2, -1);
    const codePoint = Number.parseInt(source, hexadecimal ? 16 : 10);
    if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff) {
      throw new ViewerError("PARSE_FAILED", "parse");
    }
    return String.fromCodePoint(codePoint);
  });
}

/**
 * Rejects unresolved entity-like text after supported references are decoded.
 *
 * @param value - Decoded text candidate.
 * @returns Validated decoded text.
 */
function decoded(value: string): string {
  const result = decodeEntities(value);
  if (/&[\w#][^;\s<]*;/u.test(result)) throw new ViewerError("PARSE_FAILED", "parse");
  return result;
}

/**
 * Finds a tag terminator while respecting quoted attribute values.
 *
 * @param source - Complete XML source.
 * @param start - First character after the opening angle bracket.
 * @returns Offset of the closing angle bracket.
 */
function tagEnd(source: string, start: number): number {
  let quote: '"' | "'" | undefined;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (quote === undefined && (character === '"' || character === "'")) quote = character;
    else if (quote === character) quote = undefined;
    else if (quote === undefined && character === ">") return index;
  }
  throw new ViewerError("PARSE_FAILED", "parse");
}

/**
 * Parses the name and attributes from one opening tag.
 *
 * @param value - Tag content without angle brackets.
 * @returns Mutable element shell and whether the element is self-closing.
 */
function openingTag(value: string): {
  readonly element: MutableXmlElement;
  readonly selfClosing: boolean;
} {
  let source = value.trim();
  const selfClosing = source.endsWith("/");
  if (selfClosing) source = source.slice(0, -1).trimEnd();
  let offset = 0;
  while (offset < source.length && !/\s/u.test(source[offset] ?? "")) offset += 1;
  const name = source.slice(0, offset);
  if (!/^[A-Za-z_][\w.:-]*$/u.test(name)) throw new ViewerError("PARSE_FAILED", "parse");
  const attributes: XmlAttribute[] = [];
  while (offset < source.length) {
    while (/\s/u.test(source[offset] ?? "")) offset += 1;
    if (offset >= source.length) break;
    const nameStart = offset;
    while (offset < source.length && !/[\s=]/u.test(source[offset] ?? "")) offset += 1;
    const attributeName = source.slice(nameStart, offset);
    if (!/^[A-Za-z_][\w.:-]*$/u.test(attributeName)) {
      throw new ViewerError("PARSE_FAILED", "parse");
    }
    while (/\s/u.test(source[offset] ?? "")) offset += 1;
    if (source[offset] !== "=") throw new ViewerError("PARSE_FAILED", "parse");
    offset += 1;
    while (/\s/u.test(source[offset] ?? "")) offset += 1;
    const quote = source[offset];
    if (quote !== '"' && quote !== "'") throw new ViewerError("PARSE_FAILED", "parse");
    offset += 1;
    const valueStart = offset;
    while (offset < source.length && source[offset] !== quote) offset += 1;
    if (offset >= source.length) throw new ViewerError("PARSE_FAILED", "parse");
    attributes.push({
      name: attributeName,
      localName: localName(attributeName),
      value: decoded(source.slice(valueStart, offset)),
    });
    offset += 1;
  }
  return {
    element: { name, localName: localName(name), attributes, children: [], content: [] },
    selfClosing,
  };
}

/**
 * Freezes one mutable XML tree into a structured-clone-safe public tree.
 *
 * @param element - Mutable parse node.
 * @returns Immutable XML element.
 */
function finalize(element: MutableXmlElement): XmlElement {
  const children = element.children.map((child) => finalize(child));
  const ownText = element.content
    .filter((item): item is string => typeof item === "string")
    .join("");
  let childIndex = 0;
  const textContent = element.content
    .map((item) => (typeof item === "string" ? item : (children[childIndex++]?.textContent ?? "")))
    .join("");
  return {
    name: element.name,
    localName: element.localName,
    attributes: element.attributes,
    children,
    ownText,
    textContent,
  };
}

/**
 * Parses inert XML without browser DOM APIs while rejecting declarations and excessive trees.
 *
 * @param source - Untrusted XML source text.
 * @param maxNodes - Maximum number of elements allowed in the parsed document.
 * @param maxDepth - Maximum nesting depth allowed in the parsed document.
 * @returns Parsed XML document that is safe to use in a module Worker.
 */
export function parseXmlDocument(source: string, maxNodes: number, maxDepth = 128): XmlDocument {
  if (/<!DOCTYPE|<!ENTITY/iu.test(source)) throw new ViewerError("PARSE_FAILED", "parse");
  const stack: MutableXmlElement[] = [];
  let root: MutableXmlElement | undefined;
  let nodeCount = 0;
  let offset = 0;
  while (offset < source.length) {
    const opening = source.indexOf("<", offset);
    if (opening < 0) {
      const tail = source.slice(offset);
      if (tail.trim() !== "") {
        const parent = stack.at(-1);
        if (parent === undefined) throw new ViewerError("PARSE_FAILED", "parse");
        parent.content.push(decoded(tail));
      }
      break;
    }
    if (opening > offset) {
      const text = source.slice(offset, opening);
      if (text.trim() !== "") {
        const parent = stack.at(-1);
        if (parent === undefined) throw new ViewerError("PARSE_FAILED", "parse");
        parent.content.push(decoded(text));
      }
    }
    if (source.startsWith("<!--", opening)) {
      const end = source.indexOf("-->", opening + 4);
      if (end < 0) throw new ViewerError("PARSE_FAILED", "parse");
      offset = end + 3;
      continue;
    }
    if (source.startsWith("<?", opening)) {
      const end = source.indexOf("?>", opening + 2);
      if (end < 0) throw new ViewerError("PARSE_FAILED", "parse");
      offset = end + 2;
      continue;
    }
    if (source.startsWith("<![CDATA[", opening)) {
      const end = source.indexOf("]]>", opening + 9);
      if (end < 0) throw new ViewerError("PARSE_FAILED", "parse");
      stack.at(-1)?.content.push(source.slice(opening + 9, end));
      offset = end + 3;
      continue;
    }
    const end = tagEnd(source, opening + 1);
    const tag = source.slice(opening + 1, end).trim();
    if (tag.startsWith("!")) throw new ViewerError("PARSE_FAILED", "parse");
    if (tag.startsWith("/")) {
      const name = tag.slice(1).trim();
      const current = stack.pop();
      if (current === undefined || current.name !== name) {
        throw new ViewerError("PARSE_FAILED", "parse");
      }
    } else {
      const parsed = openingTag(tag);
      nodeCount += 1;
      if (nodeCount > maxNodes || stack.length + 1 > maxDepth) {
        throw new ViewerError("RESOURCE_LIMIT_EXCEEDED", "parse");
      }
      const parent = stack.at(-1);
      if (parent === undefined) {
        if (root !== undefined) throw new ViewerError("PARSE_FAILED", "parse");
        root = parsed.element;
      } else {
        parent.children.push(parsed.element);
        parent.content.push(parsed.element);
      }
      if (!parsed.selfClosing) stack.push(parsed.element);
    }
    offset = end + 1;
  }
  if (root === undefined || stack.length > 0) throw new ViewerError("PARSE_FAILED", "parse");
  return { documentElement: finalize(root) };
}

/**
 * Returns all descendant elements in document order.
 *
 * @param root - Document or element whose descendants are traversed.
 * @returns Descendant elements, excluding the root element itself.
 */
export function allElements(root: XmlDocument | XmlElement): XmlElement[] {
  const result: XmlElement[] = [];
  const visit = (element: XmlElement): void => {
    for (const child of element.children) {
      result.push(child);
      visit(child);
    }
  };
  visit("documentElement" in root ? root.documentElement : root);
  return result;
}

/**
 * Returns all descendants with a namespace-independent local name.
 *
 * @param root - Parent tree whose descendants are searched.
 * @param name - Namespace-independent element name to match.
 * @returns Matching descendant elements in document order.
 */
export function elementsByLocalName(root: XmlDocument | XmlElement, name: string): XmlElement[] {
  return allElements(root).filter((element) => element.localName === name);
}

/**
 * Returns the first descendant with a namespace-independent local name.
 *
 * @param root - Parent tree whose descendants are searched.
 * @param name - Namespace-independent element name to match.
 * @returns First matching element, or undefined when no match exists.
 */
export function firstElementByLocalName(
  root: XmlDocument | XmlElement,
  name: string,
): XmlElement | undefined {
  return elementsByLocalName(root, name)[0];
}

/**
 * Reads one namespace-independent attribute.
 *
 * @param element - Element whose attributes are inspected.
 * @param name - Namespace-independent attribute name to match.
 * @returns Attribute value, or undefined when the attribute is absent.
 */
export function localAttribute(element: XmlElement, name: string): string | undefined {
  return element.attributes.find((item) => item.localName === name)?.value;
}

/**
 * Concatenates text from descendants matching a local element name.
 *
 * @param root - Parent tree whose descendant text is collected.
 * @param name - Namespace-independent element name to match.
 * @returns Concatenated text content in document order.
 */
export function textFromElements(root: XmlDocument | XmlElement, name = "t"): string {
  return elementsByLocalName(root, name)
    .map((element) => element.textContent)
    .join("");
}
