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

import { forwardRef } from "react";

import { classNames } from "../../shared/class-names.js";
import type {
  EditorPart,
  EditorFieldsProps,
  EditorActionsProps,
  EditorBoxProps,
  EditorFieldsetProps,
  EditorStatusProps,
  EditorGroupProps,
  EditorLayoutProps,
  EditorOverviewProps,
  EditorPickerProps,
  EditorSectionProps,
  EditorSummaryProps,
} from "./editor.types.js";

/**
 * Provides one shared native editor recipe without introducing content wrappers.
 *
 * @param part - Public editor part whose class recipe is required.
 * @param className - Optional consumer class appended to the recipe.
 * @returns A complete native editor class name.
 * @public
 */
export function getEditorClassName(part: EditorPart, className?: string): string {
  return classNames(`miaixz-editor-plain-${part}`, className);
}

/**
 * Renders an accessible compact group of fields.
 *
 * @public
 */
export const EditorFieldset = forwardRef<HTMLFieldSetElement, EditorFieldsetProps>(
  function EditorFieldset({ legend, emphasis = "default", className, children, ...props }, ref) {
    return (
      <fieldset
        {...props}
        ref={ref}
        className={classNames(
          "miaixz-editor-fieldset",
          emphasis === "strong" && "miaixz-editor-fieldset-strong",
          className,
        )}
      >
        <legend>{legend}</legend>
        {children}
      </fieldset>
    );
  },
);

/**
 * Renders the status strip beneath editor content.
 *
 * @public
 */
export const EditorStatus = forwardRef<HTMLElement, EditorStatusProps>(function EditorStatus(
  { className, ...props },
  ref,
) {
  return <footer {...props} ref={ref} className={classNames("miaixz-editor-status", className)} />;
});

/**
 * Creates a summary-and-form editor layout. @public
 */
export const EditorLayout = forwardRef<HTMLDivElement, EditorLayoutProps>(function EditorLayout(
  { summary, variant = "default", className, children, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={classNames(
        "miaixz-editor-layout",
        variant === "divided" && "miaixz-editor-layout-divided",
        className,
      )}
    >
      {summary}
      <div className="miaixz-editor-form">{children}</div>
    </div>
  );
});

/**
 * Renders the sticky identity summary for an editor. @public
 */
export const EditorSummary = forwardRef<HTMLElement, EditorSummaryProps>(function EditorSummary(
  { avatar, title, subtitle, status, items, footer, className, ...props },
  ref,
) {
  return (
    <aside {...props} ref={ref} className={classNames("miaixz-editor-summary", className)}>
      <div className="miaixz-editor-summary-avatar">{avatar}</div>
      <div className="miaixz-editor-summary-name">
        <h3>{title}</h3>
        <p>{subtitle}</p>
        {status}
      </div>
      <dl>
        {items.map((item, index) => (
          <div key={index}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
      {footer !== undefined && <div className="miaixz-editor-summary-footer">{footer}</div>}
    </aside>
  );
});

/**
 * Renders a titled form section with a reusable field grid. @public
 */
export const EditorSection = forwardRef<HTMLElement, EditorSectionProps>(function EditorSection(
  {
    title,
    description,
    accessory,
    layout = "default",
    variant = "default",
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <section
      {...props}
      ref={ref}
      className={classNames(
        variant === "default" ? "miaixz-editor-section" : `miaixz-editor-${variant}`,
        className,
      )}
    >
      <header>
        <div>
          <h3>{title}</h3>
          {description !== undefined && <p>{description}</p>}
        </div>
        {accessory}
      </header>
      {variant !== "default" ? (
        children
      ) : (
        <div className={classNames("miaixz-editor-section-body", `miaixz-editor-${layout}`)}>
          {children}
        </div>
      )}
    </section>
  );
});

/**
 * Groups fields without imposing business column counts.
 *
 * @public
 */
export const EditorFields = forwardRef<HTMLDivElement, EditorFieldsProps>(function EditorFields(
  { className, ...props },
  ref,
) {
  return <div {...props} ref={ref} className={classNames("miaixz-editor-fields", className)} />;
});

/**
 * Groups footer actions without changing their order or wrapping.
 *
 * @public
 */
export const EditorActions = forwardRef<HTMLDivElement, EditorActionsProps>(function EditorActions(
  { className, ...props },
  ref,
) {
  return <div {...props} ref={ref} className={classNames("miaixz-editor-actions", className)} />;
});

/**
 * Frames a control or short guidance text.
 *
 * @public
 */
export const EditorBox = forwardRef<HTMLDivElement, EditorBoxProps>(function EditorBox(
  { className, variant = "default", ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={classNames(
        "miaixz-editor-box",
        variant === "guidance" && "miaixz-editor-guidance",
        className,
      )}
    />
  );
});

/**
 * Renders one bordered association group. @public
 */
export const EditorGroup = forwardRef<HTMLElement, EditorGroupProps>(function EditorGroup(
  { title, description, accessory, className, children, ...props },
  ref,
) {
  return (
    <section {...props} ref={ref} className={classNames("miaixz-editor-group", className)}>
      <header>
        <div>
          <h4>{title}</h4>
          {description !== undefined && <p>{description}</p>}
        </div>
        {accessory}
      </header>
      <div className="miaixz-editor-group-options">{children}</div>
    </section>
  );
});

/**
 * Renders a compact set of editor headline values. @public
 */
export const EditorOverview = forwardRef<HTMLDivElement, EditorOverviewProps>(
  function EditorOverview({ items, className, variant = "default", ...props }, ref) {
    if (variant === "detailed") {
      return (
        <div
          {...props}
          ref={ref}
          className={classNames("miaixz-editor-overview-detailed", className)}
        >
          {items.map((item, index) => (
            <article key={index}>
              <span>{item.label}</span>
              {item.value}
              {item.description !== undefined && <small>{item.description}</small>}
            </article>
          ))}
        </div>
      );
    }
    return (
      <div {...props} ref={ref} className={classNames("miaixz-editor-overview", className)}>
        {items.map((item, index) => (
          <div key={index}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            {item.description !== undefined && <small>{item.description}</small>}
          </div>
        ))}
      </div>
    );
  },
);

/**
 * Renders a bordered, scrollable option collection. @public
 */
export const EditorPicker = forwardRef<HTMLDivElement, EditorPickerProps>(function EditorPicker(
  { className, ...props },
  ref,
) {
  return <div {...props} ref={ref} className={classNames("miaixz-editor-picker", className)} />;
});
