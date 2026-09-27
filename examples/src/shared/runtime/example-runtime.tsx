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

import { createMiaixzAppearanceManager } from "@miaixz/sdk/appearance";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { Appearance, MiaixzDocumentLocale, MiaixzLocaleProvider, Theme } from "@miaixz/ui";
import { useEffect, type ReactNode } from "react";

const localeStorageKey = "miaixz.examples.locale";
const appearanceStorageKey = "miaixz:v1:global:miaixz-examples:appearance";
const initialLocale = window.localStorage.getItem(localeStorageKey) === "zh-CN" ? "zh-CN" : "en-US";
const hasStoredAppearance = window.localStorage.getItem(appearanceStorageKey) !== null;

const appearance = createMiaixzAppearanceManager({
  appId: "miaixz-examples",
  storage: {
    getItem: (key) => window.localStorage.getItem(key),
    removeItem: (key) => window.localStorage.removeItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
  },
});

if (!hasStoredAppearance) appearance.setColorMode("light");

const i18n = createMiaixzI18n({
  fallbackLocale: "en-US",
  locale: initialLocale,
});

export interface ExampleRuntimeProps {
  readonly children: ReactNode;
}

function RuntimeEffects() {
  useEffect(
    () =>
      i18n.subscribe((snapshot) => {
        window.localStorage.setItem(localeStorageKey, snapshot.locale);
      }),
    [],
  );

  return null;
}

/**
 * Connects the examples application to the same theme, locale, and Appearance runtimes as Miaixz.
 */
export function ExampleRuntime({ children }: ExampleRuntimeProps) {
  return (
    <MiaixzLocaleProvider i18n={i18n}>
      <MiaixzDocumentLocale />
      <Theme appearance={appearance} fallback="miaixz">
        <RuntimeEffects />
        {children}
        <Appearance scope="entry" />
      </Theme>
    </MiaixzLocaleProvider>
  );
}
