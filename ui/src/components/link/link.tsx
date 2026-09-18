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

import { Anchor } from "../../shared/anchor.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";
import type { LinkOwnerState, LinkProps, LinkRootAttributes } from "./link.types.js";

/**
 * Renders an inline semantic navigation link.
 *
 * @public
 */
export const Link = withMiaixzThemeComponent(
  "Link",
  forwardRef<HTMLAnchorElement, LinkProps>(function Link(
    { href, children, tone = "brand", underline = "hover", renderAnchor, slotProps, ...props },
    forwardedRef,
  ) {
    const ownerState: LinkOwnerState = { tone, underline };
    const rootProps = mergeMiaixzSlotProps<LinkOwnerState, LinkRootAttributes, HTMLAnchorElement>({
      ownerState,
      defaultProps: { className: "miaixz-link" },
      componentProps: props,
      slotProps: slotProps?.root,
      forwardedRef,
      internalProps: {
        href,
        "data-ui": "link",
        "data-tone": tone,
        "data-underline": underline,
      },
      ownedProps: ["href", "data-ui", "data-tone", "data-underline"],
    });
    return (
      <Anchor {...rootProps} href={href} renderAnchor={renderAnchor}>
        {children}
      </Anchor>
    );
  }),
);
