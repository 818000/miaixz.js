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

import { useId, useMemo, useState } from "react";

import { useMiaixzLocale } from "../../i18n/index.js";
import { classNames } from "../../shared/class-names.js";
import { Radio } from "../radio/index.js";
import { Search } from "../search/index.js";
import type { LocalePickerProps } from "./locale-picker.types.js";

/**
 * Renders a searchable single-select locale catalog.
 *
 * @param props - Locale descriptors, selection, and change handler.
 * @returns Search field and filtered language choices.
 * @public
 */
export function LocalePicker(props: LocalePickerProps) {
  const { locales, locale, onLocaleChange, disabled = false, className, ...rest } = props;
  const { t } = useMiaixzLocale();
  const [query, setQuery] = useState("");
  const [pendingLocale, setPendingLocale] = useState<string>();
  const radioName = `miaixz-locale-picker-${useId()}`;
  const displayNames = useMemo(() => createDisplayNames(locale), [locale]);
  const choices = useMemo(
    () =>
      locales.map((descriptor) => ({
        descriptor,
        localizedLabel: displayNames?.of(descriptor.id) ?? descriptor.label,
      })),
    [displayNames, locales],
  );
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  const filtered = choices.filter(({ descriptor, localizedLabel }) => {
    if (normalizedQuery.length === 0) return true;
    const searchable = [
      descriptor.id,
      descriptor.label,
      descriptor.shortLabel,
      localizedLabel,
      ...descriptor.keywords,
    ]
      .join(" ")
      .toLocaleLowerCase(locale);
    return searchable.includes(normalizedQuery);
  });
  const busy = pendingLocale !== undefined;

  return (
    <div
      {...rest}
      aria-busy={busy || undefined}
      className={classNames("miaixz-locale-picker", className)}
    >
      <Search
        aria-label={t("ui.appearance.language.search")}
        autoComplete="off"
        clearable
        onValueChange={setQuery}
        placeholder={t("ui.appearance.language.search")}
        value={query}
      />
      <div className="miaixz-locale-picker-list">
        {filtered.map(({ descriptor, localizedLabel }) => {
          const selected = descriptor.id === locale;
          const secondaryLabel =
            localizedLabel === descriptor.label ? descriptor.id : localizedLabel;
          return (
            <Radio
              key={descriptor.id}
              checked={selected}
              className="miaixz-locale-picker-option"
              disabled={disabled || busy}
              label={
                <span className="miaixz-locale-picker-option-layout">
                  <span aria-hidden="true" className="miaixz-locale-picker-short-label">
                    {descriptor.shortLabel}
                  </span>
                  <span className="miaixz-locale-picker-copy">
                    <span className="miaixz-locale-picker-native-label">{descriptor.label}</span>
                    <span className="miaixz-locale-picker-localized-label">{secondaryLabel}</span>
                  </span>
                </span>
              }
              name={radioName}
              onChange={() => {
                if (selected || busy) return;
                setPendingLocale(descriptor.id);
                void Promise.resolve(onLocaleChange(descriptor.id))
                  .catch(() => undefined)
                  .finally(() => setPendingLocale(undefined));
              }}
              value={descriptor.id}
            />
          );
        })}
        {filtered.length === 0 ? (
          <p className="miaixz-locale-picker-empty">{t("ui.appearance.language.empty")}</p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Creates a language-name formatter for the active locale.
 *
 * @param locale - Active interface locale.
 * @returns Language display-name formatter when supported.
 */
function createDisplayNames(locale: string): Intl.DisplayNames | undefined {
  try {
    return new Intl.DisplayNames([locale], { type: "language", languageDisplay: "standard" });
  } catch {
    return undefined;
  }
}
