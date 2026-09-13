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

/* eslint-disable jsdoc/require-jsdoc -- Public editor contracts live in editor.types.
 */
import { createContext, createElement, forwardRef, useContext } from "react";

import { classNames } from "../../shared/class-names.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { Grid } from "../grid/grid.js";
import { Panel } from "../panel/panel.js";
import { Scroll } from "../scroll/scroll.js";
import { Status } from "../status/status.js";
import type {
  EditorActionsProps,
  EditorBoxProps,
  EditorFieldsProps,
  EditorFieldsetProps,
  EditorGroupOwnerState,
  EditorGroupProps,
  EditorLayoutOwnerState,
  EditorLayoutProps,
  EditorOverviewOwnerState,
  EditorOverviewProps,
  EditorPickerProps,
  EditorSectionOwnerState,
  EditorSectionProps,
  EditorStatusProps,
  EditorSummaryOwnerState,
  EditorSummaryProps,
} from "./editor.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

const EditorSectionHeadingContext = createContext<1 | 2 | 3 | 4 | 5 | 6 | null>(null);

export const EditorFieldset = withMiaixzThemeComponent(
  "EditorFieldset",
  forwardRef<HTMLFieldSetElement, EditorFieldsetProps>(function EditorFieldset(
    { legend, emphasis = "default", className, children, ...props },
    ref,
  ) {
    return (
      <fieldset
        {...props}
        ref={ref}
        className={classNames("miaixz-editor-fieldset", className)}
        data-emphasis={emphasis}
      >
        <legend>{legend}</legend>
        {children}
      </fieldset>
    );
  }),
);

export const EditorLayout = withMiaixzThemeComponent(
  "EditorLayout",
  forwardRef<HTMLDivElement, EditorLayoutProps>(function EditorLayout(
    { summary, layout = "split", divided = false, slotProps, className, children, ...props },
    ref,
  ) {
    const ownerState: EditorLayoutOwnerState = { layout, divided };
    return (
      <div
        {...props}
        ref={ref}
        className={classNames("miaixz-editor-layout", className)}
        data-layout={layout}
        data-divided={divided || undefined}
      >
        <div
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-editor-layout-summary" },
            slotProps: slotProps?.summary,
          })}
        >
          {summary}
        </div>
        <div
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-editor-layout-content" },
            slotProps: slotProps?.content,
          })}
        >
          {children}
        </div>
      </div>
    );
  }),
);

export const EditorSummary = withMiaixzThemeComponent(
  "EditorSummary",
  forwardRef<HTMLElement, EditorSummaryProps>(function EditorSummary(
    {
      avatar,
      title,
      subtitle,
      status,
      items,
      footer,
      headingLevel = 3,
      slotProps,
      className,
      ...props
    },
    ref,
  ) {
    const ownerState: EditorSummaryOwnerState = { headingLevel };
    return (
      <aside {...props} ref={ref} className={classNames("miaixz-editor-summary", className)}>
        <div
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-editor-summary-avatar" },
            slotProps: slotProps?.avatar,
          })}
        >
          {avatar}
        </div>
        {createElement(
          `h${headingLevel}`,
          mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-editor-summary-title" },
            slotProps: slotProps?.title,
          }),
          title,
        )}
        <div
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-editor-summary-subtitle" },
            slotProps: slotProps?.subtitle,
          })}
        >
          {subtitle}
        </div>
        {status !== undefined && (
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-editor-summary-status" },
              slotProps: slotProps?.status,
            })}
          >
            {status}
          </div>
        )}
        <dl
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-editor-summary-facts" },
            slotProps: slotProps?.facts,
          })}
        >
          {items.map((item) => (
            <div key={item.id}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
        {footer !== undefined && (
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-editor-summary-footer" },
              slotProps: slotProps?.footer,
            })}
          >
            {footer}
          </div>
        )}
      </aside>
    );
  }),
);

export const EditorSection = withMiaixzThemeComponent(
  "EditorSection",
  forwardRef<HTMLElement, EditorSectionProps>(function EditorSection(
    {
      title,
      description,
      accessory,
      headingLevel = 2,
      surface = "plain",
      layout = "single",
      slotProps,
      className,
      children,
      ...props
    },
    ref,
  ) {
    const ownerState: EditorSectionOwnerState = { surface, layout, headingLevel };
    return (
      <section
        {...props}
        ref={ref}
        className={classNames("miaixz-editor-section", className)}
        data-surface={surface}
        data-layout={layout}
      >
        <header
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-editor-section-header" },
            slotProps: slotProps?.header,
          })}
        >
          <div>
            {createElement(`h${headingLevel}`, {}, title)}
            {description !== undefined && (
              <div
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-editor-section-description" },
                  slotProps: slotProps?.description,
                })}
              >
                {description}
              </div>
            )}
          </div>
          {accessory}
        </header>
        <EditorSectionHeadingContext.Provider value={headingLevel}>
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-editor-section-body" },
              slotProps: slotProps?.body,
            })}
          >
            {children}
          </div>
        </EditorSectionHeadingContext.Provider>
      </section>
    );
  }),
);

