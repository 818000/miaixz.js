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

import { Header } from "../header/index.js";
import { Hidden } from "../hidden/index.js";
import { Tabs } from "../tabs/index.js";
import { Divider } from "../divider/index.js";
import { classNames } from "../../shared/class-names.js";
import type { ModuleFrameProps } from "./module-frame.types.js";

/**
 * Renders the shared title, navigation, and content frame used by product modules.
 *
 * @param props - Frame content and controlled navigation.
 * @returns The composed module frame.
 * @public
 */
export function ModuleFrame(props: ModuleFrameProps) {
  const {
    "aria-label": ariaLabel,
    title,
    description,
    actions,
    headingLevel = 1,
    navigation,
    navigationContent,
    headerContent,
    variant = "default",
    mastheadProps,
    contentProps,
    className,
    disabled = false,
    children,
    ...attributes
  } = props;
  return (
    <section
      {...attributes}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      className={classNames(
        "miaixz-module-frame",
        variant !== "default" && `miaixz-module-frame-${variant}`,
        className,
      )}
    >
      {variant === "workspace" ? (
        <>
          {headerContent ?? (
            <Header
              variant="compact"
              spacing="none"
              title={title}
              description={description}
              actions={actions}
              headingLevel={headingLevel}
            />
          )}
          {navigationContent !== undefined ? (
            navigationContent
          ) : navigation ? (
            <Tabs
              label={navigation.label}
              variant="navigation"
              value={navigation.value}
              onValueChange={navigation.onValueChange}
              items={navigation.items.map((item) => ({
                value: item.id,
                label: item.label,
                ...(disabled || item.disabled ? { disabled: true } : {}),
                content: <Hidden>{item.label}</Hidden>,
              }))}
            />
          ) : (
            <Divider />
          )}
        </>
      ) : (
        <>
          <div
            {...mastheadProps}
            className={classNames("miaixz-module-frame-masthead", mastheadProps?.className)}
          >
            {headerContent ?? (
              <Header
                variant="compact"
                spacing="none"
                title={title}
                description={description}
                actions={actions}
                headingLevel={headingLevel}
              />
            )}
            {navigationContent !== undefined ? (
              navigationContent
            ) : navigation ? (
              <Tabs
                label={navigation.label}
                variant="navigation"
                panelPadding="none"
                value={navigation.value}
                onValueChange={navigation.onValueChange}
                items={navigation.items.map((item) => ({
                  value: item.id,
                  label: item.label,
                  ...(disabled || item.disabled ? { disabled: true } : {}),
                  content: <Hidden>{item.label}</Hidden>,
                }))}
              />
            ) : (
              <Divider />
            )}
          </div>
        </>
      )}
      <div
        {...contentProps}
        className={classNames("miaixz-module-frame-content", contentProps?.className)}
      >
        {children}
      </div>
    </section>
  );
}
