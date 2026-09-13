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

import type { ReactElement, ReactNode, Ref } from "react";

import { Button, ButtonLink } from "../button/button.js";
import { type ButtonLinkSlotProps, type ButtonSlotProps } from "../button/button.types.js";
import type { ActionDescriptor, ActionTextSlotProps } from "./action.types.js";

interface ActionTargetProps {
  /**
   * Resolved command or navigation action.
   */
  readonly action: ActionDescriptor;
  /**
   * Visible content.
   */
  readonly children: ReactNode;
  /**
   * Canonical presentation class.
   */
  readonly className: string;
  /**
   * Optional leading element.
   */
  readonly startIcon?: ReactElement;
  /**
   * Fixed ActionText slot properties.
   */
  readonly slotProps?: ActionTextSlotProps;
  /**
   * Final button or anchor reference.
   */
  readonly ref?: Ref<HTMLButtonElement | HTMLAnchorElement>;
}

/**
 * Renders the semantic target selected by the action discriminator.
 *
 * @param properties - Resolved action target properties.
 * @returns A Button for commands or ButtonLink for navigation.
 * @internal
 */
export function ActionTarget(properties: ActionTargetProps) {
  const { action, children, className, startIcon, slotProps, ref } = properties;
  const tone = action.tone ?? "neutral";
  const size = action.size ?? "medium";
  if (action.kind === "navigation") {
    return (
      <ButtonLink
        {...action.anchorProps}
        ref={ref as Ref<HTMLAnchorElement>}
        className={className}
        href={action.href}
        size={size}
        {...(slotProps === undefined ? {} : { slotProps: slotProps as ButtonLinkSlotProps })}
        {...(startIcon === undefined ? {} : { startIcon })}
        tone={tone}
        variant="plain"
      >
        {children}
      </ButtonLink>
    );
  }
  return (
    <Button
      {...action.buttonProps}
      ref={ref as Ref<HTMLButtonElement>}
      className={className}
      {...(action.disabled === undefined ? {} : { disabled: action.disabled })}
      {...(action.loading === undefined ? {} : { loading: action.loading })}
      onClick={action.onAction}
      size={size}
      {...(slotProps === undefined ? {} : { slotProps: slotProps as ButtonSlotProps })}
      {...(startIcon === undefined ? {} : { startIcon })}
      tone={tone}
      variant="plain"
    >
      {children}
    </Button>
  );
}
