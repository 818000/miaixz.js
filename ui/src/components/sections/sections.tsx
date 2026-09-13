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

/* eslint-disable jsdoc/require-jsdoc --
 * Public Sections contracts are defined by the component type module.
 */
import { createElement, forwardRef, useId } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { useMiaixzLocale } from "../../i18n/i18n.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { SectionsOwnerState, SectionsProps } from "./sections.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/*
 * Displays named read-only collections with invariant list semantics. @public
 */
export const Sections = withMiaixzThemeComponent(
  "Sections",
  forwardRef<HTMLDivElement, SectionsProps>(function Sections(
    { sections, headingLevel = 3, layout = "rows", slotProps, ...props },
    ref,
  ) {
    validateSections(sections);
    const { t } = useMiaixzLocale();
    const baseId = `miaixz-sections-${useId()}`;
    const rootState: SectionsOwnerState = {
      layout,
      sectionId: undefined,
      itemId: undefined,
    };
    return (
      <div
        {...mergeMiaixzSlotProps({
          ownerState: rootState,
          defaultProps: { className: "miaixz-sections" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: { "data-layout": layout },
          ownedProps: ["data-layout"],
        })}
      >
        <div
          {...mergeMiaixzSlotProps({
            ownerState: rootState,
            defaultProps: { className: "miaixz-sections-grid" },
            slotProps: slotProps?.grid,
          })}
        >
          {sections.map((section, sectionIndex) => {
            const headingId = `${baseId}-heading-${sectionIndex}`;
            const sectionState: SectionsOwnerState = {
              layout,
              sectionId: section.id,
              itemId: undefined,
            };
            return (
              <section
                {...mergeMiaixzSlotProps({
                  ownerState: sectionState,
                  defaultProps: { className: "miaixz-sections-section" },
                  slotProps: slotProps?.section,
                  internalProps: { "aria-labelledby": headingId },
                  ownedProps: ["aria-labelledby"],
                })}
                key={section.id}
              >
                <header
                  {...mergeMiaixzSlotProps({
                    ownerState: sectionState,
                    defaultProps: { className: "miaixz-sections-header" },
                    slotProps: slotProps?.header,
                  })}
                >
                  {createElement(
                    `h${headingLevel}`,
                    mergeMiaixzSlotProps({
                      ownerState: sectionState,
                      defaultProps: { className: "miaixz-sections-heading" },
                      slotProps: slotProps?.heading,
                      internalProps: { id: headingId },
                      ownedProps: ["id"],
                    }),
                    section.label,
                  )}
                  {section.count !== undefined && (
                    <div
                      {...mergeMiaixzSlotProps({
                        ownerState: sectionState,
                        defaultProps: { className: "miaixz-sections-count" },
                        slotProps: slotProps?.count,
                      })}
                    >
                      {section.count}
                    </div>
                  )}
                </header>
                {section.items.length > 0 ? (
                  <ul
                    {...mergeMiaixzSlotProps({
                      ownerState: sectionState,
                      defaultProps: { className: "miaixz-sections-items" },
                      slotProps: slotProps?.items,
                    })}
                  >
                    {section.items.map((item) => {
                      const itemState: SectionsOwnerState = {
                        layout,
                        sectionId: section.id,
                        itemId: item.id,
                      };
                      return (
                        <li
                          {...mergeMiaixzSlotProps({
                            ownerState: itemState,
                            defaultProps: { className: "miaixz-sections-item" },
                            slotProps: slotProps?.item,
                          })}
                          key={item.id}
                        >
                          <div
                            {...mergeMiaixzSlotProps({
                              ownerState: itemState,
                              defaultProps: { className: "miaixz-sections-title" },
                              slotProps: slotProps?.title,
                            })}
                          >
                            {item.title}
                          </div>
                          {item.description !== undefined && (
                            <div
                              {...mergeMiaixzSlotProps({
                                ownerState: itemState,
                                defaultProps: { className: "miaixz-sections-description" },
                                slotProps: slotProps?.description,
                              })}
                            >
                              {item.description}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div
                    {...mergeMiaixzSlotProps({
                      ownerState: sectionState,
                      defaultProps: { className: "miaixz-sections-empty" },
                      slotProps: slotProps?.empty,
                    })}
                  >
                    {section.empty ?? t("ui.sections.empty")}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    );
  }),
);

function validateSections(sections: SectionsProps["sections"]): void {
  const sectionIds = new Set<string>();
  for (const section of sections) {
    if (sectionIds.has(section.id)) throwDuplicate(section.id);
    sectionIds.add(section.id);
    const itemIds = new Set<string>();
    for (const item of section.items) {
      if (itemIds.has(item.id)) throwDuplicate(item.id);
      itemIds.add(item.id);
    }
  }
}

function throwDuplicate(id: string): never {
  throw new MiaixzUiError({
    code: "UI_COLLECTION_DUPLICATE_ID",
    details: { id },
  });
}
