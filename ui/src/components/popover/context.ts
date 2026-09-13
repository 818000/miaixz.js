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

import { createContext, useContext, type RefObject } from "react";
import type { MiaixzOverlayChangeReason } from "../../shared/overlay/types.js";

/**
 * Exposes package-internal Popover lifecycle controls to composed surfaces such as Dropdown.
 */
export interface MiaixzPopoverContextValue {
  /**
   * Reports whether the owning Popover surface is open.
   */
  readonly open: boolean;

  /**
   * References the native interactive element that owns the surface.
   */
  readonly triggerRef: RefObject<HTMLButtonElement | null>;

  /**
   * References the rendered Portal content element.
   */
  readonly contentRef: RefObject<HTMLDivElement | null>;

  /**
   * Requests closure and optionally restores trigger focus after the controlled state commits.
   */
  readonly requestClose: (reason?: MiaixzOverlayChangeReason) => void;
}

/**
 * Carries one Popover lifecycle through its Portal without becoming public API.
 */
export const MiaixzPopoverContext = createContext<MiaixzPopoverContextValue | undefined>(undefined);

/**
 * Reads the nearest package-internal Popover lifecycle when composition provides one.
 *
 * @returns The nearest Popover lifecycle, or undefined outside Popover content.
 */
export function useMiaixzPopoverContext(): MiaixzPopoverContextValue | undefined {
  return useContext(MiaixzPopoverContext);
}
