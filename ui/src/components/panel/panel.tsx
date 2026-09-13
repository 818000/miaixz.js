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
 * Public Panel contracts are defined by the component type module.
 */
import { createElement, forwardRef } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { PanelDensityProvider, usePanelDensity } from "./panel-context.js";
import type {
  PanelFooterOwnerState,
  PanelFooterProps,
  PanelHeaderOwnerState,
  PanelHeaderProps,
  PanelOwnerState,
  PanelProps,
  PanelRowOwnerState,
  PanelRowProps,
} from "./panel.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/*
 * Renders a non-interactive content surface with one stable structure. @public
 */
export const Panel = withMiaixzThemeComponent(
  "Panel",
  forwardRef<HTMLElement, PanelProps>(function Panel(
    {
      as = "div",
      title,
      description,
      leading,
      actions,
      headingLevel,
      footer,
      surface = "filled",
      frame = "outlined",
      density = "standard",
      slotProps,
      children,
      ...props
    },
    ref,
  ) {
    const ariaLabel = props["aria-label"];
    const ariaLabelledBy = props["aria-labelledby"];
    if (
      (as === "section" || as === "aside") &&
      ((ariaLabel !== undefined) === (ariaLabelledBy !== undefined) ||
        (ariaLabel !== undefined && ariaLabel.trim() === "") ||
        (ariaLabelledBy !== undefined && ariaLabelledBy.trim() === ""))
    ) {
      throw new MiaixzUiError({
        code: "UI_PANEL_LABEL_INVALID",
      });
    }
    const ownerState: PanelOwnerState = { as, surface, frame, density };
    const headerSlot = resolveSlot(slotProps?.header, ownerState);
    const actionsSlot = resolveSlot(slotProps?.actions, ownerState);
    const footerSlot = resolveSlot(slotProps?.footer, ownerState);
    return createElement(
      as,
      mergeMiaixzSlotProps({
        ownerState,
        defaultProps: { className: "miaixz-panel" },
        componentProps: props,
        slotProps: slotProps?.root,
        forwardedRef: ref,
        internalProps: {
          "data-surface": surface,
          "data-frame": frame,
          "data-density": density,
          "aria-label": ariaLabel,
          "aria-labelledby": ariaLabelledBy,
        },
        ownedProps: ["data-surface", "data-frame", "data-density", "aria-label", "aria-labelledby"],
      }),
      <PanelDensityProvider value={density}>
        {title !== undefined && (
          <PanelHeader
            actions={actions}
            description={description}
            headingLevel={headingLevel ?? 3}
            leading={leading}
            slotProps={{
              ...(headerSlot === undefined ? {} : { root: headerSlot }),
              ...(actionsSlot === undefined ? {} : { actions: actionsSlot }),
            }}
            title={title}
          />
        )}
        <div
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-panel-body" },
            slotProps: slotProps?.body,
          })}
        >
          {children}
        </div>
        {footer !== undefined && (
          <PanelFooter {...(footerSlot === undefined ? {} : { slotProps: { root: footerSlot } })}>
            {footer}
          </PanelFooter>
        )}
      </PanelDensityProvider>,
    );
  }),
);

/*
 * Renders a neutral panel title region. @public
 */
export const PanelHeader = withMiaixzThemeComponent(
  "PanelHeader",
  forwardRef<HTMLDivElement, PanelHeaderProps>(function PanelHeader(
    {
      title,
      description,
      leading,
      actions,
      headingLevel = 2,
      density: explicitDensity,
      divider = false,
      alignment = "between",
      slotProps,
      ...props
    },
    ref,
  ) {
    const density = usePanelDensity(explicitDensity);
    const ownerState: PanelHeaderOwnerState = { density, divider, alignment };
    return (
      <div
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-panel-header" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: {
            "data-density": density,
            "data-alignment": alignment,
            ...(divider ? { "data-divider": true } : {}),
          },
        })}
      >
        <div
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-panel-header-copy" },
            slotProps: slotProps?.copy,
          })}
        >
          {leading !== undefined && (
            <div
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-panel-leading" },
                slotProps: slotProps?.leading,
              })}
            >
              {leading}
            </div>
          )}
          <div>
            {createElement(
              `h${headingLevel}`,
              mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-panel-title" },
                slotProps: slotProps?.title,
              }),
              title,
            )}
            {description !== undefined && (
              <div
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-panel-description" },
                  slotProps: slotProps?.description,
                })}
              >
                {description}
              </div>
            )}
          </div>
        </div>
        {actions !== undefined && (
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-panel-actions" },
              slotProps: slotProps?.actions,
            })}
          >
            {actions}
          </div>
        )}
      </div>
    );
  }),
);

/*
 * Renders a density-aware panel action footer. @public
 */
export const PanelFooter = withMiaixzThemeComponent(
  "PanelFooter",
  forwardRef<HTMLDivElement, PanelFooterProps>(function PanelFooter(
    { divider = true, alignment = "end", density: explicitDensity, slotProps, children, ...props },
    ref,
  ) {
    const density = usePanelDensity(explicitDensity);
    const ownerState: PanelFooterOwnerState = { density, divider, alignment };
    return (
      <div
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-panel-footer" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: {
            "data-density": density,
            "data-alignment": alignment,
            ...(divider ? { "data-divider": true } : {}),
          },
        })}
      >
        {children}
      </div>
    );
  }),
);

/*
 * Renders a non-interactive density-aware row scoped to Panel. @public
 */
export const PanelRow = withMiaixzThemeComponent(
  "PanelRow",
  forwardRef<HTMLDivElement, PanelRowProps>(function PanelRow(
    { distribution = "between", slotProps, ...props },
    ref,
  ) {
    const density = usePanelDensity(undefined);
    const ownerState: PanelRowOwnerState = { density, distribution };
    return (
      <div
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-panel-row" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: { "data-density": density, "data-distribution": distribution },
        })}
      />
    );
  }),
);

function resolveSlot<Props extends object>(
  slot: ((state: Readonly<PanelOwnerState>) => Partial<Props>) | Partial<Props> | undefined,
  ownerState: PanelOwnerState,
): Partial<Props> | undefined {
  return typeof slot === "function" ? slot(ownerState) : slot;
}
