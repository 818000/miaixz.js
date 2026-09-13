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

import { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { useMiaixzLocale } from "../../i18n/i18n.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { Radio } from "../radio/radio.js";
import { Search } from "../search/search.js";
import type { LocaleOwnerState, LocaleProps } from "./locale.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/**
 * Renders the sole searchable locale catalog and latest-request state machine.
 */
export const Locale = withMiaixzThemeComponent(
  "Locale",
  forwardRef<HTMLDivElement, LocaleProps>(function Locale(props, ref) {
    const {
      locales,
      locale,
      onLocaleChange,
      onError,
      disabled = false,
      slotProps,
      ...rootNativeProps
    } = props;
    const { t } = useMiaixzLocale();
    const [query, setQuery] = useState("");
    const [selectedLocale, setSelectedLocale] = useState(locale);
    const [pendingLocale, setPendingLocale] = useState<string>();
    const [error, setError] = useState<MiaixzUiError>();
    const requestSequenceRef = useRef(0);
    const mountedRef = useRef(true);
    const lastSuccessfulLocaleRef = useRef(locale);
    const radioName = `miaixz-locale-${useId()}`;
    useEffect(() => {
      if (pendingLocale === undefined) {
        lastSuccessfulLocaleRef.current = locale;
        setSelectedLocale(locale);
      }
    }, [locale, pendingLocale]);
    useEffect(
      () => () => {
        mountedRef.current = false;
        requestSequenceRef.current += 1;
      },
      [],
    );
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
      return [
        descriptor.id,
        descriptor.label,
        descriptor.shortLabel,
        localizedLabel,
        ...descriptor.keywords,
      ]
        .join(" ")
        .toLocaleLowerCase(locale)
        .includes(normalizedQuery);
    });
    const pending = pendingLocale !== undefined;
    const ownerState: LocaleOwnerState = {
      disabled,
      pending,
      hasError: error !== undefined,
    };
    const rootProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-locale" },
      componentProps: rootNativeProps,
      slotProps: slotProps?.root,
      forwardedRef: ref,
      internalProps: { ...(pending ? { "aria-busy": true } : {}) },
      ownedProps: ["aria-busy"],
    });
    const searchProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-locale-search" },
      slotProps: slotProps?.search,
    });
    const listProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-locale-list" },
      slotProps: slotProps?.list,
    });
    const optionProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-locale-option" },
      slotProps: slotProps?.option,
    });
    const emptyProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-locale-empty" },
      slotProps: slotProps?.empty,
    });
    const errorProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-locale-error" },
      slotProps: slotProps?.error,
      internalProps: { role: "alert" },
      ownedProps: ["role"],
    });

    const selectLocale = (nextLocale: string): void => {
      if (disabled || nextLocale === selectedLocale) return;
      requestSequenceRef.current += 1;
      const requestSequence = requestSequenceRef.current;
      const previousLocale = lastSuccessfulLocaleRef.current;
      setSelectedLocale(nextLocale);
      setPendingLocale(nextLocale);
      setError(undefined);
      void Promise.resolve(onLocaleChange(nextLocale)).then(
        () => {
          if (!mountedRef.current || requestSequence !== requestSequenceRef.current) return;
          lastSuccessfulLocaleRef.current = nextLocale;
          setSelectedLocale(nextLocale);
          setPendingLocale(undefined);
        },
        (cause: unknown) => {
          if (!mountedRef.current || requestSequence !== requestSequenceRef.current) return;
          const nextError = new MiaixzUiError({
            code: "UI_LOCALE_UPDATE_FAILED",
            cause,
          });
          setSelectedLocale(previousLocale);
          setPendingLocale(undefined);
          setError(nextError);
          onError?.(nextError);
        },
      );
    };

    return (
      <div {...rootProps}>
        <div {...searchProps}>
          <Search
            aria-label={t("ui.appearance.language.search")}
            autoComplete="off"
            clearable
            onValueChange={setQuery}
            placeholder={t("ui.appearance.language.search")}
            value={query}
          />
        </div>
        <div {...listProps}>
          {filtered.map(({ descriptor, localizedLabel }) => {
            const selected = descriptor.id === selectedLocale;
            const secondaryLabel =
              localizedLabel === descriptor.label ? descriptor.id : localizedLabel;
            return (
              <div {...optionProps} key={descriptor.id}>
                <Radio
                  checked={selected}
                  disabled={disabled || pending}
                  label={
                    <span className="miaixz-locale-option-layout">
                      <span aria-hidden="true" className="miaixz-locale-short-label">
                        {descriptor.shortLabel}
                      </span>
                      <span className="miaixz-locale-copy">
                        <span className="miaixz-locale-native-label">{descriptor.label}</span>
                        <span className="miaixz-locale-localized-label">{secondaryLabel}</span>
                      </span>
                    </span>
                  }
                  name={radioName}
                  onChange={() => selectLocale(descriptor.id)}
                  value={descriptor.id}
                />
              </div>
            );
          })}
          {filtered.length === 0 ? (
            <p {...emptyProps}>{t("ui.appearance.language.empty")}</p>
          ) : null}
        </div>
        {error === undefined ? null : <div {...errorProps}>{error.message}</div>}
      </div>
    );
  }),
);

/**
 * Creates a language-name formatter for the active locale.
 *
 * @param locale - Active interface locale.
 * @returns A formatter when supported by the runtime.
 */
function createDisplayNames(locale: string): Intl.DisplayNames | undefined {
  try {
    return new Intl.DisplayNames([locale], { type: "language", languageDisplay: "standard" });
  } catch {
    return undefined;
  }
}
