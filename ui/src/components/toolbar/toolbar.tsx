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
 * Public Toolbar contracts are defined by the component type module.
 */
import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";

import { assertMiaixzAccessibleName } from "../../accessibility/assert-accessible-name.js";
import { classNames } from "../../shared/class-names.js";
import { useRovingFocus } from "../../shared/use-roving-focus.js";
import type { ToolbarProps } from "./toolbar.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

const focusableSelector = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]",
].join(",");

/*
 * Renders a visual control group or a keyboard-managed ARIA toolbar. @public
 */
export const Toolbar = withMiaixzThemeComponent(
  "Toolbar",
  forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
    {
      behavior = "group",
      surface = "plain",
      density = "standard",
      orientation = "horizontal",
      wrap = true,
      className,
      children,
      onFocus,
      onKeyDown,
      ...props
    },
    forwardedRef,
  ) {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const [elements, setElements] = useState<HTMLElement[]>([]);
    const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");
    const hasName = props["aria-label"] !== undefined || props["aria-labelledby"] !== undefined;
    if (behavior === "toolbar" || hasName) {
      assertMiaixzAccessibleName({
        ...(props["aria-label"] === undefined ? {} : { ariaLabel: props["aria-label"] }),
        ...(props["aria-labelledby"] === undefined
          ? {}
          : { ariaLabelledBy: props["aria-labelledby"] }),
      });
    }
    const roving = useRovingFocus({
      elements,
      direction,
      orientation,
      loop: true,
      isDisabled: (element) =>
        element.matches(":disabled") || element.getAttribute("aria-disabled") === "true",
    });
    const setRef = useCallback(
      (element: HTMLDivElement | null) => {
        rootRef.current = element;
        if (typeof forwardedRef === "function") forwardedRef(element);
        else if (forwardedRef !== null) forwardedRef.current = element;
      },
      [forwardedRef],
    );
    const rebuild = useCallback(() => {
      const root = rootRef.current;
      if (root === null) return;
      const next = Array.from(root.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) =>
          element.closest<HTMLElement>("[data-miaixz-toolbar-root]") === root &&
          !element.hidden &&
          !element.closest("[hidden], [inert]") &&
          element.getAttribute("aria-disabled") !== "true" &&
          !element.matches(":disabled"),
      );
      setElements((current) =>
        current.length === next.length && current.every((element, index) => element === next[index])
          ? current
          : next,
      );
      setDirection(getComputedStyle(root).direction === "rtl" ? "rtl" : "ltr");
    }, []);
    useLayoutEffect(() => {
      if (behavior !== "toolbar") {
        setElements([]);
        return;
      }
      const root = rootRef.current;
      if (root === null) return;
      rebuild();
      const observer = new MutationObserver(rebuild);
      observer.observe(root, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["aria-disabled", "disabled", "hidden", "href", "inert", "tabindex"],
      });
      return () => observer.disconnect();
    }, [behavior, rebuild, children]);
    useLayoutEffect(() => {
      if (behavior !== "toolbar") return;
      for (const element of elements) {
        const tabIndex = roving.getTabIndex(element);
        if (element.tabIndex !== tabIndex) element.tabIndex = tabIndex;
      }
    }, [behavior, elements, roving]);
    const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
      onFocus?.(event);
      if (event.defaultPrevented || behavior !== "toolbar") return;
      const target = event.target as HTMLElement;
      if (elements.includes(target)) roving.setActiveElement(target);
    };
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (!event.defaultPrevented && behavior === "toolbar") roving.onKeyDown(event);
    };
    return (
      <div
        {...props}
        ref={setRef}
        aria-orientation={behavior === "toolbar" ? orientation : undefined}
        className={classNames("miaixz-toolbar", className)}
        data-density={density}
        data-miaixz-toolbar-root=""
        data-orientation={orientation}
        data-surface={surface}
        data-wrap={wrap}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        role={behavior === "toolbar" ? "toolbar" : hasName ? "group" : undefined}
      >
        {children}
      </div>
    );
  }),
);
