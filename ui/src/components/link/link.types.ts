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

import type { AnchorHTMLAttributes, ReactNode, RefAttributes } from "react";

import type { AnchorRenderer, AnchorRenderProps } from "../../shared/anchor.js";
import type { MiaixzSlotProps } from "../../shared/slots.js";

export type LinkTone = "brand" | "inherit";
export type LinkUnderline = "hover" | "always";
export type LinkSlot = "root";

export interface LinkOwnerState {
  readonly tone: LinkTone;
  readonly underline: LinkUnderline;
}

export interface LinkRootAttributes
  extends AnchorHTMLAttributes<HTMLAnchorElement>, RefAttributes<HTMLAnchorElement> {
  readonly "data-tone"?: LinkTone;
  readonly "data-underline"?: LinkUnderline;
  readonly "data-ui"?: "link";
}

export interface LinkSlotProps {
  readonly root?: MiaixzSlotProps<LinkOwnerState, LinkRootAttributes>;
}

export type LinkRenderProps = AnchorRenderProps;

/**
 * Adapts Link to a router while preserving a final native anchor.
 *
 * @public
 */
export type LinkRenderer = AnchorRenderer;

/**
 * Configures an inline semantic navigation link.
 *
 * @public
 */
export interface LinkProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "children" | "href"
> {
  readonly href: string;
  readonly children: ReactNode;
  readonly tone?: LinkTone;
  readonly underline?: LinkUnderline;
  readonly renderAnchor?: LinkRenderer;
  readonly slotProps?: LinkSlotProps;
}
