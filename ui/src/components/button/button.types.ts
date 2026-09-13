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

import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactElement,
  ReactNode,
  Ref,
  RefAttributes,
} from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Defines the visual treatment independently from semantic tone.
 *
 * @public
 */
export type ButtonVariant = "solid" | "outlined" | "plain";

/**
 * Defines the semantic color role used by Button and ButtonLink.
 *
 * @public
 */
export type ButtonTone = "neutral" | "brand" | "danger";

/**
 * Defines the supported framed-control sizes.
 *
 * @public
 */
export type ButtonSize = "small" | "medium" | "large";

/**
 * Lists the fixed Button content slots.
 *
 * @public
 */
export type ButtonSlot = "root" | "label" | "startIcon" | "endIcon" | "loadingIndicator";

/**
 * Describes immutable Button state exposed to slot functions and Theme variants.
 *
 * @public
 */
export interface ButtonOwnerState {
  /**
   * Selects the visual treatment.
   */
  readonly variant: ButtonVariant;
  /**
   * Selects the semantic tone.
   */
  readonly tone: ButtonTone;
  /**
   * Selects control geometry.
   */
  readonly size: ButtonSize;
  /**
   * Reports whether the root fills available width.
   */
  readonly block: boolean;
  /**
   * Reports whether command interaction is pending.
   */
  readonly loading: boolean;
  /**
   * Reports whether command interaction is unavailable.
   */
  readonly disabled: boolean;
}

/**
 * Configures fixed Button native slots.
 *
 * @public
 */
export interface ButtonSlotProps {
  /**
   * Configures the native button root.
   */
  readonly root?: MiaixzSlotProps<ButtonOwnerState, ButtonRootAttributes>;
  /**
   * Configures the visible label wrapper.
   */
  readonly label?: MiaixzSlotProps<ButtonOwnerState, HTMLAttributes<HTMLSpanElement>>;
  /**
   * Configures the leading icon wrapper.
   */
  readonly startIcon?: MiaixzSlotProps<ButtonOwnerState, HTMLAttributes<HTMLSpanElement>>;
  /**
   * Configures the trailing icon wrapper.
   */
  readonly endIcon?: MiaixzSlotProps<ButtonOwnerState, HTMLAttributes<HTMLSpanElement>>;
  /**
   * Configures the centered loading indicator wrapper.
   */
  readonly loadingIndicator?: MiaixzSlotProps<ButtonOwnerState, HTMLAttributes<HTMLSpanElement>>;
}

/**
 * Configures a labeled command button.
 *
 * @public
 */
export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-labelledby" | "children"
> {
  /**
   * Supplies the visible button label.
   */
  readonly children: ReactNode;
  /**
   * Selects visual treatment.
   *
   * @defaultValue `"outlined"`
   */
  readonly variant?: ButtonVariant;
  /**
   * Selects semantic color.
   *
   * @defaultValue `"neutral"`
   */
  readonly tone?: ButtonTone;
  /**
   * Selects the shared control height.
   *
   * @defaultValue `"medium"`
   */
  readonly size?: ButtonSize;
  /**
   * Expands the button to container width.
   *
   * @defaultValue `false`
   */
  readonly block?: boolean;
  /**
   * Disables interaction and announces progress.
   *
   * @defaultValue `false`
   */
  readonly loading?: boolean;
  /**
   * Overrides the localized loading announcement.
   */
  readonly loadingLabel?: string;
  /**
   * Displays one leading element.
   */
  readonly startIcon?: ReactElement;
  /**
   * Displays one trailing element.
   */
  readonly endIcon?: ReactElement;
  /**
   * Configures fixed native slots.
   */
  readonly slotProps?: ButtonSlotProps;
}

/**
 * Describes the native Button root plus component-owned data attributes.
 *
 * @public
 */
export interface ButtonRootAttributes
  extends ButtonHTMLAttributes<HTMLButtonElement>, RefAttributes<HTMLButtonElement> {
  /**
   * Exposes pending state to styles.
   */
  readonly "data-loading"?: boolean;
  /**
   * Enables the shared press effect.
   */
  readonly "data-miaixz-ripple"?: string;
  /**
   * Exposes the effective visual treatment.
   */
  readonly "data-variant"?: ButtonVariant;
  /**
   * Exposes the effective semantic tone.
   */
  readonly "data-tone"?: ButtonTone;
  /**
   * Exposes the effective control size.
   */
  readonly "data-size"?: ButtonSize;
  /**
   * Exposes full-width layout state.
   */
  readonly "data-block"?: string;
}

/**
 * Configures ButtonLink fixed native slots.
 *
 * @public
 */
export interface ButtonLinkSlotProps extends Omit<ButtonSlotProps, "root"> {
  /**
   * Configures the native anchor root.
   */
  readonly root?: MiaixzSlotProps<ButtonOwnerState, ButtonLinkRootAttributes>;
}

/**
 * Describes the native ButtonLink root plus component-owned data attributes.
 *
 * @public
 */
export interface ButtonLinkRootAttributes
  extends AnchorHTMLAttributes<HTMLAnchorElement>, RefAttributes<HTMLAnchorElement> {
  /**
   * Enables the shared press effect.
   */
  readonly "data-miaixz-ripple"?: string;
  /**
   * Exposes the effective visual treatment.
   */
  readonly "data-variant"?: ButtonVariant;
  /**
   * Exposes the effective semantic tone.
   */
  readonly "data-tone"?: ButtonTone;
  /**
   * Exposes the effective control size.
   */
  readonly "data-size"?: ButtonSize;
  /**
   * Exposes full-width layout state.
   */
  readonly "data-block"?: string;
}

/**
 * Supplies the required destination to a ButtonLink renderer.
 *
 * @public
 */
export interface ButtonLinkRenderProps extends ButtonLinkRootAttributes {
  /**
   * Supplies the real navigation destination.
   */
  readonly href: string;
}

/**
 * Defines the sole custom router-link adapter.
 *
 * @public
 */
export type ButtonLinkRenderer = (
  props: ButtonLinkRenderProps,
  ref: Ref<HTMLAnchorElement>,
) => ReactElement;

/**
 * Configures a real navigation link with Button presentation.
 *
 * @public
 */
export interface ButtonLinkProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "children" | "href"
> {
  /**
   * Supplies the real navigation destination.
   */
  readonly href: string;
  /**
   * Supplies the visible link label.
   */
  readonly children: ReactNode;
  /**
   * Selects visual treatment.
   *
   * @defaultValue `"outlined"`
   */
  readonly variant?: ButtonVariant;
  /**
   * Selects semantic color.
   *
   * @defaultValue `"neutral"`
   */
  readonly tone?: ButtonTone;
  /**
   * Selects shared control height.
   *
   * @defaultValue `"medium"`
   */
  readonly size?: ButtonSize;
  /**
   * Expands the link to container width.
   *
   * @defaultValue `false`
   */
  readonly block?: boolean;
  /**
   * Displays one leading element.
   */
  readonly startIcon?: ReactElement;
  /**
   * Displays one trailing element.
   */
  readonly endIcon?: ReactElement;
  /**
   * Adapts the final native anchor to a router.
   */
  readonly renderAnchor?: ButtonLinkRenderer;
  /**
   * Configures fixed native slots.
   */
  readonly slotProps?: ButtonLinkSlotProps;
}
