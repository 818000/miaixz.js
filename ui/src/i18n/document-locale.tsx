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

import { useEffect, useRef } from "react";

import { MiaixzUiError } from "../errors/ui-error.js";
import { useMiaixzLocale } from "./i18n.js";

/* eslint-disable jsdoc/require-jsdoc -- Closed internal ownership records are self-describing.
 */

const documentLocaleOwners = new WeakMap<Document, symbol>();

interface ControlledDocumentLocale {
  lang: string;
  dir: string;
}

interface PreviousDocumentLocale {
  lang: string | null;
  dir: string | null;
}

/**
 * Owns the root document language attributes for one application shell.
 *
 * This component must be rendered inside `MiaixzLocaleProvider`. Micro-frontends should set
 * language attributes on their existing host element instead of mounting a document owner.
 *
 * @returns No rendered DOM.
 * @public
 */
export function MiaixzDocumentLocale(): null {
  const { locale, locales } = useMiaixzLocale();
  const direction = locales.find((definition) => definition.id === locale)?.direction ?? "ltr";
  const owner = useRef(Symbol("MiaixzDocumentLocale"));
  const controlled = useRef<ControlledDocumentLocale | undefined>(undefined);
  const previous = useRef<PreviousDocumentLocale | undefined>(undefined);

  useEffect(() => {
    const ownerToken = owner.current;
    const currentOwner = documentLocaleOwners.get(document);
    if (currentOwner !== undefined && currentOwner !== ownerToken) {
      throw new MiaixzUiError({ code: "UI_LOCALE_GLOBAL_DUPLICATE" });
    }

    const root = document.documentElement;
    previous.current = {
      lang: root.getAttribute("lang"),
      dir: root.getAttribute("dir"),
    };
    documentLocaleOwners.set(document, ownerToken);

    return () => {
      if (documentLocaleOwners.get(document) !== ownerToken) return;
      const current = controlled.current;
      const initial = previous.current;
      if (current !== undefined && initial !== undefined) {
        if (root.getAttribute("lang") === current.lang)
          restoreAttribute(root, "lang", initial.lang);
        if (root.getAttribute("dir") === current.dir) restoreAttribute(root, "dir", initial.dir);
      }
      documentLocaleOwners.delete(document);
      controlled.current = undefined;
      previous.current = undefined;
    };
  }, []);

  useEffect(() => {
    if (documentLocaleOwners.get(document) !== owner.current) return;
    const next = { lang: locale, dir: direction };
    const root = document.documentElement;
    root.setAttribute("lang", next.lang);
    root.setAttribute("dir", next.dir);
    controlled.current = next;
  }, [direction, locale]);

  return null;
}

/**
 * Restores an attribute to its exact pre-owner state.
 *
 * @param element - Document root controlled by the owner.
 * @param name - Language attribute to restore.
 * @param value - Original attribute value, or null when absent.
 */
function restoreAttribute(element: HTMLElement, name: "lang" | "dir", value: string | null): void {
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}
