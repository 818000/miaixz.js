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

import {
  createContext,
  forwardRef,
  useContext,
  useRef,
  type AnchorHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

import { MiaixzUiError } from "../errors/ui-error.js";
import { useMiaixzLayoutEffect } from "./use-client-layout-effect.js";
import { useMergedRef } from "./use-merged-ref.js";

/**
 * Describes the final properties supplied to an anchor renderer.
 *
 * @public
 */
export interface AnchorRenderProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  readonly href: string;
}

/**
 * Adapts navigation to a router while preserving a final native anchor.
 *
 * @public
 */
export type AnchorRenderer = (
  props: AnchorRenderProps,
  ref: Ref<HTMLAnchorElement>,
) => ReactElement;

/**
 * Configures the application-wide anchor renderer.
 *
 * @public
 */
export interface MiaixzLinkProviderProps {
  readonly renderAnchor: AnchorRenderer;
  readonly children: ReactNode;
}

interface AnchorProps extends AnchorRenderProps {
  readonly renderAnchor?: AnchorRenderer | undefined;
}

const MiaixzAnchorRendererContext = createContext<AnchorRenderer | undefined>(undefined);

/**
 * Supplies one router adapter to every Miaixz navigation component.
 *
 * @param root0 - Provider properties.
 * @returns Provider-wrapped navigation tree.
 * @public
 */
export function MiaixzLinkProvider({
  renderAnchor,
  children,
}: MiaixzLinkProviderProps): ReactElement {
  return (
    <MiaixzAnchorRendererContext.Provider value={renderAnchor}>
      {children}
    </MiaixzAnchorRendererContext.Provider>
  );
}

/**
 * Renders a styleless, validated anchor for component-internal navigation.
 *
 * @internal
 */
export const Anchor = forwardRef<HTMLAnchorElement, AnchorProps>(function Anchor(
  { renderAnchor, ...props },
  forwardedRef,
) {
  const providerRenderer = useContext(MiaixzAnchorRendererContext);
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const mergedRef = useMergedRef(anchorRef, forwardedRef);
  const renderer = renderAnchor ?? providerRenderer ?? renderNativeAnchor;
  useMiaixzLayoutEffect(() => {
    if (anchorRef.current instanceof HTMLAnchorElement) return;
    throw new MiaixzUiError({ code: "UI_ANCHOR_RENDERER_INVALID" });
  });
  return renderer(props, mergedRef);
});

/**
 * Renders the default final native anchor.
 *
 * @param props - Final native anchor properties.
 * @param ref - Merged anchor reference.
 * @returns Native anchor element.
 */
function renderNativeAnchor(props: AnchorRenderProps, ref: Ref<HTMLAnchorElement>): ReactElement {
  return <a {...props} ref={ref} />;
}
