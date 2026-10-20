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

/**
 * Implements shared anchor behavior for UI components.
 */

import {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  useRef,
  type AnchorHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
  type MouseEvent,
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
export type LinkRefreshMode = "content" | "page";

/**
 * Configures the application-wide link renderer and document refresh policy. @public
 */
export interface MiaixzLinkProviderProps {
  readonly refreshMode?: LinkRefreshMode;
  readonly renderAnchor: AnchorRenderer;
  readonly children: ReactNode;
}

/**
 * Properties accepted by the Anchor renderer.
 */
interface AnchorProps extends AnchorRenderProps {
  readonly refreshMode?: LinkRefreshMode | undefined;
  readonly renderAnchor?: AnchorRenderer | undefined;
}

const MiaixzAnchorRendererContext = createContext<
  | {
      readonly renderAnchor: AnchorRenderer;
      readonly refreshMode: LinkRefreshMode;
    }
  | undefined
>(undefined);

/**
 * Reads the application-wide refresh policy with an optional component override.
 * @param override Component-specific refresh policy.
 * @returns Effective content or document refresh policy.
 * @internal
 */
export function useMiaixzLinkRefreshMode(override?: LinkRefreshMode): LinkRefreshMode {
  const provider = useContext(MiaixzAnchorRendererContext);
  return override ?? provider?.refreshMode ?? "content";
}

/**
 * Supplies one router adapter to every Miaixz navigation component.
 *
 * @param root0 - Provider properties.
 * @returns Provider-wrapped navigation tree.
 * @public
 */
export function MiaixzLinkProvider({
  renderAnchor,
  refreshMode = "content",
  children,
}: MiaixzLinkProviderProps): ReactElement {
  const value = useMemo(() => ({ renderAnchor, refreshMode }), [renderAnchor, refreshMode]);
  return (
    <MiaixzAnchorRendererContext.Provider value={value}>
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
  { renderAnchor, refreshMode, ...props },
  forwardedRef,
) {
  const providerRenderer = useContext(MiaixzAnchorRendererContext);
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const mergedRef = useMergedRef(anchorRef, forwardedRef);
  const effectiveMode = refreshMode ?? providerRenderer?.refreshMode ?? "content";
  const renderer =
    effectiveMode === "page"
      ? renderPageAnchor
      : (renderAnchor ?? providerRenderer?.renderAnchor ?? renderNativeAnchor);
  useMiaixzLayoutEffect(() => {
    if (anchorRef.current instanceof HTMLAnchorElement) return;
    throw new MiaixzUiError({ code: "UI_ANCHOR_RENDERER_INVALID" });
  });
  return renderer(
    { ...props, "data-miaixz-refresh-mode": effectiveMode } as AnchorRenderProps,
    mergedRef,
  );
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

/**
 * Forces a document reload for same-document fragment targets while retaining native link behavior.
 * @param props Native anchor properties.
 * @param ref Forwarded native anchor reference.
 * @returns Document navigation anchor.
 */
function renderPageAnchor(props: AnchorRenderProps, ref: Ref<HTMLAnchorElement>): ReactElement {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    props.onClick?.(event);
    const anchor = event.currentTarget;
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      anchor.hasAttribute("download") ||
      (anchor.target !== "" && anchor.target !== "_self")
    )
      return;
    const destination = new URL(props.href, window.location.href);
    const current = new URL(window.location.href);
    if (
      destination.origin === current.origin &&
      destination.pathname === current.pathname &&
      destination.search === current.search
    ) {
      event.preventDefault();
      window.history.pushState(null, "", destination.href);
      window.location.reload();
    }
  };
  return <a {...props} onClick={onClick} ref={ref} />;
}
