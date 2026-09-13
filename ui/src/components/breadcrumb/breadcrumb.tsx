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

/* eslint-disable jsdoc/require-jsdoc, react-hooks/refs --
 * Slot ref composition is centralized and public contracts live in the type module.
 */
import { forwardRef } from "react";

import { useMiaixzLocale } from "../../i18n/i18n.js";
import { MiaixzUiError } from "../../errors/ui-error.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type {
  BreadcrumbEntry,
  BreadcrumbOwnerState,
  BreadcrumbProps,
  BreadcrumbSlotProps,
} from "./breadcrumb.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

const ownerState: BreadcrumbOwnerState = {};

/*
 * Renders localized hierarchical navigation from one declarative item source. @public
 */
export const Breadcrumb = withMiaixzThemeComponent(
  "Breadcrumb",
  forwardRef<HTMLElement, BreadcrumbProps>(function Breadcrumb(
    { label, items, slotProps, ...props },
    ref,
  ) {
    const { t } = useMiaixzLocale();
    const ids = new Set<string>();
    for (const item of items) {
      if (ids.has(item.id)) {
        throw new MiaixzUiError({
          code: "UI_COLLECTION_DUPLICATE_ID",
          details: { id: item.id },
        });
      }
      ids.add(item.id);
    }
    return (
      <nav
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-breadcrumb" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: { "aria-label": label ?? t("ui.breadcrumb.label") },
          ownedProps: ["aria-label"],
        })}
      >
        <ol
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-breadcrumb-list" },
            slotProps: slotProps?.list,
          })}
        >
          {items.map((item) => (
            <BreadcrumbEntryView entry={item} key={item.id} slotProps={slotProps} />
          ))}
        </ol>
      </nav>
    );
  }),
);

function BreadcrumbEntryView({
  entry,
  slotProps,
}: {
  readonly entry: BreadcrumbEntry;
  readonly slotProps: BreadcrumbSlotProps | undefined;
}) {
  const content = (
    <>
      {entry.icon !== undefined && (
        <span
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-breadcrumb-icon" },
            slotProps: slotProps?.icon,
          })}
        >
          {entry.icon}
        </span>
      )}
      <span
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-breadcrumb-label" },
          slotProps: slotProps?.label,
        })}
      >
        {entry.label}
      </span>
    </>
  );
  return (
    <li
      {...mergeMiaixzSlotProps({
        ownerState,
        defaultProps: { className: "miaixz-breadcrumb-item" },
        slotProps: slotProps?.item,
      })}
    >
      {entry.current ? (
        <span
          {...entry.spanProps}
          aria-current="page"
          className={
            entry.spanProps?.className === undefined
              ? "miaixz-breadcrumb-current"
              : `miaixz-breadcrumb-current ${entry.spanProps.className}`
          }
        >
          {content}
        </span>
      ) : (
        <a
          {...entry.anchorProps}
          className={
            entry.anchorProps?.className === undefined
              ? "miaixz-breadcrumb-link"
              : `miaixz-breadcrumb-link ${entry.anchorProps.className}`
          }
          href={entry.href}
        >
          {content}
        </a>
      )}
    </li>
  );
}