export const EditorFields = withMiaixzThemeComponent(
  "EditorFields",
  forwardRef<HTMLDivElement, EditorFieldsProps>(function EditorFields(props, ref) {
    return <Grid {...props} ref={ref} />;
  }),
);

export const EditorActions = withMiaixzThemeComponent(
  "EditorActions",
  forwardRef<HTMLDivElement, EditorActionsProps>(function EditorActions(
    { className, ...props },
    ref,
  ) {
    return <div {...props} ref={ref} className={classNames("miaixz-editor-actions", className)} />;
  }),
);

export const EditorBox = withMiaixzThemeComponent(
  "EditorBox",
  forwardRef<HTMLElement, EditorBoxProps>(function EditorBox({ className, ...props }, ref) {
    return (
      <Panel
        {...props}
        ref={ref}
        as="div"
        className={classNames("miaixz-editor-box", className)}
        surface="filled"
        frame="outlined"
        density="compact"
      />
    );
  }),
);

export const EditorGroup = withMiaixzThemeComponent(
  "EditorGroup",
  forwardRef<HTMLElement, EditorGroupProps>(function EditorGroup(
    {
      title,
      description,
      accessory,
      headingLevel: explicitLevel,
      slotProps,
      className,
      children,
      ...props
    },
    ref,
  ) {
    const sectionLevel = useContext(EditorSectionHeadingContext);
    const headingLevel =
      explicitLevel ?? (sectionLevel === null ? 3 : Math.min(6, sectionLevel + 1));
    const ownerState: EditorGroupOwnerState = {
      headingLevel: headingLevel as 1 | 2 | 3 | 4 | 5 | 6,
    };
    return (
      <section {...props} ref={ref} className={classNames("miaixz-editor-group", className)}>
        <header
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-editor-group-header" },
            slotProps: slotProps?.header,
          })}
        >
          <div>
            {createElement(`h${ownerState.headingLevel}`, {}, title)}
            {description !== undefined && (
              <div
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-editor-group-description" },
                  slotProps: slotProps?.description,
                })}
              >
                {description}
              </div>
            )}
          </div>
          {accessory}
        </header>
        <div
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-editor-group-options" },
            slotProps: slotProps?.options,
          })}
        >
          {children}
        </div>
      </section>
    );
  }),
);

export const EditorOverview = withMiaixzThemeComponent(
  "EditorOverview",
  forwardRef<HTMLDivElement, EditorOverviewProps>(function EditorOverview(
    { items, density = "compact", slotProps, className, ...props },
    ref,
  ) {
    const rootState: EditorOverviewOwnerState = { density, itemId: undefined };
    return (
      <div
        {...props}
        ref={ref}
        className={classNames("miaixz-editor-overview", className)}
        data-density={density}
      >
        {items.map((item) => {
          const ownerState = { ...rootState, itemId: item.id };
          return (
            <div
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-editor-overview-item" },
                slotProps: slotProps?.item,
              })}
              key={item.id}
            >
              <span
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-editor-overview-label" },
                  slotProps: slotProps?.label,
                })}
              >
                {item.label}
              </span>
              <span
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-editor-overview-value" },
                  slotProps: slotProps?.value,
                })}
              >
                {item.value}
              </span>
              {item.description !== undefined && (
                <div
                  {...mergeMiaixzSlotProps({
                    ownerState,
                    defaultProps: { className: "miaixz-editor-overview-description" },
                    slotProps: slotProps?.description,
                  })}
                >
                  {item.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }),
);

export const EditorPicker = withMiaixzThemeComponent(
  "EditorPicker",
  forwardRef<HTMLElement, EditorPickerProps>(function EditorPicker(
    { children, className, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, ...props },
    ref,
  ) {
    return (
      <Panel
        {...props}
        ref={ref}
        as="div"
        className={classNames("miaixz-editor-picker", className)}
        surface="plain"
        frame="outlined"
        density="compact"
      >
        <Scroll
          focusable="auto"
          {...(ariaLabel === undefined
            ? { "aria-labelledby": ariaLabelledBy! }
            : { "aria-label": ariaLabel })}
          className="miaixz-editor-picker-scroll"
        >
          {children}
        </Scroll>
      </Panel>
    );
  }),
);

export const EditorStatus = withMiaixzThemeComponent(
  "EditorStatus",
  forwardRef<HTMLDivElement, EditorStatusProps>(function EditorStatus(
    { tone, label, className, children, ...props },
    ref,
  ) {
    return (
      <div {...props} ref={ref} className={classNames("miaixz-editor-status", className)}>
        <Status tone={tone} label={label}>
          {children}
        </Status>
      </div>
    );
  }),
);
